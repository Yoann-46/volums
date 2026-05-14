type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Volums brand mark — a square frame containing an arch (window / portal),
 * inspired by the original FlatAvenue mark and Volums' Parisian doorways aesthetic.
 */
export const LogoMark = ({ size = 28, className = "" }: LogoProps) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className={className}
    aria-hidden="true"
  >
    <rect x="1" y="1" width="46" height="46" />
    <path d="M14 38 V24 A10 10 0 0 1 34 24 V38" strokeLinecap="square" />
    <line x1="24" y1="14" x2="24" y2="38" strokeWidth="1.1" opacity="0.55" />
    <line x1="10" y1="38" x2="38" y2="38" />
  </svg>
);

export const Wordmark = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <LogoMark size={28} />
    <span className="font-display text-xl tracking-tight">
      Volums
    </span>
  </div>
);
