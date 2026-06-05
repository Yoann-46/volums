// Vercel Edge function — récupère les données d'une annonce Airbnb.
// POST { url: string }
// → { title, description, bedrooms, bathrooms, maxGuests, surface, neighborhood, photos }
//
// Stratégie :
// 1. API v2 Airbnb (rapide, fonctionne pour les anciens IDs courts ~8 chiffres)
// 2. Jina.ai Reader (r.jina.ai) en fallback — service public qui rend la page avec un
//    vrai navigateur headless et retourne contenu + images, sans se faire bloquer.

export const config = { runtime: "edge" };

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

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function extractListingId(url: string): string | null {
  const m = url.match(/\/rooms\/(\d+)/);
  return m ? m[1] : null;
}

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

// ─── Stratégie 1 : API Airbnb v2 ─────────────────────────────────────────────

async function tryAirbnbV2Api(listingId: string): Promise<AirbnbResult | null> {
  const url =
    `https://www.airbnb.com/api/v2/pdp_listing_details` +
    `?id=${listingId}&_format=for_rooms_show&key=${AIRBNB_API_KEY}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "application/json",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "X-Airbnb-API-Key": AIRBNB_API_KEY,
        Referer: `https://www.airbnb.com/rooms/${listingId}`,
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const listing = ((data.pdp_listing_detail as Record<string, unknown>) ??
      data) as Record<string, unknown>;

    const result: AirbnbResult = {
      title: (listing.name as string) ?? "",
      description:
        (listing.summary as string) || (listing.description as string) || "",
      bedrooms: 0,
      bathrooms: 0,
      maxGuests: 0,
      surface: "",
      neighborhood: "",
      photos: [],
    };

    const bedrooms = listing.bedrooms ?? findByKey(data, "bedrooms");
    if (typeof bedrooms === "number") result.bedrooms = Math.round(bedrooms);

    const bathrooms = listing.bathrooms ?? findByKey(data, "bathrooms");
    if (typeof bathrooms === "number") result.bathrooms = Math.ceil(bathrooms);

    const capacity =
      listing.person_capacity ??
      findByKey(data, "person_capacity") ??
      findByKey(data, "personCapacity");
    if (typeof capacity === "number") result.maxGuests = capacity;

    const sqft = listing.square_feet ?? findByKey(data, "square_feet");
    if (typeof sqft === "number" && sqft > 0)
      result.surface = `${Math.round(sqft * 0.0929)} m²`;

    result.neighborhood =
      (listing.city as string) ||
      (listing.public_address as string) ||
      ((findByKey(data, "city") as string) ?? "");

    // Photos
    const rawPhotos =
      (listing.photos as unknown[]) ?? (findByKey(data, "photos") as unknown[]) ?? [];
    if (Array.isArray(rawPhotos)) {
      const seen = new Set<string>();
      for (const p of rawPhotos) {
        if (!p || typeof p !== "object") continue;
        const ph = p as Record<string, unknown>;
        const photoUrl =
          (ph.xx_large as string) ||
          (ph.x_large as string) ||
          (ph.large as string) ||
          (ph.picture as string) ||
          "";
        if (photoUrl && !seen.has(photoUrl)) {
          seen.add(photoUrl);
          result.photos.push(photoUrl);
        }
      }
    }
    if (result.photos.length === 0) {
      const found = collectPhotoUrls(data);
      result.photos = [...found].map((u) => u + "?aki_policy=xx_large");
    }

    // On retourne null si on n'a rien (listing vide = probablement ID non supporté)
    if (!result.title && result.photos.length === 0) return null;
    return result;
  } catch {
    return null;
  }
}

// ─── Stratégie 2 : Jina.ai Reader ────────────────────────────────────────────
// r.jina.ai rend la page avec un vrai headless browser et retourne contenu + images.

async function tryJinaReader(listingUrl: string): Promise<AirbnbResult | null> {
  const jinaUrl = `https://r.jina.ai/${listingUrl}`;
  try {
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "application/json",
        "X-With-Images-Summary": "true", // inclure les URLs des images
        "X-No-Cache": "true",
      },
    });
    if (!res.ok) return null;

    // Jina retourne du JSON si Accept: application/json
    let body: Record<string, unknown>;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = (await res.json()) as Record<string, unknown>;
    } else {
      // Fallback : parse le texte brut
      const text = await res.text();
      return parseJinaText(text);
    }

    const data = (body.data as Record<string, unknown>) ?? body;
    const content = (data.content as string) || (data.text as string) || "";
    const images = (data.images as Record<string, string>) ?? {};

    const result: AirbnbResult = {
      title: ((data.title as string) ?? "").replace(/\s*[-–|]\s*Airbnb$/i, "").trim(),
      description: (data.description as string) ?? "",
      bedrooms: 0,
      bathrooms: 0,
      maxGuests: 0,
      surface: "",
      neighborhood: "",
      photos: [],
    };

    // Extraire les chiffres clés depuis le contenu markdown
    extractNumbersFromText(content, result);

    // Photos depuis le champ images (map caption → url)
    const photoUrls = Object.values(images).filter(
      (u) => typeof u === "string" && u.includes("muscache.com"),
    );
    const seen = new Set<string>();
    for (const u of photoUrls) {
      const base = u.split("?")[0];
      if (!seen.has(base)) {
        seen.add(base);
        result.photos.push(base + "?aki_policy=xx_large");
      }
    }

    // Fallback photos depuis le contenu text si images vide
    if (result.photos.length === 0) {
      const found = collectPhotoUrls(content);
      result.photos = [...found].map((u) => u + "?aki_policy=xx_large");
    }

    if (!result.title && result.photos.length === 0) return null;
    return result;
  } catch {
    return null;
  }
}

/** Parse la réponse texte brut de Jina (si pas de JSON). */
function parseJinaText(text: string): AirbnbResult | null {
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

  // Titre sur la 1re ligne non vide ou après "Title:"
  const titleMatch =
    text.match(/^Title:\s*(.+)$/m) || text.match(/^#\s+(.+)$/m);
  if (titleMatch)
    result.title = titleMatch[1].replace(/\s*[-–|]\s*Airbnb$/i, "").trim();

  extractNumbersFromText(text, result);

  // Photos
  const found = collectPhotoUrls(text);
  result.photos = [...found].map((u) => u + "?aki_policy=xx_large");

  if (!result.title && result.photos.length === 0) return null;
  return result;
}

/** Extrait chambres / SDB / voyageurs depuis un bloc de texte. */
function extractNumbersFromText(text: string, result: AirbnbResult) {
  if (!result.bedrooms) {
    const m =
      text.match(/(\d+)\s*chambre/i) || text.match(/(\d+)\s*bedroom/i);
    if (m) result.bedrooms = parseInt(m[1]);
  }
  if (!result.bathrooms) {
    const m =
      text.match(/(\d+(?:[.,]\d)?)\s*salle\s*de\s*bain/i) ||
      text.match(/(\d+(?:[.,]\d)?)\s*bathroom/i);
    if (m) result.bathrooms = Math.ceil(parseFloat(m[1].replace(",", ".")));
  }
  if (!result.maxGuests) {
    const m =
      text.match(/(\d+)\s*voyageur/i) ||
      text.match(/(\d+)\s*guest/i) ||
      text.match(/(\d+)\s*personne/i);
    if (m) result.maxGuests = parseInt(m[1]);
  }
  if (!result.neighborhood) {
    // "Paris, Île-de-France, France" ou "11e arrondissement, Paris"
    const m = text.match(/([A-ZÀ-Ÿ][a-zà-ÿ\-]+(?:,\s*[A-ZÀ-Ÿ][a-zà-ÿ\-]+){1,2})/);
    if (m) result.neighborhood = m[1];
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return jsonResp({ error: "Méthode non autorisée" }, 405);

  // Parse body
  let listingId: string;
  let cleanUrl: string;
  try {
    const body = (await req.json()) as { url?: string };
    let rawUrl = (body.url ?? "").trim();
    if (!rawUrl) throw new Error("URL manquante");
    if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("airbnb"))
      throw new Error("URL Airbnb invalide");
    cleanUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    const id = extractListingId(rawUrl);
    if (!id) throw new Error("Impossible d'extraire l'ID depuis l'URL");
    listingId = id;
  } catch (e) {
    return jsonResp({ error: e instanceof Error ? e.message : "URL invalide" }, 400);
  }

  // Stratégie 1 : API Airbnb v2 (rapide, fonctionne pour anciens IDs)
  const v2Result = await tryAirbnbV2Api(listingId);
  if (v2Result) return jsonResp(v2Result);

  // Stratégie 2 : Jina.ai (fonctionne pour nouveaux IDs longs, robuste anti-bot)
  const jinaResult = await tryJinaReader(cleanUrl);
  if (jinaResult) return jsonResp(jinaResult);

  // Tout a échoué
  return jsonResp(
    {
      error:
        `Impossible d'accéder à cette annonce (ID: ${listingId}). ` +
        `Vérifie que l'URL est bien publique et réessaie.`,
    },
    502,
  );
}
