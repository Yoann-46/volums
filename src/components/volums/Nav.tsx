import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Logo";
import { useLang } from "@/i18n/LangContext";
import { LangToggle } from "@/i18n/LangToggle";

// Un lien du menu : soit une section de l'accueil (scroll), soit une route.
type NavLink =
  | { label: string; kind: "section"; id: string }
  | { label: string; kind: "route"; to: string };

export const Nav = () => {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const links: NavLink[] = [
    { label: t("nav.pourquoi"), kind: "section", id: "pourquoi" },
    { label: t("nav.appartements"), kind: "route", to: "/appartements" },
    { label: t("nav.pourQui"), kind: "section", id: "pour-qui" },
    { label: t("nav.promesse"), kind: "section", id: "promesse" },
    { label: t("nav.contact"), kind: "section", id: "contact" },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Section : scroll si on est déjà sur l'accueil, sinon on navigue vers
  // l'accueil avec l'ancre (Index.tsx gère le scroll à l'arrivée).
  // Léger différé : laisse le drawer se refermer (le body retrouve son scroll,
  // bloqué par overflow:hidden tant que le menu est ouvert) avant de scroller.
  const goToSection = (id: string) => {
    setOpen(false);
    if (location.pathname === "/") {
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      }, 60);
    } else {
      navigate("/#" + id);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-ink/70 backdrop-blur-md border-b border-cream/10">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-4 flex items-center justify-between text-cream">
          <Link to="/" aria-label={t("nav.home")}>
            <Wordmark />
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {links.map((l) =>
              l.kind === "route" ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className="font-mono-meta text-cream/70 hover:text-cream transition-colors"
                >
                  {l.label}
                </Link>
              ) : (
                <button
                  key={l.label}
                  onClick={() => goToSection(l.id)}
                  className="font-mono-meta text-cream/70 hover:text-cream transition-colors"
                >
                  {l.label}
                </button>
              ),
            )}
          </nav>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => goToSection("contact")}
              className="inline-flex items-center gap-2 border border-cream/40 px-5 py-2.5 rounded-xl font-mono-meta text-cream hover:bg-cream hover:text-ink transition-colors"
            >
              {t("nav.contactCta")}
            </button>
            <LangToggle variant="cream" />
          </div>

          {/* Mobile right-side: lang + burger */}
          <div className="md:hidden flex items-center gap-3">
            <LangToggle variant="cream" />
            <button
              onClick={() => setOpen(true)}
              aria-label={t("nav.openMenu")}
              className="w-10 h-10 flex items-center justify-center border border-cream/30 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — rendu hors du <header> : son backdrop-blur crée un
          bloc conteneur qui casserait le positionnement « fixed » du drawer
          (menu sans fond sur iOS Safari). */}
      {open && (
        <div className="fixed inset-0 z-50 bg-ink text-cream md:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <Wordmark />
            <div className="flex items-center gap-3">
              <LangToggle variant="cream" />
              <button
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="w-10 h-10 flex items-center justify-center border border-cream/30 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 flex flex-col px-6 pt-6 gap-1">
            {links.map((l) =>
              l.kind === "route" ? (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl py-4 border-b border-cream/15 text-left"
                >
                  {l.label}
                </Link>
              ) : (
                <button
                  key={l.label}
                  onClick={() => goToSection(l.id)}
                  className="font-display text-3xl py-4 border-b border-cream/15 text-left"
                >
                  {l.label}
                </button>
              ),
            )}
          </nav>
          <div className="p-6">
            <button
              onClick={() => goToSection("contact")}
              className="block w-full text-center bg-cream text-ink py-4 rounded-xl font-mono-meta"
            >
              {t("nav.contactCta")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
