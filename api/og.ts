// Vercel Edge function — serves rich-preview HTML to social/messaging crawlers
// (WhatsApp, Facebook, Twitter, LinkedIn, Slack, Telegram, Discord, iMessage…).
// Real users keep getting the SPA via the rewrite in vercel.json.
//
// Triggered from vercel.json when the User-Agent matches a known crawler and
// the path is /appartements/:slug. Query params: ?slug=...

export const config = { runtime: "edge" };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://uqsvfqpbbgfxdilyaang.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const SITE_URL = "https://volums.fr";
const DEFAULT_TITLE =
  "Volums — Appartements meublés haut de gamme à Paris, 1 à 12 mois";
const DEFAULT_DESC =
  "Volums propose des appartements parisiens haut de gamme, meublés et clé en main, pour des séjours de 1 à 12 mois. Sans bail longue durée, tout inclus.";
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`;

type Property = {
  id: string;
  slug: string;
  name: string | null;
  name_italic: string | null;
  baseline: string | null;
  short_description: string | null;
  quartier: string | null;
  arrondissement: string | null;
  cover_photo_id: string | null;
};

type Photo = { storage_path: string };

async function supaGet<T>(path: string): Promise<T[]> {
  if (!SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

function publicPhotoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/property-photos/${storagePath}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const { title, description, image, url } = opts;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const u = escapeHtml(url);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${u}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Volums" />
<meta property="og:url" content="${u}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${i}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${i}" />
<meta http-equiv="refresh" content="0; url=${u}" />
</head>
<body><a href="${u}">${t}</a></body>
</html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim();

  // Fallback: no slug → home meta
  if (!slug) {
    return new Response(
      buildHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        image: DEFAULT_IMAGE,
        url: SITE_URL,
      }),
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const pageUrl = `${SITE_URL}/appartements/${slug}`;

  const props = await supaGet<Property>(
    `properties?slug=eq.${encodeURIComponent(slug)}` +
      `&select=id,slug,name,name_italic,baseline,short_description,quartier,arrondissement,cover_photo_id` +
      `&limit=1`
  );
  const appt = props[0];

  if (!appt) {
    return new Response(
      buildHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        image: DEFAULT_IMAGE,
        url: pageUrl,
      }),
      {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    );
  }

  // Pick the cover photo, fallback to first photo by sort_order
  let image = DEFAULT_IMAGE;
  if (appt.cover_photo_id) {
    const photos = await supaGet<Photo>(
      `property_photos?id=eq.${appt.cover_photo_id}&select=storage_path&limit=1`
    );
    if (photos[0]) image = publicPhotoUrl(photos[0].storage_path);
  }
  if (image === DEFAULT_IMAGE) {
    const photos = await supaGet<Photo>(
      `property_photos?property_id=eq.${appt.id}` +
        `&select=storage_path&order=sort_order.asc&limit=1`
    );
    if (photos[0]) image = publicPhotoUrl(photos[0].storage_path);
  }

  const namePart = [appt.name, appt.name_italic]
    .filter(Boolean)
    .join(" ")
    .trim();
  const title = namePart ? `${namePart} — Volums` : DEFAULT_TITLE;

  const where = appt.quartier
    ? `dans le ${appt.quartier}`
    : appt.arrondissement
      ? `dans le ${appt.arrondissement}`
      : "à Paris";
  const description =
    appt.short_description ||
    appt.baseline ||
    `Appartement meublé haut de gamme à louer ${where}, de 1 à 12 mois.`;

  return new Response(
    buildHtml({ title, description, image, url: pageUrl }),
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Cache crawler responses a bit at the edge to soak repeated hits
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
