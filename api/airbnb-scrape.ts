// Vercel Edge function — récupère les données d'une annonce Airbnb via leur API interne.
// POST { url: string }
// → { title, description, bedrooms, bathrooms, maxGuests, surface, neighborhood, photos }
//
// On utilise l'API v2 d'Airbnb (clé publique embarquée dans leur bundle JS).
// Plus fiable que le scraping HTML qui est bloqué par Cloudflare depuis les IPs cloud.

export const config = { runtime: "edge" };

// Clé API publique Airbnb (visible dans leur bundle JS, inchangée depuis des années)
const AIRBNB_API_KEY = "d306zoyjsyarp7uygyw5bd3aeq";

type AirbnbResult = {
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surface: string;
  neighborhood: string;
  photos: string[];
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Extrait l'ID numérique de l'annonce depuis une URL Airbnb. */
function extractListingId(rawUrl: string): string | null {
  // https://www.airbnb.fr/rooms/1234567 → "1234567"
  const m = rawUrl.match(/\/rooms\/(\d+)/);
  return m ? m[1] : null;
}

/** Cherche récursivement la première valeur associée à une clé. */
function findByKey(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findByKey(item, key);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (key in rec) return rec[key];
  for (const v of Object.values(rec)) {
    const r = findByKey(v, key);
    if (r !== undefined) return r;
  }
  return undefined;
}

/** Extrait récursivement toutes les URLs de photos muscache dans un objet JSON. */
function collectPhotoUrls(obj: unknown, found: Set<string> = new Set()): Set<string> {
  if (typeof obj === "string") {
    if (obj.includes("muscache.com") && obj.includes("/pictures/")) {
      found.add(obj.split("?")[0]);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => collectPhotoUrls(v, found));
  } else if (obj && typeof obj === "object") {
    Object.values(obj as Record<string, unknown>).forEach((v) =>
      collectPhotoUrls(v, found),
    );
  }
  return found;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // ── Parse body ──────────────────────────────────────────────────────────
  let listingId: string;
  try {
    const body = (await req.json()) as { url?: string };
    let rawUrl = (body.url ?? "").trim();
    if (!rawUrl) throw new Error("URL manquante");
    if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;

    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("airbnb"))
      throw new Error("URL Airbnb invalide (domaine non reconnu)");

    const id = extractListingId(rawUrl);
    if (!id) throw new Error("Impossible d'extraire l'ID de l'annonce depuis l'URL");
    listingId = id;
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "URL invalide" }, 400);
  }

  // ── Appel API Airbnb v2 ─────────────────────────────────────────────────
  // Endpoint utilisé par le site Airbnb lui-même (clé API publique dans leur bundle JS).
  const apiUrl =
    `https://www.airbnb.com/api/v2/pdp_listing_details` +
    `?id=${listingId}` +
    `&_format=for_rooms_show` +
    `&key=${AIRBNB_API_KEY}`;

  let apiData: Record<string, unknown>;
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "application/json",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "X-Airbnb-API-Key": AIRBNB_API_KEY,
        Referer: `https://www.airbnb.com/rooms/${listingId}`,
      },
      redirect: "follow",
    });

    if (res.status === 403 || res.status === 401) {
      return json(
        { error: "Airbnb a refusé l'accès à l'API. L'annonce est peut-être privée ou supprimée." },
        502,
      );
    }
    if (res.status === 404) {
      return json({ error: `Annonce introuvable (ID: ${listingId})` }, 404);
    }
    if (!res.ok) {
      return json({ error: `Airbnb API a répondu ${res.status}` }, 502);
    }

    apiData = (await res.json()) as Record<string, unknown>;
  } catch (e) {
    return json(
      { error: `Erreur API Airbnb : ${e instanceof Error ? e.message : "inconnue"}` },
      502,
    );
  }

  // ── Extraction des données ──────────────────────────────────────────────
  const listing = (
    (apiData.pdp_listing_detail as Record<string, unknown>) ?? apiData
  ) as Record<string, unknown>;

  const result: AirbnbResult = {
    title: "",
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    maxGuests: 0,
    surface: "",
    neighborhood: "",
    photos: [],
  };

  // Titre
  result.title =
    (listing.name as string) ??
    (findByKey(apiData, "name") as string) ??
    "";

  // Description (plusieurs champs possibles selon la version)
  result.description =
    (listing.summary as string) ||
    (listing.description as string) ||
    ((findByKey(apiData, "summary") as string) ?? "") ||
    ((findByKey(apiData, "description") as string) ?? "");

  // Chiffres clés
  const bedrooms = listing.bedrooms ?? findByKey(apiData, "bedrooms");
  if (typeof bedrooms === "number") result.bedrooms = Math.round(bedrooms);

  const bathrooms = listing.bathrooms ?? findByKey(apiData, "bathrooms");
  if (typeof bathrooms === "number") result.bathrooms = Math.ceil(bathrooms);

  const capacity =
    listing.person_capacity ??
    listing.personCapacity ??
    findByKey(apiData, "person_capacity") ??
    findByKey(apiData, "personCapacity");
  if (typeof capacity === "number") result.maxGuests = capacity;

  // Surface (rarement disponible sur Airbnb)
  const sqft =
    listing.square_feet ?? listing.squareFeet ?? findByKey(apiData, "square_feet");
  if (typeof sqft === "number" && sqft > 0) {
    result.surface = `${Math.round(sqft * 0.0929)} m²`;
  }

  // Localisation
  const neighborhood =
    (listing.neighborhood_overview as string) ||
    (listing.city as string) ||
    (listing.public_address as string) ||
    ((findByKey(apiData, "city") as string) ?? "");
  result.neighborhood = neighborhood;

  // Photos — l'API retourne un tableau `photos` avec `large`, `xx_large`, etc.
  const rawPhotos =
    (listing.photos as unknown[]) ??
    (findByKey(apiData, "photos") as unknown[]) ??
    [];

  if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
    const seen = new Set<string>();
    for (const p of rawPhotos) {
      if (!p || typeof p !== "object") continue;
      const photo = p as Record<string, unknown>;
      // Priorité : xx_large > x_large > large > picture
      const url =
        (photo.xx_large as string) ||
        (photo.x_large as string) ||
        (photo.large as string) ||
        (photo.picture as string) ||
        (photo.url as string) ||
        "";
      if (url && !seen.has(url)) {
        seen.add(url);
        result.photos.push(url);
      }
    }
  }

  // Fallback : chercher les URLs muscache partout dans la réponse
  if (result.photos.length === 0) {
    const found = collectPhotoUrls(apiData);
    result.photos = [...found].map((u) => u + "?aki_policy=xx_large");
  }

  return json(result);
}
