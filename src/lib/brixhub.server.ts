const BASE = "https://api.brixhub.is/api/v1";

export async function brixFetch(path: string, init?: RequestInit) {
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
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { status: res.status, message: text || "Réponse invalide", data: null };
  }
  return body as {
    status: number;
    message?: string;
    data?: { results?: Record<string, unknown>[] } | null;
    meta?: Record<string, unknown> | null;
  };
}
