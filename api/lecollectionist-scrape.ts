// Vercel Edge function — récupère les données d'une annonce Le Collectionist.
// POST { url: string }
// → { title, description, bedrooms, bathrooms, maxGuests, surface, neighborhood,
//     latitude, longitude, photos }
//
// Stratégie (testée sur de vraies annonces) :
//   Le Collectionist est un site Nuxt adossé à une API publique JSON:API
//   (prod-michelangelo.herokuapp.com). Pas de blocage Cloudflare : on interroge
//   l'API directement, bien plus fiable que de scraper le HTML.
//     1) GET /houses/<slug>?locale=fr      → infos (nom, description, ch/sdb/voy,
//                                            surface, GPS, destinationId, id num.)
//     2) GET /houses/<idNumérique>/photos  → photos ordonnées (l'endpoint exige
//                                            l'id numérique, pas le slug)
//     3) GET /destinations/<id>?locale=fr  → nom de la ville
//
//   Le Collectionist ne catégorise pas les photos par pièce → room = null
//   (l'utilisateur classera dans le PhotoManager).

export const config = { runtime: "edge" };

const API = "https://prod-michelangelo.herokuapp.com/api/v1";
// Base CDN pour les URLs de photos renvoyées en chemin relatif (anciennes annonces).
const CDN_BASE = "https://cdn.lecollectionist.com/__collectionist__/";

type ScrapedPhoto = { url: string; room: string | null; roomIndex: number | null };

type Result = {
  title: string;
  description: string;
  descriptionEn: string; // anglais natif fourni par Le Collectionist
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surface: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  photos: ScrapedPhoto[];
};

/** Assemble accroche + description détaillée d'une fiche en un seul texte. */
function buildDescription(attr: any): string {
  const lead = (attr?.leadText ?? "").trim();
  const desc = (attr?.description ?? "").trim();
  return [lead, desc].filter(Boolean).join("\n\n");
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Extrait le slug de l'annonce depuis l'URL (gère /fr|/en, /photos, query). */
function extractSlug(url: string): string | null {
  const m = url.match(/location-luxe\/([^/?#]+)/i);
  return m ? m[1] : null;
}

/** Parse une valeur numérique (l'API renvoie parfois des nombres en chaîne). */
function numOrNull(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Construit l'URL CDN complète d'une photo (chemin relatif OU déjà absolu). */
function photoUrl(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return CDN_BASE + raw.replace(/^\/+/, "");
}

async function apiGet(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json", "Accept-Language": "fr" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return jsonResp({ error: "Méthode non autorisée" }, 405);

  // ── Parse body → slug ─────────────────────────────────────────────────────
  let slug: string;
  try {
    const body = (await req.json()) as { url?: string };
    let rawUrl = (body.url ?? "").trim();
    if (!rawUrl) throw new Error("URL manquante");
    if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("lecollectionist"))
      throw new Error("URL Le Collectionist invalide (domaine non reconnu)");
    const s = extractSlug(parsed.pathname);
    if (!s) throw new Error("Impossible d'extraire l'annonce depuis l'URL");
    slug = s;
  } catch (e) {
    return jsonResp({ error: e instanceof Error ? e.message : "URL invalide" }, 400);
  }

  // ── 1) Fiche de l'annonce ─────────────────────────────────────────────────
  const house = await apiGet(`/houses/${encodeURIComponent(slug)}?locale=fr`);
  const attr = house?.data?.attributes;
  const numericId = house?.data?.id;
  if (!attr || !numericId) {
    return jsonResp(
      { error: "Annonce introuvable sur Le Collectionist (vérifie l'URL)." },
      502,
    );
  }

  const result: Result = {
    title: attr.name ?? "",
    description: "",
    descriptionEn: "",
    bedrooms: Number(attr.bedrooms) || 0,
    bathrooms: Number(attr.bathrooms) || 0,
    maxGuests: Number(attr.capacity) || 0,
    surface: attr.surface ? `${attr.surface} m²` : "",
    neighborhood: "",
    // L'API renvoie les coordonnées en chaînes → on parse en nombre.
    latitude: numOrNull(attr.gpslatitude),
    longitude: numOrNull(attr.gpslongitude),
    photos: [],
  };

  // Description FR : leadText (accroche) + description détaillée si présents.
  result.description = buildDescription(attr);

  // Description EN native : on re-interroge par ID numérique sans locale
  // (anglais par défaut) → vraie traduction pro, sans service tiers. On utilise
  // l'ID (pas le slug) car le slug diffère selon la langue.
  const houseEn = await apiGet(`/houses/${numericId}`);
  result.descriptionEn = buildDescription(houseEn?.data?.attributes);

  // ── 2) Ville (destination) ────────────────────────────────────────────────
  if (attr.destinationId) {
    const dest = await apiGet(`/destinations/${attr.destinationId}?locale=fr`);
    const name = dest?.data?.attributes?.name;
    if (name) result.neighborhood = name;
  }

  // ── 3) Photos (ordonnées par position, hors photos masquées) ──────────────
  const photosResp = await apiGet(`/houses/${numericId}/photos`);
  const photoList: any[] = Array.isArray(photosResp?.data) ? photosResp.data : [];
  photoList
    .filter((p) => p?.attributes && !p.attributes.hidden && p.attributes.url)
    .sort(
      (a, b) => (a.attributes.position ?? 0) - (b.attributes.position ?? 0),
    )
    .forEach((p) =>
      result.photos.push({
        url: photoUrl(p.attributes.url),
        room: null,
        roomIndex: null,
      }),
    );

  if (!result.title && result.photos.length === 0) {
    return jsonResp(
      { error: "Aucune donnée extraite. L'annonce est peut-être indisponible." },
      502,
    );
  }

  return jsonResp(result);
}
