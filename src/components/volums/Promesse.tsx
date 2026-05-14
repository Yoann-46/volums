import { useLang } from "@/i18n/LangContext";

export const Promesse = () => {
  const { t } = useLang();
  const promises = [
    {
      n: "01",
      tag: t("promesse.p1.tag"),
      title: t("promesse.p1.title"),
      titleItalic: t("promesse.p1.titleIt"),
      body: t("promesse.p1.body"),
    },
    {
      n: "02",
      tag: t("promesse.p2.tag"),
      title: t("promesse.p2.title"),
      titleItalic: t("promesse.p2.titleIt"),
      body: t("promesse.p2.body"),
    },
    {
      n: "03",
      tag: t("promesse.p3.tag"),
      title: t("promesse.p3.title"),
      titleItalic: t("promesse.p3.titleIt"),
      body: t("promesse.p3.body"),
    },
    {
      n: "04",
      tag: t("promesse.p4.tag"),
      title: t("promesse.p4.title"),
      titleItalic: t("promesse.p4.titleIt"),
      body: t("promesse.p4.body"),
    },
  ];

  return (
    <section id="promesse" className="bg-ink text-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <span className="font-mono-meta text-copper">{t("promesse.eyebrow")}</span>
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl mt-6 leading-[1.02] max-w-5xl">
          {t("promesse.title.l1")}{" "}
          <span className="italic-display">{t("promesse.title.l2")}</span>{" "}
          {t("promesse.title.l3")}
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
};
