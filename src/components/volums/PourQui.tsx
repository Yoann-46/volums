import { Briefcase, Home } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

export const PourQui = () => {
  const { t } = useLang();
  const audiences = [
    {
      tag: t("pourqui.corp.tag"),
      Icon: Briefcase,
      title: t("pourqui.corp.title"),
      body: t("pourqui.corp.body"),
      bullets: [
        t("pourqui.corp.b1"),
        t("pourqui.corp.b2"),
        t("pourqui.corp.b3"),
        t("pourqui.corp.b4"),
      ],
    },
    {
      tag: t("pourqui.fam.tag"),
      Icon: Home,
      title: t("pourqui.fam.title"),
      body: t("pourqui.fam.body"),
      bullets: [
        t("pourqui.fam.b1"),
        t("pourqui.fam.b2"),
        t("pourqui.fam.b3"),
        t("pourqui.fam.b4"),
      ],
    },
  ];

  return (
    <section id="pour-qui" className="bg-cream text-ink py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="mb-16">
          <span className="font-mono-meta text-copper">{t("pourqui.eyebrow")}</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-[1.05] max-w-3xl">
            {t("pourqui.title.l1")} <span className="italic-display">{t("pourqui.title.l2")}</span>
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
};
