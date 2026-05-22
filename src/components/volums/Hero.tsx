import heroImg from "@/assets/hero-beaumarchais.jpg";
import { useLang } from "@/i18n/LangContext";

export const Hero = () => {
  const { t } = useLang();
  return (
    <section className="relative bg-ink text-cream min-h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 pt-32 lg:pt-0">
        {/* Left — editorial copy */}
        <div className="flex flex-col justify-between px-6 md:px-12 lg:px-16 py-12 lg:py-24">
          <div className="lg:mt-24">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1.02] tracking-tight">
              {t("hero.title.l1")}
              <br />
              <span className="italic-display">{t("hero.title.l2")}</span>
            </h1>
            <p className="mt-10 max-w-md text-copper font-display text-lg lg:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <a
                href="#appartements"
                className="inline-flex items-center gap-3 bg-cream text-ink px-7 py-4 rounded-xl font-mono-meta hover:bg-copper hover:text-cream transition-colors"
              >
                {t("hero.ctaList")}
                <span aria-hidden>→</span>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-3 border border-cream/40 text-cream px-7 py-4 rounded-xl font-mono-meta hover:bg-cream hover:text-ink transition-colors"
              >
                {t("hero.ctaContact")}
              </a>
            </div>
          </div>
        </div>

        {/* Right — image */}
        <div className="relative min-h-[60vh] lg:min-h-screen overflow-hidden">
          <img
            src={heroImg}
            alt="Salon haussmannien lumineux à Paris meublé par Volums"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10">
            <span className="italic-display text-cream text-sm lg:text-base drop-shadow-lg">
              {t("hero.imgCaption")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
