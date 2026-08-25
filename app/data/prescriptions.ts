

export type Medicine = {
  id: string;
  name: string;
  dose: string;

  rule: string;

  times: string[];

  confident?: boolean;
};



export const SCAN_TIPS = [
  "Letakkan resep di permukaan datar dengan cahaya merata.",
  "Pastikan seluruh tepi kertas masuk ke dalam bingkai.",
  "Hindari bayangan tangan atau kepala di atas kertas.",
  "Jika tulisan dokter sulit dibaca, foto lebih dekat per bagian.",
];
