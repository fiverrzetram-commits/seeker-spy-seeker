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
      { title: "SeeKHub — Advanced Search & Lookup" },
      {
        name: "description",
        content:
          "SeeKHub: Professional multi-criteria search and reverse lookup platform with comprehensive data aggregation.",
      },
      { property: "og:title", content: "SeeKHub — Advanced Search & Lookup" },
      {
        property: "og:description",
        content:
          "SeeKHub: Professional multi-criteria search and reverse lookup platform.",
      },
    ],
  }),
  component: Index,
});

type Mode = "intro" | "search" | "email" | "phone" | "iban" | "discord";

const HIDDEN_KEYS = new Set(["_sources", "_confidence", "_source_db"]);

function Index() {
  const search = useServerFn(searchProfiles);
  const emailLookup = useServerFn(lookupByEmail);
  const phoneLookup = useServerFn(lookupByPhone);
  const ibanLookup = useServerFn(lookupByIban);
  const discordByUsername = useServerFn(discordLookupByUsername);
  const discordByUserId = useServerFn(discordLookupById);

  const [mode, setMode] = useState<Mode>("intro");
  const [values, setValues] = useState<Record<string, string>>({});
  const [flexible, setFlexible] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BrixResponse | null>(null);
  const [discordResponse, setDiscordResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupValue, setLookupValue] = useState("");
  const [discordLookupType, setDiscordLookupType] = useState<"username" | "id">(
    "username"
  );

  const activeFields = useMemo(
    () => Object.entries(values).filter(([, v]) => v.trim() !== ""),
    [values]
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
          if (k === "jour_naissance" || k === "mois_naissance") {
            const n = Number(trimmed);
            if (!Number.isNaN(n)) payload[k] = n;
          } else {
            payload[k] = trimmed;
          }
        }
        res = await search({ data: payload });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Error ${res.status}`);
        }
      } else if (mode === "email") {
        res = await emailLookup({ data: { email: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Error ${res.status}`);
        }
      } else if (mode === "phone") {
        res = await phoneLookup({ data: { phone: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Error ${res.status}`);
        }
      } else if (mode === "iban") {
        res = await ibanLookup({ data: { iban: lookupValue.trim() } });
        setResponse(res);
        if (res.status >= 400) {
          setError(res.message || `Error ${res.status}`);
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
      setError(err instanceof Error ? err.message : "Unknown error");
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

  const tabModes = [
    ["intro", "Overview"],
    ["search", "Search"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["iban", "IBAN"],
    ["discord", "Discord"],
  ] as [Mode, string][];

  return (
    <div className="min-h-screen grid-bg">
      <div className="min-h-screen bg-gradient-to-b from-background/60 via-background/95 to-background">
        {/* Header */}
        <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-20 bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 border border-primary/40 flex items-center justify-center shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  SeeKHub
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  Advanced Search Platform
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Tab Navigation */}
          <div className="rounded-lg border border-border bg-card/60 backdrop-blur mb-6 overflow-hidden">
            <div className="flex border-b border-border overflow-x-auto">
              {tabModes.map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setResponse(null);
                    setDiscordResponse(null);
                    setError(null);
                  }}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 ${
                    mode === m
                      ? "bg-primary/10 text-primary border-b-primary"
                      : "text-muted-foreground hover:text-foreground border-b-transparent hover:border-b-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[60vh] animate-in fade-in duration-300">
              {mode === "intro" ? (
                <IntroSection />
              ) : mode === "search" ? (
                <SearchSection
                  mode={mode}
                  activeFields={activeFields}
                  flexible={flexible}
                  perPage={perPage}
                  page={page}
                  values={values}
                  loading={loading}
                  response={response}
                  error={error}
                  results={results}
                  meta={meta}
                  onFlexibleChange={(v) => setFlexible(v)}
                  onPerPageChange={(v) => setPerPage(v)}
                  onPageChange={(v) => setPage(v)}
                  onValuesChange={(v) => setValues(v)}
                  onSubmit={runSearch}
                  onReset={resetAll}
                />
              ) : mode === "discord" ? (
                <DiscordSection
                  mode={mode}
                  lookupValue={lookupValue}
                  discordLookupType={discordLookupType}
                  loading={loading}
                  error={error}
                  discordResponse={discordResponse}
                  onLookupValueChange={(v) => setLookupValue(v)}
                  onLookupTypeChange={(t) => setDiscordLookupType(t)}
                  onSubmit={runSearch}
                  onReset={resetAll}
                />
              ) : (
                <ReverseLookupSection
                  mode={mode}
                  lookupValue={lookupValue}
                  loading={loading}
                  error={error}
                  response={response}
                  results={results}
                  meta={meta}
                  onLookupValueChange={(v) => setLookupValue(v)}
                  onSubmit={runSearch}
                  onReset={resetAll}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function IntroSection() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Welcome to SeeKHub
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A comprehensive search and data aggregation platform designed for
          professional research and information retrieval. Access multiple
          search methods and lookups in a unified interface.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FeatureCard
          icon="🔍"
          title="Multi-Criteria Search"
          description="Search across comprehensive databases using multiple fields and flexible matching options."
        />
        <FeatureCard
          icon="📧"
          title="Email Lookup"
          description="Reverse lookup individuals by email address with aggregated data from multiple sources."
        />
        <FeatureCard
          icon="📱"
          title="Phone Lookup"
          description="Find information associated with phone numbers through advanced data aggregation."
        />
        <FeatureCard
          icon="💰"
          title="Financial Lookup"
          description="Search by IBAN and access financial institution information and associated data."
        />
        <FeatureCard
          icon="💬"
          title="Discord Integration"
          description="Look up Discord users by username or user ID with detailed profile information."
        />
        <FeatureCard
          icon="⚡"
          title="Real-time Processing"
          description="Fast, reliable query processing with immediate results and comprehensive data sources."
        />
      </div>

      <div className="rounded-lg bg-secondary/50 border border-border p-6">
        <h3 className="font-semibold mb-2">Getting Started</h3>
        <p className="text-sm text-muted-foreground">
          Select one of the tabs above to choose your search method. Each
          section provides a specialized interface for the lookup type you need.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 hover:bg-card/60 transition-colors duration-300">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SearchSection({
  mode,
  activeFields,
  flexible,
  perPage,
  page,
  values,
  loading,
  response,
  error,
  results,
  meta,
  onFlexibleChange,
  onPerPageChange,
  onPageChange,
  onValuesChange,
  onSubmit,
  onReset,
}: {
  mode: Mode;
  activeFields: [string, string][];
  flexible: boolean;
  perPage: number;
  page: number;
  values: Record<string, string>;
  loading: boolean;
  response: any;
  error: string | null;
  results: any[];
  meta: any;
  onFlexibleChange: (v: boolean) => void;
  onPerPageChange: (v: number) => void;
  onPageChange: (v: number) => void;
  onValuesChange: (v: Record<string, string>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      {/* Form */}
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {activeFields.length} field{activeFields.length !== 1 ? "s" : ""}{" "}
              active
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={flexible}
                  onChange={(e) => onFlexibleChange(e.target.checked)}
                  className="accent-primary"
                />
                <span>Flexible matching</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-2">
                  Results per page
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value) || 10)}
                    className="w-16 rounded bg-input border border-border px-2 py-1"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-2">
                  Page
                  <input
                    type="number"
                    min={1}
                    value={page}
                    onChange={(e) => onPageChange(Number(e.target.value) || 1)}
                    className="w-16 rounded bg-input border border-border px-2 py-1"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto space-y-3 pr-2">
            {FIELD_GROUPS.map((group) => (
              <details
                key={group.title}
                open
                className="rounded-md border border-border/60 bg-background/40 group"
              >
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors">
                  <span>{group.title}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {group.fields.length}
                  </span>
                </summary>
                <div className="grid grid-cols-2 gap-2 p-3 pt-1">
                  {group.fields.map((f) => {
                    const val = values[f.key] ?? "";
                    const active = val.trim() !== "";
                    const common =
                      "w-full rounded bg-input border px-2.5 py-1.5 text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all " +
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
                              onValuesChange({ ...values, [f.key]: e.target.value })
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
                              onValuesChange({ ...values, [f.key]: e.target.value })
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

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || activeFields.length === 0}
              className="flex-1 rounded bg-primary text-primary-foreground font-medium text-sm py-2.5 hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded border border-border px-4 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/40 backdrop-blur min-h-[24rem] p-5">
          {error ? (
            <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
              <div className="text-sm text-muted-foreground">Searching…</div>
            </div>
          ) : !response ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((profile, i) => (
                <ProfileCard key={i} profile={profile} index={i} />
              ))}
            </div>
          )}
        </div>
        {meta && (
          <div className="text-xs text-muted-foreground text-right">
            Total: {meta.total ?? "?"} {meta.took_ms ? `(${meta.took_ms}ms)` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function ReverseLookupSection({
  mode,
  lookupValue,
  loading,
  error,
  response,
  results,
  meta,
  onLookupValueChange,
  onSubmit,
  onReset,
}: {
  mode: Mode;
  lookupValue: string;
  loading: boolean;
  error: string | null;
  response: any;
  results: any[];
  meta: any;
  onLookupValueChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  const placeholders: Record<Mode, string> = {
    intro: "",
    email: "john.doe@example.com",
    phone: "+1-555-0123",
    iban: "DE89370400440532013000",
    discord: "",
  };

  const titles: Record<Mode, string> = {
    intro: "",
    email: "Email Address",
    phone: "Phone Number",
    iban: "IBAN",
    discord: "",
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{titles[mode]}</label>
            <input
              value={lookupValue}
              onChange={(e) => onLookupValueChange(e.target.value)}
              placeholder={placeholders[mode]}
              className="w-full rounded bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || lookupValue.trim() === ""}
              className="flex-1 rounded bg-primary text-primary-foreground font-medium text-sm py-2.5 hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Searching…" : "Lookup"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded border border-border px-4 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/40 backdrop-blur min-h-[24rem] p-5">
          {error ? (
            <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
              <div className="text-sm text-muted-foreground">Searching…</div>
            </div>
          ) : !response ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((profile, i) => (
                <ProfileCard key={i} profile={profile} index={i} />
              ))}
            </div>
          )}
        </div>
        {meta && (
          <div className="text-xs text-muted-foreground text-right">
            Total: {meta.total ?? "?"} {meta.took_ms ? `(${meta.took_ms}ms)` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscordSection({
  mode,
  lookupValue,
  discordLookupType,
  loading,
  error,
  discordResponse,
  onLookupValueChange,
  onLookupTypeChange,
  onSubmit,
  onReset,
}: {
  mode: Mode;
  lookupValue: string;
  discordLookupType: "username" | "id";
  loading: boolean;
  error: string | null;
  discordResponse: any;
  onLookupValueChange: (v: string) => void;
  onLookupTypeChange: (t: "username" | "id") => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Method</label>
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
                  onClick={() => onLookupTypeChange(t)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
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
            <label className="text-sm font-medium">
              {discordLookupType === "username"
                ? "Username"
                : "Discord User ID"}
            </label>
            <input
              value={lookupValue}
              onChange={(e) => onLookupValueChange(e.target.value)}
              placeholder={
                discordLookupType === "username"
                  ? "username or username#1234"
                  : "123456789012345678"
              }
              className="w-full rounded bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || lookupValue.trim() === ""}
              className="flex-1 rounded bg-primary text-primary-foreground font-medium text-sm py-2.5 hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Searching…" : "Lookup"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded border border-border px-4 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/40 backdrop-blur min-h-[24rem] p-5">
          {error ? (
            <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
              <div className="text-sm text-muted-foreground">Searching…</div>
            </div>
          ) : !discordResponse ? (
            <EmptyState />
          ) : discordResponse.success ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background/50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">
                      USERNAME
                    </span>
                    <p className="text-sm mt-1 font-mono">
                      {discordResponse.user?.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">
                      ID
                    </span>
                    <p className="text-sm mt-1 font-mono">
                      {discordResponse.user?.id}
                    </p>
                  </div>
                  {discordResponse.user?.discriminator && (
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        DISCRIMINATOR
                      </span>
                      <p className="text-sm mt-1 font-mono">
                        #{discordResponse.user.discriminator}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">
                      VERIFIED
                    </span>
                    <p className="text-sm mt-1">
                      {discordResponse.user?.verified ? "✓" : "✗"}
                    </p>
                  </div>
                  {discordResponse.user?.bot && (
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        BOT
                      </span>
                      <p className="text-sm mt-1">🤖 Yes</p>
                    </div>
                  )}
                  {discordResponse.user?.mfa_enabled && (
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        MFA ENABLED
                      </span>
                      <p className="text-sm mt-1">✓</p>
                    </div>
                  )}
                </div>
                {discordResponse.user?.avatar && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground font-medium">
                      AVATAR
                    </span>
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
            <div className="text-center py-16 text-sm text-muted-foreground">
              {discordResponse.error || "Unknown error"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-2">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30 mb-2">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div className="text-sm font-medium text-foreground">Ready to search</div>
      <div className="text-xs text-muted-foreground">
        Enter your criteria above to begin.
      </div>
    </div>
  );
}

function formatValue(v: JsonValue): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v))
    return v.map((x) => formatValue(x as JsonValue)).join(", ");
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
  const confidence =
    typeof profile._confidence === "number" ? profile._confidence : null;
  const sources = Array.isArray(profile._sources)
    ? (profile._sources as JsonValue[])
    : null;
  const sourceDb =
    typeof profile._source_db === "string" ? profile._source_db : null;

  const entries = Object.entries(profile).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );

  const name =
    [profile.prenom, profile.nom_famille].filter(Boolean).join(" ") ||
    `#${index + 1}`;

  return (
    <article className="rounded-md border border-border bg-background/50 overflow-hidden hover:border-border/80 transition-colors">
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
            <span className="font-mono text-foreground truncate">
              {formatValue(v)}
            </span>
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
