import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useBooking } from "@/data/bookings";
import "./booking-confirmation.css";

const formatDate = (isoDate: string): { month: string; day: number; year: number } => {
  // isoDate = "2026-05-22" — on parse en UTC pour éviter les décalages timezone
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const month = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return { month, day: d, year: y };
};

const nightsBetween = (start: string, end: string): number => {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const s = Date.UTC(ys, ms - 1, ds);
  const e = Date.UTC(ye, me - 1, de);
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
};

const formatEuroPlain = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " €";

const monthYear = (isoDate: string) => {
  const { month, year } = formatDate(isoDate);
  return `${month} ${year}`;
};

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const { data: booking, isLoading, error } = useBooking(bookingId);

  useEffect(() => {
    if (booking) {
      document.title = `Booking Confirmation — ${booking.property.name} ${booking.property.name_italic} · Volums`;
    } else if (!isLoading) {
      document.title = "Booking — Volums";
    }
  }, [booking, isLoading]);

  if (isLoading) {
    return (
      <div className="bc-loading">
        <span>Loading reservation…</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bc-loading">
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22, marginBottom: 12 }}>
            Reservation not found
          </p>
          <p style={{ fontSize: 13, color: "#8A8680", marginBottom: 18 }}>
            The booking reference <strong>{bookingId}</strong> doesn't match any active reservation.
          </p>
          <Link to="/" style={{ color: "#C05A3A", textDecoration: "none", fontSize: 13 }}>
            ← Back to volums.fr
          </Link>
        </div>
      </div>
    );
  }

  const checkIn = formatDate(booking.check_in);
  const checkOut = formatDate(booking.check_out);
  const nights = nightsBetween(booking.check_in, booking.check_out);
  const total =
    booking.total_amount !== null
      ? formatEuroPlain(booking.total_amount)
      : "—";

  // ── Statut global de la résa : pilote la bannière en haut de page ──
  const isCancelled = booking.status === "cancelled";
  const isFullyPaid =
    booking.status === "paid_full" ||
    (booking.deposit_status === "paid" && booking.balance_status === "paid");
  const isAwaitingPayment =
    booking.status === "draft" || booking.status === "sent" || !isFullyPaid;

  const bannerVariant = isCancelled
    ? "cancelled"
    : isFullyPaid
      ? "confirmed"
      : "awaiting";

  const bannerLabel =
    bannerVariant === "cancelled"
      ? "Cancelled"
      : bannerVariant === "confirmed"
        ? "Confirmed"
        : "Awaiting Payment";
  const bannerTitle =
    bannerVariant === "cancelled"
      ? "This reservation has been cancelled."
      : bannerVariant === "confirmed"
        ? "Your reservation is confirmed."
        : "Your reservation is held — please complete payment.";
  const tagline =
    booking.property.baseline_en && booking.property.baseline_en.trim() !== ""
      ? booking.property.baseline_en
      : booking.property.baseline;
  const floor =
    (booking.property.etage_en && booking.property.etage_en.trim() !== ""
      ? booking.property.etage_en
      : booking.property.etage) || "—";

  // Convertir arrondissement type "11ᵉ Arrondissement" → "Paris 11ᵉ"
  const arrondissementShort = booking.property.arrondissement?.replace(/\s*Arrondissement\s*/i, "");
  const locationLine = [
    booking.property.quartier && `Boulevard ${booking.property.quartier}`,
    arrondissementShort ? `Paris ${arrondissementShort}` : "Paris",
    `Ref. ${booking.property.ref}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bc-page">
      {/* HEADER */}
      <header className="bc-header">
        <a href="https://www.volums.fr" className="bc-header-brand">
          <svg
            viewBox="0 0 48 48"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <rect x="1" y="1" width="46" height="46" />
            <path d="M14 38 V24 A10 10 0 0 1 34 24 V38" strokeLinecap="square" />
            <line x1="24" y1="14" x2="24" y2="38" strokeWidth="1.1" opacity="0.55" />
            <line x1="10" y1="38" x2="38" y2="38" />
          </svg>
          <span className="bc-header-brand-name">Volums</span>
        </a>
        <span className="bc-header-tag">Booking Confirmation</span>
      </header>

      {/* STATUS BANNER (varie selon le statut de la résa) */}
      <div className={`bc-confirm-banner bc-banner-${bannerVariant}`}>
        <div className="bc-confirm-check">
          {bannerVariant === "confirmed" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : bannerVariant === "cancelled" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>
        <div>
          <div className="bc-confirm-text-label">{bannerLabel}</div>
          <div className="bc-confirm-text-title">{bannerTitle}</div>
        </div>
        <div className="bc-confirm-ref">
          <div className="bc-confirm-ref-label">Booking ID</div>
          <div className="bc-confirm-ref-value">{booking.booking_id}</div>
        </div>
      </div>

      <main className="bc-main">
        {/* GUEST GREETING */}
        <div className="bc-guest-block">
          <div className="bc-section-label">The Guest</div>
          <h1 className="bc-guest-greeting">
            Welcome, <em>{booking.guest_name}</em>
          </h1>
          <p className="bc-guest-sub">
            We are pleased to confirm your upcoming stay in Paris with Volums.
            <br />
            Below is a full summary of your reservation at {booking.property.name}{" "}
            {booking.property.name_italic}.
          </p>
        </div>

        {/* PAYMENT — placé en haut pour être visible sans scroll */}
        {!isCancelled && (
          <div className="bc-payment">
            <div className="bc-section-label">Payment</div>

            <PaymentBlock
              label="Deposit"
              amount={booking.deposit_amount}
              method={booking.deposit_payment_method}
              status={booking.deposit_status}
              paidAt={booking.deposit_paid_at}
              ctaLabel="Pay the deposit"
            />

            <PaymentBlock
              label="Balance"
              amount={booking.balance_amount}
              method={booking.balance_payment_method}
              status={booking.balance_status}
              paidAt={booking.balance_paid_at}
              ctaLabel="Pay the balance"
              gated={booking.deposit_status !== "paid"}
            />

            {isAwaitingPayment && (
              <p className="bc-payment-note">
                Payment is processed securely. Card details are handled by Stripe.
                For bank transfers, IBAN and reference are sent to you via WhatsApp.
              </p>
            )}
          </div>
        )}

        {/* DATES STRIP */}
        <div className="bc-dates-strip">
          <div className="bc-date-block">
            <div className="bc-date-label">Check-in</div>
            <div className="bc-date-value">
              {checkIn.month} <em>{checkIn.day},</em> {checkIn.year}
            </div>
          </div>
          <div className="bc-dates-divider" />
          <div className="bc-nights-block">
            <span className="bc-nights-value">{nights}</span>
            <span className="bc-nights-label">Nights</span>
          </div>
          <div className="bc-dates-divider" />
          <div className="bc-date-block bc-date-right">
            <div className="bc-date-label">Check-out</div>
            <div className="bc-date-value">
              {checkOut.month} <em>{checkOut.day},</em> {checkOut.year}
            </div>
          </div>
        </div>

        {/* PROPERTY CARD */}
        <div className="bc-property-card">
          {booking.photos.length > 0 && (
            <div className="bc-property-photos">
              {booking.photos.slice(0, 3).map((p, i) => (
                <img key={i} src={p.url} alt={`${booking.property.name} ${booking.property.name_italic} — ${p.caption || p.label}`} />
              ))}
            </div>
          )}
          <div className="bc-property-info">
            <div className="bc-property-location">{locationLine}</div>
            <div className="bc-property-name">
              {booking.property.name} <em>{booking.property.name_italic}</em>
            </div>
            {tagline && <div className="bc-property-tagline">{tagline}</div>}
            <div className="bc-property-specs">
              <div className="bc-spec-item">
                <div className="bc-spec-label">Surface</div>
                <div className="bc-spec-value">{booking.property.surface || "—"}</div>
              </div>
              <div className="bc-spec-item">
                <div className="bc-spec-label">Bedrooms</div>
                <div className="bc-spec-value">{booking.property.chambres || "—"}</div>
              </div>
              <div className="bc-spec-item">
                <div className="bc-spec-label">Bathrooms</div>
                <div className="bc-spec-value">{booking.property.sdb || "—"}</div>
              </div>
              <div className="bc-spec-item">
                <div className="bc-spec-label">Floor</div>
                <div className="bc-spec-value">{floor}</div>
              </div>
            </div>
          </div>
        </div>

        {/* INCLUSIONS */}
        <div className="bc-inclusions">
          <div className="bc-section-label">Always Included</div>
          <div className="bc-inclusions-grid">
            {["Utilities & Tourist Tax", "High-Speed Wi-Fi", "Fully Equipped Kitchen", "Concierge Service"].map(
              (item) => (
                <div key={item} className="bc-inclusion-item">
                  <div className="bc-inclusion-icon">✦</div>
                  <span className="bc-inclusion-text">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="bc-price-summary">
          <div className="bc-section-label">Price Summary</div>
          <div className="bc-price-row">
            <span className="bc-price-row-label">
              {booking.property.name} {booking.property.name_italic} · {nights} nights
            </span>
            <span className="bc-price-row-value">{total}</span>
          </div>

          {/* Ménage final : ligne toujours affichée, "Included" ou "Not included" selon valeur */}
          <CleaningRow
            label="Final cleaning"
            value={booking.final_cleaning_fee ?? booking.cleaning_fee}
          />

          {/* Ménage hebdo : ligne toujours affichée */}
          <CleaningRow
            label="Weekly cleaning"
            value={booking.weekly_cleaning_fee}
          />

          <div className="bc-price-row">
            <span className="bc-price-row-label">Utilities &amp; Tourist Tax</span>
            <span className="bc-price-row-value">Included</span>
          </div>

          <div className="bc-price-total">
            <span className="bc-price-total-label">Total Due</span>
            <div>
              <span className="bc-price-total-value">
                {formatEuroPlain(
                  (booking.total_amount ?? 0) +
                    (booking.final_cleaning_fee ?? booking.cleaning_fee ?? 0) +
                    (booking.weekly_cleaning_fee ?? 0) * Math.ceil(nights / 7),
                )}
              </span>
              <span className="bc-price-total-note">Tax Incl. · All-Inclusive</span>
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className="bc-contact-block">
          <div>
            <div className="bc-contact-title">
              Any <em>questions?</em>
            </div>
            <div className="bc-contact-sub">
              Our team is available to assist you throughout your stay.
            </div>
          </div>
          <a href="mailto:hello@volums.fr" className="bc-contact-email">
            hello@volums.fr
          </a>
        </div>

        {/* FOOTER */}
        <footer className="bc-footer">
          <div className="bc-footer-brand">
            <svg
              viewBox="0 0 48 48"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
              style={{ color: "var(--bc-charcoal)" }}
            >
              <rect x="1" y="1" width="46" height="46" />
              <path d="M14 38 V24 A10 10 0 0 1 34 24 V38" strokeLinecap="square" />
              <line x1="24" y1="14" x2="24" y2="38" strokeWidth="1.1" opacity="0.55" />
              <line x1="10" y1="38" x2="38" y2="38" />
            </svg>
            <span className="bc-footer-brand-name">Volums</span>
          </div>
          <div className="bc-footer-text">
            Booking ref. {booking.booking_id} · Confirmed {monthYear(booking.check_in)}
            <br />
            <a href="https://www.volums.fr">www.volums.fr</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

// ─── Ligne ménage dans le price summary ───
// Règle UX : valeur 0 ou null → "Not included" (en gris) ; valeur > 0 → "Included".
type CleaningRowProps = {
  label: string;
  value: number | null;
};
const CleaningRow = ({ label, value }: CleaningRowProps) => {
  const isIncluded = (value ?? 0) > 0;
  return (
    <div className="bc-price-row">
      <span className="bc-price-row-label">{label}</span>
      <span
        className={`bc-price-row-value ${isIncluded ? "" : "bc-price-row-excluded"}`}
      >
        {isIncluded ? "Included" : "Not included"}
      </span>
    </div>
  );
};

// ─── Bloc paiement (acompte / solde) sur la page client ───
type BlockProps = {
  label: string;
  amount: number | null;
  method: "stripe" | "bank_transfer" | null;
  status: "pending" | "paid" | "refunded";
  paidAt: string | null;
  ctaLabel: string;
  gated?: boolean; // true → bouton désactivé tant qu'une condition n'est pas remplie
};

const PaymentBlock = ({ label, amount, method, status, paidAt, ctaLabel, gated }: BlockProps) => {
  const isPaid = status === "paid";
  const amountLabel = amount !== null ? formatEuroPlain(amount) : "—";
  const paidDate = paidAt
    ? new Date(paidAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const onPayStripe = () => {
    // Stripe sera branché dès que les clés test seront disponibles.
    toast.info("Stripe payment will be enabled shortly. Stand by.");
  };

  return (
    <div className={`bc-payment-block ${isPaid ? "is-paid" : "is-pending"}`}>
      <div className="bc-payment-row">
        <div>
          <div className="bc-payment-label">{label}</div>
          <div className="bc-payment-amount">{amountLabel}</div>
        </div>
        <div className="bc-payment-status">
          {isPaid ? (
            <span className="bc-payment-paid">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Paid {paidDate && `· ${paidDate}`}
            </span>
          ) : method === "bank_transfer" ? (
            <span className="bc-payment-pending">Awaiting bank transfer</span>
          ) : (
            <span className="bc-payment-pending">Awaiting payment</span>
          )}
        </div>
      </div>

      {!isPaid && (
        <div className="bc-payment-cta">
          {method === "stripe" ? (
            <button
              type="button"
              onClick={onPayStripe}
              disabled={gated}
              className="bc-payment-btn"
            >
              {gated ? "Available after deposit is paid" : ctaLabel}
            </button>
          ) : method === "bank_transfer" ? (
            <p className="bc-payment-bank">
              Payment by bank transfer.<br />
              IBAN and payment reference sent to you separately via WhatsApp.
            </p>
          ) : (
            <p className="bc-payment-bank">Payment method to be confirmed.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingConfirmation;
