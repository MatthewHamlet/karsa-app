"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Modal from "./Modal";
import { createClient } from "../lib/supabase/client";
import { createPost, type CommunityResult } from "../lib/community/actions";
import type { CommunityGroup } from "../lib/community/queries";

/** Matches the bucket's own limits (migration 0012). Checked here as a courtesy
 *  — so somebody picking a 20MB photo is told before waiting for an upload —
 *  and again by Storage, which is the check that actually holds. */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Writing something for the community.
 *
 *  A plain `<form action={…}>` around a server action: it works before
 *  hydration, the browser validates the fields, and there is no client-side
 *  copy of the write to keep in step with the one on the server.
 *
 *  Three fields and no more. The thing being asked for is a question somebody
 *  is stuck on at eleven at night, and every extra field is another reason to
 *  close the dialog instead of pressing send. */
const FIELD =
  "w-full rounded-2xl border-2 border-karsa-line bg-white px-4 text-[15px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";
const LABEL = "block text-[13px] font-semibold text-neutral-600";

export default function ComposePost({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  /** Only the ones this person has joined — posting into a group you are not
   *  in is a way to reach an audience that never asked for you. */
  groups: CommunityGroup[];
}) {
  const [state, action, busy] = useActionState<CommunityResult, FormData>(createPost, {
    error: null,
  });
  const uid = useId();

  /* The picture is uploaded straight from the browser to Storage, and only its
     URL is posted to the server action. Routing the bytes through the action
     instead would push a 5MB body through a Server Action — which has its own
     size ceiling, holds a server worker for the length of a phone upload, and
     buys nothing, because Storage is the thing that has to receive it either
     way. */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Object URLs are a manual allocation: without the revoke the blob is pinned
     in memory for the life of the tab, once per photo previewed. */
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* Uploads as soon as a file is chosen rather than on submit, so the wait
     happens while they are still writing instead of after they press send. */
  useEffect(() => {
    if (!file) {
      setImageUrl("");
      return;
    }

    let cancelled = false;
    setUploading(true);
    setUploadError(null);

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setUploadError("Kamu belum masuk.");
        return;
      }

      /* The first path segment must be the uploader's own id — the storage
         policy checks exactly that, so a path shaped any other way is refused
         rather than silently landing somewhere shared. */
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("community")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (cancelled) return;
      if (error) {
        setUploadError("Gambarnya gagal diunggah. Coba lagi atau pilih yang lain.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("community").getPublicUrl(path);
      setImageUrl(publicUrl);
    })().finally(() => {
      if (!cancelled) setUploading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const pick = (chosen: File | null) => {
    setUploadError(null);
    if (chosen && chosen.size > MAX_BYTES) {
      setUploadError("Gambarnya lebih dari 5 MB. Pilih yang lebih kecil ya.");
      return;
    }
    setFile(chosen);
  };

  const clearImage = () => {
    setFile(null);
    setImageUrl("");
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* Closing on success rather than showing a confirmation: the post appears at
     the top of the feed behind the dialog, which says it landed better than a
     sentence claiming it did. */
  useEffect(() => {
    if (!state.ok) return;
    clearImage();
    onClose();
    /* `clearImage` is stable enough for this — it only touches setters and a
       ref — and listing it would re-run the effect on every render. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, onClose]);

  const mine = groups.filter((g) => g.joined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat postingan"
      description="Ceritakan yang kamu hadapi. Pendamping lain mungkin pernah di posisi yang sama."
      size="lg"
    >
      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className={LABEL} htmlFor={`${uid}-title`}>
            Judul
          </label>
          <input
            id={`${uid}-title`}
            name="title"
            required
            maxLength={160}
            disabled={busy}
            placeholder="Cara membujuk lansia yang menolak minum obat?"
            className={`${FIELD} mt-1.5 h-13 py-3.5`}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor={`${uid}-body`}>
            Ceritanya
          </label>
          <textarea
            id={`${uid}-body`}
            name="body"
            rows={6}
            maxLength={8000}
            disabled={busy}
            placeholder="Tulis sedetail yang kamu mau. Tidak harus rapi."
            className={`${FIELD} mt-1.5 resize-none py-3`}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor={`${uid}-tags`}>
            Topik <span className="font-normal text-neutral-400">(pisahkan dengan koma)</span>
          </label>
          <input
            id={`${uid}-tags`}
            name="tags"
            maxLength={200}
            disabled={busy}
            placeholder="lansia, obat, demensia"
            className={`${FIELD} mt-1.5 h-13 py-3.5`}
          />
          <p className="mt-1.5 text-[12.5px] leading-4 text-neutral-500">
            Topik juga dipakai untuk pencarian, jadi tulis kata yang orang lain
            mungkin cari.
          </p>
        </div>

        {/* ── Picture ─────────────────────────────────────────────────── */}
        <div>
          <span className={LABEL}>
            Gambar <span className="font-normal text-neutral-400">(opsional)</span>
          </span>

          {/* The URL, not the file, is what the action receives. */}
          <input type="hidden" name="image_url" value={imageUrl} />

          <input
            ref={fileRef}
            id={`${uid}-image`}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />

          {preview ? (
            <div className="relative mt-1.5 overflow-hidden rounded-2xl ring-2 ring-karsa-line">
              {/* A blob URL has no dimensions Next can know ahead of time and
                  no loader to run it through, so this one stays a plain `img`.
                  The posted version goes through `next/image` on the card. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Pratinjau gambar"
                className="max-h-64 w-full bg-karsa-canvas object-contain"
              />

              {uploading && (
                <p className="absolute inset-x-0 bottom-0 bg-neutral-900/70 py-2 text-center text-[13px] font-semibold text-white">
                  Mengunggah…
                </p>
              )}

              <button
                type="button"
                onClick={clearImage}
                aria-label="Hapus gambar"
                className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-neutral-900/60 text-white outline-none transition-colors hover:bg-neutral-900/80 focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={17} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`${uid}-image`}
              className="mt-1.5 flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-karsa-line bg-white text-neutral-500 outline-none transition-colors duration-200 hover:border-karsa hover:bg-karsa-soft/40 hover:text-karsa-dark"
            >
              <ImagePlus size={22} strokeWidth={2.2} aria-hidden />
              <span className="text-[13.5px] font-semibold">Tambahkan gambar</span>
              <span className="text-[12px] text-neutral-400">JPG, PNG, atau WebP · maks 5 MB</span>
            </label>
          )}

          {uploadError && (
            <p role="alert" className="mt-2 text-[13px] font-semibold text-rose-700">
              {uploadError}
            </p>
          )}
        </div>

        {mine.length > 0 && (
          <div>
            <label className={LABEL} htmlFor={`${uid}-group`}>
              Kirim ke <span className="font-normal text-neutral-400">(opsional)</span>
            </label>
            <select
              id={`${uid}-group`}
              name="group_id"
              disabled={busy}
              className={`${FIELD} mt-1.5 h-13 py-3.5`}
            >
              <option value="">Semua orang</option>
              {mine.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            /* Blocked while the picture is still going up: submitting now
               would post the text with an empty `image_url` and quietly drop
               the photo they chose. */
            disabled={busy || uploading}
            className="h-12 flex-[2] rounded-2xl bg-karsa text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {uploading ? "Mengunggah gambar…" : busy ? "Mengirim…" : "Kirim postingan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
