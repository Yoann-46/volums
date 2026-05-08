import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Logo";

const links = [
  { label: "Pourquoi", href: "#pourquoi" },
  { label: "Appartements", href: "#appartements" },
  { label: "Pour qui", href: "#pour-qui" },
  { label: "Promesse", href: "#promesse" },
  { label: "Contact", href: "#contact" },
];

export const Nav = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-5 md:py-6 flex items-center justify-between text-cream">
        <a href="#" aria-label="Volums — accueil">
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
        <a
          href="#contact"
          className="hidden md:inline-flex items-center gap-2 border border-cream/40 px-5 py-2.5 font-mono-meta text-cream hover:bg-cream hover:text-ink transition-colors"
        >
          Nous écrire
        </a>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="md:hidden w-10 h-10 flex items-center justify-center border border-cream/30"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-ink text-cream md:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <Wordmark />
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="w-10 h-10 flex items-center justify-center border border-cream/30"
            >
              <X className="w-5 h-5" />
            </button>
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
              Nous écrire
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
