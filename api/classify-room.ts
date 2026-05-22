// Fonction serverless Vercel — classe des photos d'appartement par pièce
// via Google Gemini Vision. La clé API reste côté serveur (jamais exposée).
// Classement PAR LOTS : un seul appel Gemini pour plusieurs photos, afin
// de rester sous la limite de débit du palier gratuit.

export const config = { maxDuration: 60 };

const ROOMS = [
  "salon",
  "salle_a_manger",
  "cuisine",
  "chambre",
  "sdb",
  "entree",
  "bureau",
  "exterieur",
  "autre",
];

const PROMPT = `Tu reçois plusieurs photos d'intérieur d'un même appartement parisien, dans l'ordre.
Classe CHAQUE photo par type de pièce.
Réponds par un tableau JSON de chaînes, une valeur par photo, dans le même ordre.
Valeurs possibles : salon, salle_a_manger, cuisine, chambre, sdb, entree, bureau, exterieur, autre.

Indices :
- salon : pièce de vie avec un canapé
- salle_a_manger : la table à manger est l'élément principal
- cuisine : plan de travail, électroménager
- chambre : un lit
- sdb : salle de bain — douche, baignoire, lavabo ou WC
- entree : couloir, hall, hall d'entrée
- bureau : espace de travail
- exterieur : balcon, terrasse, cour, vue extérieure, façade
- autre : si rien ne correspond clairement`;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

// Requête Gemini avec retries sur 429 (limite de débit du palier gratuit).
async function callGemini(
  apiKey: string,
  parts: Part[],
): Promise<Response | null> {
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: { type: "ARRAY", items: { type: "STRING", enum: ROOMS } },
    },
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body,
    });
    if (res.status === 429 && attempt < 2) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    return res;
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "GEMINI_API_KEY non configurée" }, 500);

  let imageUrls: string[] = [];
  try {
    const body = (await request.json()) as { imageUrls?: unknown };
    if (Array.isArray(body?.imageUrls)) {
      imageUrls = body.imageUrls.filter((u): u is string => typeof u === "string");
    }
  } catch {
    // Corps absent ou non-JSON.
  }
  if (imageUrls.length === 0) return json({ error: "imageUrls requis" }, 400);

  try {
    // Récupère toutes les images du lot en parallèle.
    const images = await Promise.all(
      imageUrls.map(async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Image inaccessible (${r.status})`);
        const mime = r.headers.get("content-type") || "image/jpeg";
        const data = Buffer.from(await r.arrayBuffer()).toString("base64");
        return { mime, data };
      }),
    );

    const parts: Part[] = [
      { text: PROMPT },
      ...images.map((im) => ({
        inline_data: { mime_type: im.mime, data: im.data },
      })),
    ];

    const geminiRes = await callGemini(apiKey, parts);
    if (!geminiRes) return json({ error: "Limite de débit Gemini" }, 429);
    if (!geminiRes.ok) {
      const detail = (await geminiRes.text()).slice(0, 200);
      return json(
        { error: `Gemini ${geminiRes.status}`, detail },
        geminiRes.status === 429 ? 429 : 502,
      );
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "[]")
      .replace(/```json|```/g, "")
      .trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = [];
    }
    const rooms = (Array.isArray(parsed) ? parsed : []).map((v) => {
      const s = String(v).trim().toLowerCase();
      return ROOMS.includes(s) ? s : "autre";
    });
    return json({ rooms });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
}

// Diagnostic : GET /api/classify-room confirme que la fonction tourne
// et que la clé est bien configurée.
export function GET(): Response {
  return json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY) });
}
