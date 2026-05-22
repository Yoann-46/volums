// Fonction serverless Vercel — classe une photo d'appartement par pièce
// via Google Gemini Vision. La clé API reste côté serveur (jamais exposée).
// Signature Web standard : Vercel route la requête vers POST() / GET().

export const config = { maxDuration: 25 };

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

const PROMPT = `Tu classes une photo d'intérieur d'un appartement parisien dans UNE seule catégorie de pièce.
Réponds STRICTEMENT par un seul de ces mots, sans rien d'autre :
salon, salle_a_manger, cuisine, chambre, sdb, entree, bureau, exterieur, autre

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

// Requête Gemini avec un retry sur 429 (limite de débit du palier gratuit).
async function callGemini(
  apiKey: string,
  mime: string,
  base64: string,
): Promise<Response | null> {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mime, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 256 },
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body,
    });
    if (res.status === 429 && attempt === 0) {
      await sleep(3000);
      continue;
    }
    return res;
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "GEMINI_API_KEY non configurée" }, 500);

  let imageUrl: string | undefined;
  try {
    const body = (await request.json()) as { imageUrl?: string };
    imageUrl = body?.imageUrl;
  } catch {
    // Corps absent ou non-JSON.
  }
  if (!imageUrl || typeof imageUrl !== "string") {
    return json({ error: "imageUrl requis" }, 400);
  }

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return json({ error: "Image inaccessible" }, 502);
    const mime = imgRes.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");

    const geminiRes = await callGemini(apiKey, mime, base64);
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
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .trim()
      .toLowerCase();
    const room =
      ROOMS.find((r) => text === r) ??
      ROOMS.find((r) => text.includes(r)) ??
      "autre";
    return json({ room });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
}

// Diagnostic : GET /api/classify-room confirme que la fonction tourne
// et que la clé est bien configurée.
export function GET(): Response {
  return json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY) });
}
