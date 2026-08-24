/** Scanned prescriptions: what the reader pulls off a photo, and every sheet
 *  scanned before it.
 *
 *  No reader behind this yet — `EXTRACTED` is what a scan is scripted to find,
 *  so the review screen can be designed against a realistic result. Point it at
 *  a real OCR response and nothing else here has to move. */

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  /** How it is taken, in the words a label uses. */
  rule: string;
  /** The schedule those words work out to. Editable — a reader guesses these
   *  from "3x sehari", and a household's hours are its own. */
  times: string[];
  /** Below this, the reader wasn't sure. The row says so rather than hiding it:
   *  a misread dose is the one mistake this feature must not make quietly. */
  confident?: boolean;
};


/** What the scan comes back with, before anyone checks it. */
export const SCAN_TIPS = [
  "Letakkan resep di permukaan datar dengan cahaya merata.",
  "Pastikan seluruh tepi kertas masuk ke dalam bingkai.",
  "Hindari bayangan tangan atau kepala di atas kertas.",
  "Jika tulisan dokter sulit dibaca, foto lebih dekat per bagian.",
];
