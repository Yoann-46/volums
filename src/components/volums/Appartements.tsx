import beaumarchais from "@/assets/appt-beaumarchais.jpg";
import lenoirT5 from "@/assets/appt-richard-lenoir-t5.jpg";
import duplex from "@/assets/appt-duplex.jpg";
import t2 from "@/assets/appt-t2.jpg";

type Appt = {
  ref: string;
  dispo: string;
  arrondissement: string;
  quartier: string;
  name: string;
  nameItalic: string;
  baseline: string;
  surface: string;
  chambres: string;
  sdb: string;
  etage: string;
  couchages: string;
  loyer: string;
  image: string;
};

const apts: Appt[] = [
  {
    ref: "4 BEAUMAR 1",
    dispo: "04 MAI 2026",
    arrondissement: "11ᵉ Arrondissement",
    quartier: "Bastille",
    name: "Appt",
    nameItalic: "Beaumarchais",
    baseline: "T4 haussmannien de 105 m² tout équipé, boulevard Beaumarchais.",
    surface: "105 m²",
    chambres: "3",
    sdb: "2",
    etage: "1ᵉʳ · ascenseur",
    couchages: "6 personnes",
    loyer: "7 500 €",
    image: beaumarchais,
  },
  {
    ref: "3R LENOIR 2R",
    dispo: "29 AVRIL 2026",
    arrondissement: "11ᵉ Arrondissement",
    quartier: "Richard Lenoir",
    name: "Appt",
    nameItalic: "Richard Lenoir",
    baseline: "T5 haussmannien de 147 m² alliant ancien et design contemporain.",
    surface: "147 m²",
    chambres: "4",
    sdb: "3",
    etage: "3ᵉ · ascenseur",
    couchages: "10 personnes",
    loyer: "8 500 €",
    image: lenoirT5,
  },
  {
    ref: "11 BEAUMAR 5L",
    dispo: "29 AVRIL 2026",
    arrondissement: "4ᵉ Arrondissement",
    quartier: "Marais",
    name: "Duplex",
    nameItalic: "Beaumarchais",
    baseline: "Duplex contemporain de 80 m² sous verrière, design minimaliste.",
    surface: "80 m²",
    chambres: "2",
    sdb: "2",
    etage: "5ᵉ · ascenseur",
    couchages: "6 personnes",
    loyer: "7 500 €",
    image: duplex,
  },
  {
    ref: "11 BEAUMAR 2R",
    dispo: "29 AVRIL 2026",
    arrondissement: "4ᵉ Arrondissement",
    quartier: "Marais",
    name: "Pied-à-terre",
    nameItalic: "Beaumarchais",
    baseline: "T2 chic et chaleureux de 45 m², finitions haut de gamme.",
    surface: "45 m²",
    chambres: "1",
    sdb: "1",
    etage: "2ᵉ · ascenseur",
    couchages: "4 personnes",
    loyer: "3 200 €",
    image: t2,
  },
];

const Card = ({ a, idx }: { a: Appt; idx: number }) => (
  <article className="group lift bg-cream-soft border border-hairline">
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
        <Stat label="Min." value="30 nuits" small />
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

      <div className="mt-6 flex items-center gap-5 font-mono-meta text-slate">
        <span>Internet</span>
        <span className="text-hairline">·</span>
        <span>Ménage hebdo</span>
        <span className="text-hairline">·</span>
        <span>Linge inclus</span>
      </div>
    </div>
  </article>
);

const Stat = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div>
    <div className="font-mono-meta text-slate">{label}</div>
    <div className={`font-display mt-1 ${small ? "text-base" : "text-xl"}`}>{value}</div>
  </div>
);

export const Appartements = () => (
  <section id="appartements" className="bg-cream-soft text-ink py-24 md:py-32">
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
        {apts.map((a, i) => (
          <Card key={a.ref} a={a} idx={i} />
        ))}
      </div>
    </div>
  </section>
);
