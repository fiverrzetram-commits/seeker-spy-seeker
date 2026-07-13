import 'dotenv/config'; // charge .env en environnement de dev si nécessaire
import { CONFIG } from './config';

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
  // Cherche la clé dans plusieurs emplacements (priorité : process.env > CONFIG (Vite) )
  const apiKey =
    (process.env && process.env.BRIXHUB_API_KEY) ||
    (typeof CONFIG !== 'undefined' ? CONFIG.BRIXHUB_API_KEY : undefined) ||
    (process.env && process.env.VITE_BRIXHUB_API_KEY) ||
    '';

  // Debug minimal : on logge uniquement la présence et la source (pas la clé)
  if (!apiKey) {
    console.error('BRIXHUB_API_KEY manquante (recherché dans process.env et VITE/CONFIG).');
    return { status: 500, message: "BRIXHUB_API_KEY manquante", data: null, meta: null };
  } else {
    // Pour debug, indiquer la source réelle (utile en dev). Remove ou passez en trace en prod.
    const source =
      process.env.BRIXHUB_API_KEY ? 'process.env.BRIXHUB_API_KEY' :
      CONFIG?.BRIXHUB_API_KEY ? 'CONFIG.VITE_BRIXHUB_API_KEY' :
      process.env.VITE_BRIXHUB_API_KEY ? 'process.env.VITE_BRIXHUB_API_KEY' : 'unknown';
    console.debug(`BRIXHUB_API_KEY trouvé via ${source}`);
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
