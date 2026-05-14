import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Logo";
import { useLang } from "@/i18n/LangContext";
import { LangToggle } from "@/i18n/LangToggle";

export const Nav = () => {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  const links = [
    { label: t("nav.pourquoi"), href: "#pourquoi" },
    { label: t("nav.appartements"), href: "#appartements" },
    { label: t("nav.pourQui"), href: "#pour-qui" },
    { label: t("nav.promesse"), href: "#promesse" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-ink/70 backdrop-blur-md border-b border-cream/10">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-4 flex items-center justify-between text-cream">
        <a href="#" aria-label={t("nav.home")}>
          <Wordmark />
        </a>
        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono-meta text-cream/70 hover:text-cream transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 border border-cream/40 px-5 py-2.5 font-mono-meta text-cream hover:bg-cream hover:text-ink transition-colors"
          >
            {t("nav.contactCta")}
          </a>
          <LangToggle variant="cream" />
        </div>

        {/* Mobile right-side: lang + burger */}
        <div className="md:hidden flex items-center gap-3">
          <LangToggle variant="cream" />
          <button
            onClick={() => setOpen(true)}
            aria-label={t("nav.openMenu")}
            className="w-10 h-10 flex items-center justify-center border border-cream/30"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-ink text-cream md:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <Wordmark />
            <div className="flex items-center gap-3">
              <LangToggle variant="cream" />
              <button
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="w-10 h-10 flex items-center justify-center border border-cream/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 flex flex-col px-6 pt-6 gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-3xl py-4 border-b border-cream/15"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="p-6">
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="block text-center bg-cream text-ink py-4 font-mono-meta"
            >
              {t("nav.contactCta")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
