// Vercel Edge function — récupère les données d'une annonce Airbnb.
// POST { url: string }
// → { title, description, bedrooms, bathrooms, maxGuests, surface, neighborhood, photos }
//
// Stratégie (testée sur de vraies annonces) :
//   On passe par Jina.ai Reader (r.jina.ai) en mode HTML. Jina rend la page avec un
//   navigateur headless (bypass Cloudflare) et nous renvoie le HTML complet incluant
//   l'état embarqué d'Airbnb. On y extrait :
//     - listingTitle           → titre
//     - personCapacity         → nb voyageurs
//     - ligne résumé "· N chambres · N lits · N salles de bain"
//     - blocs htmlText          → description
//     - toutes les URLs muscache/Hosting-<id>  → photos (dédup par UUID)
//
//   Le scraping HTML direct ne marche pas : Airbnb bloque les IPs datacenter (Vercel)
//   avec des boucles de redirect Cloudflare. Jina contourne ça.

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

/** Décode les échappements JSON/unicode présents dans le HTML brut de Jina. */
function unescapeJson(s: string): string {
  return s
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u002f/gi, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/\\"/g, '"')
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // strip HTML tags résiduels
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, "\n")
    .trim();
}

/** Parse le HTML rendu par Jina pour en extraire les données structurées. */
function parseAirbnbHtml(html: string, listingId: string): AirbnbResult {
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

  // ── Titre ──────────────────────────────────────────────────────────────
  const titleMatch =
    html.match(/"listingTitle":"([^"]+)"/) ||
    html.match(/"pdpTitle":"([^"]+)"/) ||
    html.match(/"sharingConfig":\{"title":"([^"]+)"/);
  if (titleMatch) result.title = unescapeJson(titleMatch[1]);

  // ── Voyageurs ──────────────────────────────────────────────────────────
  const capMatch = html.match(/"personCapacity":\s*(\d+)/);
  if (capMatch) result.maxGuests = parseInt(capMatch[1]);

  // ── Ligne résumé : "… · N chambres · N lits · N salles de bain" ─────────
  //    IMPORTANT : on ancre chambres ET salles de bain sur la MÊME ligne
  //    résumé (séparée par des "·"), sinon on attrape par erreur des légendes
  //    de photos ("2 salles de bain") ou des annonces recommandées.
  const summaryMatch =
    html.match(
      /(\d+)\s*chambres?\s*·(?:\s*\d+\s*lits?\s*·)?\s*(\d+(?:[,.]\d)?)\s*salles?\s*de\s*bain/i,
    ) ||
    html.match(
      /(\d+)\s*bedrooms?\s*·(?:\s*\d+\s*beds?\s*·)?\s*(\d+(?:[,.]\d)?)\s*bath/i,
    );
  if (summaryMatch) {
    result.bedrooms = parseInt(summaryMatch[1]);
    result.bathrooms = Math.ceil(parseFloat(summaryMatch[2].replace(",", ".")));
  }

  // Fallbacks si la ligne résumé combinée n'a pas matché (studios, formats variés)
  if (!result.bedrooms) {
    const b =
      html.match(/·\s*(\d+)\s*chambres?\b/i) ||
      html.match(/·\s*(\d+)\s*bedrooms?\b/i);
    if (b) result.bedrooms = parseInt(b[1]);
  }
  if (!result.bathrooms) {
    const b =
      html.match(
        /(?:appartement|logement|maison|villa|studio)\s+de\s+(\d+(?:[,.]\d)?)\s*salles?\s*de\s*bain/i,
      ) || html.match(/·\s*(\d+(?:[,.]\d)?)\s*salles?\s*de\s*bain/i);
    if (b) result.bathrooms = Math.ceil(parseFloat(b[1].replace(",", ".")));
  }

  // ── Type de bien + ville : "Appartement · Monaco · ★5,0 · …" ────────────
  const typeCityMatch = html.match(
    /([A-ZÀ-Ÿ][a-zà-ÿ]+)\s*·\s*([A-ZÀ-Ÿ][\w\sÀ-ÿ-]+?)\s*·\s*★/,
  );
  if (typeCityMatch) {
    result.neighborhood = typeCityMatch[2].trim();
  }
  if (!result.neighborhood) {
    const cityMatch = html.match(/"localizedCity":"([^"]+)"/);
    if (cityMatch) result.neighborhood = unescapeJson(cityMatch[1]);
  }

  // ── Description : meilleur bloc htmlText (hors disclaimers) ──────────────
  const htmlTexts = [...html.matchAll(/"htmlText":"((?:[^"\\]|\\.){60,})"/g)].map(
    (m) => unescapeJson(m[1]),
  );
  const DISCLAIMER = /(responsable de la proposition|particulier\.|lois sur|entièrement responsable|fully responsible|laws on)/i;
  const candidates = htmlTexts.filter((t) => !DISCLAIMER.test(t));
  if (candidates.length > 0) {
    // Le bloc le plus long = la vraie description du logement
    result.description = candidates.sort((a, b) => b.length - a.length)[0];
  }
  // Fallback : meta description
  if (!result.description) {
    const meta = html.match(/name="description"\s+content="([^"]+)"/);
    if (meta) result.description = unescapeJson(meta[1]);
  }

  // ── Photos : toutes les URLs muscache/Hosting-<id>, dédup par UUID ──────
  const photoRegex = new RegExp(
    `https://a0\\.muscache\\.com/im/pictures/hosting/Hosting-${listingId}/[^\\s"\\\\]+`,
    "g",
  );
  const urls = html.match(photoRegex) ?? [];
  const byUuid = new Map<string, string>();
  for (const raw of urls) {
    const base = raw.split("?")[0];
    const uuid = base.match(/\/([a-f0-9-]{36})\./)?.[1];
    if (uuid && !byUuid.has(uuid)) {
      // On force une grande taille via le paramètre de policy Airbnb
      byUuid.set(uuid, base + "?im_w=1440");
    }
  }
  result.photos = [...byUuid.values()];

  // Fallback : si pas de Hosting-<id>, prendre toutes les photos hosting génériques
  if (result.photos.length === 0) {
    const generic =
      html.match(/https:\/\/a0\.muscache\.com\/im\/pictures\/hosting\/[^\s"\\]+/g) ??
      [];
    const seen = new Set<string>();
    for (const raw of generic) {
      const base = raw.split("?")[0];
      const uuid = base.match(/\/([a-f0-9-]{36})\./)?.[1];
      if (uuid && !seen.has(uuid)) {
        seen.add(uuid);
        result.photos.push(base + "?im_w=1440");
      }
    }
  }

  return result;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return jsonResp({ error: "Méthode non autorisée" }, 405);

  // ── Parse body ──────────────────────────────────────────────────────────
  let cleanUrl: string;
  let listingId: string;
  try {
    const body = (await req.json()) as { url?: string };
    let rawUrl = (body.url ?? "").trim();
    if (!rawUrl) throw new Error("URL manquante");
    if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("airbnb"))
      throw new Error("URL Airbnb invalide (domaine non reconnu)");
    cleanUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    const id = extractListingId(rawUrl);
    if (!id) throw new Error("Impossible d'extraire l'ID de l'annonce depuis l'URL");
    listingId = id;
  } catch (e) {
    return jsonResp({ error: e instanceof Error ? e.message : "URL invalide" }, 400);
  }

  // ── Appel Jina.ai Reader en mode HTML ───────────────────────────────────
  let html: string;
  try {
    const res = await fetch(`https://r.jina.ai/${cleanUrl}`, {
      headers: {
        "X-Return-Format": "html",
        "X-No-Cache": "true",
        Accept: "text/html",
      },
      // Jina peut prendre 10-30s pour rendre la page
    });

    if (!res.ok) {
      return jsonResp(
        {
          error: `Le lecteur de page a répondu ${res.status}. Réessaie dans quelques secondes.`,
        },
        502,
      );
    }
    html = await res.text();
    if (html.length < 1000) {
      return jsonResp(
        { error: "Page Airbnb vide ou inaccessible. Vérifie que l'URL est publique." },
        502,
      );
    }
  } catch (e) {
    return jsonResp(
      {
        error: `Impossible de lire la page : ${e instanceof Error ? e.message : "erreur réseau"}`,
      },
      502,
    );
  }

  // ── Extraction ──────────────────────────────────────────────────────────
  const result = parseAirbnbHtml(html, listingId);

  if (!result.title && result.photos.length === 0) {
    return jsonResp(
      {
        error:
          "Aucune donnée extraite. L'annonce est peut-être privée, supprimée, ou Airbnb a changé sa structure.",
      },
      502,
    );
  }

  return jsonResp(result);
}
