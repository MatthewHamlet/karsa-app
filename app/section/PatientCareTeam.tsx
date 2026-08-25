"use client";

import { useActionState, useState } from "react";
import { Check, Copy, ShieldCheck, UserMinus, X } from "lucide-react";
import { respondToInvitation, revokeRelationship, type CareResult } from "../lib/care/actions";
import type { CareTeamMember } from "../lib/care/types";
import ConnectCaregiver from "../components/ConnectCaregiver";


export default function PatientCareTeam({
  team,
  shareCode,
}: {
  team: CareTeamMember[];
  shareCode: string | null;
}) {
  const pending = team.filter((m) => m.status === "pending");
  const active = team.filter((m) => m.status === "active");

  return (

    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Pendamping saya
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-neutral-500">
        Siapa saja yang boleh melihat data perawatanmu. Kamu yang menentukan.
      </p>


      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">

        <div className="min-w-0 space-y-6">

          <ConnectCaregiver />

          {shareCode && <ShareCode code={shareCode} />}
        </div>


        <div className="min-w-0 space-y-8">

          {pending.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Menunggu jawabanmu
              </h2>
              <ul className="mt-3 space-y-3">
                {pending.map((member) => (
                  <InvitationCard key={member.relationshipId} member={member} />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Pendamping aktif
            </h2>

            {active.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-karsa-canvas px-4 py-5 text-[15px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
                Belum ada yang mendampingimu. Masukkan kode dari pendampingmu,
                atau bagikan kode undanganmu.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {active.map((member) => (
                  <ActiveCard key={member.relationshipId} member={member} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InvitationCard({ member }: { member: CareTeamMember }) {
  const [state, action, busy] = useActionState<CareResult, FormData>(respondToInvitation, {
    error: null,
  });

  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-karsa-line">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-karsa text-[15px] font-bold text-white"
        >
          {member.initial}
        </span>
        <p className="min-w-0 flex-1 text-[15px] leading-6 text-neutral-700">
          <span className="font-bold text-neutral-900">{member.fullName}</span> ingin
          mendampingimu di Karsa.
          {member.relation && (
            <span className="block text-[13px] text-neutral-500">Sebagai {member.relation}</span>
          )}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-700">
          {state.error}
        </p>
      )}


      <div className="mt-3 flex gap-2.5">
        <form action={action} className="flex-1">
          <input type="hidden" name="relationship_id" value={member.relationshipId} />
          <input type="hidden" name="decision" value="accept" />
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3f6b44] text-[15px] font-bold text-white outline-none transition-colors hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] disabled:opacity-60"
          >
            <Check size={18} strokeWidth={2.6} aria-hidden />
            Terima
          </button>
        </form>
        <form action={action} className="flex-1">
          <input type="hidden" name="relationship_id" value={member.relationshipId} />
          <input type="hidden" name="decision" value="reject" />
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-karsa-line bg-white text-[15px] font-semibold text-neutral-700 outline-none transition-colors hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-60"
          >
            <X size={18} strokeWidth={2.6} aria-hidden />
            Tolak
          </button>
        </form>
      </div>
    </li>
  );
}

function ActiveCard({ member }: { member: CareTeamMember }) {
  const [state, action, busy] = useActionState<CareResult, FormData>(revokeRelationship, {
    error: null,
  });

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-karsa-line">
      <span
        aria-hidden
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-karsa text-[15px] font-bold text-white"
      >
        {member.initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-bold text-neutral-900">
          {member.fullName}
        </span>
        <span className="block truncate text-[13px] text-neutral-500">
          {member.relation ?? "Pendamping"}
        </span>
        {state.error && (
          <span role="alert" className="mt-1 block text-[13px] font-semibold text-rose-700">
            {state.error}
          </span>
        )}
      </span>
      <form action={action}>
        <input type="hidden" name="relationship_id" value={member.relationshipId} />
        <button
          type="submit"
          disabled={busy}
          aria-label={`Cabut akses ${member.fullName}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-neutral-400 outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-60"
        >
          <UserMinus size={19} strokeWidth={2.2} aria-hidden />
        </button>
      </form>
    </li>
  );
}

function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="mt-8 rounded-2xl bg-karsa-soft p-5 ring-1 ring-karsa/20">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-karsa-dark">
        <ShieldCheck size={18} strokeWidth={2.4} aria-hidden />
        Kode undanganmu
      </h2>
      <p className="mt-1.5 text-[14px] leading-5 text-neutral-600">
        Bacakan kode ini ke orang yang kamu percaya. Hanya dengan kode ini mereka
        bisa meminta jadi pendampingmu — dan kamu tetap harus menyetujuinya dulu.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <output className="flex-1 rounded-xl bg-white px-4 py-3 text-center font-mono text-[22px] font-bold tracking-[0.25em] text-neutral-900 ring-1 ring-karsa-line">
          {code}
        </output>
        <button
          type="button"
          onClick={() => {

            navigator.clipboard?.writeText(code).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              },
              () => setCopied(false),
            );
          }}
          aria-label="Salin kode"
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-white text-neutral-600 outline-none ring-1 ring-karsa-line transition-colors hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          {copied ? (
            <Check size={19} strokeWidth={2.6} className="text-karsa-dark" aria-hidden />
          ) : (
            <Copy size={19} strokeWidth={2.2} aria-hidden />
          )}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Kode disalin" : ""}
      </p>
    </section>
  );
}
