"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  HeartHandshake,
  IdCard,
  Info,
  Languages,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Palette,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import AccentIcon from "../components/AccentIcon";
import PageHeader from "../components/PageHeader";
import SettingRow from "../components/SettingRow";
import Toggle from "../components/Toggle";
import { EASE } from "../components/List";
import { TONES, type Tone } from "../components/tones";
import {
  ACCOUNT,
  SETTINGS,
  SETTING_ITEMS,
  type IconKey,
} from "../data/settings";

const ICON: Record<IconKey, typeof UserRound> = {
  user: UserRound,
  idCard: IdCard,
  bell: Bell,
  palette: Palette,
  languages: Languages,
  careHands: HeartHandshake,
  patientAccess: UsersRound,
  privacy: ShieldCheck,
  security: LockKeyhole,
  support: LifeBuoy,
  about: Info,
};

/** Rounded list container — the shape every settings group shares. */
const LIST =
  "overflow-hidden rounded-2xl bg-white ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-28px_rgba(24,32,24,0.35)]";

const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2.5 px-1 text-[14px] font-semibold text-neutral-500">{children}</h2>
);

export default function SettingsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  /** Switch state lives here so a row can be flipped and stay flipped. */
  const [switches, setSwitches] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      SETTING_ITEMS.flatMap((item) =>
        item.rows
          .filter((row) => row.control.kind === "toggle")
          .map((row) => [
            `${item.id}.${row.id}`,
            row.control.kind === "toggle" && row.control.enabled,
          ]),
      ),
    ),
  );

  const selected = useMemo(
    () => SETTING_ITEMS.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  );

  const fade = reduce
    ? { duration: 0 }
    : { duration: 0.24, ease: EASE };

  return (
    <div className="w-full px-4 pb-16 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pt-12">
      {/* The page wears its colour: a wash across the top, not a banner.
          No "go home" arrow — the rail already does that. The only back
          control left is the one that climbs out of a settings detail, which
          mobile has no other way to do. */}
      <PageHeader
        tone="forest"
        eyebrow={selected ? selected.groupLabel : "Karsa"}
        title={selected ? selected.title : "Pengaturan"}
        subtitle={
          selected ? selected.description : "Kelola akun, preferensi, dan privasi aplikasi kamu."
        }
        onBack={selected ? () => setSelectedId(null) : undefined}
        backLabel="Kembali ke semua pengaturan"
      />

      <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-10">
        {/* ── Persistent profile + navigation ─────────────────────────────
            Desktop only. On mobile the profile becomes a card at the top of
            the list and the groups are the navigation. */}
        <aside className="hidden lg:sticky lg:top-10 lg:block lg:self-start">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-30px_rgba(24,32,24,0.4)]">
            <span className="relative inline-block">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-karsa text-[22px] font-bold text-white">
                {ACCOUNT.initial}
              </span>
              <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-[3px] ring-white" />
            </span>

            <p className="mt-4 truncate text-[19px] font-bold leading-7 tracking-tight text-neutral-900">
              {ACCOUNT.name}
            </p>
            <p className="mt-0.5 text-[14px] text-neutral-500">{ACCOUNT.role}</p>
            <p className="mt-3 truncate text-[13px] text-neutral-400">{ACCOUNT.email}</p>
          </div>

          <nav className="mt-6">
            <ul className="space-y-1">
              <li>
                <NavEntry
                  icon={SettingsIcon}
                  tone="neutral"
                  label="Semua pengaturan"
                  active={selectedId === null}
                  onClick={() => setSelectedId(null)}
                />
              </li>
            </ul>

            {SETTINGS.map((group) => (
              <div key={group.id} className="mt-6">
                <p className="mb-2 px-3 text-[13px] font-semibold text-neutral-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <NavEntry
                        icon={ICON[item.icon]}
                        tone={group.tone}
                        label={item.title}
                        active={selectedId === item.id}
                        onClick={() => setSelectedId(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="mt-8 border-t border-karsa-line pt-4">
              <LogOutButton />
            </div>
          </nav>
        </aside>

        {/* ── Content ──────────────────────────────────────────────────────
            Capped: settings are list rows, and a 1000px row leaves the chevron
            stranded a long way from the label it belongs to. */}
        <div className="min-w-0 max-w-[820px]">
          {/* Keyed, so switching section remounts and replays the entrance.
              Deliberately no AnimatePresence: `mode="wait"` would hold the new
              panel back until the old one finished animating out, which puts a
              delay on every click for no benefit. */}
          <motion.div
            key={selectedId ?? "overview"}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fade}
          >
              {selected ? (
                <section>
                  <div className={LIST}>
                    <ul className="divide-y divide-karsa-line/70">
                      {selected.rows.map((row) => {
                        const key = `${selected.id}.${row.id}`;
                        return (
                          <li key={row.id}>
                            {row.control.kind === "toggle" ? (
                              <SettingRow
                                title={row.title}
                                description={row.description}
                                trailing={
                                  <Toggle
                                    label={row.title}
                                    checked={switches[key] ?? false}
                                    onChange={(next) =>
                                      setSwitches((prev) => ({ ...prev, [key]: next }))
                                    }
                                  />
                                }
                              />
                            ) : (
                              <SettingRow
                                title={row.title}
                                description={row.description}
                                value={
                                  row.control.kind === "value" ? row.control.value : undefined
                                }
                                interactive
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              ) : (
                <div className="space-y-7">
                  {/* Account card — the mobile counterpart of the desktop rail. */}
                  <section className="lg:hidden">
                    <div className={LIST}>
                      <button
                        type="button"
                        onClick={() => setSelectedId("profile")}
                        className="group/row flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
                      >
                        <span className="relative shrink-0">
                          <span className="grid h-12 w-12 place-items-center rounded-full bg-karsa text-[17px] font-bold text-white">
                            {ACCOUNT.initial}
                          </span>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-[3px] ring-white" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16.5px] font-semibold leading-6 text-neutral-800">
                            {ACCOUNT.name}
                          </span>
                          <span className="block truncate text-[13.5px] leading-5 text-neutral-500">
                            {ACCOUNT.email}
                          </span>
                        </span>
                        <ChevronRight
                          size={18}
                          strokeWidth={2}
                          className="shrink-0 text-neutral-300 transition-transform duration-200 group-hover/row:translate-x-0.5"
                        />
                      </button>
                    </div>
                  </section>

                  {SETTINGS.map((group) => (
                    <section key={group.id}>
                      <GroupLabel>{group.label}</GroupLabel>
                      <div className={LIST}>
                        <ul className="divide-y divide-karsa-line/70">
                          {group.items.map((item) => (
                            <li key={item.id}>
                              <SettingRow
                                icon={
                                  <AccentIcon
                                    icon={ICON[item.icon]}
                                    tone={group.tone}
                                    size="md"
                                  />
                                }
                                title={item.title}
                                description={item.description}
                                interactive
                                onClick={() => setSelectedId(item.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  ))}

                  <section className="lg:hidden">
                    <div className={LIST}>
                      <LogOutButton variant="row" />
                    </div>
                  </section>
                </div>
              )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function NavEntry({
  icon,
  tone,
  label,
  active,
  onClick,
}: {
  icon: typeof UserRound;
  tone: Tone;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
        active ? "bg-karsa-soft" : "hover:bg-white"
      }`}
    >
      <AccentIcon icon={icon} tone={tone} size="sm" />
      <span
        className={`min-w-0 flex-1 truncate text-[14.5px] ${
          active ? "font-semibold text-karsa-dark" : "font-medium text-neutral-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/** `rail` sits under the sidebar nav, `row` inside a rounded list on mobile —
 *  same action, padding matched to whichever container holds it. */
function LogOutButton({ variant = "rail" }: { variant?: "rail" | "row" }) {
  const shell =
    variant === "rail"
      ? "gap-3 rounded-xl px-3 py-2.5"
      : "gap-4 px-5 py-4";

  return (
    <button
      type="button"
      className={`flex w-full items-center text-left outline-none transition-colors duration-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-300 ${shell} ${TONES.rose.ink}`}
    >
      <span
        className={`grid shrink-0 place-items-center ${
          variant === "rail" ? "h-9 w-9 rounded-[10px]" : "h-11 w-11 rounded-xl"
        } ${TONES.rose.tile}`}
      >
        <LogOut size={variant === "rail" ? 17 : 19} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15.5px] font-semibold">Keluar</span>
    </button>
  );
}
