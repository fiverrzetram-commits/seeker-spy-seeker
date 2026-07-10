import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  searchProfiles,
  lookupByEmail,
  lookupByPhone,
  lookupByIban,
} from "@/lib/brixhub.functions";
import {
  discordLookupByUsername,
  discordLookupById,
} from "@/lib/discord.functions";
import { FIELD_GROUPS, FIELD_LABELS } from "@/lib/brixhub-fields";
import type { BrixResponse, JsonValue } from "@/lib/brixhub.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrixOSINT — Recherche multi-critères (Test)" },
      {
        name: "description",
        content:
          "Interface de test pour l'API BrixHub : recherche OSINT multi-critères et reverse lookup. Données 100% fictives.",
      },
      { property: "og:title", content: "BrixOSINT — Recherche multi-critères (Test)" },
      { property: "og:description", content: "Interface de test pour l'API BrixHub : recherche OSINT multi-critères et reverse lookup. Données 100% fictives." },
    ],
  }),
  component: Index,
});

type Mode = "search" | "email" | "phone" | "iban" | "discord";

const HIDDEN_KEYS = new Set(["_sources", "_confidence", "_source_db"]);

function Index() {
  const search = useServerFn(searchProfiles);
  const emailLookup = useServerFn(lookupByEmail);
  const phoneLookup = useServerFn(lookupByPhone);
  const ibanLookup = useServerFn(lookupByIban);
  const discordByUsername = useServerFn(discordLookupByUsername);
  const discordByUserId = useServerFn(discordLookupById);

  const [mode, setMode] = useState<Mode>("search");
  const [values, setValues] = useState<Record<string, string>>({});
  const [flexible, setFlexible] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BrixResponse | null>(null);
  const [discordResponse, setDiscordResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupValue, setLookupValue] = useState("");
  const [discordLookupType, setDiscordLookupType] = useState<"username" | "id">("username");

  const activeFields = useMemo(
    () => Object.entries(values).filter(([, v]) => v.trim() !== ""),
    [values],
  );

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setDiscordResponse(null);
    try {
      let res: any;
      if (mode === "search") {
        const payload: Record<string, string | number | boolean> = {
          flexible,
          per_page: perPage,
          page,
        };
        for (const [k, v] of activeFields) {
          const trimmed = v.trim();
          if (
            k === "jour_naissance" ||
            k === "mois_naissance"
          ) {
            const n = Number(trimmed);
            if (!Number.isNaN(n)) payload[k] = n;
          } else {
            payload[k] = trimmed;
          }
        }
        res = await search({ data: payload });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Erreur ${res.status}`);
        }
      } else if (mode === "email") {
        res = await emailLookup({ data: { email: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Erreur ${res.status}`);
        }
      } else if (mode === "phone") {
        res = await phoneLookup({ data: { phone: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Erreur ${res.status}`);
        }
      } else if (mode === "iban") {
        res = await ibanLookup({ data: { iban: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Erreur ${res.status}`);
        }
      } else if (mode === "discord") {
        if (discordLookupType === "username") {
          const parts = lookupValue.trim().split("#");
          const username = parts[0];
          const discriminator = parts[1];
          res = await discordByUsername({
            data: {
              username,
              discriminator: discriminator || undefined,
            },
          });
        } else {
          res = await discordByUserId({ data: { userId: lookupValue.trim() } });
        }
        setDiscordResponse(res);
        if (!res.success) {
          setError(res.error || "Unknown error");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setValues({});
    setResponse(null);
    setDiscordResponse(null);
    setError(null);
    setLookupValue("");
    setPage(1);
  }

  const results = response?.data?.results ?? [];
  const meta = response?.meta ?? null;

  return (
    <div className="min-h-screen grid-bg">
      <div className="min-h-screen bg-gradient-to-b from-background/60 via-background/95 to-background">
        <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-20 bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center glow">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Brix<span className="text-primary">OSINT</span>
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  pentest console · v1 · api.brixhub.is
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">TEST MODE — données fictives</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* LEFT — form */}
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-card/60 backdrop-blur">
              <div className="flex border-b border-border overflow-x-auto">
                {(
                  [
                    ["search", "Recherche"],
                    ["email", "Email"],
                    ["phone", "Téléphone"],
                    ["iban", "IBAN"],
                    ["discord", "Discord"],
                  ] as [Mode, string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setResponse(null);
                      setDiscordResponse(null);
                      setError(null);
                    }}
                    className={`flex-shrink-0 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                      mode === m
                        ? "bg-primary/10 text-primary border-b-2 border-primary -mb-px"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={runSearch} className="p-5 space-y-5">
                {mode === "search" ? (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs font-mono text-muted-foreground">
                        {activeFields.length} champ{activeFields.length > 1 ? "s" : ""} actif
                        {activeFields.length > 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-mono">
                          <input
                            type="checkbox"
                            checked={flexible}
                            onChange={(e) => setFlexible(e.target.checked)}
                            className="accent-primary"
                          />
                          flexible
                        </label>
                        <label className="flex items-center gap-2 text-xs font-mono">
                          per_page
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value) || 10)}
                            className="w-14 rounded bg-input border border-border px-1.5 py-0.5 text-foreground"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-mono">
                          page
                          <input
                            type="number"
                            min={1}
                            value={page}
                            onChange={(e) => setPage(Number(e.target.value) || 1)}
                            className="w-14 rounded bg-input border border-border px-1.5 py-0.5 text-foreground"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 -mr-1">
                      {FIELD_GROUPS.map((group) => (
                        <details
                          key={group.title}
                          open
                          className="rounded-md border border-border/60 bg-background/40 group"
                        >
                          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center justify-between">
                            <span>{group.title}</span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {group.fields.length}
                            </span>
                          </summary>
                          <div className="grid grid-cols-2 gap-2 p-3 pt-1">
                            {group.fields.map((f) => {
                              const val = values[f.key] ?? "";
                              const active = val.trim() !== "";
                              const common =
                                "w-full rounded bg-input border px-2.5 py-1.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 " +
                                (active ? "border-primary/60" : "border-border");
                              return (
                                <div key={f.key} className="space-y-1">
                                  <label className="block text-[11px] text-muted-foreground">
                                    {f.label}
                                  </label>
                                  {f.type === "select" ? (
                                    <select
                                      value={val}
                                      onChange={(e) =>
                                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                                      }
                                      className={common}
                                    >
                                      {f.options?.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type === "number" ? "number" : "text"}
                                      value={val}
                                      placeholder={f.placeholder ?? ""}
                                      onChange={(e) =>
                                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                                      }
                                      className={common}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </>
                ) : mode === "discord" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Méthode de recherche
                      </label>
                      <div className="flex gap-2">
                        {(
                          [
                            ["username", "Username"],
                            ["id", "User ID"],
                          ] as [typeof discordLookupType, string][]
                        ).map(([t, label]) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDiscordLookupType(t)}
                            className={`flex-1 px-3 py-2 text-xs font-mono rounded transition-colors ${
                              discordLookupType === t
                                ? "bg-primary/20 text-primary border border-primary/60"
                                : "bg-input border border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {discordLookupType === "username"
                          ? "Username (ou username#discriminator)"
                          : "Discord User ID"}
                      </label>
                      <input
                        value={lookupValue}
                        onChange={(e) => setLookupValue(e.target.value)}
                        placeholder={
                          discordLookupType === "username"
                            ? "username ou username#1234"
                            : "123456789012345678"
                        }
                        className="w-full rounded bg-input border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {discordLookupType === "username"
                          ? "Recherche par username Discord (ancien format avec #discriminator optionnel ou nouveau format sans discriminator)"
                          : "Recherche par ID utilisateur Discord"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {mode === "email"
                        ? "Adresse email"
                        : mode === "phone"
                          ? "Numéro de téléphone"
                          : "IBAN"}
                    </label>
                    <input
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      placeholder={
                        mode === "email"
                          ? "jean.dupont@example.com"
                          : mode === "phone"
                            ? "0612345678"
                            : "FR7630006000011234567890189"
                      }
                      className="w-full rounded bg-input border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Reverse lookup — retourne les enregistrements bruts par source.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (mode === "search" ? activeFields.length === 0 : lookupValue.trim() === "")
                    }
                    className="flex-1 rounded bg-primary text-primary-foreground font-mono uppercase text-xs tracking-wider py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Interrogation…" : "Exécuter ▸"}
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded border border-border px-4 text-xs font-mono uppercase tracking-wider hover:bg-secondary transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* RIGHT — results */}
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-card/60 backdrop-blur min-h-[24rem]">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {mode === "discord" ? "Discord Lookup" : "Résultats"}
                </div>
                {meta ? (
                  <div className="text-xs font-mono text-muted-foreground flex gap-3">
                    <span>total: <span className="text-foreground">{String(meta.total ?? "?")}</span></span>
                    {"took_ms" in meta && (
                      <span>{String(meta.took_ms)}ms</span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="p-5">
                {error ? (
                  <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
                    {error}
                  </div>
                ) : loading ? (
                  <div className="text-center py-16 text-sm text-muted-foreground font-mono">
                    <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
                    <div>Interrogation…</div>
                  </div>
                ) : mode === "discord" ? (
                  discordResponse ? (
                    discordResponse.success ? (
                      <div className="space-y-4">
                        <div className="rounded-md border border-border bg-background/50 p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground font-mono">USERNAME</span>
                              <p className="font-mono text-sm mt-1">{discordResponse.user?.username}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground font-mono">ID</span>
                              <p className="font-mono text-sm mt-1">{discordResponse.user?.id}</p>
                            </div>
                            {discordResponse.user?.discriminator && (
                              <div>
                                <span className="text-xs text-muted-foreground font-mono">DISCRIMINATOR</span>
                                <p className="font-mono text-sm mt-1">#{discordResponse.user.discriminator}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-muted-foreground font-mono">VERIFIED</span>
                              <p className="font-mono text-sm mt-1">{discordResponse.user?.verified ? "✓" : "✗"}</p>
                            </div>
                            {discordResponse.user?.bot && (
                              <div>
                                <span className="text-xs text-muted-foreground font-mono">BOT</span>
                                <p className="font-mono text-sm mt-1">🤖 Yes</p>
                              </div>
                            )}
                            {discordResponse.user?.mfa_enabled && (
                              <div>
                                <span className="text-xs text-muted-foreground font-mono">MFA ENABLED</span>
                                <p className="font-mono text-sm mt-1">✓</p>
                              </div>
                            )}
                            {discordResponse.user?.locale && (
                              <div>
                                <span className="text-xs text-muted-foreground font-mono">LOCALE</span>
                                <p className="font-mono text-sm mt-1">{discordResponse.user.locale}</p>
                              </div>
                            )}
                            {discordResponse.user?.premium_type > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground font-mono">NITRO</span>
                                <p className="font-mono text-sm mt-1">
                                  {discordResponse.user.premium_type === 1
                                    ? "Classic"
                                    : discordResponse.user.premium_type === 2
                                      ? "Full"
                                      : "Basic"}
                                </p>
                              </div>
                            )}
                          </div>
                          {discordResponse.user?.avatar && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <span className="text-xs text-muted-foreground font-mono">AVATAR</span>
                              <div className="mt-2">
                                <img
                                  src={`https://cdn.discordapp.com/avatars/${discordResponse.user.id}/${discordResponse.user.avatar}.png`}
                                  alt="Discord Avatar"
                                  className="w-16 h-16 rounded-full"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-sm text-muted-foreground font-mono">
                        {discordResponse.error || "Unknown error"}
                      </div>
                    )
                  ) : (
                    <EmptyState />
                  )
                ) : !response ? (
                  <EmptyState />
                ) : results.length === 0 ? (
                  <div className="text-center py-16 text-sm text-muted-foreground font-mono">
                    Aucun résultat.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((profile, i) => (
                      <ProfileCard key={i} profile={profile} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 text-[11px] font-mono text-muted-foreground leading-relaxed">
              ⚠ Interface de test / démonstration. L'API BrixHub renvoie des données{" "}
              <span className="text-foreground">fictives</span>. Cet outil est destiné à
              l'apprentissage du pentesting et de l'OSINT dans un cadre légal uniquement.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-2">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30 mb-2">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div className="text-sm font-mono text-foreground">Prêt à interroger</div>
      <div className="text-xs font-mono text-muted-foreground">
        Renseignez un ou plusieurs champs puis exécutez la requête.
      </div>
    </div>
  );
}

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
    <article className="rounded-md border border-border bg-background/50 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            #{String(index + 1).padStart(2, "0")}
          </span>
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
