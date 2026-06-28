import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Check, AlertTriangle, XCircle, FileText } from "lucide-react";
import type { Patient, CheckStatus } from "../types";
import { RouteBadge } from "../components/ui/RouteBadge";
import { ConfidenceGauge } from "../components/ui/ConfidenceGauge";
import { HighlightedNote, fieldTone, fieldLabel } from "../components/HighlightedNote";
import { EvidenceGraph } from "../components/flow/EvidenceGraph";
import { fmtMeasure, pct } from "../lib/route";

const CHECK_ICON: Record<CheckStatus, { Icon: typeof Check; cls: string }> = {
  pass: { Icon: Check, cls: "bg-teal-100 text-teal-700" },
  warn: { Icon: AlertTriangle, cls: "bg-amber-100 text-amber-700" },
  fail: { Icon: XCircle, cls: "bg-rose-100 text-rose-700" },
};

export function PatientDetail({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // focus management: move focus into the panel on open, restore on close, trap Esc.
  useEffect(() => {
    if (!patient) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [patient, onClose]);

  return (
    <AnimatePresence>
      {patient && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Patient ${patient.patient_id} detail`}>
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            className="glass-strong relative h-full w-full max-w-2xl overflow-y-auto rounded-l-3xl p-6 shadow-2xl"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="tabular text-xl font-bold text-ink">{patient.patient_id}</h2>
                  <span className="text-sm text-ink-soft">{patient.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RouteBadge route={patient.route} />
                  <span className="tabular rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
                    {patient.payer.code} · {patient.payer.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-ink-soft">
                    <FileText className="h-3 w-3" aria-hidden="true" /> {patient.wound.format}
                  </span>
                </div>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close detail"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-soft ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-ink focus-visible:outline-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            {/* decision + confidence */}
            <section className="mt-5 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 ring-1 ring-teal-600/10">
              <ConfidenceGauge value={patient.confidence} size={56} />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-ink-soft">Decision · confidence {pct(patient.confidence)}</div>
                <p className="mt-1 text-sm leading-snug text-ink">{patient.reason}</p>
              </div>
            </section>

            {/* eligibility checks */}
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-ink">Eligibility checks</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {patient.eligibility_checks.map((c, i) => {
                  const { Icon, cls } = CHECK_ICON[c.status];
                  return (
                    <div key={i} className="glass rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-6 w-6 place-items-center rounded-full ${cls}`}>
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-semibold text-ink">{c.label}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">
                        {c.code && <span className="tabular font-medium text-ink">{c.code} · </span>}
                        {c.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* structured fields */}
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-ink">Extracted fields</h3>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label="Type" value={patient.wound.type} />
                <Field label="Location" value={patient.wound.location} />
                <Field label="Stage" value={patient.wound.stage} />
                <Field label="L×W×D" value={fmtMeasure(patient.wound.L, patient.wound.W, patient.wound.D)} mono />
              </dl>
            </section>

            {/* original note with highlights */}
            <section className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Original note · fields highlighted in place</h3>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {Array.from(new Set(patient.highlights.map((h) => h.field))).map((f) => (
                  <span key={f} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${fieldTone(f)}`}>
                    {fieldLabel(f)}
                  </span>
                ))}
              </div>
              <div className="glass rounded-xl p-4">
                <HighlightedNote text={patient.note_text} highlights={patient.highlights} />
              </div>
            </section>

            {/* evidence graph */}
            <section className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Evidence graph</h3>
                <span className="text-xs text-ink-soft">
                  <span className="tabular">{patient.evidence_graph.agreeing_sources}</span> agreeing source
                  {patient.evidence_graph.agreeing_sources === 1 ? "" : "s"} · green = agree, red = conflict
                </span>
              </div>
              <EvidenceGraph graph={patient.evidence_graph} />
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="glass rounded-xl p-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-ink ${mono ? "tabular" : ""}`}>{value ?? <span className="text-ink-faint">—</span>}</dd>
    </div>
  );
}
