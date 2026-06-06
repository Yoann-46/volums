import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createProperty, uploadPhoto, type PropertyInput } from "../api";
import { compressImage } from "../lib/compressImage";

// ─── Types ───────────────────────────────────────────────────────────────────

type ScrapedPhoto = {
  url: string;
  room: string | null;
  roomIndex: number | null;
};

type ScrapedData = {
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surface: string;
  neighborhood: string;
  photos: ScrapedPhoto[];
};

// Libellés FR des pièces (pour les badges de catégorisation).
const ROOM_LABELS: Record<string, string> = {
  salon: "Salon",
  salle_a_manger: "Salle à manger",
  cuisine: "Cuisine",
  chambre: "Chambre",
  sdb: "Salle de bains",
  entree: "Entrée",
  bureau: "Bureau",
  exterieur: "Extérieur",
};

const roomLabel = (p: ScrapedPhoto): string => {
  if (!p.room) return "Non classé";
  const base = ROOM_LABELS[p.room] ?? p.room;
  return p.roomIndex ? `${base} ${p.roomIndex}` : base;
};

type FormState = {
  name: string;
  name_italic: string;
  ref: string;
  arrondissement: string;
  quartier: string;
  surface: string;
  chambres: string;
  sdb: string;
  couchages: string;
  baseline: string;
  short_description: string;
  loyer_num: string;
};

type Step = "input" | "scraping" | "preview" | "importing" | "done";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-hairline bg-cream-soft px-3 py-2 focus:outline-none focus:border-ink text-sm";

const PROXY = "/api/proxy-image?url=";

function scraped2form(d: ScrapedData): FormState {
  return {
    name: "Appt",
    name_italic: d.title || "",
    ref: "",
    arrondissement: d.neighborhood || "",
    quartier: "",
    surface: d.surface || "",
    chambres: d.bedrooms
      ? `${d.bedrooms} chambre${d.bedrooms > 1 ? "s" : ""}`
      : "",
    sdb: d.bathrooms
      ? `${d.bathrooms} salle${d.bathrooms > 1 ? "s" : ""} de bains`
      : "",
    couchages: d.maxGuests ? `${d.maxGuests} personnes` : "",
    baseline: d.description?.substring(0, 120) || "",
    short_description: d.description?.substring(0, 300) || "",
    loyer_num: "",
  };
}

async function fetchPhotoAsFile(photoUrl: string, idx: number): Promise<File | null> {
  try {
    const res = await fetch(PROXY + encodeURIComponent(photoUrl));
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], `photo-${String(idx + 1).padStart(2, "0")}.jpg`, {
      type: "image/jpeg",
    });
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const AirbnbImport = () => {
  const nav = useNavigate();

  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [scraped, setScraped] = useState<ScrapedData | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<FormState>(scraped2form({} as ScrapedData));
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // ── Step 1 : scraping ──────────────────────────────────────────────────

  const handleScrape = async () => {
    if (!url.trim()) return;
    setStep("scraping");
    try {
      const res = await fetch("/api/airbnb-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de scraping");
      const s = data as ScrapedData;
      setScraped(s);
      setForm(scraped2form(s));
      setSelectedPhotos(new Set(s.photos.map((_, i) => i)));
      setStep("preview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur inconnue");
      setStep("input");
    }
  };

  // ── Step 2 : import ────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!scraped) return;
    setStep("importing");

    try {
      // Construit le payload PropertyInput
      const payload: PropertyInput = {
        slug: "",
        ref: form.ref || "IMPORT",
        dispo: "Disponible",
        dispo_en: "Available",
        arrondissement: form.arrondissement,
        quartier: form.quartier,
        name: form.name,
        name_italic: form.name_italic,
        baseline: form.baseline,
        baseline_en: "",
        short_description: form.short_description,
        short_description_en: "",
        long_description: [],
        long_description_en: [],
        surface: form.surface,
        chambres: form.chambres,
        sdb: form.sdb,
        etage: "",
        etage_en: "",
        couchages: form.couchages,
        min_stay: "30 nuits",
        min_stay_en: "1 month minimum",
        loyer_num: parseInt(form.loyer_num) || 0,
        // Biens Airbnb = séjours datés par défaut (loyer + dates à compléter dans l'édition).
        pricing_mode: "stay",
        inclus: [],
        inclus_en: [],
        is_published: false, // brouillon — à publier depuis PropertyEdit
        sort_order: 999,
      };

      const created = await createProperty(payload);
      setCreatedId(created.id);

      // Upload des photos sélectionnées
      const toUpload = scraped.photos.filter((_, i) => selectedPhotos.has(i));
      setProgress({ current: 0, total: toUpload.length });

      let uploaded = 0;
      for (let i = 0; i < toUpload.length; i++) {
        setProgress({ current: i + 1, total: toUpload.length });
        const photo = toUpload[i];
        const file = await fetchPhotoAsFile(photo.url, i);
        if (!file) continue;
        try {
          const { file: compressed } = await compressImage(file);
          await uploadPhoto(created.id, compressed, {
            label: String(uploaded + 1).padStart(2, "0"),
            caption: "",
            sort_order: uploaded,
            room: photo.room,
            room_index: photo.roomIndex,
          });
          uploaded++;
        } catch {
          // On continue même si une photo échoue
        }
      }

      toast.success(
        `Appartement créé${uploaded > 0 ? ` avec ${uploaded} photo${uploaded > 1 ? "s" : ""}` : ""} — il est en brouillon`,
      );
      setStep("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur création");
      setStep("preview");
    }
  };

  const setF = <K extends keyof FormState>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const togglePhoto = (i: number) =>
    setSelectedPhotos((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const toggleAll = () =>
    setSelectedPhotos((s) => {
      if (!scraped) return s;
      return s.size === scraped.photos.length
        ? new Set()
        : new Set(scraped.photos.map((_, i) => i));
    });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-6 md:px-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Import Airbnb</h1>
          <p className="font-mono-meta text-sm text-slate mt-1">
            Extraire les données d'une annonce Airbnb pour créer un appartement
          </p>
        </div>
        <button
          type="button"
          onClick={() => nav("/admin/properties")}
          className="font-mono-meta text-slate hover:text-ink text-sm"
        >
          ← Retour
        </button>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-3 mb-8 font-mono-meta text-xs">
        {(["input", "preview", "done"] as const).map((s, i) => {
          const labels = ["URL", "Vérification", "Terminé"];
          const isDone =
            (s === "input" && ["preview", "importing", "done"].includes(step)) ||
            (s === "preview" && ["importing", "done"].includes(step)) ||
            (s === "done" && step === "done");
          const isCurrent =
            s === step ||
            (s === "preview" && step === "importing");
          return (
            <div key={s} className="flex items-center gap-3">
              {i > 0 && <span className="text-hairline">—</span>}
              <span
                className={
                  isDone
                    ? "text-copper"
                    : isCurrent
                      ? "text-ink font-medium"
                      : "text-slate"
                }
              >
                {isDone ? "✓" : i + 1}. {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          STEP 1 — Input URL
      ══════════════════════════════════════════════ */}
      {step === "input" && (
        <section className="border border-hairline bg-cream-soft p-8">
          <label className="block mb-4">
            <span className="block font-mono-meta text-xs text-slate mb-2">
              URL de l'annonce Airbnb
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="https://www.airbnb.fr/rooms/12345678"
              className={inputCls + " text-base"}
              autoFocus
            />
          </label>
          <div className="flex items-center justify-between mt-6">
            <p className="font-mono-meta text-xs text-slate/60 max-w-md">
              Fonctionne avec les URLs airbnb.fr et airbnb.com. Les données
              photos et textes sont extraites automatiquement.
            </p>
            <button
              type="button"
              onClick={handleScrape}
              disabled={!url.trim()}
              className="bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors disabled:opacity-50 shrink-0 ml-4"
            >
              Extraire →
            </button>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          STEP 1b — Scraping en cours
      ══════════════════════════════════════════════ */}
      {step === "scraping" && (
        <section className="border border-hairline bg-cream-soft p-8 text-center">
          <div className="font-display text-2xl mb-3">Extraction en cours…</div>
          <p className="font-mono-meta text-sm text-slate">
            Lecture de la page Airbnb et analyse des données
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-ink rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          STEP 2 — Preview & form
      ══════════════════════════════════════════════ */}
      {(step === "preview" || step === "importing") && scraped && (
        <div className="space-y-6">
          {/* Photos */}
          <section className="border border-hairline bg-cream-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">
                Photos{" "}
                <span className="font-mono-meta text-sm text-slate font-normal">
                  ({selectedPhotos.size}/{scraped.photos.length} sélectionnées)
                </span>
              </h2>
              <button
                type="button"
                onClick={toggleAll}
                className="font-mono-meta text-xs text-copper hover:text-ink"
              >
                {selectedPhotos.size === scraped.photos.length
                  ? "Tout décocher"
                  : "Tout cocher"}
              </button>
            </div>

            {scraped.photos.length === 0 ? (
              <p className="font-mono-meta text-sm text-slate">
                Aucune photo trouvée sur cette annonce.
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {scraped.photos.map((photo, i) => {
                  const selected = selectedPhotos.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => togglePhoto(i)}
                      className={`relative aspect-[4/3] overflow-hidden border-2 transition-all ${
                        selected
                          ? "border-copper"
                          : "border-transparent opacity-40"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Badge pièce (catégorisation Airbnb) */}
                      <span
                        className={`absolute bottom-0 inset-x-0 px-1.5 py-0.5 font-mono-meta text-[0.6rem] leading-tight truncate ${
                          photo.room
                            ? "bg-ink/75 text-cream"
                            : "bg-copper/80 text-cream"
                        }`}
                      >
                        {roomLabel(photo)}
                      </span>
                      {selected && (
                        <span className="absolute top-1 right-1 bg-copper text-cream w-5 h-5 flex items-center justify-center font-mono-meta text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Données extraites — formulaire pré-rempli */}
          <section className="border border-hairline bg-cream-soft p-6">
            <h2 className="font-display text-xl mb-5">Données extraites</h2>
            <div className="space-y-4">
              {/* Nom */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Nom (ex: Appt, Duplex)
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => setF("name", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Nom italique (titre Airbnb)
                  </span>
                  <input
                    value={form.name_italic}
                    onChange={(e) => setF("name_italic", e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>

              {/* Référence interne */}
              <label className="block">
                <span className="block font-mono-meta text-xs text-slate mb-1">
                  Référence interne{" "}
                  <span className="text-slate/60">(ex: LX B3RR)</span>
                </span>
                <input
                  value={form.ref}
                  onChange={(e) => setF("ref", e.target.value)}
                  placeholder="Ex: LX B3RR"
                  className={inputCls}
                />
              </label>

              {/* Localisation */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Arrondissement
                  </span>
                  <input
                    value={form.arrondissement}
                    onChange={(e) => setF("arrondissement", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Quartier
                  </span>
                  <input
                    value={form.quartier}
                    onChange={(e) => setF("quartier", e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>

              {/* Caractéristiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Surface
                  </span>
                  <input
                    value={form.surface}
                    onChange={(e) => setF("surface", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Chambres
                  </span>
                  <input
                    value={form.chambres}
                    onChange={(e) => setF("chambres", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Salles de bains
                  </span>
                  <input
                    value={form.sdb}
                    onChange={(e) => setF("sdb", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block font-mono-meta text-xs text-slate mb-1">
                    Couchages
                  </span>
                  <input
                    value={form.couchages}
                    onChange={(e) => setF("couchages", e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>

              {/* Loyer */}
              <label className="block">
                <span className="block font-mono-meta text-xs text-slate mb-1">
                  Loyer mensuel (€){" "}
                  <span className="text-slate/60">— non extractible depuis Airbnb, à saisir manuellement</span>
                </span>
                <input
                  type="number"
                  value={form.loyer_num}
                  onChange={(e) => setF("loyer_num", e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </label>

              {/* Descriptions */}
              <label className="block">
                <span className="block font-mono-meta text-xs text-slate mb-1">
                  Baseline (carte)
                </span>
                <input
                  value={form.baseline}
                  onChange={(e) => setF("baseline", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="block font-mono-meta text-xs text-slate mb-1">
                  Description courte
                </span>
                <textarea
                  value={form.short_description}
                  onChange={(e) => setF("short_description", e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </label>
            </div>

            {/* Note */}
            <p className="font-mono-meta text-xs text-slate/60 mt-5 border-t border-hairline pt-4">
              L'appartement sera créé en <strong>brouillon</strong> (non publié). Tu pourras
              compléter les champs manquants (description longue, inclus, étage, loyer…) depuis
              la page d'édition.
            </p>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-cream/90 backdrop-blur py-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setStep("input")}
              disabled={step === "importing"}
              className="border border-hairline px-5 h-11 font-mono-meta hover:bg-ink hover:text-cream transition-colors disabled:opacity-50"
            >
              ← Modifier l'URL
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={step === "importing"}
              className="bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors disabled:opacity-50"
            >
              {step === "importing"
                ? progress
                  ? `Upload ${progress.current}/${progress.total}…`
                  : "Création…"
                : `Importer${selectedPhotos.size > 0 ? ` (${selectedPhotos.size} photos)` : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 3 — Done
      ══════════════════════════════════════════════ */}
      {step === "done" && createdId && (
        <section className="border border-hairline bg-cream-soft p-8 text-center">
          <div className="text-4xl mb-4">✓</div>
          <div className="font-display text-2xl mb-2">Importé avec succès</div>
          <p className="font-mono-meta text-sm text-slate mb-8">
            L'appartement est créé en brouillon. Complète les données manquantes
            avant de le publier.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => nav(`/admin/properties/${createdId}`)}
              className="bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors"
            >
              Éditer l'appartement →
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setUrl("");
                setScraped(null);
                setCreatedId(null);
              }}
              className="border border-hairline px-5 h-11 font-mono-meta hover:bg-ink hover:text-cream transition-colors"
            >
              Nouvel import
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default AirbnbImport;
