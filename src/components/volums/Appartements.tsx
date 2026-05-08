import { Link } from "react-router-dom";
import { appartements, type Appt } from "@/data/appartements";

const Card = ({ a, idx }: { a: Appt; idx: number }) => (
  <Link
    to={`/appartements/${a.slug}`}
    className="group lift bg-cream-soft border border-hairline block focus:outline-none focus:ring-2 focus:ring-ink"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
      <img
        src={a.image}
        alt={`${a.name} ${a.nameItalic} — ${a.quartier}, Paris`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
        loading={idx > 1 ? "lazy" : "eager"}
      />
      <div className="absolute top-0 left-0 right-0 p-5 flex items-start justify-between text-cream bg-gradient-to-b from-ink/60 to-transparent">
        <span className="font-mono-meta">Réf · {a.ref}</span>
        <span className="font-mono-meta">Dispo · {a.dispo}</span>
      </div>
    </div>

    <div className="p-7 md:p-9">
      <span className="font-mono-meta text-copper">
        {a.arrondissement} · {a.quartier}
      </span>
      <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
        {a.name} <span className="italic-display">{a.nameItalic}</span>
      </h3>
      <p className="text-slate mt-4 leading-relaxed">{a.baseline}</p>

      <div className="grid grid-cols-3 gap-4 mt-8 py-6 border-y border-hairline">
        <Stat label="Surface" value={a.surface} />
        <Stat label="Chambres" value={a.chambres} />
        <Stat label="SDB" value={a.sdb} />
        <Stat label="Étage" value={a.etage} small />
        <Stat label="Couchages" value={a.couchages} small />
        <Stat label="Min." value={a.minStay} small />
      </div>

      <div className="mt-7 flex items-end justify-between bg-ink text-cream p-5">
        <div>
          <span className="font-mono-meta text-cream/60">Loyer · charges incl.</span>
          <div className="font-display text-2xl mt-1">
            {a.loyer}
            <span className="text-cream/60 text-base"> / mois</span>
          </div>
        </div>
        <span className="font-mono-meta text-cream/60 text-right">
          De 1<br />à 12 mois
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-5 font-mono-meta text-slate">
          <span>Internet</span>
          <span className="text-hairline">·</span>
          <span>Ménage</span>
          <span className="text-hairline">·</span>
          <span>Linge</span>
        </div>
        <span className="font-mono-meta text-ink group-hover:text-copper transition-colors">
          Voir →
        </span>
      </div>
    </div>
  </Link>
);

const Stat = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div>
    <div className="font-mono-meta text-slate">{label}</div>
    <div className={`font-display mt-1 ${small ? "text-base" : "text-xl"}`}>{value}</div>
  </div>
);

export const Appartements = () => (
  <section id="appartements" className="bg-cream-soft text-ink py-16 md:py-20">
    <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
        <div>
          <span className="font-mono-meta text-copper">— La sélection</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05] max-w-2xl">
            Quatre adresses, <span className="italic-display">prêtes à vivre.</span>
          </h2>
        </div>
        <p className="text-slate max-w-sm">
          Chaque bien est inspecté, photographié et stylisé par notre équipe parisienne.
          Aucune annonce partenaire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {appartements.map((a, i) => (
          <Card key={a.slug} a={a} idx={i} />
        ))}
      </div>
    </div>
  </section>
);
