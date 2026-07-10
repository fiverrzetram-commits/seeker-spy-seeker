interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot: boolean;
  system: boolean;
  mfa_enabled: boolean;
  banner: string | null;
  accent_color: number | null;
  locale: string;
  verified: boolean;
  email: string | null;
  flags: number;
  premium_type: number;
  public_flags: number;
  avatar_decoration_data: unknown | null;
}

interface DiscordLookupResult {
  success: boolean;
  user?: DiscordUser;
  error?: string;
}

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Look up a Discord user by username and discriminator
 * @param username - The Discord username
 * @param discriminator - The Discord discriminator (the #number part)
 * @returns Promise with user data or error
 */
export async function lookupDiscordUser(
  username: string,
  discriminator?: string
): Promise<DiscordLookupResult> {
  try {
    // If discriminator is provided, use the old format
    if (discriminator) {
      const response = await fetch(
        `${DISCORD_API_BASE}/users/lookup?username=${encodeURIComponent(
          username
        )}&discriminator=${discriminator}`
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Discord API error: ${response.status} ${response.statusText}`,
        };
      }

      const user = (await response.json()) as DiscordUser;
      return { success: true, user };
    }

    // For new Discord usernames without discriminators
    const response = await fetch(
      `${DISCORD_API_BASE}/users/lookup?username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Discord user not found",
        };
      }
      return {
        success: false,
        error: `Discord API error: ${response.status} ${response.statusText}`,
      };
    }

    const user = (await response.json()) as DiscordUser;
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Look up a Discord user by their user ID
 * @param userId - The Discord user ID
 * @returns Promise with user data or error
 */
export async function lookupDiscordUserById(
  userId: string
): Promise<DiscordLookupResult> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/${userId}/profile`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Discord user not found",
        };
      }
      return {
        success: false,
        error: `Discord API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { user: DiscordUser };
    return { success: true, user: data.user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Format Discord user info for display
 * @param user - The Discord user object
 * @returns Formatted user information string
 */
export function formatDiscordUser(user: DiscordUser): string {
  const tag = user.discriminator === "0" 
    ? user.username 
    : `${user.username}#${user.discriminator}`;
  
  return `
Discord User: ${tag}
ID: ${user.id}
${user.bot ? "🤖 Bot Account" : ""}
${user.system ? "⚙️ System Account" : ""}
Avatar: ${user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "None"}
Verified: ${user.verified ? "✓" : "✗"}
MFA Enabled: ${user.mfa_enabled ? "✓" : "✗"}
Locale: ${user.locale}
Premium Type: ${getPremiumType(user.premium_type)}
  `.trim();
}

function getPremiumType(type: number): string {
  const types: Record<number, string> = {
    0: "None",
    1: "Nitro Classic",
    2: "Nitro",
    3: "Nitro Basic",
  };
  return types[type] || "Unknown";
}
