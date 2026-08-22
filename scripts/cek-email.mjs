/**
 * Cek kredensial Resend, tanpa lewat Supabase.
 *
 *   node scripts/cek-email.mjs re_XXXXXXXX
 *   node scripts/cek-email.mjs re_XXXXXXXX kamu@gmail.com   (sekalian kirim tes)
 *
 * Kuncinya cuma dibaca dari argumen dan tidak pernah ditulis ke file mana pun.
 *
 * Kenapa alat ini ada: kalau email tidak sampai, ada empat tempat yang bisa
 * salah — kunci Resend, sambungan SMTP, setelan Supabase, atau alamat tujuan.
 * Menebak satu per satu lewat form pendaftaran itu lambat dan buta. Ini menguji
 * dua yang pertama secara langsung, jadi kalau dua-duanya lolos, yang tersisa
 * pasti di sisi Supabase.
 *
 * Tanpa dependensi: bicara SMTP mentah lewat soket TLS.
 */

import net from "node:net";
import tls from "node:tls";

const ok = (m) => console.log(`  \x1b[32mOK\x1b[0m    ${m}`);
const bad = (m) => console.log(`  \x1b[31mGAGAL\x1b[0m ${m}`);
const info = (m) => console.log(`        ${m}`);

/** Reads SMTP replies one complete response at a time. A reply can arrive split
 *  across packets, or several can arrive in one, so this buffers until it sees
 *  a final line (`250 ` with a space, not `250-`) before resolving. */
function talk(sock) {
  let buf = "";
  const waiters = [];
  const drain = () => {
    while (waiters.length) {
      const m = buf.match(/^\d{3} [^\n]*\n/m);
      if (!m) break;
      const end = buf.indexOf(m[0]) + m[0].length;
      const chunk = buf.slice(0, end);
      buf = buf.slice(end);
      waiters.shift()(chunk.trim());
    }
  };
  sock.on("data", (d) => {
    buf += d.toString();
    drain();
  });
  return {
    read: () => new Promise((r) => (waiters.push(r), drain())),
    send: (line) => sock.write(line + "\r\n"),
  };
}

async function main() {
  const KEY = process.argv[2];
  const TO = process.argv[3];

  if (!KEY || !KEY.startsWith("re_")) {
    console.error("\n  Pakai:  node scripts/cek-email.mjs re_XXXXXXXX [tujuan@email.com]\n");
    return 1;
  }

  /* ── 1. Apakah kuncinya sah? ───────────────────────────────────────────── */
  console.log("\n1. Kunci API Resend");
  let verified = [];
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    /* Any non-2xx, not just 401/403. Resend answers a bad key with **400**
       `"API key is invalid"`, and an earlier version of this script only
       checked the usual auth codes — so a deliberately wrong key sailed
       straight through reporting OK, which is worse than no check at all. */
    const detail = await res.text();
    let msg = detail.slice(0, 160);
    try {
      msg = JSON.parse(detail).message ?? msg;
    } catch {
      /* not JSON — Cloudflare and friends answer in plain text */
    }

    /* A key scoped to "Sending access" is *refused* by this endpoint, because
       listing domains needs full access. That refusal proves the key is real
       and correctly scoped — sending is all SMTP ever needs, and a full-access
       key here would be privilege nobody asked for. Reading this as a failure
       had me telling someone to replace a perfectly good key with a more
       dangerous one. */
    if (/restricted to only send/i.test(msg)) {
      ok("kunci sah, berjenis kirim-saja (sending access) — ini yang benar untuk SMTP");
      info("daftar domain tidak bisa dibaca kunci jenis ini, jadi dilewati");
    } else if (!res.ok) {
      bad(`kunci ditolak Resend (HTTP ${res.status}) — ${msg}`);
      info("Ambil kunci baru: resend.com → API keys → Create API Key");
      return 1;
    } else {
      verified = (JSON.parse(detail)?.data ?? []).filter((d) => d.status === "verified");
      ok("kunci diterima Resend");
      if (verified.length) {
        info(`domain terverifikasi: ${verified.map((d) => d.name).join(", ")}`);
      } else {
        info("belum ada domain terverifikasi — jadi Resend HANYA mau mengirim");
        info("ke alamat pemilik akun Resend, dan pengirimnya harus onboarding@resend.dev");
      }
    }
  } catch (e) {
    bad(`tidak bisa menghubungi api.resend.com — ${e.message}`);
    return 1;
  }

  /* ── 2. Apakah SMTP-nya menerima kunci itu? ────────────────────────────── */
  console.log("\n2. Sambungan SMTP (smtp.resend.com:587)");
  const HOST = "smtp.resend.com";
  let sock;
  try {
    sock = net.createConnection({ host: HOST, port: 587, timeout: 15000 });
    await new Promise((res, rej) => (sock.once("connect", res), sock.once("error", rej)));
    let io = talk(sock);
    await io.read();

    io.send("EHLO karsa.local");
    if (!/STARTTLS/i.test(await io.read())) {
      bad("server tidak menawarkan STARTTLS");
      return 1;
    }

    io.send("STARTTLS");
    await io.read();
    sock = tls.connect({ socket: sock, servername: HOST });
    await new Promise((res, rej) => (sock.once("secure", res), sock.once("error", rej)));
    ok("TLS terpasang");

    io = talk(sock);
    io.send("EHLO karsa.local");
    await io.read();

    /* AUTH LOGIN: username then password, each base64 on its own line. */
    io.send("AUTH LOGIN");
    await io.read();
    io.send(Buffer.from("resend").toString("base64"));
    await io.read();
    io.send(Buffer.from(KEY).toString("base64"));
    const auth = await io.read();

    if (!auth.startsWith("235")) {
      bad(`SMTP menolak kunci → ${auth}`);
      info("Kunci yang sama akan ditolak Supabase juga.");
      return 1;
    }
    ok("SMTP menerima kunci (username `resend`, port 587)");

    /* ── 3. Kirim sungguhan, kalau diminta ──────────────────────────────── */
    if (!TO) {
      console.log("\n  Dua-duanya lolos. Kalau lewat aplikasi emailnya tetap tidak sampai,");
      console.log("  berarti masalahnya di setelan Supabase, bukan di Resend.");
      console.log("\n  Mau sekalian kirim email tes?");
      console.log("  node scripts/cek-email.mjs <kunci> alamat@kamu.com\n");
      io.send("QUIT");
      return 0;
    }

    console.log(`\n3. Kirim email tes ke ${TO}`);
    const FROM = verified.length ? `karsa@${verified[0].name}` : "onboarding@resend.dev";
    info(`pengirim: ${FROM}`);

    io.send(`MAIL FROM:<${FROM}>`);
    const mf = await io.read();
    if (!mf.startsWith("250")) {
      bad(`pengirim ditolak → ${mf}`);
      return 1;
    }

    io.send(`RCPT TO:<${TO}>`);
    const rc = await io.read();
    if (!rc.startsWith("250")) {
      bad(`tujuan ditolak → ${rc}`);
      info("Tanpa domain terverifikasi, Resend hanya mau mengirim ke alamat pemilik akun.");
      return 1;
    }

    io.send("DATA");
    await io.read();
    io.send(
      [
        `From: Karsa <${FROM}>`,
        `To: <${TO}>`,
        "Subject: Tes SMTP Karsa",
        "",
        "Kalau email ini sampai, kredensial Resend-nya benar",
        "dan sisa masalahnya ada di setelan Supabase.",
        ".",
      ].join("\r\n"),
    );
    const sent = await io.read();
    if (!sent.startsWith("250")) {
      bad(`server menolak isi email → ${sent}`);
      return 1;
    }
    ok(`terkirim — cek kotak masuk ${TO} (dan folder spam)`);
    io.send("QUIT");
    return 0;
  } catch (e) {
    bad(`sambungan SMTP gagal — ${e.message}`);
    return 1;
  } finally {
    /* Closed explicitly rather than by `process.exit()`: exiting while a socket
       or Node's fetch pool is still open trips a libuv assertion on Windows,
       which printed an alarming C-level crash under a perfectly good answer. */
    try {
      sock?.end();
    } catch {
      /* already gone */
    }
  }
}

process.exitCode = await main();
