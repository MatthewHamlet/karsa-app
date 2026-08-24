import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createClient } from "../../lib/supabase/server";
import { getSessionProfile } from "../../lib/profile";
import { buildAssistantContext } from "../../lib/assistant/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATTEMPTS = [
  { model: "gemini-3.1-flash-lite", minimal: true },
  { model: "gemini-3.6-flash", minimal: true },
  { model: "gemini-3.5-flash", minimal: true },
];

const HISTORY_LIMIT = 20;
const MAX_INPUT = 2000;

/* Gemini 3 spends output tokens thinking before it writes. At 800 a long
   context left nothing for the answer and the reply came back empty. */
const MAX_OUTPUT = 2000;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return fail("Maskot belum dikonfigurasi. GEMINI_API_KEY belum diisi.", 503);
  }

  const me = await getSessionProfile();
  if (!me) return fail("Belum masuk.", 401);

  let body: { message?: unknown; threadId?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Permintaan tidak terbaca.", 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return fail("Pesan kosong.", 400);
  if (message.length > MAX_INPUT) return fail("Pesan terlalu panjang.", 400);

  const supabase = await createClient();
  const asked = typeof body.threadId === "string" ? body.threadId : null;

  const [context, pastResult] = await Promise.all([
    buildAssistantContext(),
    asked
      ? supabase
          .from("assistant_messages")
          .select("role, body")
          .eq("thread_id", asked)
          .order("created_at", { ascending: true })
          .limit(HISTORY_LIMIT)
      : Promise.resolve({ data: null }),
  ]);

  if (!context) {
    return fail("Belum ada pasien yang terhubung dengan akun ini.", 409);
  }

  const past = pastResult.data ?? [];
  let threadId = past.length > 0 ? asked : null;

  if (!threadId) {
    const { data, error } = await supabase
      .from("assistant_threads")
      .insert({
        patient_id: context.patientId,
        owner_id: me.id,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();

    if (error || !data) return fail("Gagal membuat percakapan.", 500);
    threadId = data.id as string;
  }

  const history = past.map((row) => ({
    role: row.role === "user" ? "user" : "model",
    parts: [{ text: row.body as string }],
  }));

  const saving = supabase
    .from("assistant_messages")
    .insert({ thread_id: threadId, role: "user", body: message });

  const ai = new GoogleGenAI({ apiKey: key });

  const contents = [...history, { role: "user", parts: [{ text: message }] }];

  let stream: AsyncGenerator<{ text?: string }> | null = null;
  let lastStatus: number | null = null;

  for (const attempt of ATTEMPTS) {
    try {
      stream = await ai.models.generateContentStream({
        model: attempt.model,
        contents,
        config: {
          systemInstruction: context.system,
          temperature: 0.7,
          maxOutputTokens: MAX_OUTPUT,
          ...(attempt.minimal
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
            : {}),
        },
      });
      break;
    } catch (error) {
      stream = null;
      lastStatus = (error as { status?: number })?.status ?? null;
      console.error(
        `[mascot] ${attempt.model} (minimal=${attempt.minimal}) failed:`,
        lastStatus,
        (error as { message?: string })?.message?.slice(0, 300),
      );
    }
  }

  if (!stream) {
    if (lastStatus === 429) {
      return fail(
        "Kuota harian maskot sudah habis. Coba lagi nanti atau pakai API key lain.",
        429,
      );
    }
    return fail("Maskot sedang tidak bisa dihubungi. Coba lagi sebentar lagi.", 502);
  }

  const encoder = new TextEncoder();
  const thread = threadId;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";

      try {
        for await (const chunk of stream) {
          const piece = chunk.text;
          if (!piece) continue;
          full += piece;
          controller.enqueue(encoder.encode(piece));
        }
      } catch {
        if (!full) {
          controller.enqueue(
            encoder.encode("Maaf, jawabannya terputus. Coba tanya lagi ya."),
          );
        }
      }

      controller.close();

      const { error: saveError } = await saving;
      if (saveError) console.error("[mascot] gagal menyimpan pesan pengguna:", saveError.message);

      const answer = full.trim();
      if (answer) {
        await supabase
          .from("assistant_messages")
          .insert({ thread_id: thread, role: "model", body: answer });
        await supabase
          .from("assistant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", thread);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Thread-Id": thread,
    },
  });
}
