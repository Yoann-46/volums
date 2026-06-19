// Vercel Edge function — traduction de texte (FR → EN par défaut).
// POST { text: string, source?: string, target?: string } → { text: string }
//
// Utilisée à l'import d'annonce pour pré-remplir les champs EN (baseline,
// description) quand la source ne fournit pas de version anglaise native
// (cas Airbnb). Le Collectionist, lui, expose déjà l'anglais via son API.
//
// On passe par l'endpoint public de Google Translate (gratuit, sans clé). En
// cas d'échec, on renvoie une chaîne vide → l'import n'est jamais bloqué.

export const config = { runtime: "edge" };

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

async function translateChunk(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`translate ${res.status}`);
  // Réponse : [[[ "segment traduit", "segment source", … ], …], …]
  const data = (await res.json()) as any;
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  return segments.map((s: any[]) => s?.[0] ?? "").join("");
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return jsonResp({ error: "Méthode non autorisée" }, 405);

  let text: string;
  let source: string;
  let target: string;
  try {
    const body = (await req.json()) as {
      text?: string;
      source?: string;
      target?: string;
    };
    text = (body.text ?? "").trim();
    source = body.source || "fr";
    target = body.target || "en";
    if (!text) return jsonResp({ text: "" });
  } catch {
    return jsonResp({ error: "Corps de requête invalide" }, 400);
  }

  try {
    // L'endpoint Google limite la taille par requête → on découpe en tronçons
    // (~1800 caractères) sur des frontières de phrase quand c'est possible.
    const chunks: string[] = [];
    let rest = text;
    while (rest.length > 1800) {
      let cut = rest.lastIndexOf(". ", 1800);
      if (cut < 500) cut = 1800;
      chunks.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    chunks.push(rest);

    const out: string[] = [];
    for (const c of chunks) out.push(await translateChunk(c, source, target));
    return jsonResp({ text: out.join("").trim() });
  } catch {
    // Non bloquant : l'import continue avec un champ EN vide.
    return jsonResp({ text: "" });
  }
}
