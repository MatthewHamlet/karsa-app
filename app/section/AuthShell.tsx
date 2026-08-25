import type { ReactNode } from "react";
import LoginScene from "../components/LoginScene";
import MascotPair from "../components/MascotPair";


export default function AuthShell({
  children,
  quiet = false,
}: {
  children: ReactNode;
  quiet?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <LoginScene />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">

        <section className="hidden flex-col items-center justify-center px-10 lg:flex">
          {!quiet && (
            <>
              <MascotPair className="w-full max-w-[27rem]" />
              <p className="mt-8 text-center text-3xl font-bold leading-relaxed text-neutral-800">
                &ldquo;One step toward a better life.&rdquo;
              </p>
            </>
          )}
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-lg rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_-32px_rgba(20,45,25,0.45)] backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
