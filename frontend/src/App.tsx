import { useEffect, useState } from "react";
import { LayoutDashboard, Table2, Workflow, Activity } from "lucide-react";
import { useExport } from "./data/useExport";
import type { Patient } from "./types";
import { ErrorState, EmptyState, GlassCard } from "./components/ui/Primitives";
import { CommandCenter } from "./screens/CommandCenter";
import { TriageTable, TriageTableSkeleton } from "./screens/TriageTable";
import { PatientDetail } from "./screens/PatientDetail";
import { PipelineFlow } from "./screens/PipelineFlow";

type Tab = "command" | "triage" | "pipeline";
const TABS: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "command", label: "Command Center", Icon: LayoutDashboard },
  { id: "triage", label: "Triage Queue", Icon: Table2 },
  { id: "pipeline", label: "Pipeline Run", Icon: Workflow },
];

export default function App() {
  const state = useExport();
  const [tab, setTab] = useState<Tab>("command");
  const [selected, setSelected] = useState<Patient | null>(null);

  // hash-based deep links so a tab is shareable/restorable without a router dep.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as Tab;
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const go = (t: Tab) => {
    setTab(t);
    window.location.hash = t;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="gradient-teal grid h-9 w-9 place-items-center rounded-xl text-white shadow-md">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-ink">woundpipe</span>
              <span className="ml-2 hidden text-xs text-ink-soft sm:inline">wound-care billing triage</span>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-full bg-white/50 p-1 ring-1 ring-teal-600/10" role="tablist" aria-label="Views">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 ${
                    active ? "gradient-teal text-white shadow-sm" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <t.Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {state.status === "loading" && <TriageTableSkeleton />}

        {state.status === "error" && (
          <GlassCard strong className="mx-auto max-w-lg">
            <ErrorState message={state.error} onRetry={state.reload} />
          </GlassCard>
        )}

        {state.status === "empty" && (
          <GlassCard strong className="mx-auto max-w-lg">
            <EmptyState
              title="No patients in this run"
              hint="The export published successfully but contains zero routed patients. Re-run the pipeline to populate the queue."
            />
          </GlassCard>
        )}

        {state.status === "ready" && (
          <>
            {tab === "command" && <CommandCenter data={state.data} />}
            {tab === "triage" && <TriageTable patients={state.data.patients} onSelect={setSelected} />}
            {tab === "pipeline" && <PipelineFlow data={state.data} />}
          </>
        )}
      </main>

      <PatientDetail patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
