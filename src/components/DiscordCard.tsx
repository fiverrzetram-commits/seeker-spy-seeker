import type { DiscordLookupResult } from "@/lib/discord.functions";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface DiscordCardProps {
  result: DiscordLookupResult | null;
  loading: boolean;
}

export function DiscordCard({ result, loading }: DiscordCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground font-mono">
        <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
        <div>Recherche Discord…</div>
      </div>
    );
  }

  if (!result || !result.success || !result.user) {
    return null;
  }

  const user = result.user;
  const tag = user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`;
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header avec avatar */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-purple-500/10 to-background/50 p-4">
        <div className="flex items-start gap-4">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-20 h-20 rounded-full border-2 border-primary/30"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-foreground break-all">{tag}</h3>
              {user.bot && <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-200">🤖 Bot</span>}
              {user.system && <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-200">⚙️ System</span>}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {user.id}</p>
          </div>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* ID */}
        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            ID
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm break-all">{user.id}</span>
            <button
              onClick={() => copyToClipboard(user.id, "id")}
              className="p-1 rounded hover:bg-primary/20 transition-colors"
              title="Copier"
            >
              {copied === "id" ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Username */}
        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Username
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm break-all">{user.username}</span>
            <button
              onClick={() => copyToClipboard(user.username, "username")}
              className="p-1 rounded hover:bg-primary/20 transition-colors"
              title="Copier"
            >
              {copied === "username" ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Verificaton */}
        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Vérification
          </div>
          <span className={`text-sm font-mono ${user.verified ? "text-green-400" : "text-muted-foreground"}` }>
            {user.verified ? "✓ Vérifié" : "✗ Non vérifié"}
          </span>
        </div>

        {/* MFA */}
        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            MFA
          </div>
          <span className={`text-sm font-mono ${user.mfa_enabled ? "text-green-400" : "text-muted-foreground"}` }>
            {user.mfa_enabled ? "✓ Activé" : "✗ Désactivé"}
          </span>
        </div>

        {/* Locale */}
        {user.locale && (
          <div className="rounded-md border border-border/60 bg-background/30 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Locale
            </div>
            <span className="text-sm font-mono">{user.locale}</span>
          </div>
        )}

        {/* Nitro */}
        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Nitro
          </div>
          <span className="text-sm font-mono">
            {user.premium_type === 0
              ? "Aucun"
              : user.premium_type === 1
                ? "Classic"
                : user.premium_type === 2
                  ? "Full"
                  : "Basic"}
          </span>
        </div>
      </div>

      {/* Flags additionnels */}
      <div className="rounded-md border border-border/60 bg-background/30 p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Métadonnées
        </div>
        <div className="space-y-1 text-xs font-mono text-muted-foreground">
          <div>Public Flags: {user.public_flags}</div>
          <div>Flags: {user.flags}</div>
          {user.email && <div>Email: {user.email}</div>}
        </div>
      </div>
    </div>
  );
}
