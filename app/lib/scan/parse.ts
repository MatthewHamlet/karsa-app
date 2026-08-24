export type ParsedMedicine = {
  id: string;
  name: string;
  dose: string;
  rule: string;
  times: string[];
  confident: boolean;
};

const NOISE =
  /^(r\/?|resep|apotek|apotik|klinik|rumah sakit|rs\b|dr\.?|drg\.?|sip\b|no\.?|tgl\.?|tanggal|nama|umur|alamat|pasien|ttd|paraf)/i;

const DOSE =
  /(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|g|ml|cc|iu|ui|tablet|tabs?|kaplet|kapsul|caps?|sirup|syr|sachet|sach|tetes|drops?|puff)\b/i;

const CONFUSIONS: [RegExp, string][] = [
  [/(?<=\d)[lI|](?=\d)/g, "1"],
  [/\b([0-9])\s*[xX×]\b/g, "$1x"],
  [/\bsehar[i1l]\b/gi, "sehari"],
  [/\bkal[i1l]\b/gi, "kali"],
  [/\bmakam\b/gi, "makan"],
  [/\bt1dur\b/gi, "tidur"],
  [/\b(?:m9|rng|mq)\b/gi, "mg"],
];

const UNIT_RUN = /\b(\d[\doOlI|]*)\s*(mg|mcg|ug|ml|cc|iu|g)\b/gi;

function repair(line: string): string {
  const fixed = line.replace(UNIT_RUN, (_, digits: string, unit: string) => {
    const clean = digits.replace(/[oO]/g, "0").replace(/[lI|]/g, "1");
    return `${clean} ${unit}`;
  });
  return CONFUSIONS.reduce((acc, [re, to]) => acc.replace(re, to), fixed);
}

const FREQ = [
  { re: /\b(\d)\s*[x×]\s*(\d+)?\s*(?:sehari|sehari|hari|\/hari|per hari)?/i, from: (m: RegExpMatchArray) => Number(m[1]) },
  { re: /\bsekali\s+sehari\b/i, from: () => 1 },
  { re: /\bdua\s+kali\s+sehari\b/i, from: () => 2 },
  { re: /\btiga\s+kali\s+sehari\b/i, from: () => 3 },
  { re: /\bempat\s+kali\s+sehari\b/i, from: () => 4 },
  { re: /\bo\.?d\.?\b|\bq\.?d\.?\b/i, from: () => 1 },
  { re: /\bb\.?i\.?d\.?\b/i, from: () => 2 },
  { re: /\bt\.?i\.?d\.?\b/i, from: () => 3 },
  { re: /\bq\.?i\.?d\.?\b/i, from: () => 4 },
];

const SCHEDULE: Record<number, string[]> = {
  1: ["08:00"],
  2: ["08:00", "20:00"],
  3: ["08:00", "14:00", "20:00"],
  4: ["06:00", "12:00", "18:00", "22:00"],
};

const WHEN =
  /\b(sebelum makan|sesudah makan|setelah makan|saat makan|sebelum tidur|pagi|siang|sore|malam)\b/i;

const TIME_OF_DAY: Record<string, string> = {
  pagi: "08:00",
  siang: "14:00",
  sore: "17:00",
  malam: "20:00",
  "sebelum tidur": "21:00",
};

function timesFor(count: number, when: string | null): string[] {
  if (count === 1 && when) {
    const hour = TIME_OF_DAY[when.toLowerCase()];
    if (hour) return [hour];
  }
  return SCHEDULE[count] ?? SCHEDULE[1];
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.length > 2 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function frequencyOf(line: string): number | null {
  for (const entry of FREQ) {
    const match = line.match(entry.re);
    if (match) {
      const n = entry.from(match);
      if (n >= 1 && n <= 6) return n;
    }
  }
  return null;
}

export function parsePrescription(raw: string): ParsedMedicine[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => repair(line.replace(/[|_]+/g, " ").replace(/\s+/g, " ").trim()))
    .filter((line) => line.length >= 3);

  const out: ParsedMedicine[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (NOISE.test(line)) continue;

    const dose = line.match(DOSE);
    /* Prescriptions often break after the drug name, putting "3x sehari
       sesudah makan" on its own line underneath. Looking one line ahead when
       this one has no schedule of its own is what turns two half-rows into one
       complete medicine — and `consumed` is what stops that continuation line
       being emitted again as a medicine called "3x Sehari Sesudah Makan". */
    const next = lines[i + 1] ?? "";
    const nextIsOwnDrug = DOSE.test(next);
    const ownFreq = frequencyOf(line);
    const borrowed = ownFreq === null && !nextIsOwnDrug ? frequencyOf(next) : null;
    const freq = ownFreq ?? borrowed;
    if (!dose && freq === null) continue;

    let consumed = false;
    if (dose && borrowed !== null) consumed = true;

    let name = line;
    if (dose) name = name.slice(0, dose.index ?? name.length);
    name = name
      .replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "")
      .replace(/\b(r\/|resep)\b/gi, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 3) continue;

    const when = line.match(WHEN) ?? (nextIsOwnDrug ? null : next.match(WHEN));
    const count = freq ?? 1;
    const whenWord = when ? when[1].toLowerCase() : null;

    out.push({
      id: `ocr-${out.length}-${Date.now()}`,
      name: titleCase(name).slice(0, 60),
      dose: dose ? `${dose[1].replace(",", ".")} ${dose[2].toLowerCase()}` : "",
      rule: [freq ? `${count}x sehari` : "", whenWord ?? ""].filter(Boolean).join(" · "),
      times: timesFor(count, whenWord),
      confident: Boolean(dose && freq),
    });

    if (consumed) i += 1;
  }

  const seen = new Set<string>();
  return out.filter((medicine) => {
    const key = medicine.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
