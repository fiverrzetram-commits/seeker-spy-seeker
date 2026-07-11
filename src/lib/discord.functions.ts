import { createServerFn } from "@tanstack/react-start";
import { notifyTelegram } from "./telegram.server";

export const discordLookupByUsername = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { username: string; discriminator?: string }) => data
  )
  .handler(async ({ data }) => {
    const query = data.discriminator
      ? `${data.username}#${data.discriminator}`
      : data.username;
    const started = Date.now();
    try {
      const response = await fetch(
        `https://discordapp.com/api/v9/users/username/${query}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      const result = {
        success: response.ok,
        error: response.ok ? null : `Discord API error: ${response.status}`,
        user: response.ok ? await response.json() : null,
      };

      await notifyTelegram({
        type: "lookup:discord:username",
        query: { username: data.username, discriminator: data.discriminator },
        resultCount: result.user ? 1 : 0,
        status: response.status,
        durationMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (err) {
      await notifyTelegram({
        type: "lookup:discord:username",
        query: { username: data.username, discriminator: data.discriminator },
        resultCount: 0,
        status: 500,
        durationMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        user: null,
      };
    }
  });

export const discordLookupById = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const started = Date.now();
    try {
      const response = await fetch(
        `https://discordapp.com/api/v9/users/${data.userId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      const result = {
        success: response.ok,
        error: response.ok ? null : `Discord API error: ${response.status}`,
        user: response.ok ? await response.json() : null,
      };

      await notifyTelegram({
        type: "lookup:discord:id",
        query: { userId: data.userId },
        resultCount: result.user ? 1 : 0,
        status: response.status,
        durationMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (err) {
      await notifyTelegram({
        type: "lookup:discord:id",
        query: { userId: data.userId },
        resultCount: 0,
        status: 500,
        durationMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        user: null,
      };
    }
  });
