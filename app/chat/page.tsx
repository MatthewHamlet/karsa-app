import type { Metadata } from "next";
import { MessagesSquare, Paperclip } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { CONTEXT_LABEL, type CareContextType } from "../data/care";

export const metadata: Metadata = {
  title: "Grup · Karsa",
  description: "Percakapan antar pendamping, terhubung dengan konteks perawatan.",
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** The destination for every "Diskusikan" on the Care page.
 *
 *  This is the landing only — it receives the care item and shows what would
 *  be attached to the message. The conversation itself is the Chat feature's
 *  own scope, not something the care profile should carry. */
export default async function Chat({ searchParams }: PageProps<"/chat">) {
  const params = await searchParams;

  const ref = first(params.ref);
  const label = first(params.label);
  const detail = first(params.detail);
  const withName = first(params.name);

  const [rawType, id] = ref?.split(":") ?? [];
  const type = (rawType ?? "") as CareContextType;
  const typeLabel = CONTEXT_LABEL[type];

  return (
    <div className="w-full px-4 pb-20 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pt-12">
      {/* Amber — the page's own colour, washed across the top. */}
      <PageHeader
        tone="amber"
        eyebrow="Grup"
        title={withName ? withName : "Tim perawatan"}
        subtitle="Percakapan antar pendamping Meimei."
        backHref="/care"
        backLabel="Kembali ke perawatan"
      />

      {typeLabel && label && (
        <section className="pt-10">
          <h2 className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-neutral-400">
            Konteks terlampir
          </h2>

          <div className="mt-5 flex max-w-xl items-start gap-4 rounded-2xl bg-tint-sand px-5 py-5 ring-1 ring-edge-sand">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-karsa-dark ring-1 ring-edge-sand">
              <Paperclip size={17} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-karsa/70">
                {typeLabel}
              </p>
              <p className="mt-1 text-[16px] font-semibold leading-6 text-neutral-800">{label}</p>
              {detail && (
                <p className="mt-0.5 text-[14.5px] leading-6 text-neutral-600">{detail}</p>
              )}
              {id && (
                <p className="mt-2 text-[12px] tabular-nums text-neutral-400">
                  {type}:{id}
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 max-w-xl text-[15px] leading-6 text-neutral-500">
            Pesan yang dikirim di sini akan membawa konteks di atas, sehingga percakapan
            selalu terhubung dengan perawatan yang dibahas.
          </p>
        </section>
      )}

      <section className="pt-10">
        <div className="flex max-w-xl items-start gap-4 border-t border-karsa-line/70 pt-7">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-neutral-400 ring-1 ring-karsa-line">
            <MessagesSquare size={17} strokeWidth={1.9} />
          </span>
          <p className="min-w-0 flex-1 text-[15px] leading-6 text-neutral-500">
            Percakapan tim perawatan tampil di halaman ini.
          </p>
        </div>
      </section>
    </div>
  );
}
