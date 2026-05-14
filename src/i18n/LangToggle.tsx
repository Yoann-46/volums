import { useLang } from "./LangContext";

type Props = {
  /** Couleur du texte par défaut/actif. "cream" pour fond sombre (home/promesse), "ink" pour fond clair (pages détail / liste). */
  variant?: "cream" | "ink";
  className?: string;
};

export const LangToggle = ({ variant = "cream", className = "" }: Props) => {
  const { lang, setLang, t } = useLang();

  const isCream = variant === "cream";
  const activeCls = isCream ? "text-cream" : "text-ink";
  const idleCls = isCream ? "text-cream/50 hover:text-cream" : "text-slate hover:text-ink";
  const sepCls = isCream ? "text-cream/30" : "text-hairline";

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono-meta text-xs ${className}`}
      role="group"
      aria-label={t("lang.switchTo")}
    >
      <button
        type="button"
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={`transition-colors ${lang === "fr" ? activeCls : idleCls}`}
      >
        FR
      </button>
      <span className={sepCls} aria-hidden>
        /
      </span>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`transition-colors ${lang === "en" ? activeCls : idleCls}`}
      >
        EN
      </button>
    </div>
  );
};
