import { Link } from "react-router-dom";
import { useAppartements } from "@/data/queries";
import type { Appt } from "@/data/types";

const Card = ({ a, idx }: { a: Appt; idx: number }) => (
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
        <span className="font-mono-meta">Réf · {a.ref}</span>
        <span className="font-mono-meta">Dispo · {a.dispo}</span>
      </div>
    </div>

    <div className="p-5 md:p-6">
      <span className="font-mono-meta text-copper text-xs">
        {a.arrondissement} · {a.quartier}
      </span>
      <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight">
        {a.name} <span className="italic-display">{a.nameItalic}</span>
      </h3>
      <p className="text-slate mt-2 text-sm leading-relaxed">{a.baseline}</p>

      <div className="grid grid-cols-3 gap-3 mt-5 py-4 border-y border-hairline">
        <Stat label="Surface" value={a.surface} />
        <Stat label="Chambres" value={a.chambres} />
        <Stat label="SDB" value={a.sdb} />
        <Stat label="Étage" value={a.etage} small />
        <Stat label="Couchages" value={a.couchages} small />
        <Stat label="Min." value={a.minStay} small />
      </div>

      <div className="mt-5 flex items-end justify-between bg-ink text-cream p-4">
        <div>
          <span className="font-mono-meta text-cream/60 text-xs">Loyer · charges incl.</span>
          <div className="font-display text-xl mt-1">
            {a.loyer}
            <span className="text-cream/60 text-sm"> / mois</span>
          </div>
        </div>
        <span className="font-mono-meta text-cream/60 text-right text-xs">
          De 1<br />à 12 mois
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono-meta text-slate text-xs">
          <span>Internet</span>
          <span className="text-hairline">·</span>
          <span>Ménage</span>
          <span className="text-hairline">·</span>
          <span>Linge</span>
        </div>
        <span className="font-mono-meta text-ink group-hover:text-copper transition-colors text-xs">
          Voir →
        </span>
      </div>
    </div>
  </Link>
);

const Stat = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div>
    <div className="font-mono-meta text-slate text-xs">{label}</div>
    <div className={`font-display mt-0.5 ${small ? "text-sm" : "text-base"}`}>{value}</div>
  </div>
);

export const Appartements = () => {
  const { data: appartements = [], isLoading } = useAppartements();

  return (
    <section id="appartements" className="bg-cream-soft text-ink py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <span className="font-mono-meta text-copper">— La sélection</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05] max-w-2xl">
              Notre sélection, <span className="italic-display">prête à vivre.</span>
            </h2>
          </div>
          <p className="text-slate max-w-sm">
            Chaque bien est inspecté, photographié et stylisé par notre équipe parisienne.
            Aucune annonce partenaire.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {[0, 1].map((i) => (
              <div key={i} className="aspect-[16/10] bg-ink/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {appartements.map((a, i) => (
              <Card key={a.slug} a={a} idx={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
