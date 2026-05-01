import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Heart, Share2, ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/volums/Logo";
import { getAppt, appartements } from "@/data/appartements";

const ApptDetail = () => {
  const { slug } = useParams();
  const appt = getAppt(slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (appt) {
      document.title = `${appt.name} ${appt.nameItalic} — Volums`;
    }
  }, [appt]);

  useEffect(() => {
    if (lightbox === null || !appt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % appt.gallery.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + appt.gallery.length) % appt.gallery.length));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, appt]);

  if (!appt) return <Navigate to="/" replace />;

  const [main, ...rest] = appt.gallery;

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Top bar */}
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 py-5 flex items-center justify-between">
          <Link to="/" aria-label="Volums — accueil" className="text-ink">
            <Wordmark />
          </Link>
          <Link
            to="/#appartements"
            className="font-mono-meta text-slate hover:text-ink transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Toute la sélection
          </Link>
        </div>
      </header>

      {/* Title block */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 pt-12 md:pt-16">
        <div className="flex items-center gap-3 font-mono-meta text-slate">
          <span>{appt.arrondissement}</span>
          <span className="text-hairline">·</span>
          <span>{appt.quartier}</span>
          <span className="text-hairline">·</span>
          <span className="text-copper">Réf {appt.ref}</span>
          <span className="text-hairline">·</span>
          <span>Signature</span>
        </div>

        <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
              {appt.name} <span className="italic-display">{appt.nameItalic}</span>
            </h1>
            <p className="text-slate mt-4 max-w-2xl">{appt.shortDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Sauvegarder"
              className="w-11 h-11 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              aria-label="Partager"
              className="w-11 h-11 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href="#booking"
              className="inline-flex items-center gap-2 bg-ink text-cream px-6 h-11 font-mono-meta hover:bg-copper transition-colors"
            >
              Demander une visite →
            </a>
          </div>
        </div>
      </section>

      {/* Gallery mosaic */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-10 md:mt-14">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="relative col-span-2 lg:row-span-2 aspect-[4/3] lg:aspect-auto group overflow-hidden bg-ink/5"
          >
            <img
              src={main.src}
              alt={main.caption}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
            />
            <span className="absolute top-4 left-4 font-mono-meta text-cream/90">
              #{main.label} · {main.caption}
            </span>
          </button>

          {rest.slice(0, 4).map((g, i) => (
            <button
              type="button"
              key={g.label}
              onClick={() => setLightbox(i + 1)}
              className="relative aspect-[4/3] lg:aspect-square group overflow-hidden bg-ink/5"
            >
              <img
                src={g.src}
                alt={g.caption}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 font-mono-meta text-cream/90 text-[0.6rem]">
                #{g.label} · {g.caption}
              </span>
              {i === 3 && appt.gallery.length > 5 && (
                <span className="absolute bottom-3 right-3 bg-ink/80 text-cream font-mono-meta px-3 py-1.5">
                  + {appt.gallery.length - 5} photos
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Body: description + booking column */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <span className="font-mono-meta text-copper">— La résidence</span>
          <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">
            Haussmannien, <span className="italic-display">réimaginé.</span>
          </h2>

          <div className="mt-8 space-y-6 text-slate leading-relaxed max-w-xl">
            {appt.longDescription.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border border-hairline mt-12">
            <Stat label="Surface" value={appt.surface} />
            <Stat label="Chambres" value={appt.chambres} />
            <Stat label="Salles de bain" value={appt.sdb} />
            <Stat label="Séjour min." value={appt.minStay} />
          </div>

          {/* Inclus */}
          <div className="mt-16">
            <span className="font-mono-meta text-copper">— Inclus de série</span>
            <h3 className="font-display text-3xl md:text-4xl mt-4">
              Tout est <span className="italic-display">clé en main.</span>
            </h3>
            <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {appt.inclus.map((it) => (
                <li
                  key={it}
                  className="flex items-start gap-3 py-2 border-b border-hairline text-ink"
                >
                  <span className="w-4 h-4 border border-ink/40 mt-1 flex-shrink-0" />
                  <span className="text-sm">{it}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transport */}
          <div className="mt-12 p-6 bg-cream-soft border border-hairline">
            <span className="font-mono-meta text-slate">Transports</span>
            <p className="mt-2 font-display text-lg">{appt.transport}</p>
          </div>
        </div>

        {/* Booking sidebar */}
        <aside className="lg:col-span-5">
          <div id="booking" className="lg:sticky lg:top-8 border border-hairline bg-cream-soft p-7 md:p-8">
            <span className="font-mono-meta text-slate">À partir de</span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-4xl md:text-5xl">{appt.loyer}</span>
              <span className="text-slate">/ mois</span>
            </div>
            <div className="mt-1 font-mono-meta text-slate">
              ≈ {appt.pricePerSqm} · TTC · tout inclus
            </div>

            <div className="mt-7 grid grid-cols-2 border border-hairline">
              <Field label="Arrivée" value={appt.dispo} />
              <Field label="Départ" value="04 AOÛT 2026" border />
            </div>
            <p className="mt-3 font-mono-meta text-slate">3 mois · 2 résidents</p>

            <dl className="mt-6 space-y-3 text-sm">
              <Row k={`3 mois × ${appt.loyer}`} v={`${(appt.loyerNum * 3).toLocaleString("fr-FR")} €`} />
              <Row k="Pack accueil & linge" v="Inclus" />
              <Row k="Ménage hebdomadaire ×13" v="Inclus" />
              <Row k="Conciergerie · taxe de séjour" v="Inclus" />
              <div className="hairline my-3" />
              <Row k="Total · TTC" v={`${(appt.loyerNum * 3).toLocaleString("fr-FR")} €`} bold />
            </dl>

            <a
              href="mailto:contact@volums.fr"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-ink text-cream py-3.5 font-mono-meta hover:bg-copper transition-colors"
            >
              Demander une visite →
            </a>
            <button className="mt-2 w-full border border-ink py-3.5 font-mono-meta hover:bg-ink hover:text-cream transition-colors">
              Réserver 48h · sans frais
            </button>

            <div className="mt-7 pt-6 border-t border-hairline flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-copper/30 flex items-center justify-center font-display text-copper">
                {appt.host.name.charAt(0)}
              </div>
              <div>
                <div className="font-display">{appt.host.name}</div>
                <div className="font-mono-meta text-slate">{appt.host.role}</div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Other apartments */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-24 md:mt-32 pb-24 md:pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="font-mono-meta text-copper">— Autres adresses</span>
            <h3 className="font-display text-3xl md:text-4xl mt-3">
              Continuer la <span className="italic-display">sélection.</span>
            </h3>
          </div>
          <Link to="/#appartements" className="font-mono-meta text-ink hover:text-copper transition-colors">
            Toute la sélection →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {appartements
            .filter((a) => a.slug !== appt.slug)
            .slice(0, 3)
            .map((a) => (
              <Link
                key={a.slug}
                to={`/appartements/${a.slug}`}
                className="group block bg-cream-soft border border-hairline lift"
              >
                <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                  <img
                    src={a.image}
                    alt={`${a.name} ${a.nameItalic}`}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <span className="font-mono-meta text-copper">{a.quartier}</span>
                  <div className="font-display text-xl mt-2">
                    {a.name} <span className="italic-display">{a.nameItalic}</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between font-mono-meta text-slate">
                    <span>{a.surface} · {a.chambres} ch.</span>
                    <span className="text-ink">{a.loyer} / mois</span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-4 md:p-10"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Fermer"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-cream/80 hover:text-cream w-10 h-10 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            aria-label="Précédent"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i - 1 + appt.gallery.length) % appt.gallery.length));
            }}
            className="absolute left-3 md:left-8 text-cream/80 hover:text-cream w-12 h-12 flex items-center justify-center"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            aria-label="Suivant"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i + 1) % appt.gallery.length));
            }}
            className="absolute right-3 md:right-8 text-cream/80 hover:text-cream w-12 h-12 flex items-center justify-center"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          <figure
            className="max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={appt.gallery[lightbox].src}
              alt={appt.gallery[lightbox].caption}
              className="w-full max-h-[80vh] object-contain"
            />
            <figcaption className="mt-4 flex items-center justify-between text-cream/80 font-mono-meta">
              <span>
                #{appt.gallery[lightbox].label} · {appt.gallery[lightbox].caption}
              </span>
              <span>
                {lightbox + 1} / {appt.gallery.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-cream p-5">
    <div className="font-mono-meta text-slate">{label}</div>
    <div className="font-display text-2xl mt-1">{value}</div>
  </div>
);

const Field = ({ label, value, border }: { label: string; value: string; border?: boolean }) => (
  <div className={`p-4 ${border ? "border-l border-hairline" : ""}`}>
    <div className="font-mono-meta text-slate">{label}</div>
    <div className="font-display text-base mt-1">{value}</div>
  </div>
);

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? "font-display" : "text-slate"}>{k}</span>
    <span className={bold ? "font-display" : ""}>{v}</span>
  </div>
);

export default ApptDetail;
