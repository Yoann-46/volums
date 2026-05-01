import { Wordmark } from "./Logo";

const links = [
  { label: "Pourquoi", href: "#pourquoi" },
  { label: "Appartements", href: "#appartements" },
  { label: "Pour qui", href: "#pour-qui" },
  { label: "Promesse", href: "#promesse" },
  { label: "Contact", href: "#contact" },
];

export const Nav = () => (
  <header className="absolute top-0 left-0 right-0 z-30">
    <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-6 flex items-center justify-between text-cream">
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
    </div>
  </header>
);
