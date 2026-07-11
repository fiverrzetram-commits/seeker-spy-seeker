/**
 * Application Configuration
 * Contains API keys and environment-specific settings
 */

export const CONFIG = {
  BRIXHUB_API_KEY: import.meta.env.VITE_BRIXHUB_API_KEY || 'brix_Wz3UAC7Cb29W9ZmeevElCv2M0OGING25ZJ8b6fH0kdDDGbCS',
  BRIXHUB_API_BASE: import.meta.env.VITE_BRIXHUB_API_BASE || 'https://api.brixhub.io',
  DISCORD_API_BASE: import.meta.env.VITE_DISCORD_API_BASE || 'https://discord.com/api',
} as const;