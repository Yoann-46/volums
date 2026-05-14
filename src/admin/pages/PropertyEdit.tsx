import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createProperty,
  getProperty,
  updateProperty,
  type PropertyInput,
} from "../api";
import { PhotoManager } from "../components/PhotoManager";

const empty: PropertyInput = {
  slug: "",
  ref: "",
  dispo: "",
  arrondissement: "",
  quartier: "",
  name: "Appt",
  name_italic: "",
  baseline: "",
  short_description: "",
  long_description: [""],
  surface: "",
  chambres: "",
  sdb: "",
  etage: "",
  couchages: "",
  min_stay: "30 nuits",
  loyer_num: 0,
  inclus: [""],
  is_published: true,
  sort_order: 0,
  dispo_en: "",
  baseline_en: "",
  short_description_en: "",
  long_description_en: [""],
  etage_en: "",
  min_stay_en: "",
  inclus_en: [""],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const PropertyEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<PropertyInput>(empty);
  const [saving, setSaving] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-property", id],
    queryFn: () => getProperty(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug,
        ref: existing.ref,
        dispo: existing.dispo,
        arrondissement: existing.arrondissement,
        quartier: existing.quartier,
        name: existing.name,
        name_italic: existing.name_italic,
        baseline: existing.baseline,
        short_description: existing.short_description,
        long_description: existing.long_description,
        surface: existing.surface,
        chambres: existing.chambres,
        sdb: existing.sdb,
        etage: existing.etage,
        couchages: existing.couchages,
        min_stay: existing.min_stay,
        loyer_num: existing.loyer_num,
        inclus: existing.inclus,
        is_published: existing.is_published,
        sort_order: existing.sort_order,
        dispo_en: existing.dispo_en ?? "",
        baseline_en: existing.baseline_en ?? "",
        short_description_en: existing.short_description_en ?? "",
        long_description_en: existing.long_description_en ?? [""],
        etage_en: existing.etage_en ?? "",
        min_stay_en: existing.min_stay_en ?? "",
        inclus_en: existing.inclus_en ?? [""],
      });
    }
  }, [existing]);

  const set = <K extends keyof PropertyInput>(k: K, v: PropertyInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: PropertyInput = {
        ...form,
        slug: form.slug || slugify(`${form.name}-${form.name_italic}`),
        long_description: form.long_description.filter((s) => s.trim()),
        inclus: form.inclus.filter((s) => s.trim()),
        long_description_en: (form.long_description_en ?? []).filter((s) => s.trim()),
        inclus_en: (form.inclus_en ?? []).filter((s) => s.trim()),
      };
      if (isNew) {
        const created = await createProperty(payload);
        toast.success("Appartement créé");
        qc.invalidateQueries({ queryKey: ["admin-properties"] });
        qc.invalidateQueries({ queryKey: ["appartements"] });
        nav(`/admin/properties/${created.id}`, { replace: true });
      } else {
        await updateProperty(id!, payload);
        toast.success("Modifications enregistrées");
        qc.invalidateQueries({ queryKey: ["admin-properties"] });
        qc.invalidateQueries({ queryKey: ["admin-property", id] });
        qc.invalidateQueries({ queryKey: ["appartements"] });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && isLoading) {
    return <div className="p-10 font-mono-meta text-slate">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl md:text-4xl">
          {isNew ? "Nouvel appartement" : `${form.name} ${form.name_italic}`}
        </h1>
        <button
          type="button"
          onClick={() => nav("/admin/properties")}
          className="font-mono-meta text-slate hover:text-ink"
        >
          ← Retour
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <Section title="Identité">
          <Grid>
            <Field label="Nom (ex: Appt, Duplex)">
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Nom italique (ex: Beaumarchais)">
              <input
                value={form.name_italic}
                onChange={(e) => set("name_italic", e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Slug (URL)" hint="Laisser vide pour génération automatique">
              <input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Référence interne">
              <input
                value={form.ref}
                onChange={(e) => set("ref", e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Disponibilité (ex: 04 MAI 2026)">
              <input
                value={form.dispo}
                onChange={(e) => set("dispo", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Ordre d'affichage">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
            <Field label="Arrondissement">
              <input
                value={form.arrondissement}
                onChange={(e) => set("arrondissement", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Quartier">
              <input
                value={form.quartier}
                onChange={(e) => set("quartier", e.target.value)}
                className={inputCls}
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Descriptions">
          <Field label="Baseline (carte)">
            <input
              value={form.baseline}
              onChange={(e) => set("baseline", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Description courte (page détail)">
            <textarea
              value={form.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Description longue (paragraphes)">
            <ArrayEditor
              value={form.long_description}
              onChange={(v) => set("long_description", v)}
              placeholder="Paragraphe…"
              multiline
            />
          </Field>
        </Section>

        <Section title="Caractéristiques">
          <Grid>
            <Field label="Surface"><input value={form.surface} onChange={(e) => set("surface", e.target.value)} className={inputCls} /></Field>
            <Field label="Chambres"><input value={form.chambres} onChange={(e) => set("chambres", e.target.value)} className={inputCls} /></Field>
            <Field label="Salles de bain"><input value={form.sdb} onChange={(e) => set("sdb", e.target.value)} className={inputCls} /></Field>
            <Field label="Étage"><input value={form.etage} onChange={(e) => set("etage", e.target.value)} className={inputCls} /></Field>
            <Field label="Couchages"><input value={form.couchages} onChange={(e) => set("couchages", e.target.value)} className={inputCls} /></Field>
            <Field label="Séjour minimum"><input value={form.min_stay} onChange={(e) => set("min_stay", e.target.value)} className={inputCls} /></Field>
          </Grid>
        </Section>

        <Section title="Loyer">
          <Field label="Loyer mensuel en € (ex: 7500)" hint="Affiché formaté sur le site (ex: 7 500 €)">
            <input
              type="number"
              value={form.loyer_num}
              onChange={(e) => set("loyer_num", parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Inclus de série">
          <ArrayEditor
            value={form.inclus}
            onChange={(v) => set("inclus", v)}
            placeholder="Ex: Wi-Fi fibre 1 Gbps"
          />
        </Section>

        <Section title="🇬🇧 Traductions EN (optionnel — fallback FR si vide)">
          <Field label="Disponibilité (EN) — ex: MAY 04, 2026">
            <input
              value={form.dispo_en ?? ""}
              onChange={(e) => set("dispo_en", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Étage (EN) — ex: 3rd floor">
            <input
              value={form.etage_en ?? ""}
              onChange={(e) => set("etage_en", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Séjour minimum (EN) — ex: 1 month minimum">
            <input
              value={form.min_stay_en ?? ""}
              onChange={(e) => set("min_stay_en", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Baseline (EN)">
            <input
              value={form.baseline_en ?? ""}
              onChange={(e) => set("baseline_en", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Description courte (EN)">
            <textarea
              value={form.short_description_en ?? ""}
              onChange={(e) => set("short_description_en", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Description longue (EN) — paragraphes">
            <ArrayEditor
              value={form.long_description_en ?? [""]}
              onChange={(v) => set("long_description_en", v)}
              placeholder="Paragraph…"
              multiline
            />
          </Field>
          <Field label="Inclus de série (EN)">
            <ArrayEditor
              value={form.inclus_en ?? [""]}
              onChange={(v) => set("inclus_en", v)}
              placeholder="Ex: 1 Gbps fibre Wi-Fi"
            />
          </Field>
        </Section>

        <Section title="Publication">
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="w-4 h-4"
            />
            <span>Publié sur le site public</span>
          </label>
        </Section>

        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-cream/90 backdrop-blur py-4 border-t border-hairline">
          <button
            type="button"
            onClick={() => nav("/admin/properties")}
            className="border border-hairline px-5 h-11 font-mono-meta hover:bg-ink hover:text-cream transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer"}
          </button>
        </div>
      </form>

      {!isNew && existing && (
        <Section title="Photos">
          <PhotoManager propertyId={existing.id} coverPhotoId={existing.cover_photo_id} />
        </Section>
      )}
    </div>
  );
};

const inputCls =
  "w-full border border-hairline bg-cream-soft px-3 py-2 focus:outline-none focus:border-ink";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border border-hairline bg-cream-soft p-6 mt-8 first:mt-0">
    <h2 className="font-display text-xl mb-5">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block font-mono-meta text-xs text-slate mb-1">{label}</span>
    {children}
    {hint && <span className="block font-mono-meta text-xs text-slate/60 mt-1">{hint}</span>}
  </label>
);

const ArrayEditor = ({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) => {
  const update = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);

  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2 items-start">
          {multiline ? (
            <textarea
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className={inputCls}
            />
          ) : (
            <input
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className={inputCls}
            />
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 w-10 h-10 border border-hairline hover:bg-red-700 hover:text-cream hover:border-red-700 transition-colors"
            title="Retirer"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="font-mono-meta text-sm text-copper hover:text-ink"
      >
        + Ajouter
      </button>
    </div>
  );
};

export default PropertyEdit;
