import bedroomImg from "@/assets/appt-bedroom.jpg";
import { LogoMark } from "./Logo";

const fields = [
  { label: "Email", value: "hello@volums.fr", href: "mailto:hello@volums.fr" },
  { label: "Téléphone", value: "+33 6 XX XX XX XX", href: "tel:+33600000000" },
  { label: "Bureau", value: "12 rue de Varenne · 75007 Paris" },
  { label: "Web", value: "www.volums.fr" },
];

export const Contact = () => (
  <section id="contact" className="bg-cream text-ink">
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <div className="relative min-h-[50vh] lg:min-h-[80vh] order-2 lg:order-1">
        <img
          src={bedroomImg}
          alt="Chambre principale d'un appartement Volums"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-6 left-6 italic-display text-cream drop-shadow-lg">
          Rue de la Pompe, Paris 16ème
        </div>
      </div>

      <div className="order-1 lg:order-2 px-6 md:px-12 lg:px-16 py-20 lg:py-32 flex flex-col justify-center">
        <span className="font-mono-meta text-copper">— Prochaine étape</span>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05]">
          L'appartement dont vous rêvez est{" "}
          <span className="italic-display">peut-être</span> disponible.
        </h2>

        <div className="hairline mt-12" />

        <dl className="mt-12 space-y-7">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8">
              <dt className="font-mono-meta text-slate sm:w-32">{f.label}</dt>
              <dd className="font-display text-xl">
                {f.href ? (
                  <a href={f.href} className="hover:text-copper transition-colors">
                    {f.value}
                  </a>
                ) : (
                  f.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <a
          href="mailto:hello@volums.fr"
          className="mt-12 inline-flex items-center gap-3 bg-ink text-cream px-7 py-4 font-mono-meta hover:bg-copper transition-colors w-fit"
        >
          Demander une sélection
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>

    <footer className="border-t border-ink/15">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <LogoMark size={22} />
          <span className="font-display text-lg">
            Vol<span className="italic-display">u</span>ms
          </span>
        </div>
        <span className="font-mono-meta text-slate">
          © 2026 Volums · Paris · Tous droits réservés
        </span>
      </div>
    </footer>
  </section>
);
