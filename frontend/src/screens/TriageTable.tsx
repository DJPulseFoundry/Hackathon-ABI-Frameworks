import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Patient, Route } from "../types";
import { GlassCard, FadeIn, EmptyState } from "../components/ui/Primitives";
import { RouteBadge } from "../components/ui/RouteBadge";
import { ConfidenceBar } from "../components/ui/ConfidenceGauge";
import { ROUTE_META, ROUTE_ORDER, fmtMeasure } from "../lib/route";

const col = createColumnHelper<Patient>();

export function TriageTable({ patients, onSelect }: { patients: Patient[]; onSelect: (p: Patient) => void }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "confidence", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const routeFilter = (columnFilters.find((f) => f.id === "route")?.value as Route | undefined) ?? null;
  const setRoute = (r: Route | null) =>
    setColumnFilters(r ? [{ id: "route", value: r }] : []);

  const columns = useMemo(
    () => [
      col.accessor("patient_id", {
        header: "Patient",
        cell: (c) => (
          <div className="flex flex-col">
            <span className="tabular text-sm font-semibold text-ink">{c.getValue()}</span>
            <span className="text-xs text-ink-soft">{c.row.original.name}</span>
          </div>
        ),
      }),
      col.accessor((r) => r.payer.code, {
        id: "payer",
        header: "Payer",
        cell: (c) => (
          <span
            className={`tabular rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
              c.getValue() === "MCB" ? "bg-teal-50 text-teal-700 ring-teal-600/20" : "bg-slate-100 text-slate-600 ring-slate-400/20"
            }`}
            title={c.row.original.payer.name}
          >
            {c.getValue()}
          </span>
        ),
      }),
      col.accessor((r) => r.wound.type, {
        id: "wound",
        header: "Wound",
        cell: (c) => {
          const w = c.row.original.wound;
          const m = fmtMeasure(w.L, w.W, w.D);
          return (
            <div className="flex flex-col">
              <span className="text-sm text-ink">{w.type}</span>
              <span className="text-xs text-ink-soft">
                {w.location}
                {w.stage ? ` · ${w.stage}` : ""}
                {m ? <span className="tabular"> · {m}</span> : ""}
              </span>
            </div>
          );
        },
      }),
      col.accessor("confidence", {
        header: "Confidence",
        cell: (c) => <ConfidenceBar value={c.getValue()} />,
        sortingFn: "basic",
      }),
      col.accessor("route", {
        header: "Routing",
        cell: (c) => <RouteBadge route={c.getValue()} size="sm" />,
        filterFn: (row, id, val) => row.getValue(id) === val,
        sortingFn: (a, b) =>
          ROUTE_ORDER.indexOf(a.original.route) - ROUTE_ORDER.indexOf(b.original.route),
      }),
      col.accessor("reason", {
        header: "Reason",
        enableSorting: false,
        cell: (c) => <span className="line-clamp-2 max-w-md text-xs text-ink-soft">{c.getValue()}</span>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: patients,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _id, filter) => {
      const p = row.original;
      const hay = `${p.patient_id} ${p.name} ${p.wound.type} ${p.wound.location} ${p.payer.code} ${p.reason}`.toLowerCase();
      return hay.includes(String(filter).toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const counts = ROUTE_ORDER.reduce<Record<string, number>>((a, r) => ((a[r] = patients.filter((p) => p.route === r).length), a), {});

  return (
    <div className="space-y-4">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">Triage Queue</h1>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="tabular">{rows.length}</span> of <span className="tabular">{patients.length}</span> patients · click a row to inspect evidence
            </p>
          </div>
          <label className="relative">
            <span className="sr-only">Search patients</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search id, wound, payer, reason…"
              className="glass w-72 rounded-full py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2"
            />
          </label>
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by routing">
        <FilterChip active={routeFilter === null} onClick={() => setRoute(null)} label="All" count={patients.length} tone="bg-slate-700" />
        {ROUTE_ORDER.map((r) => {
          const m = ROUTE_META[r];
          return (
            <FilterChip
              key={r}
              active={routeFilter === r}
              onClick={() => setRoute(routeFilter === r ? null : r)}
              label={m.label}
              count={counts[r]}
              Icon={m.Icon}
              tone={r === "auto_accept" ? "bg-teal-600" : r === "flag_for_review" ? "bg-amber-500" : "bg-rose-500"}
            />
          );
        })}
      </div>

      <FadeIn delay={0.05}>
        <GlassCard strong className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-teal-600/10">
                    {hg.headers.map((h) => {
                      const sortable = h.column.getCanSort();
                      const dir = h.column.getIsSorted();
                      return (
                        <th key={h.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          {sortable ? (
                            <button
                              onClick={h.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-ink focus-visible:outline-2"
                              aria-label={`Sort by ${String(h.column.columnDef.header)}`}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {dir === "asc" ? <ArrowUp className="h-3 w-3" /> : dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                            </button>
                          ) : (
                            flexRender(h.column.columnDef.header, h.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${row.original.patient_id} — ${ROUTE_META[row.original.route].label}`}
                    onClick={() => onSelect(row.original)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(row.original);
                      }
                    }}
                    className="cursor-pointer border-b border-slate-100/80 transition-colors hover:bg-teal-50/50 focus-visible:bg-teal-50 focus-visible:outline-none"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <EmptyState title="No matching patients" hint="Try clearing the search or routing filter to see the full queue." />
          )}
        </GlassCard>
      </FadeIn>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  Icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  Icon?: typeof Search;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors focus-visible:outline-2 ${
        active ? `${tone} text-white ring-transparent` : "glass text-ink-soft ring-teal-600/15 hover:text-ink"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {label}
      <span className={`tabular rounded-full px-1.5 text-[11px] ${active ? "bg-white/25" : "bg-slate-200/70 text-ink-soft"}`}>{count}</span>
    </button>
  );
}

// Skeleton shown while the run loads.
export function TriageTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 shimmer rounded-md bg-slate-200/70" />
      <GlassCard strong className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-9 w-9 shimmer rounded-full bg-slate-200/70" />
            <div className="h-4 flex-1 shimmer rounded bg-slate-200/70" />
            <div className="h-4 w-24 shimmer rounded bg-slate-200/70" />
            <div className="h-6 w-20 shimmer rounded-full bg-slate-200/70" />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
