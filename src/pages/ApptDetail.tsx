import { useEffect, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Heart, Share2, ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/volums/Logo";
import { RoomGallery } from "@/components/volums/RoomGallery";
import { useAppartement, useAppartements, pickStr, pickArr } from "@/data/queries";
import { formatEuro } from "@/lib/format";
import { useLang } from "@/i18n/LangContext";
import { LangToggle } from "@/i18n/LangToggle";
import { tFormat } from "@/i18n/translations";

const ApptDetail = () => {
  const { slug } = useParams();
  const { data: appt, isLoading } = useAppartement(slug);
  const { data: allAppartements = [] } = useAppartements();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartId, setGalleryStartId] = useState<string | undefined>(undefined);
  const { lang, t } = useLang();

  const openGallery = (startId?: string) => {
    setGalleryStartId(startId);
    setGalleryOpen(true);
  };

  // Carrousel mobile — suit la photo visible pour le compteur "n / total".
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const onHeroScroll = () => {
    const el = heroRef.current;
    if (el) setHeroIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (appt) {
      document.title = `${appt.name} ${appt.nameItalic} — Volums`;
    }
  }, [appt]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-mono-meta text-slate">{t("detail.loading")}</div>
      </main>
    );
  }
  if (!appt) return <Navigate to="/" replace />;

  const shortDescription = pickStr(lang, appt.shortDescription, appt.shortDescriptionEn);
  const longDescription = pickArr(lang, appt.longDescription, appt.longDescriptionEn);
  const dispo = pickStr(lang, appt.dispo, appt.dispoEn);
  const minStay = pickStr(lang, appt.minStay, appt.minStayEn);
  const inclus = pickArr(lang, appt.inclus, appt.inclusEn);

  const [main, ...rest] =
    appt.gallery.length > 0
      ? appt.gallery
      : [{ src: "", label: "", caption: "" } as (typeof appt.gallery)[number]];

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 py-4 flex items-center justify-between gap-4">
          <Link to="/" aria-label={t("nav.home")} className="text-ink shrink-0">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <LangToggle variant="ink" />
            <Link
              to="/#appartements"
              className="font-mono-meta text-slate hover:text-ink transition-colors inline-flex items-center gap-2 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("detail.headerBack")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Title block */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 pt-12 md:pt-16">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-meta text-slate text-xs md:text-sm">
          <span>{appt.arrondissement}</span>
          <span className="text-hairline">·</span>
          <span>{appt.quartier}</span>
          <span className="text-hairline">·</span>
          <span className="text-copper">{t("detail.ref")} {appt.ref}</span>
        </div>

        <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
              {appt.name} <span className="italic-display">{appt.nameItalic}</span>
            </h1>
            <p className="text-slate mt-4 max-w-2xl">{shortDescription}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              aria-label={t("detail.save")}
              className="w-11 h-11 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              aria-label={t("detail.share")}
              className="w-11 h-11 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href="#booking"
              className="inline-flex items-center gap-2 bg-ink text-cream px-5 sm:px-6 h-11 font-mono-meta text-sm hover:bg-copper transition-colors"
            >
              {t("detail.bookCta")}
            </a>
          </div>
        </div>
      </section>

      {/* Gallery — carrousel plein cadre sur mobile, mosaïque sur desktop */}
      <section className="mt-8 md:mt-14 md:mx-auto md:max-w-[1440px] md:px-12 lg:px-16">
        {/* Mobile — carrousel swipeable */}
        <div className="md:hidden relative">
          <div
            ref={heroRef}
            onScroll={onHeroScroll}
            className="flex snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {appt.gallery.map((g) => (
              <button
                type="button"
                key={g.id ?? g.label}
                onClick={() => openGallery(g.id)}
                className="relative w-full shrink-0 snap-center aspect-[4/3] bg-ink/5"
              >
                <img
                  src={g.src}
                  alt={g.caption}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
          {appt.gallery.length > 1 && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1 font-mono-meta text-[0.7rem] text-cream">
              {heroIdx + 1} / {appt.gallery.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => openGallery()}
            className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-cream/95 text-ink px-3 py-2 font-mono-meta text-xs shadow-sm"
          >
            <span className="grid grid-cols-2 gap-0.5">
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
            </span>
            {tFormat(t("detail.gallery.showAll"), { n: appt.gallery.length })}
          </button>
        </div>

        {/* Desktop — mosaïque */}
        <div className="relative hidden md:grid md:grid-cols-4 grid-rows-2 gap-2 rounded-sm overflow-hidden md:h-[480px] lg:h-[560px]">
          <button
            type="button"
            onClick={() => openGallery(main.id)}
            className="relative md:col-span-2 md:row-span-2 group overflow-hidden bg-ink/5"
          >
            <img
              src={main.src}
              alt={main.caption}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
            />
          </button>

          {rest.slice(0, 4).map((g) => (
            <button
              type="button"
              key={g.id ?? g.label}
              onClick={() => openGallery(g.id)}
              className="relative group overflow-hidden bg-ink/5"
            >
              <img
                src={g.src}
                alt={g.caption}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                loading="lazy"
              />
            </button>
          ))}

          <button
            type="button"
            onClick={() => openGallery()}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-cream text-ink border border-ink px-4 py-2 font-mono-meta text-xs hover:bg-ink hover:text-cream transition-colors"
          >
            <span className="grid grid-cols-2 gap-0.5">
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
              <span className="w-1.5 h-1.5 bg-current" />
            </span>
            {tFormat(t("detail.gallery.showAll"), { n: appt.gallery.length })}
          </button>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <span className="font-mono-meta text-copper">{t("detail.sec.residence")}</span>
          <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">
            {t("detail.sec.residence.title.l1")}{" "}
            <span className="italic-display">{t("detail.sec.residence.title.l2")}</span>
          </h2>

          <div className="mt-8 space-y-6 text-slate leading-relaxed max-w-xl">
            {longDescription.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border border-hairline mt-12">
            <Stat label={t("detail.stats.surface")} value={appt.surface} />
            <Stat label={t("detail.stats.chambres")} value={appt.chambres} />
            <Stat label={t("detail.stats.sdb")} value={appt.sdb} />
            <Stat label={t("detail.stats.min")} value={minStay} />
          </div>

          <div className="mt-16">
            <span className="font-mono-meta text-copper">{t("detail.sec.inclus")}</span>
            <h3 className="font-display text-3xl md:text-4xl mt-4">
              {t("detail.sec.inclus.title.l1")}{" "}
              <span className="italic-display">{t("detail.sec.inclus.title.l2")}</span>
            </h3>
            <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {inclus.map((it) => (
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
        </div>

        {/* Booking sidebar */}
        <aside className="lg:col-span-5">
          <div
            id="booking"
            className="lg:sticky lg:top-8 border border-hairline bg-cream-soft p-7 md:p-8"
          >
            <span className="font-mono-meta text-slate">{t("detail.book.from")}</span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-4xl md:text-5xl">{formatEuro(appt.loyerNum)}</span>
              <span className="text-slate">{t("detail.book.perMonth")}</span>
            </div>
            <div className="mt-1 font-mono-meta text-slate">{t("detail.book.allInc")}</div>

            <div className="mt-7 border border-hairline">
              <Field label={t("detail.book.availFrom")} value={dispo} />
            </div>
            <p className="mt-3 font-mono-meta text-slate">
              {t("detail.book.minStay")} · {minStay}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <Row k={t("detail.book.charges")} v={t("detail.book.included")} />
              <Row k={t("detail.book.welcome")} v={t("detail.book.included")} />
              <Row k={t("detail.book.cleaning")} v={t("detail.book.optional")} />
            </dl>

            <a
              href="mailto:contact@volums.fr"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-ink text-cream py-3.5 font-mono-meta hover:bg-copper transition-colors"
            >
              {t("detail.bookCta")}
            </a>
          </div>
        </aside>
      </section>

      {/* Other apartments */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 mt-24 md:mt-32 pb-24 md:pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="font-mono-meta text-copper">{t("detail.other.eyebrow")}</span>
            <h3 className="font-display text-3xl md:text-4xl mt-3">
              {t("detail.other.title.l1")}{" "}
              <span className="italic-display">{t("detail.other.title.l2")}</span>
            </h3>
          </div>
          <Link
            to="/#appartements"
            className="font-mono-meta text-ink hover:text-copper transition-colors"
          >
            {t("detail.other.all")}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allAppartements
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
                    <span>
                      {a.surface} · {a.chambres} {t("detail.other.ch")}
                    </span>
                    <span className="text-ink">
                      {formatEuro(a.loyerNum)} {t("detail.other.perMonth")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Galerie par pièce */}
      <RoomGallery
        photos={appt.gallery}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        startPhotoId={galleryStartId}
      />
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-cream p-5">
    <div className="font-mono-meta text-slate">{label}</div>
    <div className="font-display text-2xl mt-1">{value}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4">
    <div className="font-mono-meta text-slate">{label}</div>
    <div className="font-display text-base mt-1">{value}</div>
  </div>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate">{k}</span>
    <span>{v}</span>
  </div>
);

export default ApptDetail;
