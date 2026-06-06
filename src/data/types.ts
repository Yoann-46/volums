/** Clés de pièce — voir RoomGallery + i18n room.* */
export type RoomKey =
  | "salon"
  | "salle_a_manger"
  | "cuisine"
  | "chambre"
  | "sdb"
  | "entree"
  | "bureau"
  | "exterieur"
  | "autre";

export type Photo = {
  id?: string;
  src: string;
  storagePath?: string;
  label: string;
  caption: string;
  room?: RoomKey | null;
  roomIndex?: number | null;
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
  // Tarification — migration 0011
  pricingMode?: "monthly" | "stay";
  stayStart?: string | null; // YYYY-MM-DD
  stayEnd?: string | null; // YYYY-MM-DD
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
