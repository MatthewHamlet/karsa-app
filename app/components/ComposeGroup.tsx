"use client";

import { useActionState, useEffect, useId, useState } from "react";
import Modal from "./Modal";
import GroupArt, { type GroupArtKind } from "./GroupArt";
import { createGroup, type CommunityResult } from "../lib/community/actions";
import type { Tone } from "./tones";

const FIELD =
  "w-full rounded-2xl border-2 border-karsa-line bg-white px-4 text-[15px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";
const LABEL = "block text-[13px] font-semibold text-neutral-600";

const STYLES: { art: GroupArtKind; tone: Tone; label: string }[] = [
  { art: "nutrition", tone: "green", label: "Nutrisi" },
  { art: "elderly", tone: "peach", label: "Lansia" },
  { art: "mind", tone: "lavender", label: "Mental" },
  { art: "recovery", tone: "blue", label: "Pemulihan" },
];

export default function ComposeGroup({
  open,
  onClose,
  ownsGroup,
}: {
  open: boolean;
  onClose: () => void;
  ownsGroup: boolean;
}) {
  const [state, action, busy] = useActionState<CommunityResult, FormData>(createGroup, {
    error: null,
  });
  const [style, setStyle] = useState(0);
  const uid = useId();

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat grup"
      description="Ruang untuk orang yang menghadapi hal yang sama denganmu."
      size="lg"
    >
      {ownsGroup ? (
        <div className="py-4 text-center">
          <p className="text-[16px] font-bold text-neutral-800">
            Kamu sudah punya satu grup.
          </p>
          <p className="mx-auto mt-2 max-w-[34ch] text-[14.5px] leading-6 text-neutral-500">
            Satu akun hanya bisa membuat satu grup, supaya tiap grup benar-benar
            diurus. Buka grupmu dari daftar &ldquo;Grup Saya&rdquo;.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full rounded-2xl bg-karsa text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            Mengerti
          </button>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="art" value={STYLES[style].art} />
          <input type="hidden" name="tone" value={STYLES[style].tone} />

          <div>
            <label className={LABEL} htmlFor={`${uid}-name`}>
              Nama grup
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              required
              maxLength={80}
              disabled={busy}
              placeholder="Pendamping Lansia Jakarta"
              className={`${FIELD} mt-1.5 h-13 py-3.5`}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor={`${uid}-blurb`}>
              Deskripsi
            </label>
            <textarea
              id={`${uid}-blurb`}
              name="blurb"
              rows={3}
              maxLength={300}
              disabled={busy}
              placeholder="Untuk siapa grup ini, dan apa yang dibahas di dalamnya."
              className={`${FIELD} mt-1.5 resize-none py-3`}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor={`${uid}-keywords`}>
              Topik <span className="font-normal text-neutral-400">(pisahkan dengan koma)</span>
            </label>
            <input
              id={`${uid}-keywords`}
              name="keywords"
              maxLength={200}
              disabled={busy}
              placeholder="lansia, demensia, jakarta"
              className={`${FIELD} mt-1.5 h-13 py-3.5`}
            />
          </div>

          <div>
            <span className={LABEL}>Gambar grup</span>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {STYLES.map((option, i) => (
                <button
                  key={option.art}
                  type="button"
                  onClick={() => setStyle(i)}
                  aria-pressed={style === i}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                    style === i
                      ? "border-karsa bg-karsa-soft"
                      : "border-karsa-line bg-white hover:border-karsa/40"
                  }`}
                >
                  <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl">
                    <GroupArt kind={option.art} tone={option.tone} className="h-full w-full" />
                  </span>
                  <span className="text-[11.5px] font-semibold text-neutral-600">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="rounded-2xl bg-karsa-soft px-4 py-3 text-[13px] leading-5 text-karsa-dark">
            Kamu otomatis jadi admin dan anggota grup ini. Sebagai admin kamu
            bisa mengeluarkan anggota.
          </p>

          {state.error && (
            <p
              role="alert"
              className="whitespace-pre-line rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-800"
            >
              {state.error}
            </p>
          )}

          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-2xl bg-white text-[15px] font-bold text-neutral-600 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-12 flex-[2] rounded-2xl bg-karsa text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {busy ? "Membuat…" : "Buat grup"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
