"use client";

import { useId, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { OTP_LENGTH } from "../lib/otp";


export default function CodeForm({
  email,
  action,
  pending,
  submitLabel,
  pendingLabel,
  length = OTP_LENGTH,
}: {
  email: string;
  action: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  length?: number;
}) {
  const [code, setCode] = useState("");
  const uid = useId();
  const codeField = `${uid}-code`;

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="email" value={email} />

      <label htmlFor={codeField} className="sr-only">
        Kode 6 digit dari email
      </label>
      <input
        id={codeField}
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        disabled={pending}
        maxLength={length}

        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, length))}
        placeholder={"0".repeat(length)}
        className="h-20 w-full rounded-2xl border-2 border-karsa-line bg-white text-center font-mono text-[26px] font-bold tracking-[0.3em] text-neutral-900 sm:text-[32px] outline-none transition-colors duration-200 placeholder:text-neutral-300 focus:border-karsa disabled:opacity-70"
      />

      <button
        type="submit"
        disabled={pending || code.length !== length}
        className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-lg font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck size={22} strokeWidth={2.6} aria-hidden />
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
