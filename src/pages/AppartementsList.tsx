import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Nav } from "@/components/volums/Nav";
import { useAppartements, pickStr } from "@/data/queries";
import { formatEuro } from "@/lib/format";
import { useLang } from "@/i18n/LangContext";
import { tFormat } from "@/i18n/translations";
import type { Appt } from "@/data/types";
import "./appartements.css";

const numFromString = (s: string) => {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
};

// Normalisation pour la recherche : minuscules, sans accents.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Recherche par référence (sans tenir compte de la casse ni des espaces),
// par nom d'appartement ou par lieu (quartier / arrondissement).
const matchesSearch = (a: Appt, raw: string) => {
  const q = norm(raw.trim());
  if (!q) return true;
  const ref = norm(a.ref).replace(/\s+/g, "");
  const name = norm(`${a.name} ${a.nameItalic}`);
  const loc = norm(`${a.quartier} ${a.arrondissement}`);
  return (
    ref.includes(q.replace(/\s+/g, "")) ||
    name.includes(q) ||
    loc.includes(q)
  );
};

const Card = ({ a }: { a: Appt }) => {
  const { lang, t } = useLang();
  const dispo = pickStr(lang, a.dispo, a.dispoEn);

  return (
    <Link
      to={`/appartements/${a.slug}`}
      className="group bg-cream-soft border border-hairline block focus:outline-none focus:ring-2 focus:ring-ink"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
        {a.image ? (
          <img
            src={a.image}
            alt={`${a.name} ${a.nameItalic}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono-meta text-slate text-xs">
            {t("list.card.photosSoon")}
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between text-cream bg-gradient-to-b from-ink/60 to-transparent text-xs font-mono-meta">
          <span>{t("appartements.card.ref")} · {a.ref}</span>
          <span>{t("appartements.card.dispo")} · {dispo}</span>
        </div>
      </div>
      <div className="p-4 md:p-5">
        <span className="font-mono-meta text-copper text-xs">
          {a.arrondissement} · {a.quartier}
        </span>
        <h3 className="font-display text-xl md:text-2xl mt-2 leading-tight">
          {a.name} <span className="italic-display">{a.nameItalic}</span>
        </h3>
        <div className="mt-3 flex items-baseline justify-between font-mono-meta text-slate text-xs">
          <span>
            {a.surface} · {a.chambres} {t("list.card.ch")} · {a.sdb} {t("list.card.sdb")}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-display text-lg">
            {formatEuro(a.loyerNum)}
            <span className="text-slate text-sm"> {t("list.card.perMonth")}</span>
          </span>
          <span className="font-mono-meta text-ink group-hover:text-copper text-xs">
            {t("appartements.card.see")}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Select = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <label className="block">
    <span className="block font-mono-meta text-xs text-slate mb-1.5">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-hairline bg-cream-soft px-3 py-2.5 font-mono-meta text-sm focus:outline-none focus:border-ink"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

// Curseur de fourchette de loyer — deux poignées réglables (façon Airbnb).
const PriceRange = ({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) => {
  const { t } = useLang();
  const [lo, hi] = value;
  const span = max - min;
  const pct = (n: number) => (span > 0 ? ((n - min) / span) * 100 : 0);

  return (
    <div>
      {/* Piste + poignées */}
      <div className="relative h-7">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-ink/15 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-ink rounded-full"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          className="vol-range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={t("list.filter.loyer.min")}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), hi - step), hi])
          }
          style={{ zIndex: lo > min + span * 0.9 ? 5 : 3 }}
        />
        <input
          type="range"
          className="vol-range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={t("list.filter.loyer.max")}
          onChange={(e) =>
            onChange([lo, Math.max(Number(e.target.value), lo + step)])
          }
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Valeurs sélectionnées */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 border border-hairline bg-cream px-3 py-2">
          <div className="font-mono-meta text-[0.65rem] text-slate">
            {t("list.filter.loyer.min")}
          </div>
          <div className="font-display text-base leading-tight">
            {formatEuro(lo)}
          </div>
        </div>
        <span className="w-3 h-px bg-hairline shrink-0" />
        <div className="flex-1 border border-hairline bg-cream px-3 py-2">
          <div className="font-mono-meta text-[0.65rem] text-slate">
            {t("list.filter.loyer.max")}
          </div>
          <div className="font-display text-base leading-tight">
            {formatEuro(hi)}
            {hi >= max ? "+" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppartementsList = () => {
  const { data: appartements = [], isLoading } = useAppartements();
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [quartier, setQuartier] = useState("all");
  const [chambres, setChambres] = useState("all");
  const [surfaceMin, setSurfaceMin] = useState("all");
  const [loyerRange, setLoyerRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    document.title = t("list.title.tab");
    window.scrollTo(0, 0);
  }, [t]);

  const quartiers = useMemo(() => {
    const set = new Set(appartements.map((a) => a.quartier));
    return Array.from(set).sort();
  }, [appartements]);

  // Bornes du curseur de loyer, calculées sur les données (arrondies à 100 €).
  const bounds = useMemo(() => {
    const prices = appartements.map((a) => a.loyerNum).filter((n) => n > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    const lo = Math.floor(Math.min(...prices) / 100) * 100;
    const hi = Math.ceil(Math.max(...prices) / 100) * 100;
    return { min: lo, max: hi > lo ? hi : lo + 100 };
  }, [appartements]);

  // Plage effective : ce que l'utilisateur a réglé, sinon les bornes complètes.
  const loyer: [number, number] = loyerRange ?? [bounds.min, bounds.max];

  const filtered = useMemo(() => {
    const [loyerLo, loyerHi] = loyerRange ?? [bounds.min, bounds.max];
    return appartements.filter((a) => {
      if (!matchesSearch(a, query)) return false;
      if (quartier !== "all" && a.quartier !== quartier) return false;
      if (chambres !== "all") {
        const n = numFromString(a.chambres);
        if (chambres === "4+") {
          if (n < 4) return false;
        } else if (n !== parseInt(chambres)) {
          return false;
        }
      }
      if (surfaceMin !== "all" && numFromString(a.surface) < parseInt(surfaceMin))
        return false;
      if (a.loyerNum < loyerLo || a.loyerNum > loyerHi) return false;
      return true;
    });
  }, [appartements, query, quartier, chambres, surfaceMin, loyerRange, bounds]);

  const reset = () => {
    setQuery("");
    setQuartier("all");
    setChambres("all");
    setSurfaceMin("all");
    setLoyerRange(null);
  };
  const hasFilters =
    query.trim() !== "" ||
    quartier !== "all" ||
    chambres !== "all" ||
    surfaceMin !== "all" ||
    (loyerRange !== null &&
      (loyerRange[0] > bounds.min || loyerRange[1] < bounds.max));

  return (
    <main className="min-h-screen bg-cream text-ink">
      <Nav />

      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 pt-28 md:pt-32">
        <span className="font-mono-meta text-copper">{t("list.eyebrow")}</span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 leading-[1.05] max-w-3xl">
          {t("list.title.l1")} <span className="italic-display">{t("list.title.l2")}</span>
        </h1>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-10 md:mt-14">
        <div className="border border-hairline bg-cream-soft p-5 md:p-6">
          {/* Recherche */}
          <label className="block">
            <span className="block font-mono-meta text-xs text-slate mb-1.5">
              {t("list.search.label")}
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("list.search.placeholder")}
                className="w-full border border-hairline bg-cream pl-9 pr-3 py-2.5 font-mono-meta text-sm focus:outline-none focus:border-ink"
              />
            </div>
          </label>

          {/* Sélecteurs */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              label={t("list.filter.quartier")}
              value={quartier}
              onChange={setQuartier}
              options={[
                { value: "all", label: t("list.filter.quartier.all") },
                ...quartiers.map((q) => ({ value: q, label: q })),
              ]}
            />
            <Select
              label={t("list.filter.chambres")}
              value={chambres}
              onChange={setChambres}
              options={[
                { value: "all", label: t("list.filter.chambres.all") },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4+", label: t("list.filter.chambres.4plus") },
              ]}
            />
            <Select
              label={t("list.filter.surface")}
              value={surfaceMin}
              onChange={setSurfaceMin}
              options={[
                { value: "all", label: t("list.filter.surface.all") },
                { value: "40", label: "≥ 40 m²" },
                { value: "60", label: "≥ 60 m²" },
                { value: "90", label: "≥ 90 m²" },
                { value: "120", label: "≥ 120 m²" },
              ]}
            />
          </div>

          {/* Loyer — fourchette réglable */}
          <div className="mt-5 max-w-xl">
            <span className="block font-mono-meta text-xs text-slate mb-3">
              {t("list.filter.loyer")}
            </span>
            <PriceRange
              min={bounds.min}
              max={bounds.max}
              step={100}
              value={loyer}
              onChange={setLoyerRange}
            />
          </div>

          {/* Résultats + réinitialisation */}
          <div className="mt-6 flex items-center justify-between font-mono-meta text-xs">
            <span className="text-slate">
              {tFormat(
                filtered.length > 1 ? t("list.results.many") : t("list.results.one"),
                { n: filtered.length },
              )}
              {hasFilters && ` ${tFormat(t("list.results.outOf"), { total: appartements.length })}`}
            </span>
            {hasFilters && (
              <button onClick={reset} className="text-copper hover:text-ink">
                {t("list.results.reset")}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-10 pb-24 md:pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] bg-ink/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-hairline bg-cream-soft p-12 text-center">
            <p className="font-display text-xl">{t("list.empty")}</p>
            <button
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 bg-ink text-cream px-5 py-3 font-mono-meta hover:bg-copper transition-colors"
            >
              {t("list.empty.reset")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <Card key={a.slug} a={a} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AppartementsList;
