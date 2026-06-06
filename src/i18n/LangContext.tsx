import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

export type Lang = "fr" | "en";

const STORAGE_KEY = "volums.lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LangContext = createContext<Ctx | null>(null);

const readInitial = (): Lang => {
  // Langue par défaut : EN (audience internationale). Une préférence déjà
  // enregistrée par le visiteur (toggle FR/EN) reste prioritaire.
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") return stored;
  return "en";
};

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore quota / private-mode errors
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: setLangState,
      t: (key) => {
        const dict = translations[lang] as Record<string, string>;
        const fallback = translations.fr as Record<string, string>;
        return dict[key] ?? fallback[key] ?? key;
      },
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
};

/** Pick an EN value if available, otherwise fall back to FR. */
export function pickI18n<T>(lang: Lang, fr: T, en: T | null | undefined): T {
  if (lang === "en" && en !== null && en !== undefined) {
    if (typeof en === "string" && en.trim() === "") return fr;
    if (Array.isArray(en) && en.length === 0) return fr;
    return en;
  }
  return fr;
}
