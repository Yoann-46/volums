const promises = [
  {
    n: "01",
    tag: "Flexible",
    title: "Sans",
    titleItalic: "engagement",
    body: "Pas de bail longue durée. Vous restez un mois, six mois, douze. Les conditions s'adaptent à votre durée.",
  },
  {
    n: "02",
    tag: "Clé en main",
    title: "Un",
    titleItalic: "seul contact",
    body: "Un interlocuteur unique du premier message à la remise des clés. Appartement prêt à vivre dès l'arrivée.",
  },
  {
    n: "03",
    tag: "Sélectionné",
    title: "Visité &",
    titleItalic: "validé",
    body: "Chaque bien est inspecté, photographié et stylisé par notre équipe parisienne. Aucune annonce partenaire.",
  },
  {
    n: "04",
    tag: "Réactif",
    title: "Disponible",
    titleItalic: "sous 48 h",
    body: "De la première demande à la sélection de trois appartements shortlistés : 48 heures.",
  },
];

export const Promesse = () => (
  <section id="promesse" className="bg-ink text-cream py-24 md:py-32">
    <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
      <span className="font-mono-meta text-copper">— Notre promesse</span>
      <h2 className="font-display text-4xl md:text-6xl lg:text-7xl mt-6 leading-[1.02] max-w-5xl">
        Quatre raisons de nous confier{" "}
        <span className="italic-display">votre séjour</span> parisien.
      </h2>

      <div className="hairline mt-16 bg-cream/15" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 md:gap-y-20 md:gap-x-16 mt-16">
        {promises.map((p, i) => (
          <div
            key={p.n}
            className={`${i % 2 === 0 ? "md:pr-12 md:border-r md:border-cream/15" : ""}`}
          >
            <span className="font-mono-meta text-copper">
              — {p.n} · {p.tag}
            </span>
            <h3 className="font-display text-3xl md:text-4xl mt-6 leading-tight">
              {p.title} <span className="italic-display">{p.titleItalic}</span>
            </h3>
            <p className="text-cream/60 mt-5 max-w-md leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
