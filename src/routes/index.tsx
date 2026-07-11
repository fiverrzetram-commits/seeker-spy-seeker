import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
      { title: "SeeKHub — OSINT Investigation Platform" },
      {
        name: "description",
        content:
          "SeeKHub is a comprehensive OSINT search and data aggregation platform for professional research and information retrieval.",
      },
      {
        property: "og:title",
        content: "SeeKHub — OSINT Investigation Platform",
      },
      {
        property: "og:description",
        content:
          "SeeKHub is a comprehensive OSINT search and data aggregation platform.",
      },
    ],
  }),
  component: Index,
});

type Mode = "home" | "search" | "email" | "phone" | "iban" | "discord";

const HIDDEN_KEYS = new Set(["_sources", "_confidence", "_source_db"]);

function Index() {
  const search = useServerFn(searchProfiles);
  const emailLookup = useServerFn(lookupByEmail);
  const phoneLookup = useServerFn(lookupByPhone);
  const ibanLookup = useServerFn(lookupByIban);
  const discordByUsername = useServerFn(discordLookupByUsername);
  const discordByUserId = useServerFn(discordLookupById);

  const [mode, setMode] = useState<Mode>("home");
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
    "username",
  );
  const [clock, setClock] = useState("");

  const activeFields = useMemo(
    () => Object.entries(values).filter(([, v]) => v.trim() !== ""),
    [values],
  );

  // Live clock for HUD
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-GB", { hour12: false }) +
          " UTC" +
          (now.getTimezoneOffset() <= 0 ? "+" : "-") +
          String(Math.abs(now.getTimezoneOffset()) / 60).padStart(2, "0"),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.82 0.18 195 / 0.08), transparent)",
        }}
      />
      {/* Scanlines */}
      <div className="fixed inset-0 scanline pointer-events-none opacity-50" />

      {/* Top HUD bar */}
      <header className="relative z-50 border-b border-border/60 glass-strong">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setMode("home")}
          >
            <div className="relative h-10 w-10 rounded-md border border-cyan/40 flex items-center justify-center bg-cyan/5 group-hover:bg-cyan/15 transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-cyan"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <div className="absolute inset-0 rounded-md border border-cyan/20 group-hover:border-cyan/60 transition-colors" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight font-mono">
                SeeK<span className="text-cyan">Hub</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                OSINT Investigation Platform
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {(
              [
                ["home", "Home"],
                ["search", "Search"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["iban", "IBAN"],
                ["discord", "Discord"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all duration-300 ${
                  mode === m
                    ? "bg-cyan/15 text-cyan border border-cyan/40 shadow-[0_0_12px_oklch(0.82_0.18_195/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Status */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-matrix opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-matrix" />
              </span>
              <span className="text-matrix">SYS::ONLINE</span>
            </div>
            <span className="text-border">|</span>
            <span className="text-foreground/70 tabular-nums">{clock}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {mode === "home" ? (
          <HomePage onNavigate={setMode} />
        ) : mode === "search" ? (
          <SearchPage
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
            onFlexibleChange={setFlexible}
            onPerPageChange={setPerPage}
            onPageChange={setPage}
            onValuesChange={setValues}
            onSubmit={runSearch}
            onReset={resetAll}
          />
        ) : mode === "discord" ? (
          <DiscordPage
            lookupValue={lookupValue}
            discordLookupType={discordLookupType}
            loading={loading}
            error={error}
            discordResponse={discordResponse}
            onLookupValueChange={setLookupValue}
            onLookupTypeChange={setDiscordLookupType}
            onSubmit={runSearch}
            onReset={resetAll}
          />
        ) : (
          <ReverseLookupPage
            mode={mode}
            lookupValue={lookupValue}
            loading={loading}
            error={error}
            response={response}
            results={results}
            meta={meta}
            onLookupValueChange={setLookupValue}
            onSubmit={runSearch}
            onReset={resetAll}
          />
        )}
      </main>

      {/* Footer bar */}
      <footer className="relative z-10 border-t border-border/60 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>SeeKHub // OSINT TERMINAL v2.0</span>
          <span className="hidden sm:inline">CLASSIFIED — FOR AUTHORIZED USE ONLY</span>
          <span className="text-cyan/60">SECURE CHANNEL</span>
        </div>
      </footer>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (mode: Mode) => void }) {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <div className="text-center space-y-6 py-20 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono uppercase tracking-widest text-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
          System Operational
        </div>
        <h2 className="text-5xl md:text-7xl font-bold text-foreground leading-tight font-mono tracking-tight">
          SeeK<span className="text-cyan hologram">Hub</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Advanced OSINT search &amp; data aggregation platform
        </p>
        <p className="text-sm text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
          Multi-criteria search, reverse lookup, and social intelligence across
          comprehensive data sources. Professional-grade investigation tools
          with a tactical command interface.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate("search")}
            className="px-6 py-3 bg-cyan/10 border border-cyan/50 text-cyan font-mono text-sm uppercase tracking-wider rounded-md hover:bg-cyan/20 hover:shadow-[0_0_24px_oklch(0.82_0.18_195/0.4)] transition-all duration-300"
          >
            Launch Search
          </button>
          <button
            onClick={() => onNavigate("discord")}
            className="px-6 py-3 bg-transparent border border-border text-muted-foreground font-mono text-sm uppercase tracking-wider rounded-md hover:border-cyan/40 hover:text-cyan transition-all duration-300"
          >
            Discord Lookup
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["6", "Modules"],
          ["50+", "Data Fields"],
          ["5", "Lookup Modes"],
          ["24/7", "Availability"],
        ].map(([num, label]) => (
          <div
            key={label}
            className="glass rounded-md border border-border/60 p-4 text-center hover:border-cyan/40 transition-all duration-300"
          >
            <div className="text-2xl font-bold font-mono text-cyan tabular-nums">{num}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          title="Multi-Criteria Search"
          description="Search across comprehensive databases using multiple fields and flexible matching algorithms."
        />
        <FeatureCard
          title="Reverse Lookups"
          description="Find associated information using email, phone numbers, and financial identifiers."
        />
        <FeatureCard
          title="Social Intelligence"
          description="Discord user lookup with detailed profile information and verification status."
        />
      </div>

      {/* Methods */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-foreground text-center font-mono tracking-tight">
          Available Search Methods
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MethodCard
            title="General Search"
            description="Search by name, address, professional details, and more with flexible matching."
            onClick={() => onNavigate("search")}
          />
          <MethodCard
            title="Email Lookup"
            description="Reverse lookup profiles associated with email addresses."
            onClick={() => onNavigate("email")}
          />
          <MethodCard
            title="Phone Lookup"
            description="Find information linked to phone numbers."
            onClick={() => onNavigate("phone")}
          />
          <MethodCard
            title="IBAN Lookup"
            description="Search financial information by IBAN."
            onClick={() => onNavigate("iban")}
          />
          <MethodCard
            title="Discord Lookup"
            description="Look up Discord users by username or user ID."
            onClick={() => onNavigate("discord")}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass rounded-md border border-border/60 p-6 hover:border-cyan/40 hover:shadow-[0_0_24px_-8px_oklch(0.82_0.18_195/0.5)] transition-all duration-300 animate-fade-in-up">
      <div className="h-8 w-8 rounded border border-cyan/30 bg-cyan/5 flex items-center justify-center mb-4">
        <div className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-2 font-mono">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function MethodCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-md border border-border/60 p-5 text-left hover:border-cyan/50 hover:shadow-[0_0_24px_-8px_oklch(0.82_0.18_195/0.5)] hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <h4 className="text-sm font-bold text-foreground group-hover:text-cyan font-mono mb-2 transition-colors">
        {title}
      </h4>
      <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      <div className="mt-4 inline-block text-[10px] font-mono uppercase tracking-widest text-muted-foreground group-hover:text-cyan transition-colors">
        Access Module →
      </div>
    </button>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="h-4 w-1 bg-cyan" />
        <h2 className="text-2xl font-bold text-foreground font-mono tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground ml-3">{subtitle}</p>
    </div>
  );
}

function CyberButton({
  children,
  loading,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className="flex-1 bg-cyan/10 border border-cyan/50 text-cyan font-mono text-sm uppercase tracking-wider py-3 rounded-md hover:bg-cyan/20 hover:shadow-[0_0_24px_oklch(0.82_0.18_195/0.4)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {loading ? "Processing…" : children}
    </button>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 bg-transparent border border-border text-muted-foreground font-mono text-sm uppercase tracking-wider rounded-md hover:border-foreground/40 hover:text-foreground transition-all duration-300"
    >
      Reset
    </button>
  );
}

function ResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass rounded-md border border-border/60 p-6 min-h-[480px]">
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-[480px] gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan animate-spin" />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Interrogating Database…
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[480px] gap-4">
      <div className="relative h-14 w-14 rounded-full border border-cyan/20 bg-cyan/5 flex items-center justify-center">
        <svg
          className="h-6 w-6 text-cyan/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <div className="absolute inset-0 rounded-full border border-cyan/10 animate-ping" />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Awaiting Input
      </p>
      <p className="text-[10px] font-mono text-muted-foreground/60">
        Enter search criteria to begin query
      </p>
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive text-xs font-mono">
      <span className="opacity-70">[ERROR] </span>
      {error}
    </div>
  );
}

function SearchPage({
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
}: any) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PanelTitle title="General Search" subtitle="Multi-criteria query with flexible matching" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={onSubmit}
            className="glass rounded-md border border-border/60 p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Active Fields
              </label>
              <span className="text-sm font-mono font-bold text-cyan tabular-nums">
                {String(activeFields.length).padStart(2, "0")}
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={flexible}
                onChange={(e) => onFlexibleChange(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-input accent-cyan"
              />
              Flexible matching
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Per page
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={perPage}
                  onChange={(e) => onPerPageChange(Number(e.target.value) || 10)}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-input text-sm font-mono text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Page
                </label>
                <input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => onPageChange(Number(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-input text-sm font-mono text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 border-t border-border/60 pt-4 pr-1">
              {FIELD_GROUPS.map((group: any) => (
                <details
                  key={group.title}
                  open
                  className="group rounded-md border border-border/60 hover:border-cyan/30 transition-colors"
                >
                  <summary className="cursor-pointer p-3 text-xs font-mono uppercase tracking-wider text-foreground flex justify-between items-center list-none">
                    <span>{group.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      [{group.fields.length}]
                    </span>
                  </summary>
                  <div className="grid grid-cols-2 gap-2 p-3 pt-0 border-t border-border/40">
                    {group.fields.map((f: any) => {
                      const val = values[f.key] ?? "";
                      return (
                        <div key={f.key}>
                          <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                            {f.label}
                          </label>
                          {f.type === "select" ? (
                            <select
                              value={val}
                              onChange={(e) =>
                                onValuesChange({ ...values, [f.key]: e.target.value })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-input text-xs font-mono text-foreground focus:outline-none"
                            >
                              {f.options?.map((o: any) => (
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
                              className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-input text-xs font-mono text-foreground focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <CyberButton type="submit" loading={loading} disabled={activeFields.length === 0}>
                Execute Query
              </CyberButton>
              <ResetButton onClick={onReset} />
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <ResultsShell>
            {error ? (
              <ErrorBanner error={error} />
            ) : loading ? (
              <LoadingState />
            ) : !response ? (
              <EmptyState />
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[480px] gap-2">
                <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  No Results Found
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60">
                  Query returned 0 records
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meta && (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex gap-4 pb-2 border-b border-border/60">
                    <span>
                      Total: <span className="text-cyan">{String(meta.total)}</span>
                    </span>
                    {"took_ms" in meta && <span>{String(meta.took_ms)}ms</span>}
                  </div>
                )}
                {results.map((profile: any, i: number) => (
                  <ProfileCard key={i} profile={profile} index={i} />
                ))}
              </div>
            )}
          </ResultsShell>
        </div>
      </div>
    </div>
  );
}

function ReverseLookupPage({
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
}: any) {
  const titles: Record<string, string> = {
    email: "Email Lookup",
    phone: "Phone Lookup",
    iban: "IBAN Lookup",
  };
  const placeholders: Record<string, string> = {
    email: "john@example.com",
    phone: "+1-555-0123",
    iban: "DE89370400440532013000",
  };
  const descriptions: Record<string, string> = {
    email: "Find profiles associated with an email address",
    phone: "Find information linked to a phone number",
    iban: "Look up financial information by IBAN",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PanelTitle title={titles[mode]} subtitle={descriptions[mode]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form
            onSubmit={onSubmit}
            className="glass rounded-md border border-border/60 p-6 space-y-5"
          >
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">
                {titles[mode].split(" ")[0]} Target
              </label>
              <input
                value={lookupValue}
                onChange={(e) => onLookupValueChange(e.target.value)}
                placeholder={placeholders[mode]}
                className="w-full px-4 py-3 rounded-md border border-border bg-input text-sm font-mono text-foreground focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <CyberButton type="submit" loading={loading} disabled={lookupValue.trim() === ""}>
                Execute Lookup
              </CyberButton>
              <ResetButton onClick={onReset} />
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <ResultsShell>
            {error ? (
              <ErrorBanner error={error} />
            ) : loading ? (
              <LoadingState />
            ) : !response ? (
              <EmptyState />
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[480px] gap-2">
                <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  No Results Found
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60">
                  Lookup returned 0 records
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meta && (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex gap-4 pb-2 border-b border-border/60">
                    <span>
                      Total: <span className="text-cyan">{String(meta.total)}</span>
                    </span>
                  </div>
                )}
                {results.map((profile: any, i: number) => (
                  <ProfileCard key={i} profile={profile} index={i} />
                ))}
              </div>
            )}
          </ResultsShell>
        </div>
      </div>
    </div>
  );
}

function DiscordPage({
  lookupValue,
  discordLookupType,
  loading,
  error,
  discordResponse,
  onLookupValueChange,
  onLookupTypeChange,
  onSubmit,
  onReset,
}: any) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PanelTitle
        title="Discord Lookup"
        subtitle="Search for Discord users by username or user ID"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form
            onSubmit={onSubmit}
            className="glass rounded-md border border-border/60 p-6 space-y-5"
          >
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-3">
                Search Method
              </label>
              <div className="flex gap-3">
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
                    className={`flex-1 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                      discordLookupType === t
                        ? "bg-cyan/15 text-cyan border border-cyan/40"
                        : "bg-transparent text-muted-foreground border border-border hover:border-cyan/30 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">
                {discordLookupType === "username" ? "Username" : "User ID"}
              </label>
              <input
                value={lookupValue}
                onChange={(e) => onLookupValueChange(e.target.value)}
                placeholder={
                  discordLookupType === "username"
                    ? "username or username#1234"
                    : "123456789012345678"
                }
                className="w-full px-4 py-3 rounded-md border border-border bg-input text-sm font-mono text-foreground focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <CyberButton type="submit" loading={loading} disabled={lookupValue.trim() === ""}>
                Execute Lookup
              </CyberButton>
              <ResetButton onClick={onReset} />
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <ResultsShell>
            {error ? (
              <ErrorBanner error={error} />
            ) : loading ? (
              <LoadingState />
            ) : !discordResponse ? (
              <EmptyState />
            ) : discordResponse.success ? (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-border/60">
                  {discordResponse.user?.avatar && (
                    <div className="relative">
                      <img
                        src={`https://cdn.discordapp.com/avatars/${discordResponse.user.id}/${discordResponse.user.avatar}.png`}
                        alt="Discord Avatar"
                        className="w-24 h-24 rounded-full border-2 border-cyan/40 shadow-[0_0_24px_oklch(0.82_0.18_195/0.3)]"
                      />
                      <div className="absolute inset-0 rounded-full border border-cyan/20 animate-ping opacity-40" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-lg font-mono font-bold text-foreground">
                      {discordResponse.user?.username}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      ID: {discordResponse.user?.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {discordResponse.user?.discriminator && (
                    <InfoCell label="Discriminator" value={`#${discordResponse.user.discriminator}`} />
                  )}
                  <InfoCell
                    label="Verified"
                    value={discordResponse.user?.verified ? "Yes" : "No"}
                    highlight={discordResponse.user?.verified ? "matrix" : undefined}
                  />
                  {discordResponse.user?.mfa_enabled !== undefined && (
                    <InfoCell
                      label="MFA"
                      value={discordResponse.user?.mfa_enabled ? "Enabled" : "Disabled"}
                      highlight={discordResponse.user?.mfa_enabled ? "matrix" : undefined}
                    />
                  )}
                  {discordResponse.user?.bot !== undefined && (
                    <InfoCell label="Bot" value={discordResponse.user?.bot ? "Yes" : "No"} />
                  )}
                  {discordResponse.user?.locale && (
                    <InfoCell label="Locale" value={discordResponse.user.locale} />
                  )}
                  {discordResponse.user?.premium_type !== undefined && (
                    <InfoCell
                      label="Premium"
                      value={
                        ["None", "Classic", "Full", "Basic"][
                          discordResponse.user.premium_type
                        ] ?? "Unknown"
                      }
                    />
                  )}
                </div>

                {discordResponse.user?.public_flags !== undefined && (
                  <div className="rounded-md border border-border/60 bg-background/30 p-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                      Metadata
                    </p>
                    <div className="space-y-1 text-xs font-mono text-muted-foreground">
                      <div>Public Flags: {discordResponse.user.public_flags}</div>
                      <div>Flags: {discordResponse.user.flags}</div>
                      {discordResponse.user.email && (
                        <div>Email: {discordResponse.user.email}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[480px] gap-2">
                <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  User Not Found
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60">
                  {discordResponse.error || "No matching Discord user"}
                </p>
              </div>
            )}
          </ResultsShell>
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "matrix" | "cyan";
}) {
  const color =
    highlight === "matrix"
      ? "text-matrix"
      : highlight === "cyan"
        ? "text-cyan"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border/60 bg-background/30 p-3 hover:border-cyan/30 transition-colors">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </p>
      <p className={`text-sm font-mono ${color}`}>{value}</p>
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
  const confidence =
    typeof profile._confidence === "number" ? profile._confidence : null;
  const sources = Array.isArray(profile._sources)
    ? (profile._sources as JsonValue[])
    : null;
  const sourceDb =
    typeof profile._source_db === "string" ? profile._source_db : null;

  const entries = Object.entries(profile).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== "",
  );

  const name =
    [profile.prenom, profile.nom_famille].filter(Boolean).join(" ") ||
    `Record #${index + 1}`;

  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-4 hover:border-cyan/40 hover:shadow-[0_0_24px_-8px_oklch(0.82_0.18_195/0.5)] transition-all duration-300 animate-fade-in-up">
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-border/60">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            #{String(index + 1).padStart(3, "0")}
          </p>
          <p className="text-base font-semibold text-foreground mt-0.5 font-mono">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          {sourceDb && (
            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-1 rounded border border-border/60 uppercase tracking-wider">
              {sourceDb}
            </span>
          )}
          {confidence !== null && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                confidence >= 70
                  ? "text-matrix border-matrix/50 bg-matrix/10"
                  : confidence >= 40
                    ? "text-warning border-warning/50 bg-warning/10"
                    : "text-muted-foreground border-border bg-muted"
              }`}
            >
              {confidence}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {entries.map(([k, v]) => (
          <div key={k} className="text-sm">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {FIELD_LABELS[k] ?? k}
            </p>
            <p className="text-foreground font-mono text-sm mt-0.5 break-all">
              {formatValue(v)}
            </p>
          </div>
        ))}
      </div>

      {sources && sources.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
          {sources.map((s, i) => (
            <span
              key={i}
              className="text-[10px] font-mono bg-muted/50 text-muted-foreground px-2 py-1 rounded border border-border/40 uppercase tracking-wider"
            >
              {formatValue(s)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
