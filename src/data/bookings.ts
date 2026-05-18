// Lecture publique des réservations (RLS Supabase autorise SELECT à tout le monde).
// Utilisé par la page publique /booking/:bookingId.

import { useQuery } from "@tanstack/react-query";
import { supabase, photoUrl } from "@/lib/supabase";

export type BookingPublic = {
  id: string;
  booking_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number | null;
  property: {
    id: string;
    name: string;
    name_italic: string;
    ref: string;
    quartier: string;
    arrondissement: string;
    baseline_en: string | null;
    baseline: string;
    surface: string;
    chambres: string;
    sdb: string;
    etage_en: string | null;
    etage: string;
    loyer_num: number;
  };
  photos: { url: string; label: string; caption: string }[];
};

export const fetchBookingByBookingId = async (
  bookingId: string,
): Promise<BookingPublic | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id, booking_id, guest_name, check_in, check_out, total_amount,
        property:properties (
          id, name, name_italic, ref, quartier, arrondissement,
          baseline, baseline_en,
          surface, chambres, sdb, etage, etage_en, loyer_num
        )
      `,
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.property) return null;

  // property revient comme un objet (single FK) — TS croit que c'est un tableau, on cast.
  const property = (Array.isArray(data.property) ? data.property[0] : data.property) as BookingPublic["property"];

  // Récupère jusqu'à 3 photos triées par sort_order
  const { data: photos } = await supabase
    .from("property_photos")
    .select("storage_path, label, caption")
    .eq("property_id", property.id)
    .order("sort_order", { ascending: true })
    .limit(3);

  return {
    id: data.id,
    booking_id: data.booking_id,
    guest_name: data.guest_name,
    check_in: data.check_in,
    check_out: data.check_out,
    total_amount: data.total_amount,
    property,
    photos: (photos ?? []).map((p) => ({
      url: photoUrl(p.storage_path),
      label: p.label ?? "",
      caption: p.caption ?? "",
    })),
  };
};

export const useBooking = (bookingId: string | undefined) =>
  useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => (bookingId ? fetchBookingByBookingId(bookingId) : Promise.resolve(null)),
    enabled: Boolean(bookingId),
  });
