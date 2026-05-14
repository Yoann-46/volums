import { useLang } from "@/i18n/LangContext";

export const Pourquoi = () => {
  const { t } = useLang();
  const points = [
    { n: "01", title: t("pourquoi.p1.title"), body: t("pourquoi.p1.body") },
    { n: "02", title: t("pourquoi.p2.title"), body: t("pourquoi.p2.body") },
    { n: "03", title: t("pourquoi.p3.title"), body: t("pourquoi.p3.body") },
  ];

  return (
    <section id="pourquoi" className="bg-cream text-ink py-24 md:py-28 md:pb-16">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <span className="font-mono-meta text-copper">{t("pourquoi.eyebrow")}</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05]">
              {t("pourquoi.title.l1")}
              <br />
              <span className="italic-display">{t("pourquoi.title.l2")}</span>
            </h2>
            <p className="italic-display text-slate text-lg mt-8 max-w-md">
              {t("pourquoi.subtitle")}
            </p>
          </div>

          <div className="lg:col-span-7 lg:pl-12 lg:border-l border-ink/15">
            <ul className="space-y-12">
              {points.map((p) => (
                <li key={p.n}>
                  <div className="flex items-baseline gap-6">
                    <span className="font-display text-2xl text-copper">{p.n}</span>
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl">{p.title}</h3>
                      <p className="text-slate mt-3 max-w-lg leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                  <div className="hairline mt-12" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
