import { CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import type { Route } from "../types";

// Routing presentation — color is ALWAYS paired with an icon + label (never color alone).
export const ROUTE_META: Record<
  Route,
  { label: string; short: string; Icon: typeof CheckCircle2; color: string; bg: string; ring: string; text: string }
> = {
  auto_accept: {
    label: "Auto-accept",
    short: "Accept",
    Icon: CheckCircle2,
    color: "var(--color-accept)",
    bg: "bg-teal-50",
    ring: "ring-teal-600/30",
    text: "text-teal-700",
  },
  flag_for_review: {
    label: "Flag for review",
    short: "Flag",
    Icon: AlertTriangle,
    color: "var(--color-flag)",
    bg: "bg-amber-50",
    ring: "ring-amber-500/30",
    text: "text-amber-700",
  },
  reject: {
    label: "Reject",
    short: "Reject",
    Icon: Ban,
    color: "var(--color-reject)",
    bg: "bg-rose-50",
    ring: "ring-rose-500/30",
    text: "text-rose-700",
  },
};

export const ROUTE_ORDER: Route[] = ["auto_accept", "flag_for_review", "reject"];

export const fmtMeasure = (l: number | null, w: number | null, d: number | null) => {
  const part = (x: number | null) => (x == null ? "—" : x.toFixed(1));
  if (l == null && w == null && d == null) return null;
  return `${part(l)} × ${part(w)} × ${part(d)} cm`;
};

export const pct = (x: number) => `${Math.round(x * 100)}%`;
