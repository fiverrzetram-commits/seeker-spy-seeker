export type SearchMode = "search" | "email" | "phone" | "iban" | "discord";

interface SearchTabsProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

const TABS: Array<{ value: SearchMode; label: string; icon: string }> = [
  { value: "search", label: "Recherche", icon: "🔍" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "phone", label: "Téléphone", icon: "📱" },
  { value: "iban", label: "IBAN", icon: "💳" },
  { value: "discord", label: "Discord", icon: "💬" },
];

export function SearchTabs({ mode, onChange }: SearchTabsProps) {
  return (
    <div className="flex border-b border-border/60 overflow-x-auto bg-background/40 rounded-t-lg">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-shrink-0 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all ${
            mode === tab.value
              ? "bg-primary/15 text-primary border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
          }`}
        >
          <span className="inline-block mr-1.5">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
