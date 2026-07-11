/**
 * Application Configuration
 * Contains API keys and environment-specific settings
 */

export const CONFIG = {
  BRIXHUB_API_KEY: import.meta.env.VITE_BRIXHUB_API_KEY || "",
  BRIXHUB_API_BASE: import.meta.env.VITE_BRIXHUB_API_BASE || "https://api.brixhub.io",
  DISCORD_API_BASE: import.meta.env.VITE_DISCORD_API_BASE || "https://discord.com/api",
} as const;
