import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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

      {/* CONFIRMATION BANNER */}
      <div className="bc-confirm-banner">
        <div className="bc-confirm-check">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div className="bc-confirm-text-label">Confirmed</div>
          <div className="bc-confirm-text-title">
            Your reservation is <em>confirmed.</em>
          </div>
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
          <div className="bc-price-row">
            <span className="bc-price-row-label">Utilities &amp; Tourist Tax</span>
            <span className="bc-price-row-value">Included</span>
          </div>

          <div className="bc-price-total">
            <span className="bc-price-total-label">Total Due</span>
            <div>
              <span className="bc-price-total-value">{total}</span>
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

export default BookingConfirmation;
