"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, Trash2, Upload } from "lucide-react";
import { createClient } from "../lib/supabase/client";


function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[13.5px] font-semibold text-neutral-700">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[12.5px] leading-4 text-neutral-500">{hint}</p>}
    </div>
  );
}

const CONTROL =
  "w-full rounded-2xl bg-white px-4 py-3 text-[15px] leading-6 text-neutral-800 outline-none ring-1 ring-karsa-line transition-shadow duration-200 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/50";

export function TextField({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  readOnly,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
}) {
  const id = useId();

  return (
    <Field id={id} label={label} hint={hint}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${readOnly ? "cursor-not-allowed bg-karsa-canvas/60 text-neutral-500" : ""}`}
      />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  const id = useId();

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL} appearance-none pr-11`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          strokeWidth={2.2}
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>
    </Field>
  );
}


export function AvatarField({
  initial,
  value,
  onChange,
}: {
  initial: string;

  value: string | null;

  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | null) => {
    setError(null);

    if (!file) {

      if (inputRef.current) inputRef.current.value = "";
      onChange(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Fotonya lebih dari 2 MB. Pilih yang lebih kecil ya.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Kamu belum masuk.");
        return;
      }


      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {

        const missingBucket = /bucket not found|does not exist/i.test(uploadError.message);
        setError(
          missingBucket
            ? "Penyimpanan foto belum disiapkan. Jalankan supabase/migrations/0024_avatar_storage.sql dulu."
            : process.env.NODE_ENV === "development"
              ? `Fotonya gagal diunggah.\n\n[dev] ${uploadError.message}`
              : "Fotonya gagal diunggah. Coba lagi atau pilih yang lain.",
        );
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      onChange(publicUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-karsa text-[28px] font-bold text-white ring-1 ring-karsa-line">
        {value ? (

          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-karsa-dark/55 text-[11px] font-bold">
            …
          </span>
        )}
      </span>

      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-neutral-700">Foto profil</p>
        <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-500">
          Terlihat oleh tim perawatan. PNG atau JPG, maksimal 2 MB.
        </p>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-karsa px-4 py-2 text-[13.5px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Upload size={15} strokeWidth={2.3} />
            {busy ? "Mengunggah…" : "Pilih foto"}
          </button>

          {value && !busy && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-rose-600 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 size={15} strokeWidth={2.2} />
              Hapus
            </button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-2 whitespace-pre-line text-[12.5px] font-semibold leading-4 text-rose-700"
          >
            {error}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Pilih foto profil"
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}


export function FormActions({
  dirty,
  onSave,
  onCancel,
  saved,
}: {
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
  saved?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        onClick={onSave}
        disabled={!dirty}
        className="rounded-full bg-karsa px-5 py-2.5 text-[14px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        Simpan Perubahan
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={!dirty}
        className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-neutral-700 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:cursor-not-allowed disabled:text-neutral-400"
      >
        Batal
      </button>


      <p role="status" aria-live="polite" className="text-[13px] text-neutral-500">
        {dirty ? "Ada perubahan yang belum disimpan." : saved ? "Perubahan tersimpan." : ""}
      </p>
    </div>
  );
}
