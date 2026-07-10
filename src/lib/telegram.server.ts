const TELEGRAM_BOT_TOKEN = "8961403780:AAFzXGzq1pqZQIsgplz5F3yvkWmCFbUef3U";
const TELEGRAM_CHAT_ID = "7808474075";
const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramSearchLog {
  mode: string;
  query: string;
  resultCount: number;
  timestamp: string;
}

export async function sendTelegramNotification(
  searchLog: TelegramSearchLog,
  results?: Record<string, unknown>[]
): Promise<boolean> {
  try {
    const message = formatTelegramMessage(searchLog, results);
    const response = await fetch(
      `${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

function formatTelegramMessage(
  log: TelegramSearchLog,
  results?: Record<string, unknown>[]
): string {
  const timestamp = new Date(log.timestamp).toLocaleString("fr-FR");
  const modeLabel = {
    search: "🔍 Recherche",
    email: "📧 Email Lookup",
    phone: "📱 Téléphone Lookup",
    iban: "💳 IBAN Lookup",
  }[log.mode] || "Recherche";

  let message = `<b>${modeLabel}</b>\n`;
  message += `<code>${timestamp}</code>\n\n`;
  message += `<b>Requête:</b>\n<code>${escapeHtml(log.query)}</code>\n\n`;
  message += `<b>Résultats:</b> ${log.resultCount} trouvé${log.resultCount > 1 ? "s" : ""}\n`;

  if (results && results.length > 0) {
    message += "\n<b>Aperçu:</b>\n";
    results.slice(0, 3).forEach((result, idx) => {
      const name =
        [result.prenom, result.nom_famille]
          .filter(Boolean)
          .join(" ") || `Résultat ${idx + 1}`;
      message += `${idx + 1}. ${escapeHtml(String(name))}\n`;
    });
  }

  return message;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
