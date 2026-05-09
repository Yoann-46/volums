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
};

type PhotoRow = {
  id: string;
  property_id: string;
  storage_path: string;
  label: string;
  caption: string;
  sort_order: number;
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
    image: cover ? photoUrl(cover.storage_path) : "",
    gallery,
    inclus: p.inclus,
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
