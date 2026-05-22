import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Nav } from "@/components/volums/Nav";
import { useAppartements, pickStr } from "@/data/queries";
import { formatEuro } from "@/lib/format";
import { useLang } from "@/i18n/LangContext";
import { tFormat } from "@/i18n/translations";
import type { Appt } from "@/data/types";

const numFromString = (s: string) => {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
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

const AppartementsList = () => {
  const { data: appartements = [], isLoading } = useAppartements();
  const { t } = useLang();
  const [quartier, setQuartier] = useState("all");
  const [chambres, setChambres] = useState("all");
  const [loyerMax, setLoyerMax] = useState("all");
  const [surfaceMin, setSurfaceMin] = useState("all");

  useEffect(() => {
    document.title = t("list.title.tab");
    window.scrollTo(0, 0);
  }, [t]);

  const quartiers = useMemo(() => {
    const set = new Set(appartements.map((a) => a.quartier));
    return Array.from(set).sort();
  }, [appartements]);

  const filtered = useMemo(() => {
    return appartements.filter((a) => {
      if (quartier !== "all" && a.quartier !== quartier) return false;
      if (chambres !== "all") {
        const n = numFromString(a.chambres);
        if (chambres === "4+") {
          if (n < 4) return false;
        } else if (n !== parseInt(chambres)) {
          return false;
        }
      }
      if (loyerMax !== "all" && a.loyerNum > parseInt(loyerMax)) return false;
      if (surfaceMin !== "all" && numFromString(a.surface) < parseInt(surfaceMin)) return false;
      return true;
    });
  }, [appartements, quartier, chambres, loyerMax, surfaceMin]);

  const reset = () => {
    setQuartier("all");
    setChambres("all");
    setLoyerMax("all");
    setSurfaceMin("all");
  };
  const hasFilters =
    quartier !== "all" || chambres !== "all" || loyerMax !== "all" || surfaceMin !== "all";

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              label={t("list.filter.loyer")}
              value={loyerMax}
              onChange={setLoyerMax}
              options={[
                { value: "all", label: t("list.filter.loyer.all") },
                { value: "3000", label: "≤ 3 000 €" },
                { value: "5000", label: "≤ 5 000 €" },
                { value: "8000", label: "≤ 8 000 €" },
                { value: "12000", label: "≤ 12 000 €" },
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
          <div className="mt-4 flex items-center justify-between font-mono-meta text-xs">
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
