// Vercel Edge function — proxy d'images pour contourner le CORS.
// GET /api/proxy-image?url=<encoded-url>
// Seules les URLs Airbnb (muscache.com) sont autorisées.

export const config = { runtime: "edge" };

const ALLOWED_HOSTS = ["a0.muscache.com", "a1.muscache.com", "a2.muscache.com"];

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" },
    });
  }

  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return new Response("Paramètre url manquant", { status: 400, headers: CORS });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("URL invalide", { status: 400, headers: CORS });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response("Hôte non autorisé", { status: 403, headers: CORS });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.airbnb.com/",
      },
    });

    if (!res.ok) {
      return new Response(`Image non trouvée (${res.status})`, {
        status: res.status,
        headers: CORS,
      });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") ?? "image/jpeg";

    return new Response(buffer, {
      headers: {
        ...CORS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(
      `Erreur proxy : ${e instanceof Error ? e.message : "inconnue"}`,
      { status: 502, headers: CORS },
    );
  }
}
