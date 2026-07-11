/**
 * Telegram notification logger.
 * Logs all investigation queries to a configured Telegram chat.
 * Credentials are read from process.env — never hardcoded.
 */

export interface LogEntry {
  type: string;
  query: Record<string, unknown>;
  resultCount: number;
  status: number;
  durationMs: number;
  timestamp: string;
}

export async function notifyTelegram(entry: LogEntry): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const escapeMd = (s: string) =>
    s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

  const queryLines = Object.entries(entry.query)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `  • ${escapeMd(k)}: ${escapeMd(String(v))}`)
    .join("\n");

  const statusIcon =
    entry.status >= 200 && entry.status < 300 ? "✅" : "❌";

  const text = [
    `*SeeKHub \\- OSINT Query Log*`,
    ``,
    `${statusIcon} *Type:* ${escapeMd(entry.type)}`,
    `⏱ *Duration:* ${entry.durationMs}ms`,
    `📊 *Results:* ${entry.resultCount}`,
    `📡 *Status:* ${entry.status}`,
    `🕒 *Time:* ${escapeMd(entry.timestamp)}`,
    ``,
    `*Query parameters:*`,
    queryLines || "  _\\(none\\)_",
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram logging is best-effort; never block the query on it.
  }
}
