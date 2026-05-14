import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";

export type PropertyInput = {
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
  is_published: boolean;
  sort_order: number;
  // EN (nullable) — migration 0005
  dispo_en?: string | null;
  baseline_en?: string | null;
  short_description_en?: string | null;
  long_description_en?: string[] | null;
  etage_en?: string | null;
  min_stay_en?: string | null;
  inclus_en?: string[] | null;
};

const must = () => {
  if (!supabase) throw new Error("Supabase non configuré");
  return supabase;
};

export const listProperties = async () => {
  const sb = must();
  const { data, error } = await sb
    .from("properties")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const getProperty = async (id: string) => {
  const sb = must();
  const { data, error } = await sb.from("properties").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

export const createProperty = async (input: PropertyInput) => {
  const sb = must();
  const { data, error } = await sb.from("properties").insert(input).select().single();
  if (error) throw error;
  return data;
};

export const updateProperty = async (id: string, input: Partial<PropertyInput>) => {
  const sb = must();
  const { data, error } = await sb
    .from("properties")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProperty = async (id: string) => {
  const sb = must();
  const { error } = await sb.from("properties").delete().eq("id", id);
  if (error) throw error;
};

export const setCoverPhoto = async (propertyId: string, photoId: string | null) => {
  const sb = must();
  const { error } = await sb
    .from("properties")
    .update({ cover_photo_id: photoId })
    .eq("id", propertyId);
  if (error) throw error;
};

export const listPhotos = async (propertyId: string) => {
  const sb = must();
  const { data, error } = await sb
    .from("property_photos")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const uploadPhoto = async (
  propertyId: string,
  file: File,
  meta: { label: string; caption: string; sort_order: number },
) => {
  const sb = must();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await sb.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await sb
    .from("property_photos")
    .insert({
      property_id: propertyId,
      storage_path: path,
      label: meta.label,
      caption: meta.caption,
      sort_order: meta.sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePhoto = async (
  id: string,
  input: { label?: string; caption?: string; sort_order?: number },
) => {
  const sb = must();
  const { error } = await sb.from("property_photos").update(input).eq("id", id);
  if (error) throw error;
};

export const deletePhoto = async (id: string, storagePath: string) => {
  const sb = must();
  await sb.storage.from(PHOTOS_BUCKET).remove([storagePath]);
  const { error } = await sb.from("property_photos").delete().eq("id", id);
  if (error) throw error;
};
