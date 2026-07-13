// Centralise la validation des variables d'environnement.
// Importez ce module dès le démarrage pour forcer l'échec si une variable requise est manquante.

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[ERROR] ${name} manquante. Définissez-la dans .env (local) ou via les secrets CI/CD (ex: BRIXHUB_API_KEY).`);
    if (typeof process !== "undefined" && typeof process.exit === "function") {
      process.exit(1);
    }
    throw new Error(`${name} manquante`);
  }
  return v;
}

export const BRIXHUB_API_KEY = requireEnv("BRIXHUB_API_KEY");
