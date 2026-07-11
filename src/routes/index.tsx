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
      { title: "SeeKHub — Advanced Search & Lookup Platform" },
      {
        name: "description",
        content:
          "SeeKHub is a comprehensive search and data aggregation platform for professional research and information retrieval.",
      },
      {
        property: "og:title",
        content: "SeeKHub — Advanced Search & Lookup Platform",
      },
      {
        property: "og:description",
        content:
          "SeeKHub is a comprehensive search and data aggregation platform.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMode("home")}>
            <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
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
              <h1 className="text-xl font-bold text-slate-900">SeeKHub</h1>
              <p className="text-xs text-slate-500">Search Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              ["home", "Home"],
              ["search", "Search"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["iban", "IBAN"],
              ["discord", "Discord"],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m as Mode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  mode === m
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
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
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (mode: Mode) => void }) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-16">
        <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
          SeeKHub
        </h2>
        <p className="text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Advanced Search & Data Aggregation Platform
        </p>
        <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
          SeeKHub provides comprehensive multi-criteria search and reverse lookup capabilities across multiple data sources. Access professional-grade research tools with a clean, intuitive interface.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          title="Multi-Criteria Search"
          description="Search across comprehensive databases using multiple fields and flexible matching algorithms."
        />
        <FeatureCard
          title="Reverse Lookups"
          description="Find associated information using email, phone numbers, and financial identifiers."
        />
        <FeatureCard
          title="Social Integration"
          description="Discord user lookup with detailed profile information and verification status."
        />
      </div>

      {/* Available Methods */}
      <div className="space-y-8">
        <h3 className="text-3xl font-bold text-slate-900 text-center">
          Available Search Methods
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
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
      className="bg-white rounded-lg border border-slate-200 p-6 text-left hover:border-slate-300 hover:shadow-md transition-all duration-300 group"
    >
      <h4 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 mb-2">
        {title}
      </h4>
      <p className="text-slate-600 text-sm">{description}</p>
      <div className="mt-4 inline-block text-slate-400 group-hover:text-slate-600 transition-colors">
        →
      </div>
    </button>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">
          General Search
        </h2>
        <p className="text-slate-600">
          Search across multiple fields with flexible matching options
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={onSubmit} className="space-y-6 bg-white rounded-lg border border-slate-200 p-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Active Fields: {activeFields.length}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={flexible}
                    onChange={(e) => onFlexibleChange(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  Flexible matching
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Per page
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={perPage}
                  onChange={(e) => onPerPageChange(Number(e.target.value) || 10)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Page
                </label>
                <input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => onPageChange(Number(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 border-t pt-6">
              {FIELD_GROUPS.map((group: any) => (
                <details
                  key={group.title}
                  open
                  className="group rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <summary className="cursor-pointer p-3 text-sm font-semibold text-slate-900 flex justify-between items-center">
                    <span>{group.title}</span>
                    <span className="text-xs text-slate-500">
                      {group.fields.length}
                    </span>
                  </summary>
                  <div className="grid grid-cols-2 gap-2 p-3 pt-0 border-t">
                    {group.fields.map((f: any) => {
                      const val = values[f.key] ?? "";
                      return (
                        <div key={f.key}>
                          <label className="text-xs text-slate-600 font-medium">
                            {f.label}
                          </label>
                          {f.type === "select" ? (
                            <select
                              value={val}
                              onChange={(e) =>
                                onValuesChange({
                                  ...values,
                                  [f.key]: e.target.value,
                                })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                                onValuesChange({
                                  ...values,
                                  [f.key]: e.target.value,
                                })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || activeFields.length === 0}
                className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-4 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-8 min-h-96">
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin"></div>
              <p className="text-slate-600">Searching...</p>
            </div>
          ) : !response ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No results found.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((profile: any, i: number) => (
                <ProfileCard key={i} profile={profile} index={i} />
              ))}
            </div>
          )}
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
    email: "Search for profiles associated with an email address",
    phone: "Find information linked to a phone number",
    iban: "Look up financial information by IBAN",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">
          {titles[mode]}
        </h2>
        <p className="text-slate-600">{descriptions[mode]}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={onSubmit}
            className="space-y-6 bg-white rounded-lg border border-slate-200 p-8"
          >
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                {titles[mode].split(" ")[0]}
              </label>
              <input
                value={lookupValue}
                onChange={(e) => onLookupValueChange(e.target.value)}
                placeholder={placeholders[mode]}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || lookupValue.trim() === ""}
                className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Lookup"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-4 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-8 min-h-96">
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin"></div>
              <p className="text-slate-600">Searching...</p>
            </div>
          ) : !response ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No results found.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((profile: any, i: number) => (
                <ProfileCard key={i} profile={profile} index={i} />
              ))}
            </div>
          )}
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">
          Discord Lookup
        </h2>
        <p className="text-slate-600">
          Search for Discord users by username or user ID
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={onSubmit}
            className="space-y-6 bg-white rounded-lg border border-slate-200 p-8"
          >
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-3">
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
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      discordLookupType === t
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || lookupValue.trim() === ""}
                className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Lookup"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-4 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-8 min-h-96">
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin"></div>
              <p className="text-slate-600">Searching...</p>
            </div>
          ) : !discordResponse ? (
            <EmptyState />
          ) : discordResponse.success ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {discordResponse.user?.avatar && (
                  <div className="col-span-2 flex justify-center">
                    <img
                      src={`https://cdn.discordapp.com/avatars/${discordResponse.user.id}/${discordResponse.user.avatar}.png`}
                      alt="Discord Avatar"
                      className="w-24 h-24 rounded-full border-4 border-slate-200"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Username
                  </p>
                  <p className="text-sm font-mono text-slate-900 mt-1">
                    {discordResponse.user?.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    ID
                  </p>
                  <p className="text-sm font-mono text-slate-900 mt-1">
                    {discordResponse.user?.id}
                  </p>
                </div>
                {discordResponse.user?.discriminator && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Discriminator
                    </p>
                    <p className="text-sm font-mono text-slate-900 mt-1">
                      #{discordResponse.user.discriminator}
                    </p>
                  </div>
                )}
                {discordResponse.user?.verified && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Verified
                    </p>
                    <p className="text-sm text-green-600 mt-1">✓ Yes</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              {discordResponse.error || "User not found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <svg
        className="w-12 h-12 text-slate-300"
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
      <p className="text-slate-600 text-center">
        Enter your search criteria above to get started
      </p>
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
    `Result #${index + 1}`;

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
        <div>
          <p className="text-xs font-mono text-slate-500">
            #{String(index + 1).padStart(2, "0")}
          </p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          {sourceDb && (
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
              {sourceDb}
            </span>
          )}
          {confidence !== null && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                confidence >= 70
                  ? "bg-green-100 text-green-700"
                  : confidence >= 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-slate-100 text-slate-700"
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
            <p className="text-xs font-semibold text-slate-600 uppercase">
              {FIELD_LABELS[k] ?? k}
            </p>
            <p className="text-slate-900 font-mono text-sm mt-0.5">
              {formatValue(v)}
            </p>
          </div>
        ))}
      </div>

      {sources && sources.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {sources.map((s, i) => (
            <span
              key={i}
              className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded"
            >
              {formatValue(s)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
