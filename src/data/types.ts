export type Photo = {
  id?: string;
  src: string;
  storagePath?: string;
  label: string;
  caption: string;
};

export type Appt = {
  id?: string;
  slug: string;
  ref: string;
  dispo: string;
  arrondissement: string;
  quartier: string;
  name: string;
  nameItalic: string;
  baseline: string;
  shortDescription: string;
  longDescription: string[];
  surface: string;
  chambres: string;
  sdb: string;
  etage: string;
  couchages: string;
  minStay: string;
  loyerNum: number;
  image: string;
  gallery: Photo[];
  inclus: string[];
  // Versions EN (nullable) — fallback FR si absent.
  dispoEn?: string | null;
  baselineEn?: string | null;
  shortDescriptionEn?: string | null;
  longDescriptionEn?: string[] | null;
  etageEn?: string | null;
  minStayEn?: string | null;
  inclusEn?: string[] | null;
  isPublished?: boolean;
  sortOrder?: number;
};
