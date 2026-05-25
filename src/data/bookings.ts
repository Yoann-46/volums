// Lecture publique des réservations (RLS Supabase autorise SELECT à tout le monde).
// Utilisé par la page publique /booking/:bookingId.

import { useQuery } from "@tanstack/react-query";
import { supabase, photoUrl } from "@/lib/supabase";

export type PublicPaymentMethod = "stripe" | "bank_transfer";
export type PublicPaymentStatus = "pending" | "paid" | "refunded";
export type PublicBookingStatus =
  | "draft"
  | "sent"
  | "deposit_paid"
  | "paid_full"
  | "completed"
  | "cancelled";

export type BookingPublic = {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  total_amount: number | null;
  cleaning_fee: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  status: PublicBookingStatus;
  deposit_payment_method: PublicPaymentMethod | null;
  balance_payment_method: PublicPaymentMethod | null;
  deposit_status: PublicPaymentStatus;
  balance_status: PublicPaymentStatus;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
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
        id, booking_id,
        guest_name, guest_first_name, guest_last_name, guest_email,
        check_in, check_out,
        total_amount, cleaning_fee, deposit_amount, balance_amount,
        status,
        deposit_payment_method, balance_payment_method,
        deposit_status, balance_status, deposit_paid_at, balance_paid_at,
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

  const row = data as Record<string, unknown>;

  return {
    id: data.id,
    booking_id: data.booking_id,
    guest_name: data.guest_name,
    guest_first_name: (row.guest_first_name as string | null) ?? null,
    guest_last_name: (row.guest_last_name as string | null) ?? null,
    guest_email: (row.guest_email as string | null) ?? null,
    check_in: data.check_in,
    check_out: data.check_out,
    total_amount: data.total_amount,
    cleaning_fee: (row.cleaning_fee as number | null) ?? null,
    deposit_amount: (row.deposit_amount as number | null) ?? null,
    balance_amount: (row.balance_amount as number | null) ?? null,
    status: ((row.status as PublicBookingStatus | null) ?? "draft"),
    deposit_payment_method: (row.deposit_payment_method as PublicPaymentMethod | null) ?? null,
    balance_payment_method: (row.balance_payment_method as PublicPaymentMethod | null) ?? null,
    deposit_status: ((row.deposit_status as PublicPaymentStatus | null) ?? "pending"),
    balance_status: ((row.balance_status as PublicPaymentStatus | null) ?? "pending"),
    deposit_paid_at: (row.deposit_paid_at as string | null) ?? null,
    balance_paid_at: (row.balance_paid_at as string | null) ?? null,
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
