import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { listBookings, deleteBooking } from "../api";
import { formatEuro } from "@/lib/format";

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const nights = (a: string, b: string) => {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Lien envoyé",
  deposit_paid: "Acompte payé",
  paid_full: "Soldé",
  completed: "Terminé",
  cancelled: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate/20 text-slate",
  sent: "bg-amber-100 text-amber-900",
  deposit_paid: "bg-blue-100 text-blue-900",
  paid_full: "bg-emerald-100 text-emerald-900",
  completed: "bg-slate/10 text-slate",
  cancelled: "bg-red-100 text-red-900",
};

const BookingsList = () => {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: listBookings,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const onDelete = async (id: string, label: string) => {
    if (!confirm(`Supprimer la réservation "${label}" ?`)) return;
    try {
      await deleteBooking(id);
      toast.success("Réservation supprimée");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const copyLink = async (bookingId: string) => {
    const url = `${window.location.origin}/booking/${bookingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(bookingId);
      toast.success("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Impossible de copier — copie l'URL à la main : " + url);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Réservations</h1>
          <p className="font-mono-meta text-slate text-sm mt-1">
            Pages de confirmation hébergées sur /booking/&lt;ID&gt;
          </p>
        </div>
        <Link
          to="/admin/bookings/new"
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 h-10 font-mono-meta text-sm hover:bg-copper transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvelle réservation
        </Link>
      </div>

      {isLoading ? (
        <div className="font-mono-meta text-slate">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="border border-hairline bg-cream-soft p-8 text-center text-slate">
          Aucune réservation. Crée la première.
        </div>
      ) : (
        <div className="border border-hairline bg-cream-soft">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-hairline font-mono-meta text-xs text-slate">
            <span className="col-span-2">Booking ID · Statut</span>
            <span className="col-span-2">Locataire</span>
            <span className="col-span-3">Appartement</span>
            <span className="col-span-2">Séjour</span>
            <span className="col-span-2">Total · Paiement</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>
          {items.map((b) => {
            const prop = (b as { property?: { name?: string; name_italic?: string; ref?: string } }).property;
            const propLabel = prop ? `${prop.name ?? ""} ${prop.name_italic ?? ""}` : "—";
            const n = nights(b.check_in, b.check_out);
            const status = (b as { status?: string }).status ?? "draft";
            const depositStatus = (b as { deposit_status?: string }).deposit_status ?? "pending";
            const balanceStatus = (b as { balance_status?: string }).balance_status ?? "pending";
            return (
              <div
                key={b.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-hairline last:border-b-0 items-center"
              >
                <div className="md:col-span-2 font-mono-meta text-sm">
                  <div className="text-copper">{b.booking_id}</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 font-mono-meta text-[10px] ${STATUS_COLORS[status] ?? "bg-slate/20 text-slate"}`}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 font-display text-lg">{b.guest_name}</div>
                <div className="md:col-span-3">
                  <div className="font-display">{propLabel.trim()}</div>
                  {prop?.ref && (
                    <div className="font-mono-meta text-xs text-slate mt-0.5">Réf {prop.ref}</div>
                  )}
                </div>
                <div className="md:col-span-2 text-sm">
                  <div>
                    {formatDate(b.check_in)} → {formatDate(b.check_out)}
                  </div>
                  <div className="font-mono-meta text-xs text-slate mt-0.5">
                    {n} nuit{n > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="font-display">
                    {b.total_amount !== null ? formatEuro(b.total_amount) : "—"}
                  </div>
                  <div className="font-mono-meta text-xs text-slate mt-0.5 flex items-center gap-2">
                    <span title={`Acompte : ${depositStatus === "paid" ? "payé" : "en attente"}`}>
                      A {depositStatus === "paid" ? "✓" : "⏳"}
                    </span>
                    <span title={`Solde : ${balanceStatus === "paid" ? "payé" : "en attente"}`}>
                      S {balanceStatus === "paid" ? "✓" : "⏳"}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => copyLink(b.booking_id)}
                    title="Copier le lien partageable"
                    className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                  >
                    <Copy className={`w-4 h-4 ${copied === b.booking_id ? "text-copper" : ""}`} />
                  </button>
                  <a
                    href={`/booking/${b.booking_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Voir la page client (nouvel onglet)"
                    className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    to={`/admin/bookings/${b.id}`}
                    title="Modifier"
                    className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => onDelete(b.id, `${b.guest_name} · ${b.booking_id}`)}
                    title="Supprimer"
                    className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-red-700 hover:text-cream hover:border-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
