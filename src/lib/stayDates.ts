// Formatage des périodes de séjour (tarification "stay").
// Parse les dates ISO (YYYY-MM-DD) en UTC pour éviter tout décalage de fuseau.

type Lang = "fr" | "en";

const parseUTC = (iso: string): Date | null => {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d));
};

const dayNum = (d: Date) => d.getUTCDate();
const monthShort = (d: Date, lang: Lang) =>
  d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    timeZone: "UTC",
  });
const year = (d: Date) => d.getUTCFullYear();

/**
 * Période de séjour, forme longue — pour le bloc prix.
 * FR : "du 9 au 14 juil. 2026" · "du 30 juin au 5 juil. 2026" · "du 28 déc. 2026 au 3 janv. 2027"
 * EN : "Jul 9–14, 2026" · "Jun 30 – Jul 5, 2026" · "Dec 28, 2026 – Jan 3, 2027"
 */
export const formatStayPeriod = (
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  lang: Lang = "fr",
): string => {
  if (!startIso || !endIso) return "";
  const s = parseUTC(startIso);
  const e = parseUTC(endIso);
  if (!s || !e) return "";

  const sameMonth = year(s) === year(e) && s.getUTCMonth() === e.getUTCMonth();
  const sameYear = year(s) === year(e);

  if (lang === "fr") {
    if (sameMonth) return `du ${dayNum(s)} au ${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
    if (sameYear)
      return `du ${dayNum(s)} ${monthShort(s, "fr")} au ${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
    return `du ${dayNum(s)} ${monthShort(s, "fr")} ${year(s)} au ${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
  }

  // EN
  if (sameMonth) return `${monthShort(s, "en")} ${dayNum(s)}–${dayNum(e)}, ${year(e)}`;
  if (sameYear)
    return `${monthShort(s, "en")} ${dayNum(s)} – ${monthShort(e, "en")} ${dayNum(e)}, ${year(e)}`;
  return `${monthShort(s, "en")} ${dayNum(s)}, ${year(s)} – ${monthShort(e, "en")} ${dayNum(e)}, ${year(e)}`;
};

/**
 * Période de séjour, forme courte — pour la pastille "Dispo" de la carte.
 * FR : "9–14 juil. 2026" · "30 juin–5 juil. 2026" · "28 déc. 2026 – 3 janv. 2027"
 * EN : identique à la forme longue (déjà compacte).
 */
export const formatStayPeriodShort = (
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  lang: Lang = "fr",
): string => {
  if (!startIso || !endIso) return "";
  const s = parseUTC(startIso);
  const e = parseUTC(endIso);
  if (!s || !e) return "";

  if (lang === "en") return formatStayPeriod(startIso, endIso, "en");

  const sameMonth = year(s) === year(e) && s.getUTCMonth() === e.getUTCMonth();
  const sameYear = year(s) === year(e);
  if (sameMonth) return `${dayNum(s)}–${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
  if (sameYear)
    return `${dayNum(s)} ${monthShort(s, "fr")}–${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
  return `${dayNum(s)} ${monthShort(s, "fr")} ${year(s)} – ${dayNum(e)} ${monthShort(e, "fr")} ${year(e)}`;
};
