import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured, photoUrl } from "@/lib/supabase";
import { fallbackAppartements } from "./appartements";
import type { Appt, Photo } from "./types";

type PropertyRow = {
  id: string;
  slug: string;
  ref: string;
  dispo: string;
  arrondissement: string;
  quartier: string;
  name: string;
  name_italic: string;
  baseline: string;
  short_description: string;
  long_description: string[];
  surface: string;
  chambres: string;
  sdb: string;
  etage: string;
  couchages: string;
  min_stay: string;
  loyer_num: number;
  inclus: string[];
  cover_photo_id: string | null;
  is_published: boolean;
  sort_order: number;
  // Tarification — migration 0011
  pricing_mode?: "monthly" | "stay";
  stay_start?: string | null;
  stay_end?: string | null;
  // EN (nullable — migration 0005)
  dispo_en?: string | null;
  baseline_en?: string | null;
  short_description_en?: string | null;
  long_description_en?: string[] | null;
  etage_en?: string | null;
  min_stay_en?: string | null;
  inclus_en?: string[] | null;
};

type PhotoRow = {
  id: string;
  property_id: string;
  storage_path: string;
  label: string;
  caption: string;
  sort_order: number;
  room: string | null;
  room_index: number | null;
};

const rowToAppt = (p: PropertyRow, photos: PhotoRow[]): Appt => {
  const sorted = photos
    .filter((ph) => ph.property_id === p.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const gallery: Photo[] = sorted.map((ph) => ({
    id: ph.id,
    src: photoUrl(ph.storage_path),
    storagePath: ph.storage_path,
    label: ph.label,
    caption: ph.caption,
    room: (ph.room as Photo["room"]) ?? null,
    roomIndex: ph.room_index ?? null,
  }));

  const cover = sorted.find((ph) => ph.id === p.cover_photo_id) ?? sorted[0];

  return {
    id: p.id,
    slug: p.slug,
    ref: p.ref,
    dispo: p.dispo,
    arrondissement: p.arrondissement,
    quartier: p.quartier,
    name: p.name,
    nameItalic: p.name_italic,
    baseline: p.baseline,
    shortDescription: p.short_description,
    longDescription: p.long_description,
    surface: p.surface,
    chambres: p.chambres,
    sdb: p.sdb,
    etage: p.etage,
    couchages: p.couchages,
    minStay: p.min_stay,
    loyerNum: p.loyer_num,
    pricingMode: p.pricing_mode ?? "monthly",
    stayStart: p.stay_start ?? null,
    stayEnd: p.stay_end ?? null,
    image: cover ? photoUrl(cover.storage_path) : "",
    gallery,
    inclus: p.inclus,
    dispoEn: p.dispo_en ?? null,
    baselineEn: p.baseline_en ?? null,
    shortDescriptionEn: p.short_description_en ?? null,
    longDescriptionEn: p.long_description_en ?? null,
    etageEn: p.etage_en ?? null,
    minStayEn: p.min_stay_en ?? null,
    inclusEn: p.inclus_en ?? null,
    isPublished: p.is_published,
    sortOrder: p.sort_order,
  };
};

export const fetchAppartements = async (
  opts: { includeUnpublished?: boolean } = {},
): Promise<Appt[]> => {
  if (!supabaseConfigured || !supabase) return fallbackAppartements;

  let query = supabase
    .from("properties")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!opts.includeUnpublished) query = query.eq("is_published", true);

  const { data: props, error: pErr } = await query;
  if (pErr) throw pErr;
  if (!props || props.length === 0) return [];

  const ids = (props as PropertyRow[]).map((p) => p.id);
  const { data: photos, error: phErr } = await supabase
    .from("property_photos")
    .select("*")
    .in("property_id", ids);
  if (phErr) throw phErr;

  return (props as PropertyRow[]).map((p) =>
    rowToAppt(p, (photos ?? []) as PhotoRow[]),
  );
};

export const useAppartements = (opts: { includeUnpublished?: boolean } = {}) =>
  useQuery({
    queryKey: ["appartements", opts.includeUnpublished ?? false],
    queryFn: () => fetchAppartements(opts),
    staleTime: 30_000,
  });

export const useAppartement = (slug: string | undefined) =>
  useQuery({
    queryKey: ["appartement", slug],
    queryFn: async () => {
      if (!slug) return null;
      const all = await fetchAppartements({ includeUnpublished: true });
      return all.find((a) => a.slug === slug) ?? null;
    },
    enabled: Boolean(slug),
  });

// Helpers — pick a localized field with FR fallback
export const pickStr = (lang: "fr" | "en", fr: string, en: string | null | undefined): string => {
  if (lang === "en" && en && en.trim() !== "") return en;
  return fr;
};

export const pickArr = (
  lang: "fr" | "en",
  fr: string[],
  en: string[] | null | undefined,
): string[] => {
  if (lang === "en" && en && en.length > 0) return en;
  return fr;
};
