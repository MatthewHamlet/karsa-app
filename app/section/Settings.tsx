"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  Flame,
  HeartHandshake,
  IdCard,
  Info,
  Languages,
  LifeBuoy,
  Lock,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Moon,
  NotebookPen,
  Palette,
  Pencil,
  Pill,
  Settings as SettingsIcon,
  ShieldCheck,
  Sprout,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import AccentIcon from "../components/AccentIcon";
import PageHeader from "../components/PageHeader";
import SettingRow from "../components/SettingRow";
import Toggle from "../components/Toggle";
import { EASE } from "../components/List";
import { TONES, type Tone } from "../components/tones";
import {
  ACCOUNT,
  ACCOUNT_STATS,
  BADGES,
  CONTRIBUTIONS,
  OVERVIEW,
  QUICK_SETTINGS,
  SELF_CARE,
  SETTINGS,
  SETTING_ITEMS,
  type IconKey,
} from "../data/settings";

const ICON: Record<IconKey, LucideIcon> = {
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

/** Each overview card gets the hue of the area it sends you to, so the button
 *  you press and the section you land in are the same colour. */
const OVERVIEW_FACE: Record<string, { icon: LucideIcon; tone: Tone }> = {
  team: { icon: UsersRound, tone: "peach" },
  safety: { icon: ShieldCheck, tone: "blue" },
  help: { icon: LifeBuoy, tone: "cream" },
};

const CONTRIBUTION_ICON: Record<string, LucideIcon> = {
  notes: NotebookPen,
  doses: Pill,
  replies: MessageCircle,
  streak: Flame,
};

const BADGE_ICON: Record<string, LucideIcon> = {
  steady: HeartHandshake,
  keeper: NotebookPen,
  open: MessageCircle,
  night: Moon,
};

/** Rounded list container — the shape every settings group shares. */
const LIST =
  "overflow-hidden rounded-2xl bg-white ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-28px_rgba(24,32,24,0.35)]";

const CARD =
  "rounded-[22px] bg-white ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-30px_rgba(24,32,24,0.4)]";

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

  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
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

      {/* The rail is the navigation at every size — on a phone it simply sits
          above the content instead of beside it. That is why there is no second
          copy of the settings list in the right column any more: one list, one
          place, whatever the viewport. */}
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-10">
        <ProfileRail selectedId={selectedId} onSelect={setSelectedId} />

        <div className="min-w-0">
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
                            value={row.control.kind === "value" ? row.control.value : undefined}
                            interactive
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <Overview
                onSelect={setSelectedId}
                switches={switches}
                onSwitch={(key, next) => setSwitches((prev) => ({ ...prev, [key]: next }))}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── Left column ──────────────────────────────────────────────────────────── */

function ProfileRail({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-10 lg:self-start">
      {/* Identity. The pencils are real: both open the profile section, which
          is where a name actually gets changed. */}
      <div className="flex flex-col items-start">
        <span className="relative inline-block">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-karsa text-[28px] font-bold text-white xl:h-24 xl:w-24 xl:text-[32px]">
            {ACCOUNT.initial}
          </span>
          <button
            type="button"
            onClick={() => onSelect("profile")}
            aria-label="Ubah foto profil"
            className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-500 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <Pencil size={14} strokeWidth={2.2} />
          </button>
        </span>

        <div className="mt-4 flex w-full items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-[22px] font-bold leading-8 tracking-tight text-neutral-900 xl:text-[25px]">
            {ACCOUNT.name}
          </h2>
          <button
            type="button"
            onClick={() => onSelect("profile")}
            aria-label="Ubah nama"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 outline-none transition-colors duration-200 hover:bg-white hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <Pencil size={15} strokeWidth={2.2} />
          </button>
        </div>

        <p className="mt-0.5 flex items-center gap-2 text-[13.5px] text-neutral-500">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          {ACCOUNT.role}
        </p>
      </div>

      {/* Three figures, evenly spaced — the shape the reference uses for
          follower counts, carrying something worth counting instead. */}
      <dl className="mt-5 flex gap-6">
        {ACCOUNT_STATS.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="truncate text-[12.5px] leading-4 text-neutral-500">{stat.label}</dt>
            <dd className="mt-0.5 text-[19px] font-bold leading-7 tabular-nums text-neutral-900">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* The one warm block in the column. */}
      <Link
        href={SELF_CARE.href}
        className={`mt-6 flex gap-3.5 rounded-2xl p-4 outline-none ring-1 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${TONES.cream.card} ${TONES.cream.ring} hover:brightness-[0.985]`}
      >
        <AccentIcon icon={Sprout} tone="cream" size="sm" />
        <span className="min-w-0">
          <span className="block text-[14.5px] font-bold leading-5 text-neutral-800">
            {SELF_CARE.title}
          </span>
          <span className="mt-1 block text-[13px] leading-5 text-neutral-600">
            {SELF_CARE.body}
          </span>
          <span className={`mt-2 block text-[13px] font-semibold ${TONES.cream.ink}`}>
            {SELF_CARE.action} →
          </span>
        </span>
      </Link>

      <nav className="mt-6">
        <ul>
          <li>
            <NavRow
              icon={SettingsIcon}
              tone="neutral"
              label="Semua pengaturan"
              active={selectedId === null}
              onClick={() => onSelect(null)}
            />
          </li>
        </ul>

        {SETTINGS.map((group) => (
          <div key={group.id} className="mt-5">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
              {group.label}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavRow
                    icon={ICON[item.icon]}
                    tone={group.tone}
                    label={item.title}
                    active={selectedId === item.id}
                    onClick={() => onSelect(item.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-6 border-t border-karsa-line pt-4">
          <LogOutButton />
        </div>
      </nav>
    </aside>
  );
}

/** A rail entry: filled row, icon, label, chevron. Filled rather than plain so
 *  the column reads as a list of destinations against the canvas. */
function NavRow({
  icon,
  tone,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
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
      className={`group/row flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
        active ? "bg-karsa-soft ring-1 ring-act-edge" : "bg-karsa-cream hover:bg-white"
      }`}
    >
      <AccentIcon icon={icon} tone={tone} size="sm" />
      <span
        className={`min-w-0 flex-1 truncate text-[14.5px] ${
          active ? "font-bold text-karsa-dark" : "font-medium text-neutral-700"
        }`}
      >
        {label}
      </span>
      <ChevronRight
        size={17}
        strokeWidth={2.1}
        className={`shrink-0 transition-transform duration-200 group-hover/row:translate-x-0.5 ${
          active ? "text-karsa-dark" : "text-neutral-300"
        }`}
      />
    </button>
  );
}

function LogOutButton() {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors duration-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300 ${TONES.rose.ink}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${TONES.rose.tile}`}>
        <LogOut size={17} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">Keluar</span>
    </button>
  );
}

/* ── Right column ─────────────────────────────────────────────────────────── */

/** The handful of controls that carry the day, hoisted out of their sections.
 *
 *  These are the real rows, not copies of them: the toggles read and write the
 *  same state the detail panels do, so flipping one here and then opening its
 *  section shows it already flipped. Rows that aren't switches open their
 *  section instead, since a time range needs a picker this card doesn't have. */
function QuickSettings({
  onSelect,
  switches,
  onSwitch,
}: {
  onSelect: (id: string) => void;
  switches: Record<string, boolean>;
  onSwitch: (key: string, next: boolean) => void;
}) {
  const rows = QUICK_SETTINGS.flatMap((ref) => {
    const item = SETTING_ITEMS.find((i) => i.id === ref.itemId);
    const row = item?.rows.find((r) => r.id === ref.rowId);
    return item && row ? [{ item, row, key: `${item.id}.${row.id}` }] : [];
  });

  return (
    <section className={LIST}>
      <header className="border-b border-karsa-line/70 px-5 py-5 sm:px-6">
        <h2 className="text-[19px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[21px]">
          Pengaturan Cepat
        </h2>
        <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">
          Yang paling sering diubah, tanpa perlu membuka bagiannya satu per satu.
        </p>
      </header>

      <ul className="divide-y divide-karsa-line/70">
        {rows.map(({ item, row, key }) => (
          <li key={key}>
            {row.control.kind === "toggle" ? (
              <SettingRow
                icon={<AccentIcon icon={ICON[item.icon]} tone={item.tone} size="md" />}
                title={row.title}
                description={item.title}
                trailing={
                  <Toggle
                    label={row.title}
                    checked={switches[key] ?? false}
                    onChange={(next) => onSwitch(key, next)}
                  />
                }
              />
            ) : (
              <SettingRow
                icon={<AccentIcon icon={ICON[item.icon]} tone={item.tone} size="md" />}
                title={row.title}
                description={item.title}
                value={row.control.kind === "value" ? row.control.value : undefined}
                interactive
                onClick={() => onSelect(item.id)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What the caregiver has put in, counted. The figure leads and the label sits
 *  under it — the number is the reward, and burying it under its own caption
 *  would waste the only line here that means anything. */
function Contributions() {
  return (
    <section className={`${CARD} p-6 sm:p-7 xl:p-8`}>
      <header className="mb-6">
        <h2 className="text-[19px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[21px]">
          Kontribusi kamu
        </h2>
        <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">
          Yang sudah kamu kerjakan sejak mulai mendampingi Meimei.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {CONTRIBUTIONS.map((item) => {
          const t = TONES[item.tone];

          return (
            <li
              key={item.id}
              className={`flex items-start gap-3.5 rounded-2xl p-4 ring-1 ${t.card} ${t.ring}`}
            >
              <AccentIcon icon={CONTRIBUTION_ICON[item.id]} tone={item.tone} size="md" />
              <div className="min-w-0">
                <p className="text-[23px] font-bold leading-8 tabular-nums text-neutral-900">
                  {item.value}
                </p>
                <p className="text-[13.5px] font-semibold leading-5 text-neutral-700">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-500">{item.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Milestones. The unearned one is kept in the list rather than hidden: seeing
 *  73 of 100 is the only part of this card that can still change anything. */
function Badges() {
  return (
    <section className={`${CARD} p-6 sm:p-7 xl:p-8`}>
      <header className="mb-5">
        <h2 className="text-[19px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[21px]">
          Lencana
        </h2>
        <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">
          Ditandai sendiri dari catatanmu — tidak ada yang perlu diklaim.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {BADGES.map((badge) => {
          const t = TONES[badge.tone];
          const Icon = BADGE_ICON[badge.id];
          const locked = Boolean(badge.progress);
          const pct = badge.progress
            ? Math.round((badge.progress.current / badge.progress.target) * 100)
            : 100;

          return (
            <li
              key={badge.id}
              className={`flex items-start gap-3.5 rounded-2xl p-4 ring-1 ${
                locked ? "bg-white ring-karsa-line" : `${t.card} ${t.ring}`
              }`}
            >
              <span
                className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                  locked ? "bg-karsa-canvas text-neutral-400" : t.tile
                }`}
              >
                <Icon size={19} strokeWidth={2} />
                {locked && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-neutral-400 ring-1 ring-karsa-line">
                    <Lock size={10} strokeWidth={2.8} />
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[14.5px] font-bold leading-5 ${
                    locked ? "text-neutral-500" : "text-neutral-800"
                  }`}
                >
                  {badge.label}
                </p>
                <p className="text-[12.5px] leading-4 text-neutral-500">{badge.note}</p>

                {badge.progress && (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-karsa-canvas">
                      <div
                        className="h-full rounded-full bg-karsa/45"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] tabular-nums text-neutral-400">
                      {badge.progress.current} dari {badge.progress.target}
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Stacked cards, each one centred and short. The reference uses this shape for
 *  things you have not done yet; here it holds the decisions worth making on a
 *  settings page, so the column is a way in rather than a place to read. */
function Overview({
  onSelect,
  switches,
  onSwitch,
}: {
  onSelect: (id: string) => void;
  switches: Record<string, boolean>;
  onSwitch: (key: string, next: boolean) => void;
}) {
  return (
    <div className="space-y-5 xl:space-y-6">
      <Contributions />
      <QuickSettings onSelect={onSelect} switches={switches} onSwitch={onSwitch} />
      <Badges />

      {OVERVIEW.map((card) => {
        const face = OVERVIEW_FACE[card.id];

        return (
          <section key={card.id} className={`${CARD} px-6 py-8 text-center sm:px-10 xl:py-10`}>
            <span className="inline-grid">
              <AccentIcon icon={face.icon} tone={face.tone} size="lg" />
            </span>

            <h2 className="mx-auto mt-4 max-w-[30ch] text-[19px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[21px]">
              {card.title}
            </h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-[14.5px] leading-6 text-neutral-500">
              {card.body}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {card.actions.map((action) => (
                <button
                  key={action.target}
                  type="button"
                  onClick={() => onSelect(action.target)}
                  className={`rounded-full px-5 py-2.5 text-[14px] font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
                    action.primary
                      ? "bg-karsa text-white hover:bg-karsa-dark"
                      : "bg-tint-sand text-karsa-dark ring-1 ring-edge-sand hover:bg-karsa-soft"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
