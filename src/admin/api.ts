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
  // Tarification — migration 0011
  // 'monthly' : loyer_num = loyer mensuel ; 'stay' : loyer_num = total du séjour daté
  pricing_mode?: "monthly" | "stay";
  stay_start?: string | null; // YYYY-MM-DD
  stay_end?: string | null; // YYYY-MM-DD
  // Géolocalisation — migration 0012
  latitude?: number | null;
  longitude?: number | null;
  geo_address?: string | null;
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

/**
 * Liste les properties + résout la `storage_path` de la photo de couverture.
 * Si `cover_photo_id` est défini, on l'utilise. Sinon, fallback sur la première photo (sort_order le plus bas).
 * Si aucune photo n'existe pour la property → `cover_storage_path: null`.
 */
export const listPropertiesWithCover = async () => {
  const sb = must();
  const { data: props, error } = await sb
    .from("properties")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  if (!props || props.length === 0) return [];

  const propIds = (props as Array<{ id: string }>).map((p) => p.id);
  const { data: photos, error: phErr } = await sb
    .from("property_photos")
    .select("id, property_id, storage_path, sort_order")
    .in("property_id", propIds)
    .order("sort_order", { ascending: true });
  if (phErr) throw phErr;

  const photosById = new Map<string, string>();
  const firstByProperty = new Map<string, string>();
  for (const ph of (photos ?? []) as Array<{
    id: string;
    property_id: string;
    storage_path: string;
  }>) {
    photosById.set(ph.id, ph.storage_path);
    if (!firstByProperty.has(ph.property_id)) {
      firstByProperty.set(ph.property_id, ph.storage_path);
    }
  }

  return (props as Array<Record<string, unknown> & { id: string; cover_photo_id: string | null }>).map(
    (p) => ({
      ...p,
      cover_storage_path:
        (p.cover_photo_id && photosById.get(p.cover_photo_id)) ??
        firstByProperty.get(p.id) ??
        null,
    }),
  );
};

// ─────────────────────────── BOOKINGS ───────────────────────────

export type PaymentMethod = "stripe" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type BookingStatus =
  | "draft"
  | "sent"
  | "deposit_paid"
  | "paid_full"
  | "completed"
  | "cancelled";

export type BookingInput = {
  booking_id: string;
  property_id: string;
  // Coordonnées client
  guest_name: string;                  // legacy / fallback affichage
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  // Dates
  check_in: string;                    // YYYY-MM-DD
  check_out: string;                   // YYYY-MM-DD
  // Tarif
  total_amount: number | null;         // montant principal du séjour (€)
  cleaning_fee?: number | null;        // legacy (déprécié) — voir final_cleaning_fee
  final_cleaning_fee?: number | null;  // ménage de fin de séjour (€ forfait)
  weekly_cleaning_fee?: number | null; // ménage hebdomadaire (€ par semaine)
  deposit_amount?: number | null;      // acompte (€)
  balance_amount?: number | null;      // solde (€)
  // Paiement
  deposit_payment_method?: PaymentMethod | null;
  balance_payment_method?: PaymentMethod | null;
  // Statut global
  status?: BookingStatus;
  // Divers
  notes?: string | null;
};

export type BookingRow = BookingInput & {
  id: string;
  // Statuts paiement (gérés par actions explicites, pas le form principal)
  deposit_status: PaymentStatus;
  balance_status: PaymentStatus;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  // Stripe (renseigné par webhook)
  stripe_customer_id: string | null;
  stripe_deposit_intent_id: string | null;
  stripe_balance_intent_id: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
};

export const listBookings = async () => {
  const sb = must();
  const { data, error } = await sb
    .from("bookings")
    .select("*, property:properties(id, name, name_italic, ref, slug, quartier, arrondissement)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getBookingById = async (id: string) => {
  const sb = must();
  const { data, error } = await sb.from("bookings").select("*").eq("id", id).single();
  if (error) throw error;
  return data as BookingRow;
};

export const createBooking = async (input: BookingInput) => {
  const sb = must();
  const { data, error } = await sb.from("bookings").insert(input).select().single();
  if (error) throw error;
  return data as BookingRow;
};

export const updateBooking = async (id: string, input: Partial<BookingInput>) => {
  const sb = must();
  const { data, error } = await sb
    .from("bookings")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BookingRow;
};

export const deleteBooking = async (id: string) => {
  const sb = must();
  const { error } = await sb.from("bookings").delete().eq("id", id);
  if (error) throw error;
};

/**
 * Marque l'acompte comme payé (utilisé surtout pour les virements bancaires
 * que l'admin confirme manuellement après réception).
 * Met aussi à jour le statut global de la résa si nécessaire.
 */
export const markDepositPaid = async (id: string) => {
  const sb = must();
  // Lecture de l'état actuel pour décider du nouveau status global
  const { data: cur, error: readErr } = await sb
    .from("bookings")
    .select("balance_status")
    .eq("id", id)
    .single();
  if (readErr) throw readErr;
  const newStatus =
    cur && (cur as { balance_status?: PaymentStatus }).balance_status === "paid"
      ? "paid_full"
      : "deposit_paid";
  const { error } = await sb
    .from("bookings")
    .update({
      deposit_status: "paid",
      deposit_paid_at: new Date().toISOString(),
      status: newStatus,
    })
    .eq("id", id);
  if (error) throw error;
};

/**
 * Marque le solde comme payé. Si l'acompte est déjà payé, passe en `paid_full`.
 */
export const markBalancePaid = async (id: string) => {
  const sb = must();
  const { data: cur, error: readErr } = await sb
    .from("bookings")
    .select("deposit_status")
    .eq("id", id)
    .single();
  if (readErr) throw readErr;
  const newStatus =
    cur && (cur as { deposit_status?: PaymentStatus }).deposit_status === "paid"
      ? "paid_full"
      : "deposit_paid";
  const { error } = await sb
    .from("bookings")
    .update({
      balance_status: "paid",
      balance_paid_at: new Date().toISOString(),
      status: newStatus,
    })
    .eq("id", id);
  if (error) throw error;
};

/**
 * Annule une réservation. Conserve les données — change juste le statut global.
 */
export const cancelBooking = async (id: string) => {
  const sb = must();
  const { error } = await sb.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
};

/**
 * Liste les réservations qui chevauchent une plage de dates (pour le calendrier).
 * Une résa est incluse si `check_in < rangeEnd` ET `check_out > rangeStart`
 * (overlap au sens large : on inclut les résa qui s'étendent au-delà de la fenêtre).
 * Inclut toutes les propriétés référencées (join sur properties).
 */
export const listBookingsInRange = async (rangeStart: string, rangeEnd: string) => {
  const sb = must();
  const { data, error } = await sb
    .from("bookings")
    .select(
      `*, property:properties(id, name, name_italic, ref, slug)`,
    )
    .lt("check_in", rangeEnd)
    .gt("check_out", rangeStart)
    .order("check_in", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

/**
 * Met à jour le sort_order de plusieurs properties d'un coup.
 * Reçoit un tableau `[{ id, sort_order }]`. Fait les updates en parallèle.
 */
export const reorderProperties = async (
  items: Array<{ id: string; sort_order: number }>,
) => {
  const sb = must();
  // Update en parallèle — Supabase n'a pas de batch update natif via le client JS.
  await Promise.all(
    items.map(({ id, sort_order }) =>
      sb
        .from("properties")
        .update({ sort_order })
        .eq("id", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
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
  meta: {
    label: string;
    caption: string;
    sort_order: number;
    room?: string | null;
    room_index?: number | null;
  },
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
      room: meta.room ?? null,
      room_index: meta.room_index ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePhoto = async (
  id: string,
  input: {
    label?: string;
    caption?: string;
    sort_order?: number;
    room?: string | null;
    room_index?: number | null;
  },
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
