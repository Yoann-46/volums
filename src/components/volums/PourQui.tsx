import { Briefcase, Home } from "lucide-react";

const audiences = [
  {
    tag: "Corporate",
    Icon: Briefcase,
    title: "Corporate & relocation",
    body: "Pour les équipes mobilité, RH et direction qui orchestrent l'arrivée de leurs cadres à Paris.",
    bullets: [
      "Cadres en mobilité internationale",
      "Missions longues de 1 à 12 mois",
      "Relocations de dernière minute",
      "Programmes annuels récurrents",
    ],
  },
  {
    tag: "Particuliers",
    Icon: Home,
    title: "Particuliers & familles",
    body: "Pour celles et ceux qui s'installent à Paris pour une saison, une année — ou le temps d'un projet.",
    bullets: [
      "Expatriés en arrivée à Paris",
      "Séjours prolongés ou sabbatiques",
      "Logement de transition",
      "Travaux ou rénovation de résidence",
    ],
  },
];

export const PourQui = () => (
  <section id="pour-qui" className="bg-cream text-ink py-24 md:py-32">
    <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
      <div className="mb-16">
        <span className="font-mono-meta text-copper">— Pour qui</span>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05] max-w-3xl">
          Deux clientèles, <span className="italic-display">une exigence.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink/15">
        {audiences.map(({ tag, Icon, title, body, bullets }) => (
          <div key={tag} className="py-12 md:py-0 md:px-12 first:md:pl-0 last:md:pr-0">
            <div className="flex items-center gap-5">
              <div className="inline-flex w-14 h-14 shrink-0 items-center justify-center border border-ink/40">
                <Icon className="w-6 h-6" strokeWidth={1.4} />
              </div>
              <span className="font-mono-meta text-copper">— {tag}</span>
            </div>
            <h3 className="font-display text-3xl md:text-4xl mt-10 leading-tight">{title}</h3>
            <p className="text-slate mt-5 max-w-md leading-relaxed text-lg">{body}</p>
            <ul className="mt-10 space-y-4">
              {bullets.map((b) => (
                <li key={b} className="flex gap-4 items-baseline">
                  <span aria-hidden className="text-copper">·</span>
                  <span className="font-display text-lg text-ink/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);
