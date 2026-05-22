// Fonction serverless Vercel — classe une photo d'appartement par pièce
// via Google Gemini Vision. La clé API reste côté serveur (jamais exposée
// au navigateur). Appelée par l'admin après l'upload d'une photo.

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

interface ApiReq {
  method?: string;
  body?: unknown;
}
interface ApiRes {
  status: (code: number) => ApiRes;
  json: (data: unknown) => void;
}

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY non configurée" });
    return;
  }

  let payload: unknown = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = undefined;
    }
  }
  const imageUrl = (payload as { imageUrl?: string } | undefined)?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    res.status(400).json({ error: "imageUrl requis" });
    return;
  }

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      res.status(400).json({ error: "Image inaccessible" });
      return;
    }
    const mime = imgRes.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");

    const geminiRes = await callGemini(apiKey, mime, base64);
    if (!geminiRes) {
      res.status(429).json({ error: "Limite de débit Gemini" });
      return;
    }
    if (!geminiRes.ok) {
      const detail = (await geminiRes.text()).slice(0, 200);
      res
        .status(geminiRes.status === 429 ? 429 : 502)
        .json({ error: `Gemini ${geminiRes.status}`, detail });
      return;
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
    res.status(200).json({ room });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Erreur" });
  }
}
