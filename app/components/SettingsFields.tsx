"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Trash2, Upload } from "lucide-react";

/** The shell every field shares: label above, control below, hint under that.
 *  Labels sit above rather than beside — a two-column form makes the eye travel
 *  sideways for every value, and these are read far more often than edited. */
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
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  autoComplete?: string;
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
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL}
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

/** Picture picker. The preview is a real local object URL, so choosing a file
 *  actually shows that file — a chooser that silently discards what you gave it
 *  is worse than no chooser. Nothing is uploaded: there is no server yet, and
 *  the button says as much by only ever changing what is on this screen. */
export function AvatarField({
  initial,
  onFileChange,
}: {
  initial: string;
  onFileChange?: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* Object URLs are held by the document until revoked, so each one is released
     as soon as it is replaced and again when the field goes away. */
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (file: File | null) => {
    setPreview(file ? URL.createObjectURL(file) : null);
    onFileChange?.(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-karsa text-[28px] font-bold text-white ring-1 ring-karsa-line">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: URL, not an asset the optimiser can touch
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
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
            className="inline-flex items-center gap-2 rounded-full bg-karsa px-4 py-2 text-[13.5px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2"
          >
            <Upload size={15} strokeWidth={2.3} />
            Pilih foto
          </button>

          {preview && (
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                pick(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-rose-600 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 size={15} strokeWidth={2.2} />
              Hapus
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          aria-label="Pilih foto profil"
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

/** Save and cancel. Both are dead until something has actually changed — a live
 *  Save on an untouched form invites a click that does nothing and teaches the
 *  caregiver the button is unreliable. */
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

      {/* Polite, so it is announced after the caregiver stops typing rather
          than interrupting them mid-field. */}
      <p role="status" aria-live="polite" className="text-[13px] text-neutral-500">
        {dirty ? "Ada perubahan yang belum disimpan." : saved ? "Perubahan tersimpan." : ""}
      </p>
    </div>
  );
}
