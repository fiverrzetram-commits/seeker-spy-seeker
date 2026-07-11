import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const discordLookupByUsername = createServerFn()
  .validator(
    z.object({
      username: z.string().min(1),
      discriminator: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    try {
      // Discord API endpoint for user lookup
      const query = data.discriminator
        ? `${data.username}#${data.discriminator}`
        : data.username;

      const response = await fetch(
        `https://discordapp.com/api/v9/users/username/${query}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Discord API error: ${response.status}`,
          user: null,
        };
      }

      const user = await response.json();
      return {
        success: true,
        error: null,
        user,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        user: null,
      };
    }
  });

export const discordLookupById = createServerFn()
  .validator(
    z.object({
      userId: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    try {
      const response = await fetch(
        `https://discordapp.com/api/v9/users/${data.userId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Discord API error: ${response.status}`,
          user: null,
        };
      }

      const user = await response.json();
      return {
        success: true,
        error: null,
        user,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        user: null,
      };
    }
  });
