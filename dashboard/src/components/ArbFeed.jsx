// =============================================================================
// AlgoTradeAI Dashboard — Arbitrage Feed Component
// =============================================================================
import { useState }     from "react";
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import { GitMerge, Activity, TrendingUp, AlertTriangle } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const ARB_TYPE_COLOR = {
  CROSS_EXCHANGE: C.blue,
  TRIANGULAR:     C.green,
  STATISTICAL:    C.purple,
  LATENCY:        C.orange,
};

const ARB_TYPE_ICON = {
  CROSS_EXCHANGE: <GitMerge size={12} />,
  TRIANGULAR:     <Activity size={12} />,
  STATISTICAL:    <TrendingUp size={12} />,
  LATENCY:        <AlertTriangle size={12} />,
};

export default function ArbFeed() {
  const { data, loading, lastUpdate } = usePolling(api.getArbSummary, 5000);
  const [activeType, setActiveType] = useState("ALL");

  const summary = Array.isArray(data?.summary) ? data.summary : [];

  const totalDetected = summary.reduce((s, r) => s + (r.total_detected || 0), 0);
  const totalTaken    = summary.reduce((s, r) => s + (r.total_taken    || 0), 0);
  const totalProfit   = summary.reduce((s, r) => s + (r.total_realized || 0), 0);
  const avgProfit     = summary.reduce((s, r) => s + (r.avg_net_profit || 0), 0);

  const types = ["ALL", ...new Set(summary.map(r => r.arb_type).filter(Boolean))];

  const filtered = activeType === "ALL"
    ? summary
    : summary.filter(r => r.arb_type === activeType);

  const fmtPct = (n) => n != null ? `${(n * 100).toFixed(4)}%` : "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle
          title="ARBITRAGE ENGINE"
          sub={`${totalDetected} detected · ${totalTaken} taken (7d) · updated ${lastUpdate?.toLocaleTimeString() ?? "—"}`}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {types.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              style={{ background: activeType === t ? "#0e2a40" : C.surface,
                       border: `1px solid ${activeType === t ? "#1a5a80" : C.border}`,
                       color: activeType === t ? C.blue : C.muted,
                       padding: "3px 10px", borderRadius: 3, cursor: "pointer",
                       fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "TOTAL DETECTED", value: totalDetected,            color: C.blue   },
          { label: "TAKEN",          value: totalTaken,               color: C.green  },
          { label: "TAKE RATE",      value: totalDetected > 0
              ? `${((totalTaken/totalDetected)*100).toFixed(1)}%`
              : "0%",                                                  color: C.yellow },
          { label: "REALIZED PROFIT",value: `+$${totalProfit.toFixed(2)}`, color: C.green },
        ].map(k => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`,
                                       borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ color: C.dim, fontSize: 9, letterSpacing: ".1em", marginBottom: 5 }}>{k.label}</div>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 700 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Breakdown table ── */}
      {loading && summary.length === 0 ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: C.dim,
                      border: `1px solid ${C.border}`, borderRadius: 6 }}>
          No arbitrage data for this period
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid",
                        gridTemplateColumns: "140px 100px 80px 90px 110px 100px",
                        padding: "7px 14px", background: "#0a1020",
                        color: C.dim, fontSize: 9, letterSpacing: ".1em" }}>
            {["ARB TYPE","DETECTED","TAKEN","TAKE RATE","AVG NET PROFIT","REALIZED"].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {filtered.map((row, i) => {
            const typeColor = ARB_TYPE_COLOR[row.arb_type] || C.muted;
            const icon      = ARB_TYPE_ICON[row.arb_type];
            const takeRate  = row.total_detected > 0
              ? ((row.total_taken / row.total_detected) * 100).toFixed(1) + "%"
              : "0%";

            return (
              <div key={i} style={{ display: "grid",
                                     gridTemplateColumns: "140px 100px 80px 90px 110px 100px",
                                     padding: "10px 14px", borderTop: `1px solid #111e2e`,
                                     fontSize: 12, alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6,
                               color: typeColor, fontWeight: 600 }}>
                  <span style={{ color: typeColor }}>{icon}</span>
                  {row.arb_type?.replace(/_/g," ")}
                </span>
                <span>{row.total_detected ?? 0}</span>
                <span style={{ color: C.green }}>{row.total_taken ?? 0}</span>
                <span style={{ color: C.yellow }}>{takeRate}</span>
                <span style={{ color: C.blue, fontWeight: 600 }}>
                  {fmtPct(row.avg_net_profit)}
                </span>
                <span style={{ color: C.green, fontWeight: 600 }}>
                  +${(row.total_realized ?? 0).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Min profit threshold note ── */}
      <div style={{ marginTop: 10, color: C.dim, fontSize: 10 }}>
        Min net profit threshold: 0.03% after spread + commission + slippage
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 40, background: "#0d1826",
                              border: "1px solid #1a2840", borderRadius: 4,
                              animation: "shimmer 1.5s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
    </div>
  );
}
