import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import {
  createBooking,
  deleteBooking,
  getBookingById,
  listProperties,
  updateBooking,
  type BookingInput,
} from "../api";
import { generateBookingId } from "../lib/bookingId";

const todayIso = () => new Date().toISOString().slice(0, 10);

const nights = (a: string, b: string) => {
  if (!a || !b) return 0;
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
};

const emptyForm = (): BookingInput => ({
  booking_id: generateBookingId(),
  property_id: "",
  guest_name: "",
  check_in: todayIso(),
  check_out: todayIso(),
  total_amount: null,
  notes: "",
});

const inputCls =
  "w-full border border-hairline bg-cream-soft px-3 py-2 focus:outline-none focus:border-ink";

const BookingEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<BookingInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const properties = useQuery({
    queryKey: ["admin-properties"],
    queryFn: listProperties,
  });

  const existing = useQuery({
    queryKey: ["admin-booking", id],
    queryFn: () => getBookingById(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing.data) {
      const d = existing.data;
      setForm({
        booking_id: d.booking_id,
        property_id: d.property_id,
        guest_name: d.guest_name,
        check_in: d.check_in,
        check_out: d.check_out,
        total_amount: d.total_amount,
        notes: d.notes ?? "",
      });
    }
  }, [existing.data]);

  const set = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const n = nights(form.check_in, form.check_out);

  const selectedProp = useMemo(
    () => properties.data?.find((p) => p.id === form.property_id),
    [properties.data, form.property_id],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id) {
      toast.error("Choisis un appartement");
      return;
    }
    if (n <= 0) {
      toast.error("La date de check-out doit être après la date de check-in");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await createBooking(form);
        toast.success("Réservation créée");
        qc.invalidateQueries({ queryKey: ["admin-bookings"] });
        nav(`/admin/bookings/${created.id}`, { replace: true });
      } else {
        await updateBooking(id!, form);
        toast.success("Réservation mise à jour");
        qc.invalidateQueries({ queryKey: ["admin-bookings"] });
        qc.invalidateQueries({ queryKey: ["admin-booking", id] });
        qc.invalidateQueries({ queryKey: ["booking", form.booking_id] });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id || isNew) return;
    if (!confirm(`Supprimer cette réservation ?`)) return;
    try {
      await deleteBooking(id);
      toast.success("Réservation supprimée");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      nav("/admin/bookings");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const publicUrl = `${window.location.origin}/booking/${form.booking_id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie manuelle : " + publicUrl);
    }
  };

  if (!isNew && existing.isLoading) {
    return <div className="p-10 font-mono-meta text-slate">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl md:text-4xl">
          {isNew ? "Nouvelle réservation" : `Réservation · ${form.guest_name}`}
        </h1>
        <button
          type="button"
          onClick={() => nav("/admin/bookings")}
          className="font-mono-meta text-slate hover:text-ink"
        >
          ← Retour
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="border border-hairline bg-cream-soft p-6">
          <h2 className="font-display text-xl mb-5">Identité</h2>

          <label className="block mb-4">
            <span className="block font-mono-meta text-xs text-slate mb-1">
              Booking ID (généré automatiquement, modifiable)
            </span>
            <input
              value={form.booking_id}
              onChange={(e) => set("booking_id", e.target.value.toUpperCase())}
              required
              className={inputCls}
            />
            <span className="block font-mono-meta text-xs text-slate/60 mt-1">
              Apparaît dans l'URL : /booking/<strong>{form.booking_id || "…"}</strong>
            </span>
          </label>

          <label className="block mb-4">
            <span className="block font-mono-meta text-xs text-slate mb-1">Nom du locataire</span>
            <input
              value={form.guest_name}
              onChange={(e) => set("guest_name", e.target.value)}
              required
              placeholder="Jack"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="block font-mono-meta text-xs text-slate mb-1">Appartement</span>
            <select
              value={form.property_id}
              onChange={(e) => set("property_id", e.target.value)}
              required
              className={inputCls}
            >
              <option value="">— Choisir un appartement —</option>
              {(properties.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.name_italic} · Réf {p.ref} · {p.quartier}
                </option>
              ))}
            </select>
            {selectedProp && (
              <span className="block font-mono-meta text-xs text-slate/60 mt-1">
                {selectedProp.surface} · {selectedProp.chambres} ch · {selectedProp.sdb} sdb · Loyer {selectedProp.loyer_num} €/mois
              </span>
            )}
          </label>
        </section>

        <section className="border border-hairline bg-cream-soft p-6">
          <h2 className="font-display text-xl mb-5">Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Check-in</span>
              <input
                type="date"
                value={form.check_in}
                onChange={(e) => set("check_in", e.target.value)}
                required
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Check-out</span>
              <input
                type="date"
                value={form.check_out}
                onChange={(e) => set("check_out", e.target.value)}
                required
                className={inputCls}
              />
            </label>
          </div>
          <p className="font-mono-meta text-xs text-slate/70 mt-3">
            {n > 0
              ? `${n} nuit${n > 1 ? "s" : ""}`
              : n === 0
                ? "Sélectionne les deux dates"
                : "⚠️ Check-out doit être après le check-in"}
          </p>
        </section>

        <section className="border border-hairline bg-cream-soft p-6">
          <h2 className="font-display text-xl mb-5">Tarif</h2>
          <label className="block">
            <span className="block font-mono-meta text-xs text-slate mb-1">
              Total à afficher sur la confirmation (en €)
            </span>
            <input
              type="number"
              value={form.total_amount ?? ""}
              onChange={(e) =>
                set("total_amount", e.target.value === "" ? null : parseInt(e.target.value))
              }
              placeholder="ex: 7200"
              className={inputCls}
            />
            <span className="block font-mono-meta text-xs text-slate/60 mt-1">
              Champ libre. Laisser vide pour afficher "—" sur la page client.
            </span>
          </label>
        </section>

        <section className="border border-hairline bg-cream-soft p-6">
          <h2 className="font-display text-xl mb-5">Notes (interne)</h2>
          <label className="block">
            <span className="block font-mono-meta text-xs text-slate mb-1">
              Notes privées, non affichées sur la page client
            </span>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Ex: paiement reçu le 15/05, virement SEPA"
            />
          </label>
        </section>

        {!isNew && (
          <section className="border border-hairline bg-cream-soft p-6">
            <h2 className="font-display text-xl mb-3">Lien client</h2>
            <div className="flex items-center gap-3 font-mono-meta text-sm break-all">
              <span className="text-copper">{publicUrl}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 border border-hairline px-4 h-9 font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copier le lien
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-hairline px-4 h-9 font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Voir la page
              </a>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-cream/90 backdrop-blur py-4 border-t border-hairline">
          {!isNew ? (
            <button
              type="button"
              onClick={onDelete}
              className="border border-red-700 text-red-700 px-5 h-11 font-mono-meta hover:bg-red-700 hover:text-cream transition-colors"
            >
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav("/admin/bookings")}
              className="border border-hairline px-5 h-11 font-mono-meta hover:bg-ink hover:text-cream transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : isNew ? "Créer la réservation" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingEdit;
