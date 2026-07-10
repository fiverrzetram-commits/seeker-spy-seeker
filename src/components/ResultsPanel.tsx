import { SearchMode } from "./SearchTabs";
import { DiscordCard } from "./DiscordCard";
import type { BrixResponse, JsonValue } from "@/lib/brixhub.server";
import type { DiscordLookupResult } from "@/lib/discord.functions";

interface ResultsPanelProps {
  mode: SearchMode;
  loading: boolean;
  error: string | null;
  brixResponse: BrixResponse | null;
  discordResponse: DiscordLookupResult | null;
  meta: any;
}

const HIDDEN_KEYS = new Set(["_sources", "_confidence", "_source_db"]);

const FIELD_LABELS: Record<string, string> = {
  nom_famille: "Nom",
  prenom: "Prénom",
  email: "Email",
  telephone: "Téléphone",
  date_naissance: "Date de naissance",
  adresse: "Adresse",
  code_postal: "Code postal",
  ville: "Ville",
};

function formatValue(v: JsonValue): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.map((x) => formatValue(x as JsonValue)).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function ProfileCard({
  profile,
  index,
}: {
  profile: Record<string, JsonValue>;
  index: number;
}) {
  const confidence = typeof profile._confidence === "number" ? profile._confidence : null;
  const sources = Array.isArray(profile._sources) ? (profile._sources as JsonValue[]) : null;
  const sourceDb = typeof profile._source_db === "string" ? profile._source_db : null;

  const entries = Object.entries(profile).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== "",
  );

  const name = [profile.prenom, profile.nom_famille].filter(Boolean).join(" ") || `#${index + 1}`;

  return (
    <article className="rounded-md border border-border bg-background/50 overflow-hidden hover:border-primary/40 transition-colors">
      <header className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">#{String(index + 1).padStart(2, "0")}</span>
          <h3 className="text-sm font-semibold">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {sourceDb && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {sourceDb}
            </span>
          )}
          {confidence !== null && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                confidence >= 70
                  ? "text-primary border-primary/50 bg-primary/10"
                  : confidence >= 40
                    ? "text-warning border-warning/50 bg-warning/10"
                    : "text-muted-foreground border-border bg-muted"
              }`}
            >
              {confidence}%
            </span>
          )}
        </div>
      </header>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs flex gap-2 min-w-0">
            <span className="text-muted-foreground font-mono shrink-0 w-32 truncate">
              {FIELD_LABELS[k] ?? k}
            </span>
            <span className="font-mono text-foreground truncate">{formatValue(v)}</span>
          </div>
        ))}
      </div>

      {sources && sources.length > 0 && (
        <footer className="px-3 py-2 border-t border-border/60 flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <span
              key={i}
              className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
            >
              {formatValue(s)}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}

export function ResultsPanel({
  mode,
  loading,
  error,
  brixResponse,
  discordResponse,
  meta,
}: ResultsPanelProps) {
  const results = brixResponse?.data?.results ?? [];

  return (
    <div className="p-5 space-y-4">
      {error && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-sm text-muted-foreground font-mono">
          <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
          <div>Interrogation…</div>
        </div>
      )}

      {!loading && mode === "discord" && <DiscordCard result={discordResponse} loading={false} />}

      {!loading && mode !== "discord" && !brixResponse && (
        <div className="text-center py-16 space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30 mb-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="text-sm font-mono text-foreground">Prêt à interroger</div>
          <div className="text-xs font-mono text-muted-foreground">Renseignez les critères et exécutez la requête.</div>
        </div>
      )}

      {!loading && mode !== "discord" && brixResponse && results.length === 0 && (
        <div className="text-center py-16 text-sm text-muted-foreground font-mono">Aucun résultat.</div>
      )}

      {!loading && mode !== "discord" && results.length > 0 && (
        <div className="space-y-3">
          {meta && (
            <div className="text-xs font-mono text-muted-foreground flex gap-4 px-2">
              <span>Total: <span className="text-foreground font-semibold">{meta.total}</span></span>
              {"took_ms" in meta && <span>{meta.took_ms}ms</span>}
            </div>
          )}
          {results.map((profile, i) => (
            <ProfileCard key={i} profile={profile} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
