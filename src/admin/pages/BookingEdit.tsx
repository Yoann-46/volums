import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, Check, Clock } from "lucide-react";
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  getBookingById,
  listProperties,
  markBalancePaid,
  markDepositPaid,
  updateBooking,
  type BookingInput,
  type BookingRow,
  type PaymentMethod,
} from "../api";
import { generateBookingId } from "../lib/bookingId";

const todayIso = () => new Date().toISOString().slice(0, 10);

const nights = (a: string, b: string) => {
  if (!a || !b) return 0;
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
};

const formatDateFr = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

const emptyForm = (): BookingInput => ({
  booking_id: generateBookingId(),
  property_id: "",
  guest_name: "",
  guest_first_name: "",
  guest_last_name: "",
  guest_email: "",
  guest_phone: "",
  check_in: todayIso(),
  check_out: todayIso(),
  total_amount: null,
  final_cleaning_fee: null,
  weekly_cleaning_fee: null,
  deposit_amount: null,
  balance_amount: null,
  deposit_payment_method: "stripe",
  balance_payment_method: "stripe",
  status: "draft",
  notes: "",
});

const inputCls =
  "w-full border border-hairline bg-cream-soft px-3 py-2 rounded-xl focus:outline-none focus:border-ink";

// Nombre de semaines complètes pour le calcul du ménage hebdo.
// Convention : on facture les semaines entamées (ceil). Ex: 8 nuits = 2 semaines.
const weeksFromNights = (n: number) => Math.max(0, Math.ceil(n / 7));

const statusLabel: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-slate/20 text-slate" },
  sent: { label: "Lien envoyé", color: "bg-amber-100 text-amber-900" },
  deposit_paid: { label: "Acompte payé", color: "bg-blue-100 text-blue-900" },
  paid_full: { label: "Soldé", color: "bg-emerald-100 text-emerald-900" },
  completed: { label: "Séjour terminé", color: "bg-slate/10 text-slate" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-900" },
};

const BookingEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  // Query params optionnels pour pré-remplir le form depuis le calendrier
  // (ex: ?property_id=...&check_in=2026-06-01&check_out=2026-07-01)
  const [form, setForm] = useState<BookingInput>(() => {
    const base = emptyForm();
    if (isNew) {
      const propertyId = searchParams.get("property_id");
      const checkIn = searchParams.get("check_in");
      const checkOut = searchParams.get("check_out");
      if (propertyId) base.property_id = propertyId;
      if (checkIn) base.check_in = checkIn;
      if (checkOut) base.check_out = checkOut;
    }
    return base;
  });
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

  const row = existing.data as BookingRow | undefined;

  useEffect(() => {
    if (row) {
      setForm({
        booking_id: row.booking_id,
        property_id: row.property_id,
        guest_name: row.guest_name,
        guest_first_name: row.guest_first_name ?? "",
        guest_last_name: row.guest_last_name ?? "",
        guest_email: row.guest_email ?? "",
        guest_phone: row.guest_phone ?? "",
        check_in: row.check_in,
        check_out: row.check_out,
        total_amount: row.total_amount,
        // Fallback : si l'ancien `cleaning_fee` est rempli mais pas le nouveau, on l'affiche
        // dans le forfait final pour ne pas perdre la valeur côté UI.
        final_cleaning_fee:
          row.final_cleaning_fee ?? row.cleaning_fee ?? null,
        weekly_cleaning_fee: row.weekly_cleaning_fee ?? null,
        deposit_amount: row.deposit_amount ?? null,
        balance_amount: row.balance_amount ?? null,
        deposit_payment_method: row.deposit_payment_method ?? "stripe",
        balance_payment_method: row.balance_payment_method ?? "stripe",
        status: row.status ?? "draft",
        notes: row.notes ?? "",
      });
    }
  }, [row]);

  const set = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const n = nights(form.check_in, form.check_out);

  const selectedProp = useMemo(
    () => properties.data?.find((p) => p.id === form.property_id),
    [properties.data, form.property_id],
  );

  // Découpe ménage
  const weeks = weeksFromNights(n);
  const weeklyTotal = weeks * (form.weekly_cleaning_fee ?? 0);
  const cleaningTotal = (form.final_cleaning_fee ?? 0) + weeklyTotal;

  // Sommes de contrôle visuelles
  const sumDepositBalance =
    (form.deposit_amount ?? 0) + (form.balance_amount ?? 0);
  const sumTotalCleaning = (form.total_amount ?? 0) + cleaningTotal;
  const sumsMatch =
    sumDepositBalance > 0 && sumTotalCleaning > 0 && sumDepositBalance === sumTotalCleaning;

  // Synthèse `guest_name` à partir du prénom + nom (fallback : valeur saisie)
  const computedGuestName = (() => {
    const fn = (form.guest_first_name ?? "").trim();
    const ln = (form.guest_last_name ?? "").trim();
    const combined = [fn, ln].filter(Boolean).join(" ");
    return combined || form.guest_name;
  })();

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
    if (!computedGuestName.trim()) {
      toast.error("Renseigne au moins le nom du locataire");
      return;
    }

    setSaving(true);
    try {
      const payload: BookingInput = {
        ...form,
        guest_name: computedGuestName,
      };
      if (isNew) {
        const created = await createBooking(payload);
        toast.success("Réservation créée");
        qc.invalidateQueries({ queryKey: ["admin-bookings"] });
        nav(`/admin/bookings/${created.id}`, { replace: true });
      } else {
        await updateBooking(id!, payload);
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
    if (!confirm(`Supprimer cette réservation ? (action irréversible)`)) return;
    try {
      await deleteBooking(id);
      toast.success("Réservation supprimée");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      nav("/admin/bookings");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const onMarkPaid = async (which: "deposit" | "balance") => {
    if (!id || isNew) return;
    const label = which === "deposit" ? "l'acompte" : "le solde";
    if (!confirm(`Marquer ${label} comme payé ?`)) return;
    try {
      if (which === "deposit") await markDepositPaid(id);
      else await markBalancePaid(id);
      toast.success(`${which === "deposit" ? "Acompte" : "Solde"} marqué payé`);
      qc.invalidateQueries({ queryKey: ["admin-booking", id] });
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", form.booking_id] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const onCancel = async () => {
    if (!id || isNew) return;
    if (!confirm(`Annuler cette réservation ? (statut "Annulée", données conservées)`)) return;
    try {
      await cancelBooking(id);
      toast.success("Réservation annulée");
      qc.invalidateQueries({ queryKey: ["admin-booking", id] });
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
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

  const copyWhatsApp = async () => {
    const firstName = (form.guest_first_name ?? "").trim() || "bonjour";
    const msg = `Bonjour ${firstName},\n\nVoici votre réservation Volums : ${publicUrl}\n\nVous y trouverez le récap et pourrez régler l'acompte directement en ligne.\n\nÀ très vite,\nVolums`;
    try {
      await navigator.clipboard.writeText(msg);
      toast.success("Message WhatsApp copié");
    } catch {
      toast.error("Copie manuelle impossible");
    }
  };

  if (!isNew && existing.isLoading) {
    return <div className="p-10 font-mono-meta text-slate">Chargement…</div>;
  }

  const currentStatus = (form.status ?? "draft") as keyof typeof statusLabel;
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">
            {isNew ? "Nouvelle réservation" : `Réservation · ${computedGuestName}`}
          </h1>
          {!isNew && (
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full font-mono-meta text-xs ${statusLabel[currentStatus]?.color ?? ""}`}
              >
                {statusLabel[currentStatus]?.label ?? currentStatus}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => nav("/admin/bookings")}
          className="font-mono-meta text-slate hover:text-ink"
        >
          ← Retour
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ─── IDENTITÉ ─── */}
        <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
          <h2 className="font-display text-xl mb-5">Identité</h2>

          {/* Statut — sélecteur manuel */}
          <div className="mb-5">
            <span className="block font-mono-meta text-xs text-slate mb-2">Statut</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusLabel) as Array<keyof typeof statusLabel>).map((s) => {
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className={`px-3 h-8 rounded-full font-mono-meta text-xs border transition-colors ${
                      active
                        ? statusLabel[s].color + " border-transparent font-semibold"
                        : "border-hairline text-slate hover:border-ink"
                    }`}
                  >
                    {statusLabel[s].label}
                  </button>
                );
              })}
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Prénom</span>
              <input
                value={form.guest_first_name ?? ""}
                onChange={(e) => set("guest_first_name", e.target.value)}
                placeholder="Jack"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Nom</span>
              <input
                value={form.guest_last_name ?? ""}
                onChange={(e) => set("guest_last_name", e.target.value)}
                placeholder="Dupont"
                className={inputCls}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Email</span>
              <input
                type="email"
                value={form.guest_email ?? ""}
                onChange={(e) => set("guest_email", e.target.value)}
                placeholder="jack@exemple.com"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Téléphone</span>
              <input
                value={form.guest_phone ?? ""}
                onChange={(e) => set("guest_phone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={inputCls}
              />
            </label>
          </div>

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
                {selectedProp.surface} · {selectedProp.chambres} ch · {selectedProp.sdb} sdb · Loyer{" "}
                {selectedProp.loyer_num} €/mois
              </span>
            )}
          </label>
        </section>

        {/* ─── DATES ─── */}
        <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
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

        {/* ─── TARIF ─── */}
        <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
          <h2 className="font-display text-xl mb-5">Tarif</h2>

          <label className="block mb-4">
            <span className="block font-mono-meta text-xs text-slate mb-1">Total séjour (€)</span>
            <input
              type="number"
              value={form.total_amount ?? ""}
              onChange={(e) =>
                set("total_amount", e.target.value === "" ? null : parseInt(e.target.value))
              }
              placeholder="7200"
              className={inputCls}
            />
          </label>

          {/* Ménage : deux types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">
                Ménage final (€, forfait optionnel)
              </span>
              <input
                type="number"
                value={form.final_cleaning_fee ?? ""}
                onChange={(e) =>
                  set(
                    "final_cleaning_fee",
                    e.target.value === "" ? null : parseInt(e.target.value),
                  )
                }
                placeholder="150"
                className={inputCls}
              />
              <span className="block font-mono-meta text-xs text-slate/60 mt-1">
                Ménage de fin de séjour, facturé une seule fois au départ.
              </span>
            </label>
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">
                Ménage hebdomadaire (€/semaine, optionnel)
              </span>
              <input
                type="number"
                value={form.weekly_cleaning_fee ?? ""}
                onChange={(e) =>
                  set(
                    "weekly_cleaning_fee",
                    e.target.value === "" ? null : parseInt(e.target.value),
                  )
                }
                placeholder="60"
                className={inputCls}
              />
              <span className="block font-mono-meta text-xs text-slate/60 mt-1">
                {n > 0
                  ? `${weeks} semaine${weeks > 1 ? "s" : ""} sur le séjour · Total hebdo : ${weeklyTotal} €`
                  : "Renseigne les dates pour voir le total"}
              </span>
            </label>
          </div>

          {cleaningTotal > 0 && (
            <div className="mb-4 font-mono-meta text-xs text-slate bg-cream px-3 py-2 rounded-xl border border-hairline">
              Total ménage : <strong>{cleaningTotal} €</strong>
              {(form.final_cleaning_fee ?? 0) > 0 && (
                <span> ({form.final_cleaning_fee} € final{weeklyTotal > 0 && ` + ${weeklyTotal} € hebdo`})</span>
              )}
              {(form.final_cleaning_fee ?? 0) === 0 && weeklyTotal > 0 && (
                <span> ({weeklyTotal} € hebdo)</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Acompte (€)</span>
              <input
                type="number"
                value={form.deposit_amount ?? ""}
                onChange={(e) =>
                  set("deposit_amount", e.target.value === "" ? null : parseInt(e.target.value))
                }
                placeholder="2160"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="block font-mono-meta text-xs text-slate mb-1">Solde (€)</span>
              <input
                type="number"
                value={form.balance_amount ?? ""}
                onChange={(e) =>
                  set("balance_amount", e.target.value === "" ? null : parseInt(e.target.value))
                }
                placeholder="5040"
                className={inputCls}
              />
            </label>
          </div>

          {(sumDepositBalance > 0 || sumTotalCleaning > 0) && (
            <div
              className={`mt-3 font-mono-meta text-xs px-3 py-2 rounded-xl ${
                sumsMatch
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {sumsMatch ? "✓" : "⚠"} Acompte + Solde = {sumDepositBalance} € · Total séjour +
              Ménage = {sumTotalCleaning} €
              {!sumsMatch && " (vérifie la cohérence)"}
            </div>
          )}
        </section>

        {/* ─── MODES DE PAIEMENT ─── */}
        <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
          <h2 className="font-display text-xl mb-5">Mode de paiement</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block font-mono-meta text-xs text-slate mb-2">
                Acompte
              </span>
              <div className="flex gap-2">
                {(["stripe", "bank_transfer"] as PaymentMethod[]).map((m) => {
                  const active = form.deposit_payment_method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("deposit_payment_method", m)}
                      className={`flex-1 px-3 h-10 rounded-xl font-mono-meta text-sm border transition-colors ${
                        active
                          ? "bg-ink text-cream border-ink"
                          : "border-hairline text-slate hover:border-ink"
                      }`}
                    >
                      {m === "stripe" ? "Stripe (CB)" : "Virement"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block font-mono-meta text-xs text-slate mb-2">Solde</span>
              <div className="flex gap-2">
                {(["stripe", "bank_transfer"] as PaymentMethod[]).map((m) => {
                  const active = form.balance_payment_method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("balance_payment_method", m)}
                      className={`flex-1 px-3 h-10 rounded-xl font-mono-meta text-sm border transition-colors ${
                        active
                          ? "bg-ink text-cream border-ink"
                          : "border-hairline text-slate hover:border-ink"
                      }`}
                    >
                      {m === "stripe" ? "Stripe (CB)" : "Virement"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATUTS PAIEMENT (édition uniquement) ─── */}
        {!isNew && row && (
          <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
            <h2 className="font-display text-xl mb-5">Statut paiements</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaymentStatusBlock
                label="Acompte"
                amount={form.deposit_amount ?? null}
                method={form.deposit_payment_method ?? null}
                status={row.deposit_status}
                paidAt={row.deposit_paid_at}
                onMarkPaid={() => onMarkPaid("deposit")}
                disabled={isCancelled}
              />
              <PaymentStatusBlock
                label="Solde"
                amount={form.balance_amount ?? null}
                method={form.balance_payment_method ?? null}
                status={row.balance_status}
                paidAt={row.balance_paid_at}
                onMarkPaid={() => onMarkPaid("balance")}
                disabled={isCancelled}
              />
            </div>
          </section>
        )}

        {/* ─── NOTES ─── */}
        <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
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
              placeholder="Ex: contact pris par téléphone le 12/05, prix négocié -10%"
            />
          </label>
        </section>

        {/* ─── LIEN CLIENT ─── */}
        {!isNew && (
          <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
            <h2 className="font-display text-xl mb-3">Lien client</h2>
            <div className="font-mono-meta text-sm break-all text-copper mb-3">
              {publicUrl}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 border border-hairline px-4 h-9 rounded-xl font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copier le lien
              </button>
              <button
                type="button"
                onClick={copyWhatsApp}
                className="inline-flex items-center gap-2 border border-hairline px-4 h-9 rounded-xl font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copier message WhatsApp
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-hairline px-4 h-9 rounded-xl font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Voir la page
              </a>
            </div>
          </section>
        )}

        {/* ─── ZONE DANGER ─── */}
        {!isNew && !isCancelled && (
          <section className="border border-hairline bg-cream-soft p-6 rounded-xl">
            <h2 className="font-display text-xl mb-3 text-red-800">Zone sensible</h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border border-amber-700 text-amber-800 px-5 h-10 rounded-xl font-mono-meta text-sm hover:bg-amber-700 hover:text-cream transition-colors"
              >
                Annuler la réservation
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="border border-red-700 text-red-700 px-5 h-10 rounded-xl font-mono-meta text-sm hover:bg-red-700 hover:text-cream transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
            <p className="font-mono-meta text-xs text-slate/70 mt-2">
              Annuler conserve les données et change juste le statut. Supprimer efface tout.
            </p>
          </section>
        )}

        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-cream/90 backdrop-blur py-4 border-t border-hairline">
          <button
            type="button"
            onClick={() => nav("/admin/bookings")}
            className="border border-hairline px-5 h-11 rounded-xl font-mono-meta hover:bg-ink hover:text-cream transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-cream px-6 h-11 rounded-xl font-mono-meta hover:bg-copper transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : isNew ? "Créer la réservation" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Composant interne : bloc statut paiement ───
const PaymentStatusBlock = ({
  label,
  amount,
  method,
  status,
  paidAt,
  onMarkPaid,
  disabled,
}: {
  label: string;
  amount: number | null;
  method: PaymentMethod | null;
  status: "pending" | "paid" | "refunded";
  paidAt: string | null;
  onMarkPaid: () => void;
  disabled: boolean;
}) => {
  const isPaid = status === "paid";
  const methodLabel = method === "stripe" ? "Stripe (CB)" : method === "bank_transfer" ? "Virement" : "—";

  return (
    <div
      className={`border p-4 rounded-xl ${
        isPaid ? "border-emerald-300 bg-emerald-50/50" : "border-hairline bg-cream"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-lg">{label}</span>
        {isPaid ? (
          <span className="inline-flex items-center gap-1 font-mono-meta text-xs text-emerald-800">
            <Check className="w-3.5 h-3.5" /> Payé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono-meta text-xs text-amber-800">
            <Clock className="w-3.5 h-3.5" /> En attente
          </span>
        )}
      </div>
      <div className="font-mono-meta text-xs text-slate mb-1">
        Montant : <strong>{amount !== null ? `${amount} €` : "—"}</strong>
      </div>
      <div className="font-mono-meta text-xs text-slate mb-1">
        Mode : <strong>{methodLabel}</strong>
      </div>
      {isPaid && paidAt && (
        <div className="font-mono-meta text-xs text-emerald-800 mt-1">
          Payé le {formatDateFr(paidAt)}
        </div>
      )}
      {!isPaid && !disabled && (
        <button
          type="button"
          onClick={onMarkPaid}
          className="mt-3 w-full border border-hairline bg-cream-soft px-3 h-9 rounded-xl font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
        >
          Marquer comme payé
        </button>
      )}
    </div>
  );
};

export default BookingEdit;
