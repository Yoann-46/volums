import bedroomImg from "@/assets/appt-bedroom.jpg";
import { LogoMark } from "./Logo";
import { useLang } from "@/i18n/LangContext";

export const Contact = () => {
  const { t } = useLang();
  const fields = [
    { label: t("contact.email"), value: "hello@volums.fr", href: "mailto:hello@volums.fr" },
    { label: t("contact.phone"), value: "+33 6 35 34 79 90", href: "tel:+33635347990" },
    { label: t("contact.office"), value: t("contact.officeValue") },
    { label: t("contact.web"), value: "www.volums.fr" },
  ];

  return (
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
            {t("contact.imgCaption")}
          </div>
        </div>

        <div className="order-1 lg:order-2 px-6 md:px-12 lg:px-16 py-20 lg:py-32 flex flex-col justify-center">
          <span className="font-mono-meta text-copper">{t("contact.eyebrow")}</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05]">
            {t("contact.title.l1")}{" "}
            <span className="italic-display">{t("contact.title.l2")}</span>{" "}
            {t("contact.title.l3")}
          </h2>

          <div className="hairline mt-12" />

          <dl className="mt-12 space-y-7">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8"
              >
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
            {t("contact.cta")}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <footer className="border-t border-ink/15">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark size={22} />
            <span className="font-display text-lg">
              Volums
            </span>
          </div>
          <span className="font-mono-meta text-slate">{t("contact.copyright")}</span>
        </div>
      </footer>
    </section>
  );
};
