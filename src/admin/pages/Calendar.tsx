// Calendrier admin — vue type Airbnb / Gantt.
// - Apparts en lignes (sticky left), jours en colonnes (sticky top), scroll horizontal.
// - Période par défaut : J-7 → J+80 (88 jours).
// - Barres résa colorées selon le statut, popup au survol, clic → fiche.
// - Drag sur cellules vides → crée une nouvelle résa pré-remplie avec ces dates.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listBookingsInRange, listPropertiesWithCover } from "../api";
import { photoUrl } from "@/lib/supabase";

// ─── Constantes layout ───
const DAY_WIDTH = 56;            // largeur d'une colonne jour (px)
const ROW_HEIGHT = 64;           // hauteur d'une ligne appart (px)
const PROP_COL_WIDTH = 280;      // largeur colonne apparts (px)
const HEADER_H = 64;             // hauteur header (2 rangées : mois + jour)
const BAR_HEIGHT = 36;           // hauteur d'une barre de résa
const RANGE_DAYS_BEFORE = 7;
const RANGE_DAYS_AFTER = 80;
const TOTAL_DAYS = RANGE_DAYS_BEFORE + RANGE_DAYS_AFTER;

// ─── Helpers dates ───
const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const toIsoDate = (d: Date) => {
  // YYYY-MM-DD en local (pas UTC) pour aligner avec les dates BDD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseIsoDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
};
const diffDays = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86_400_000);

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"]; // dim=0 ... sam=6
const MONTH_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// ─── Couleurs barres selon statut ───
type Status = "draft" | "sent" | "deposit_paid" | "paid_full" | "completed" | "cancelled";

const STATUS_BAR: Record<Status, string> = {
  draft: "bg-slate-300 text-slate-900 border-slate-400",
  sent: "bg-amber-300 text-amber-950 border-amber-500",
  deposit_paid: "bg-sky-400 text-white border-sky-600",
  paid_full: "bg-emerald-500 text-white border-emerald-700",
  completed: "bg-slate-200 text-slate-700 border-slate-300",
  cancelled: "text-red-900 border-red-400",
};

const STATUS_LABEL_FR: Record<Status, string> = {
  draft: "Brouillon",
  sent: "Lien envoyé",
  deposit_paid: "Acompte payé",
  paid_full: "Soldée",
  completed: "Terminée",
  cancelled: "Annulée",
};

// Pour la barre "Annulée" : motif rayé
const CANCELLED_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(252,165,165,0.7), rgba(252,165,165,0.7) 6px, rgba(254,226,226,0.6) 6px, rgba(254,226,226,0.6) 12px)",
};

// ─── Types ───
type Booking = {
  id: string;
  booking_id: string;
  property_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: Status | null;
  total_amount: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  final_cleaning_fee: number | null;
  weekly_cleaning_fee: number | null;
  deposit_status: "pending" | "paid" | "refunded" | null;
  balance_status: "pending" | "paid" | "refunded" | null;
  property?: { name?: string; name_italic?: string; ref?: string } | null;
};

type Property = {
  id: string;
  ref: string;
  name: string;
  name_italic: string;
  cover_storage_path: string | null;
};

// ─── Formatage euros ───
const fmtEuro = (n: number | null) =>
  n === null
    ? ""
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " €";

// ─── Total séjour d'une résa (total + ménages) ───
const bookingTotal = (b: Booking) => {
  const nights = diffDays(parseIsoDate(b.check_in), parseIsoDate(b.check_out));
  const weeks = Math.max(0, Math.ceil(nights / 7));
  return (
    (b.total_amount ?? 0) +
    (b.final_cleaning_fee ?? 0) +
    (b.weekly_cleaning_fee ?? 0) * weeks
  );
};

// ─── Composant principal ───
const Calendar = () => {
  const nav = useNavigate();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [windowStart, setWindowStart] = useState<Date>(() =>
    addDays(today, -RANGE_DAYS_BEFORE),
  );
  const windowEnd = useMemo(
    () => addDays(windowStart, TOTAL_DAYS),
    [windowStart],
  );

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < TOTAL_DAYS; i++) arr.push(addDays(windowStart, i));
    return arr;
  }, [windowStart]);

  // Données
  const properties = useQuery({
    queryKey: ["admin-properties-with-cover"],
    queryFn: listPropertiesWithCover,
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings-calendar", toIsoDate(windowStart), toIsoDate(windowEnd)],
    queryFn: () => listBookingsInRange(toIsoDate(windowStart), toIsoDate(windowEnd)),
  });

  // Recherche apparts
  const [search, setSearch] = useState("");
  const filteredProperties = useMemo(() => {
    const list = (properties.data ?? []) as Property[];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        (p.ref ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.name_italic ?? "").toLowerCase().includes(q),
    );
  }, [properties.data, search]);

  // Grouper les résas par property_id
  const bookingsByProperty = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of (bookings.data ?? []) as Booking[]) {
      const arr = m.get(b.property_id) ?? [];
      arr.push(b);
      m.set(b.property_id, arr);
    }
    return m;
  }, [bookings.data]);

  // ─── Navigation temporelle ───
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const goToday = () => {
    setWindowStart(addDays(today, -RANGE_DAYS_BEFORE));
    requestAnimationFrame(() => {
      // Scroll pour aligner J-7 au début, mais centrer "today" à ~30%
      const el = scrollRef.current;
      if (el) el.scrollLeft = RANGE_DAYS_BEFORE * DAY_WIDTH - DAY_WIDTH * 2;
    });
  };
  const shiftWeeks = (n: number) => setWindowStart(addDays(windowStart, n * 7));

  useEffect(() => {
    // Position initiale du scroll : aligner "today" à gauche avec une petite marge
    const el = scrollRef.current;
    if (el) el.scrollLeft = RANGE_DAYS_BEFORE * DAY_WIDTH - DAY_WIDTH * 2;
  }, []);

  // ─── Hover popup ───
  const [hovered, setHovered] = useState<{
    booking: Booking;
    x: number;
    y: number;
  } | null>(null);

  // ─── Drag-to-create ───
  type DragState = {
    propertyId: string;
    startDayIdx: number;
    currentDayIdx: number;
  };
  const [drag, setDrag] = useState<DragState | null>(null);

  const onCellMouseDown = (propertyId: string, dayIdx: number) => {
    setDrag({ propertyId, startDayIdx: dayIdx, currentDayIdx: dayIdx });
  };
  const onCellMouseEnter = (propertyId: string, dayIdx: number) => {
    if (drag && drag.propertyId === propertyId) {
      setDrag({ ...drag, currentDayIdx: dayIdx });
    }
  };
  const onMouseUpGlobal = () => {
    if (!drag) return;
    const startIdx = Math.min(drag.startDayIdx, drag.currentDayIdx);
    const endIdxExclusive = Math.max(drag.startDayIdx, drag.currentDayIdx) + 1;
    const checkIn = toIsoDate(addDays(windowStart, startIdx));
    const checkOut = toIsoDate(addDays(windowStart, endIdxExclusive));
    setDrag(null);
    // Navigue vers la création de résa avec dates + propriété pré-remplies
    nav(
      `/admin/bookings/new?property_id=${drag.propertyId}&check_in=${checkIn}&check_out=${checkOut}`,
    );
  };

  useEffect(() => {
    if (!drag) return;
    const onUp = () => onMouseUpGlobal();
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  // ─── Rendu ───
  const gridWidth = TOTAL_DAYS * DAY_WIDTH;
  const gridHeight = filteredProperties.length * ROW_HEIGHT;

  // Pour chaque jour, calculer s'il commence un nouveau mois (pour le header)
  const monthSpans = useMemo(() => {
    const spans: { label: string; days: number; startIdx: number }[] = [];
    let i = 0;
    while (i < days.length) {
      const d = days[i];
      const label = `${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;
      let n = 0;
      while (
        i + n < days.length &&
        days[i + n].getMonth() === d.getMonth() &&
        days[i + n].getFullYear() === d.getFullYear()
      ) {
        n++;
      }
      spans.push({ label, days: n, startIdx: i });
      i += n;
    }
    return spans;
  }, [days]);

  const todayIdx = diffDays(windowStart, today);

  return (
    <div
      className="mx-auto max-w-[1600px] px-6 md:px-10 py-6"
      onMouseLeave={() => setHovered(null)}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Calendrier</h1>
          <p className="font-mono-meta text-slate text-sm mt-1">
            {filteredProperties.length} apparts · {(bookings.data ?? []).length} résas affichées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeeks(-4)}
            className="w-10 h-10 border border-hairline rounded-xl flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            title="−4 semaines"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="border border-hairline rounded-xl px-4 h-10 font-mono-meta text-sm hover:bg-ink hover:text-cream transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => shiftWeeks(4)}
            className="w-10 h-10 border border-hairline rounded-xl flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            title="+4 semaines"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un appart…"
            className="border border-hairline rounded-xl px-3 h-10 w-56 font-mono-meta text-sm focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Conteneur calendrier avec scroll horizontal */}
      <div
        ref={scrollRef}
        className="relative border border-hairline rounded-xl overflow-auto bg-cream-soft select-none"
        style={{ maxHeight: "75vh" }}
      >
        {/* Header sticky (mois + jours) */}
        <div
          className="sticky top-0 z-30 bg-cream-soft border-b border-hairline"
          style={{
            display: "grid",
            gridTemplateColumns: `${PROP_COL_WIDTH}px ${gridWidth}px`,
          }}
        >
          {/* Coin haut-gauche (sticky-left aussi) */}
          <div
            className="sticky left-0 z-40 bg-cream-soft border-r border-hairline flex items-end px-4 pb-2"
            style={{ height: HEADER_H }}
          >
            <span className="font-mono-meta text-xs text-slate">
              {filteredProperties.length} appartements
            </span>
          </div>
          {/* Bandeau mois + jours */}
          <div style={{ width: gridWidth }}>
            {/* Rangée 1 : mois */}
            <div
              className="flex border-b border-hairline"
              style={{ height: HEADER_H / 2 }}
            >
              {monthSpans.map((m) => (
                <div
                  key={m.startIdx}
                  className="font-display text-sm flex items-center justify-center text-ink border-r border-hairline last:border-r-0 capitalize"
                  style={{ width: m.days * DAY_WIDTH }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            {/* Rangée 2 : jours */}
            <div className="flex" style={{ height: HEADER_H / 2 }}>
              {days.map((d, i) => {
                const isToday = i === todayIdx;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center font-mono-meta text-[10px] border-r border-hairline ${
                      isToday
                        ? "bg-ink text-cream"
                        : isWeekend
                          ? "bg-cream text-slate"
                          : "text-slate"
                    }`}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="opacity-80">
                      {DAY_LETTERS[d.getDay()]}
                    </span>
                    <span className="font-semibold text-[12px]">
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corps */}
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns: `${PROP_COL_WIDTH}px ${gridWidth}px`,
            minHeight: gridHeight,
          }}
        >
          {/* Colonne apparts (sticky-left) */}
          <div
            className="sticky left-0 z-20 bg-cream-soft border-r border-hairline"
            style={{ width: PROP_COL_WIDTH }}
          >
            {properties.isLoading ? (
              <div className="p-4 font-mono-meta text-sm text-slate">
                Chargement…
              </div>
            ) : (
              filteredProperties.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3 border-b border-hairline"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="w-12 h-12 bg-cream rounded-xl overflow-hidden flex-shrink-0 border border-hairline"
                    style={{
                      backgroundImage: p.cover_storage_path
                        ? `url(${photoUrl(p.cover_storage_path)})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm truncate">
                      {p.name} <em>{p.name_italic}</em>
                    </div>
                    <div className="font-mono-meta text-[10px] text-slate truncate">
                      Réf {p.ref}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Grille jours × apparts */}
          <div
            className="relative"
            style={{ width: gridWidth, height: gridHeight }}
          >
            {/* Lignes jours (cellules cliquables) */}
            {filteredProperties.map((p, rowIdx) => (
              <div
                key={p.id}
                className="absolute left-0 right-0 flex border-b border-hairline"
                style={{ top: rowIdx * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                {days.map((d, dayIdx) => {
                  const isToday = dayIdx === todayIdx;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isInDrag =
                    drag &&
                    drag.propertyId === p.id &&
                    dayIdx >= Math.min(drag.startDayIdx, drag.currentDayIdx) &&
                    dayIdx <= Math.max(drag.startDayIdx, drag.currentDayIdx);
                  return (
                    <div
                      key={dayIdx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onCellMouseDown(p.id, dayIdx);
                      }}
                      onMouseEnter={() => onCellMouseEnter(p.id, dayIdx)}
                      className={`border-r border-hairline cursor-cell ${
                        isInDrag
                          ? "bg-copper/30"
                          : isToday
                            ? "bg-blue-50"
                            : isWeekend
                              ? "bg-cream"
                              : "bg-cream-soft"
                      } hover:bg-cream`}
                      style={{ width: DAY_WIDTH }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Trait vertical "aujourd'hui" */}
            {todayIdx >= 0 && todayIdx < TOTAL_DAYS && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: todayIdx * DAY_WIDTH,
                  width: DAY_WIDTH,
                  borderLeft: "2px solid rgb(59 130 246 / 0.55)",
                }}
              />
            )}

            {/* Barres résa */}
            {filteredProperties.map((p, rowIdx) => {
              const list = bookingsByProperty.get(p.id) ?? [];
              return list.map((b) => {
                const checkIn = parseIsoDate(b.check_in);
                const checkOut = parseIsoDate(b.check_out);
                // Position (en jours depuis windowStart), clippée à la fenêtre
                const startIdxRaw = diffDays(windowStart, checkIn);
                const endIdxRaw = diffDays(windowStart, checkOut);
                const startIdx = Math.max(0, startIdxRaw);
                const endIdx = Math.min(TOTAL_DAYS, endIdxRaw);
                if (endIdx <= startIdx) return null; // hors fenêtre
                const left = startIdx * DAY_WIDTH;
                const width = (endIdx - startIdx) * DAY_WIDTH;
                const status = (b.status ?? "draft") as Status;
                const isCancelled = status === "cancelled";
                const guestFirstName = (b.guest_name ?? "").split(" ")[0] || "—";
                const total = bookingTotal(b);
                const showLabel = width > 80; // assez large pour afficher du texte
                return (
                  <div
                    key={b.id}
                    className={`absolute border rounded-xl px-2 flex items-center gap-2 text-[11px] font-mono-meta cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-shadow ${STATUS_BAR[status]}`}
                    style={{
                      top: rowIdx * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2,
                      left: left + 2,
                      width: width - 4,
                      height: BAR_HEIGHT,
                      ...(isCancelled ? CANCELLED_STYLE : {}),
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setHovered({
                        booking: b,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => nav(`/admin/bookings/${b.id}`)}
                    title={`${b.guest_name} · ${b.check_in} → ${b.check_out}`}
                  >
                    {showLabel && (
                      <>
                        <span className="font-semibold truncate">{guestFirstName}</span>
                        {total > 0 && (
                          <span className="opacity-90 ml-auto whitespace-nowrap">
                            {fmtEuro(total)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono-meta text-xs text-slate">
        <span>Légende :</span>
        {(Object.keys(STATUS_BAR) as Status[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className={`w-4 h-4 rounded-md border ${STATUS_BAR[s]}`}
              style={s === "cancelled" ? CANCELLED_STYLE : undefined}
            />
            {STATUS_LABEL_FR[s]}
          </span>
        ))}
        <span className="ml-auto text-slate/70">
          Clic-glissé sur une cellule vide → nouvelle réservation
        </span>
      </div>

      {/* Popup résa au hover */}
      {hovered && <BookingTooltip data={hovered} onOpen={(id) => nav(`/admin/bookings/${id}`)} />}
    </div>
  );
};

// ─── Tooltip flottant ───
const BookingTooltip = ({
  data,
  onOpen,
}: {
  data: { booking: Booking; x: number; y: number };
  onOpen: (id: string) => void;
}) => {
  const { booking: b, x, y } = data;
  const status = (b.status ?? "draft") as Status;
  const total = bookingTotal(b);

  const formatDateFr = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: x,
        top: y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-ink text-cream rounded-xl shadow-lg px-4 py-3 min-w-[240px] max-w-[300px] pointer-events-auto">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="font-display text-base truncate">{b.guest_name}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono-meta border ${STATUS_BAR[status]}`}
            style={status === "cancelled" ? CANCELLED_STYLE : undefined}
          >
            {STATUS_LABEL_FR[status]}
          </span>
        </div>
        {b.property && (
          <div className="font-mono-meta text-[11px] text-cream/70 mb-2 truncate">
            {b.property.name} {b.property.name_italic} · Réf {b.property.ref}
          </div>
        )}
        <div className="font-mono-meta text-[11px] text-cream/90 mb-1">
          {formatDateFr(b.check_in)} → {formatDateFr(b.check_out)}
        </div>
        {total > 0 && (
          <div className="font-display text-lg text-cream">{fmtEuro(total)}</div>
        )}
        <button
          onClick={() => onOpen(b.id)}
          className="mt-2 w-full text-left text-[11px] font-mono-meta text-copper hover:text-cream transition-colors"
        >
          Ouvrir la fiche →
        </button>
      </div>
    </div>
  );
};

export default Calendar;
