"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
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
import { AvatarField, FormActions, SelectField, TextField } from "../components/SettingsFields";
import { EASE } from "../components/List";
import { TONES, type Tone } from "../components/tones";
import { CARE_GROUP } from "../data/careStats";
import {
  ACCOUNT,
  ACCOUNT_STATS,
  BADGES,
  CONTRIBUTIONS,
  OVERVIEW,
  PROFILE_FIELDS,
  QUICK_SETTINGS,
  ROLE_OPTIONS,
  SELF_CARE,
  SETTINGS,
  SETTING_ITEMS,
  type IconKey,
  type ResolvedItem,
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

const LIST =
  "overflow-hidden rounded-2xl bg-white ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-28px_rgba(24,32,24,0.35)]";

const CARD =
  "rounded-[22px] bg-white ring-1 ring-karsa-line shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-30px_rgba(24,32,24,0.4)]";

/** The rail is a tablist, so every destination needs a stable id for the panel
 *  to point back at. `null` is the overview, which is a destination too. */
const tabId = (id: string | null) => `settings-tab-${id ?? "overview"}`;
const PANEL_ID = "settings-panel";

/** Every destination in rail order — what arrow keys walk along. */
const TAB_ORDER: (string | null)[] = [null, ...SETTING_ITEMS.map((item) => item.id)];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function SettingsPage({
  params,
}: {
  params?: Record<string, string | string[] | undefined>;
}) {
  /* `?bagian=profile` opens straight onto a section. The rail's profile row
     uses it, so that row lands somewhere different from the Pengaturan row
     right under it — two links to the same blank page would be one link. */
  const requested = first(params?.bagian);
  const [selectedId, setSelectedId] = useState<string | null>(
    requested && SETTING_ITEMS.some((item) => item.id === requested) ? requested : null,
  );
  const reduce = useReducedMotion();
  const mainRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  /** Switch state lives here so a row can be flipped and stay flipped, and so
   *  the quick list and the detail panel are the same switch twice over. */
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

  /* Under `lg` the rail sits above the panel and is taller than the screen, so
     picking a section would otherwise change something the caregiver cannot
     see. Skipped on the first render — nobody asked for that one. */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    mainRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, [selectedId, reduce]);

  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
      {/* The banner keeps saying "Pengaturan" whatever is open. The section's
          own name belongs on the panel that shows it — swapping the page title
          per selection left the caregiver with two headings competing to say
          where they were. */}
      <PageHeader
        tone="forest"
        eyebrow="Karsa"
        title="Pengaturan"
        subtitle="Kelola akun, preferensi, dan privasi aplikasi kamu."
      />

      {/* Centred, and capped at exactly what the two columns can use: 360 rail
          + 40 gap + the panel's own 1280 ceiling. Without the cap the panel
          column kept growing while the panel inside it stopped at 1280, so on a
          wide screen every pixel of slack pooled on one side — 48px of margin
          on the left against 529px on the right at 2560. The cap turns that
          into a column that is full or centred, never lopsided. */}
      <div className="mx-auto grid w-full max-w-[1680px] gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-10">
        <ProfileRail selectedId={selectedId} onSelect={setSelectedId} />

        {/* Capped rather than uncapped: past about 1280px a settings row puts
            its control so far from its label that they stop reading as one
            line. Below that it takes everything it is given. */}
        <div
          ref={mainRef}
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={tabId(selectedId)}
          tabIndex={-1}
          className="min-w-0 max-w-[1280px] scroll-mt-6 outline-none"
        >
          <motion.div
            key={selectedId ?? "overview"}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fade}
          >
            {selected ? (
              <Detail
                item={selected}
                switches={switches}
                onSwitch={(key, next) => setSwitches((prev) => ({ ...prev, [key]: next }))}
              />
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
  /** Arrow keys walk the rail and take the selection with them, which is the
   *  expected behaviour for a tablist whose panels are cheap to render. Home
   *  and End jump the ends so a fifty-item rail is still one keystroke deep.
   *
   *  Focus moves by id rather than through a map of refs: every tab is always
   *  mounted and already carries the id the panel points at, so there is
   *  nothing a ref would know that `tabId` does not. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;

    const current = TAB_ORDER.indexOf(selectedId);
    const last = TAB_ORDER.length - 1;
    const next =
      event.key === "ArrowDown"
        ? Math.min(current + 1, last)
        : event.key === "ArrowUp"
          ? Math.max(current - 1, 0)
          : event.key === "Home"
            ? 0
            : last;

    if (next === current) return;
    event.preventDefault();

    const target = TAB_ORDER[next];
    onSelect(target);
    document.getElementById(tabId(target))?.focus();
  };

  return (
    /* Its own scroller on desktop: the rail is far taller than a screen and
       nothing in it should push the panel beside it down. `overscroll-contain`
       stops the page taking over once the rail hits an end. */
    <aside className="lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3 scrollbar-slim">
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

      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Bagian pengaturan"
        onKeyDown={onKeyDown}
        className="mt-6 pb-2"
      >
        <NavRow
          id={tabId(null)}
          icon={SettingsIcon}
          tone="neutral"
          label="Semua pengaturan"
          active={selectedId === null}
          onClick={() => onSelect(null)}
        />

        {SETTINGS.map((group) => (
          <div key={group.id} className="mt-5" role="presentation">
            <p
              role="presentation"
              className="mb-2 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400"
            >
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <NavRow
                  key={item.id}
                  id={tabId(item.id)}
                  icon={ICON[item.icon]}
                  tone={group.tone}
                  label={item.title}
                  active={selectedId === item.id}
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 border-t border-karsa-line pt-4">
          <LogOutButton />
        </div>
      </div>
    </aside>
  );
}

/** A rail entry. Only the selected tab is in the tab order — arrow keys move
 *  between the rest, which is how a tablist is meant to be walked. */
function NavRow({
  id,
  icon,
  tone,
  label,
  active,
  onClick,
}: {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={PANEL_ID}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
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

/* ── Detail panels ────────────────────────────────────────────────────────── */

/** The frame every section shares: who you are looking at, then the controls.
 *  The heading lives here rather than in the page banner so the panel can be
 *  read on its own. */
function DetailShell({
  item,
  children,
  bodyClassName = "px-6 py-6 sm:px-8 sm:py-7",
}: {
  item: ResolvedItem;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className={CARD}>
      <header className="flex items-start gap-4 border-b border-karsa-line px-6 py-5 sm:px-8 sm:py-6">
        <AccentIcon icon={ICON[item.icon]} tone={item.tone} size="lg" />
        <div className="min-w-0">
          <h2 className="text-[21px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[23px]">
            {item.title}
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-neutral-500">{item.description}</p>
        </div>
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function Detail({
  item,
  switches,
  onSwitch,
}: {
  item: ResolvedItem;
  switches: Record<string, boolean>;
  onSwitch: (key: string, next: boolean) => void;
}) {
  if (item.id === "profile") return <ProfileForm item={item} />;
  if (item.id === "personal") return <PersonalForm item={item} />;

  return (
    <DetailShell item={item} bodyClassName="">
      <ul className="divide-y divide-karsa-line/70">
        {item.rows.map((row) => {
          const key = `${item.id}.${row.id}`;

          return (
            <li key={row.id} className="px-1 sm:px-3">
              {row.control.kind === "toggle" ? (
                <SettingRow
                  title={row.title}
                  description={row.description}
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
    </DetailShell>
  );
}

/** Two forms, one shape. `saved` is the last committed state and `draft` what
 *  is on screen; Cancel is just a copy of one onto the other, which is why it
 *  needs no confirmation of its own. */
function useDraft<T extends Record<string, string>>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = (Object.keys(saved) as (keyof T)[]).some((key) => saved[key] !== draft[key]);

  const set = (key: keyof T) => (next: string) => {
    setDraft((prev) => ({ ...prev, [key]: next }));
    setJustSaved(false);
  };

  const save = () => {
    setSaved(draft);
    setJustSaved(true);
  };

  const cancel = () => {
    setDraft(saved);
    setJustSaved(false);
  };

  return { draft, dirty, justSaved, set, save, cancel };
}

const FORM_DIVIDER = "mt-7 flex flex-col gap-4 border-t border-karsa-line pt-6";

function ProfileForm({ item }: { item: ResolvedItem }) {
  const form = useDraft({
    name: PROFILE_FIELDS.name,
    email: PROFILE_FIELDS.email,
    role: PROFILE_FIELDS.role,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.save();
  };

  return (
    <DetailShell item={item}>
      <form onSubmit={submit} noValidate>
        <AvatarField initial={ACCOUNT.initial} />

        {/* Two columns from `sm` up. The role selector takes the full row: it
            is the field that changes what the rest of the app lets you do. */}
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <TextField
            label="Nama lengkap"
            value={form.draft.name}
            onChange={form.set("name")}
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={form.draft.email}
            onChange={form.set("email")}
            autoComplete="email"
            hint="Dipakai untuk masuk dan pemberitahuan penting."
          />
          <div className="sm:col-span-2">
            <SelectField
              label="Peran pendamping"
              value={form.draft.role}
              options={ROLE_OPTIONS}
              onChange={form.set("role")}
              hint="Menentukan seberapa jauh kamu bisa mengubah data perawatan pasien."
            />
          </div>
        </div>

        <div className={FORM_DIVIDER}>
          <FormActions
            dirty={form.dirty}
            saved={form.justSaved}
            onSave={form.save}
            onCancel={form.cancel}
          />
        </div>
      </form>
    </DetailShell>
  );
}

function PersonalForm({ item }: { item: ResolvedItem }) {
  const form = useDraft({
    phone: PROFILE_FIELDS.phone,
    birth: PROFILE_FIELDS.birth,
    address: PROFILE_FIELDS.address,
    emergency: PROFILE_FIELDS.emergency,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.save();
  };

  return (
    <DetailShell item={item}>
      <form onSubmit={submit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Nomor telepon"
            type="tel"
            value={form.draft.phone}
            onChange={form.set("phone")}
            autoComplete="tel"
          />
          <TextField
            label="Tanggal lahir"
            type="date"
            value={form.draft.birth}
            onChange={form.set("birth")}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Alamat"
              value={form.draft.address}
              onChange={form.set("address")}
              autoComplete="street-address"
            />
          </div>
          <div className="sm:col-span-2">
            {/* Drawn from the care team rather than typed: an emergency contact
                who is not in the group is one the app cannot actually reach. */}
            <SelectField
              label="Kontak darurat"
              value={form.draft.emergency}
              options={CARE_GROUP.members.map((member) => member.name)}
              onChange={form.set("emergency")}
              hint="Dihubungi lebih dulu bila terjadi keadaan mendesak."
            />
          </div>
        </div>

        <div className={FORM_DIVIDER}>
          <FormActions
            dirty={form.dirty}
            saved={form.justSaved}
            onSave={form.save}
            onCancel={form.cancel}
          />
        </div>
      </form>
    </DetailShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */

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

function Contributions() {
  return (
    <section className={`${CARD} p-6 sm:p-7 xl:p-8`}>
      <header className="mb-6">
        <h2 className="text-[19px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[21px]">
          Kontribusi kamu
        </h2>
        <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">
          Yang sudah kamu kerjakan sejak mulai mendampingi.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CONTRIBUTIONS.map((entry) => {
          const t = TONES[entry.tone];

          return (
            <li
              key={entry.id}
              className={`flex items-start gap-3.5 rounded-2xl p-4 ring-1 ${t.card} ${t.ring}`}
            >
              <AccentIcon icon={CONTRIBUTION_ICON[entry.id]} tone={entry.tone} size="md" />
              <div className="min-w-0">
                <p className="text-[23px] font-bold leading-8 tabular-nums text-neutral-900">
                  {entry.value}
                </p>
                <p className="text-[13.5px] font-semibold leading-5 text-neutral-700">
                  {entry.label}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-500">{entry.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

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

      {/* Side by side once there is room — three full-width cards in a column
          was most of the empty space this page used to end on. */}
      <div className="grid gap-5 xl:grid-cols-3 xl:gap-6">
        {OVERVIEW.map((card) => {
          const face = OVERVIEW_FACE[card.id];

          return (
            <section
              key={card.id}
              className={`${CARD} flex flex-col px-6 py-8 text-center sm:px-8 xl:py-9`}
            >
              <span className="mx-auto inline-grid">
                <AccentIcon icon={face.icon} tone={face.tone} size="lg" />
              </span>

              <h2 className="mx-auto mt-4 max-w-[30ch] text-[18px] font-bold leading-6 tracking-tight text-neutral-900">
                {card.title}
              </h2>
              <p className="mx-auto mt-2 max-w-[46ch] text-[14px] leading-6 text-neutral-500">
                {card.body}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2.5 pt-0 xl:mt-auto xl:pt-6">
                {card.actions.map((action) => (
                  <button
                    key={action.target}
                    type="button"
                    onClick={() => onSelect(action.target)}
                    className={`rounded-full px-4 py-2.5 text-[13.5px] font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
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
    </div>
  );
}
