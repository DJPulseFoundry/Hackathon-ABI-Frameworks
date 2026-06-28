import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from "recharts";
import type { Funnel as FunnelData } from "../../types";

// 300 → MCB active → active wound → has measurements → auto-accept.
export function EligibilityFunnel({ funnel }: { funnel: FunnelData }) {
  const data = [
    { stage: "Patients fetched", value: funnel.total, fill: "#0f766e" },
    { stage: "MCB active", value: funnel.mcb_active, fill: "#0d9488" },
    { stage: "Active wound dx", value: funnel.active_wound, fill: "#14b8a6" },
    { stage: "Has L×W×D", value: funnel.has_measurements, fill: "#2dd4bf" },
    { stage: "Auto-accept", value: funnel.auto_accept, fill: "#5eead4" },
  ];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(13,148,136,0.2)",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            fontSize: 12,
          }}
          formatter={(v: number) => [v.toLocaleString(), "patients"]}
        />
        <Funnel dataKey="value" data={data} isAnimationActive nameKey="stage" stroke="#fff" strokeWidth={2}>
          <LabelList position="right" dataKey="stage" fill="#0f172a" stroke="none" fontSize={12} fontWeight={600} />
          <LabelList
            position="left"
            dataKey="value"
            fill="#0f766e"
            stroke="none"
            fontSize={13}
            fontWeight={700}
            className="tabular"
          />
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
