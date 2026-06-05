// Vercel Edge function — scrape une annonce Airbnb et retourne les données structurées.
// POST { url: string }
// → { title, description, bedrooms, bathrooms, maxGuests, surface, neighborhood, photos }

export const config = { runtime: "edge" };

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

/** Extrait récursivement toutes les URLs muscache dans un objet JSON. */
function collectPhotoUrls(obj: unknown, found: Set<string> = new Set()): Set<string> {
  if (typeof obj === "string") {
    if (obj.includes("a0.muscache.com") && obj.includes("/pictures/")) {
      found.add(obj.split("?")[0]); // base URL sans params de taille
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

/** Cherche toutes les valeurs associées à une clé (pas juste la première). */
function findAllByKey(obj: unknown, key: string, acc: unknown[] = []): unknown[] {
  if (!obj || typeof obj !== "object") return acc;
  if (Array.isArray(obj)) {
    obj.forEach((v) => findAllByKey(v, key, acc));
  } else {
    const rec = obj as Record<string, unknown>;
    if (key in rec) acc.push(rec[key]);
    Object.values(rec).forEach((v) => findAllByKey(v, key, acc));
  }
  return acc;
}

/** Nettoie le titre Airbnb (retire " - Airbnb", "Séjour à …", etc.) */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-–|]\s*Airbnb$/i, "")
    .replace(/^(Séjour à|Stay at|Logement à|Entire [\w\s]+ in)\s*/i, "")
    .trim();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // ── Parse body ──────────────────────────────────────────────────────────
  let rawUrl: string;
  try {
    const body = (await req.json()) as { url?: string };
    rawUrl = (body.url ?? "").trim();
    if (!rawUrl) throw new Error("URL manquante");
    if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("airbnb"))
      throw new Error("URL Airbnb invalide (domaine non reconnu)");
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "URL invalide" }, 400);
  }

  // ── Fetch page Airbnb ────────────────────────────────────────────────────
  let html: string;
  try {
    const res = await fetch(rawUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Referer: "https://www.google.com/",
        DNT: "1",
      },
      redirect: "follow",
    });

    if (res.status === 403 || res.status === 503) {
      return json(
        {
          error:
            "Airbnb a bloqué la requête (protection anti-bot). Réessaie dans quelques secondes ou depuis un autre réseau.",
        },
        502,
      );
    }
    if (!res.ok) return json({ error: `Airbnb a répondu ${res.status}` }, 502);

    html = await res.text();

    // Cloudflare challenge check
    if (
      html.includes("cf-browser-verification") ||
      html.includes("challenge-platform") ||
      html.includes("Just a moment")
    ) {
      return json(
        {
          error:
            "Airbnb utilise une protection Cloudflare sur cette page. Essaie depuis la version mobile de l'URL (/s/ ou ?_format=) ou patiente quelques secondes.",
        },
        502,
      );
    }
  } catch (e) {
    return json(
      {
        error: `Impossible d'accéder à la page : ${e instanceof Error ? e.message : "erreur réseau"}`,
      },
      502,
    );
  }

  // ── Parse HTML ──────────────────────────────────────────────────────────
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

  // Meta OG — toujours présentes même sans JS
  result.title =
    cleanTitle(
      html.match(/property="og:title"\s+content="([^"]+)"/)?.[1] ||
        html.match(/content="([^"]+)"\s+property="og:title"/)?.[1] ||
        html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ||
        "",
    );

  result.description = (
    html.match(/property="og:description"\s+content="([^"]+)"/)?.[1] ||
    html.match(/content="([^"]+)"\s+property="og:description"/)?.[1] ||
    ""
  )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  // __NEXT_DATA__ — source principale
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]) as unknown;

      // Photos
      const photoBaseUrls = collectPhotoUrls(data);
      result.photos = [...photoBaseUrls].map(
        (u) => u + "?aki_policy=xx_large",
      );

      // Données de la fiche
      const bedrooms = findByKey(data, "bedrooms") ?? findByKey(data, "bedroomCount");
      if (typeof bedrooms === "number") result.bedrooms = Math.round(bedrooms);

      const bathrooms = findByKey(data, "bathrooms") ?? findByKey(data, "bathroomCount");
      if (typeof bathrooms === "number") result.bathrooms = Math.ceil(bathrooms);

      const capacity =
        findByKey(data, "personCapacity") ??
        findByKey(data, "person_capacity") ??
        findByKey(data, "maxGuestCapacity");
      if (typeof capacity === "number") result.maxGuests = capacity;

      // Surface (rare chez Airbnb mais parfois présente)
      const sqft = findByKey(data, "squareFeet") ?? findByKey(data, "square_feet");
      if (typeof sqft === "number" && sqft > 0) {
        const sqm = Math.round(sqft * 0.0929);
        result.surface = `${sqm} m²`;
      }

      // Localisation
      const city =
        findByKey(data, "city") ?? findByKey(data, "publicAddress");
      if (typeof city === "string" && city) result.neighborhood = city;

      // Si pas trouvé via les clés connues, tenter le texte de la page pour les chiffres
      if (!result.bedrooms) {
        const labels = findAllByKey(data, "title") as string[];
        for (const label of labels) {
          const m = label.match(/(\d+)\s*(?:chambre|bedroom)/i);
          if (m) {
            result.bedrooms = parseInt(m[1]);
            break;
          }
        }
      }
    } catch {
      // JSON mal formé — on continue avec ce qu'on a
    }
  }

  // Fallback texte brut pour les chiffres clés
  if (!result.bedrooms) {
    const m = html.match(/(\d+)\s*(?:chambre|bedroom)/i);
    if (m) result.bedrooms = parseInt(m[1]);
  }
  if (!result.bathrooms) {
    const m = html.match(/(\d+(?:[.,]\d)?)\s*(?:salle(?:s)? de bains?|bathroom)/i);
    if (m) result.bathrooms = Math.ceil(parseFloat(m[1].replace(",", ".")));
  }
  if (!result.maxGuests) {
    const m = html.match(/(\d+)\s*(?:voyageur|guest|personne)/i);
    if (m) result.maxGuests = parseInt(m[1]);
  }

  // Si aucune photo trouvée dans __NEXT_DATA__, chercher dans les balises <img>
  if (result.photos.length === 0) {
    const imgMatches = [...html.matchAll(/https:\/\/a0\.muscache\.com\/[^"'\s]+/g)];
    const seen = new Set<string>();
    for (const [url] of imgMatches) {
      const base = url.split("?")[0];
      if (!seen.has(base)) {
        seen.add(base);
        result.photos.push(base + "?aki_policy=xx_large");
      }
    }
  }

  return json(result);
}
