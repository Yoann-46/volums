import { Link } from "react-router-dom";
import { useAppartements, pickStr } from "@/data/queries";
import { formatEuro } from "@/lib/format";
import { useLang } from "@/i18n/LangContext";
import type { Appt } from "@/data/types";
import type { TranslationKey } from "@/i18n/translations";
import { tFormat } from "@/i18n/translations";

const Card = ({ a, idx }: { a: Appt; idx: number }) => {
  const { lang, t } = useLang();
  const baseline = pickStr(lang, a.baseline, a.baselineEn);
  const dispo = pickStr(lang, a.dispo, a.dispoEn);
  const etage = pickStr(lang, a.etage, a.etageEn);
  const minStay = pickStr(lang, a.minStay, a.minStayEn);

  return (
    <Link
      to={`/appartements/${a.slug}`}
      className="group lift bg-cream-soft border border-hairline block focus:outline-none focus:ring-2 focus:ring-ink"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink/5">
        <img
          src={a.image}
          alt={`${a.name} ${a.nameItalic} — ${a.quartier}, Paris`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
          loading={idx > 1 ? "lazy" : "eager"}
        />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between text-cream bg-gradient-to-b from-ink/60 to-transparent">
          <span className="font-mono-meta">{t("appartements.card.ref")} · {a.ref}</span>
          <span className="font-mono-meta">{t("appartements.card.dispo")} · {dispo}</span>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <span className="font-mono-meta text-copper text-xs">
          {a.arrondissement} · {a.quartier}
        </span>
        <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight">
          {a.name} <span className="italic-display">{a.nameItalic}</span>
        </h3>
        <p className="text-slate mt-2 text-sm leading-relaxed">{baseline}</p>

        <div className="grid grid-cols-3 gap-3 mt-5 py-4 border-y border-hairline">
          <Stat tKey="appartements.card.surface" value={a.surface} />
          <Stat tKey="appartements.card.chambres" value={a.chambres} />
          <Stat tKey="appartements.card.sdb" value={a.sdb} />
          <Stat tKey="appartements.card.etage" value={etage} small />
          <Stat tKey="appartements.card.couchages" value={a.couchages} small />
          <Stat tKey="appartements.card.min" value={minStay} small />
        </div>

        <div className="mt-5 flex items-end justify-between bg-ink text-cream p-4">
          <div>
            <span className="font-mono-meta text-cream/60 text-xs">
              {t("appartements.card.rent")}
            </span>
            <div className="font-display text-xl mt-1">
              {formatEuro(a.loyerNum)}
              <span className="text-cream/60 text-sm"> {t("appartements.card.perMonth")}</span>
            </div>
          </div>
          <span className="font-mono-meta text-cream/60 text-right text-xs">
            {t("appartements.card.from")}<br />{t("appartements.card.to")}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono-meta text-slate text-xs">
            <span>{t("appartements.card.internet")}</span>
            <span className="text-hairline">·</span>
            <span>{t("appartements.card.menage")}</span>
            <span className="text-hairline">·</span>
            <span>{t("appartements.card.linge")}</span>
          </div>
          <span className="font-mono-meta text-ink group-hover:text-copper transition-colors text-xs">
            {t("appartements.card.see")}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Stat = ({
  tKey,
  value,
  small,
}: {
  tKey: TranslationKey;
  value: string;
  small?: boolean;
}) => {
  const { t } = useLang();
  return (
    <div>
      <div className="font-mono-meta text-slate text-xs">{t(tKey)}</div>
      <div className={`font-display mt-0.5 ${small ? "text-sm" : "text-base"}`}>{value}</div>
    </div>
  );
};

export const Appartements = () => {
  const { data: appartements = [], isLoading } = useAppartements();
  const { t } = useLang();

  return (
    <section id="appartements" className="bg-cream-soft text-ink py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <span className="font-mono-meta text-copper">{t("appartements.eyebrow")}</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05] max-w-2xl">
              {t("appartements.title.l1")}{" "}
              <span className="italic-display">{t("appartements.title.l2")}</span>
            </h2>
          </div>
          <p className="text-slate max-w-sm">{t("appartements.intro")}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {[0, 1].map((i) => (
              <div key={i} className="aspect-[16/10] bg-ink/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {appartements.slice(0, 4).map((a, i) => (
                <Card key={a.slug} a={a} idx={i} />
              ))}
            </div>
            {appartements.length > 4 && (
              <div className="mt-12 md:mt-16 flex justify-center">
                <Link
                  to="/appartements"
                  className="inline-flex items-center gap-3 bg-ink text-cream px-7 py-4 font-mono-meta hover:bg-copper transition-colors"
                >
                  {tFormat(t("appartements.seeAll"), { n: appartements.length })}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
