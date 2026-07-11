const BASE = "https://api.brixhub.is/api/v1";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface BrixResponse {
  status: number;
  message?: string;
  data?: { results?: Record<string, JsonValue>[] } | null;
  meta?: Record<string, JsonValue> | null;
}

export async function brixFetch(path: string, init?: RequestInit): Promise<BrixResponse> {
  // Support both BRIXHUB_API_KEY and a shorter BRIX_API_KEY fallback for flexibility
  const apiKey = process.env.BRIXHUB_API_KEY ?? process.env.BRIX_API_KEY;
  if (!apiKey) {
    // Helpful warning for developers — never print the key value itself.
    console.warn(
      "BRIXHUB_API_KEY is not set. In development, copy .env.template to .env and add BRIXHUB_API_KEY; in Vercel add the variable under Project Settings → Environment Variables."
    );
    return { status: 500, message: "BRIXHUB_API_KEY manquante", data: null, meta: null };
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : { status: res.status, data: null }) as BrixResponse;
  } catch {
    return { status: res.status, message: text || "Réponse invalide", data: null };
  }
}
