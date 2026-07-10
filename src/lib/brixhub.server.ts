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
  const apiKey = process.env.BRIXHUB_API_KEY;
  if (!apiKey) {
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

