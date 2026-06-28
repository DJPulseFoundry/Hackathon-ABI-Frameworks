import { useEffect, useState } from "react";
import type { ExportData } from "../types";

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "error"; data: null; error: string }
  | { status: "empty"; data: ExportData; error: null }
  | { status: "ready"; data: ExportData; error: null };

// Loads the static export.json. Race-safe: a stale response after unmount/refetch
// is ignored via the `alive` guard. Server state only — no global spinner.
export function useExport(reloadKey = 0): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });
  const [tick, setTick] = useState(reloadKey);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", data: null, error: null });
    const url = `${import.meta.env.BASE_URL}export.json`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Could not load run data (HTTP ${r.status}).`);
        return (await r.json()) as ExportData;
      })
      .then((data) => {
        if (!alive) return; // ignore out-of-order / stale response
        if (!data?.patients || data.patients.length === 0) {
          setState({ status: "empty", data, error: null });
        } else {
          setState({ status: "ready", data, error: null });
        }
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Unexpected error loading run data.";
        setState({ status: "error", data: null, error: msg });
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
