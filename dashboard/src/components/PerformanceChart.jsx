// =============================================================================
// AlgoTradeAI Dashboard — Performance Chart Component
// =============================================================================
import { useState, useCallback } from "react";
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const PERIOD_OPTS = [
  { label: "TODAY",   type: "DAILY"     },
  { label: "WEEK",    type: "WEEKLY"    },
  { label: "MONTH",   type: "MONTHLY"   },
  { label: "QUARTER", type: "QUARTERLY" },
  { label: "YEAR",    type: "YEARLY"    },
];

export default function PerformanceChart() {
  const [period, setPeriod]   = useState("DAILY");
  const [loading, setLoading] = useState(false);
  const [reportData, setData] = useState(null);

  const load = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await api.getReportData(type);
      if (res?.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on first render
  useState(() => { load("DAILY"); }, []);

  const m    = reportData?.metrics       || {};
  const comp = reportData?.comparison?.vs_prior || {};
  const eq   = reportData?.equity_curve  || [];
  const asst = reportData?.metrics?.by_asset || {};

  // Equity curve chart data
  const eqData = eq.map((p, i) => ({
    i,
    value: p.balance_after || p.equity_after || 0,
  }));

  // Asset P&L bar data
  const assetData = Object.entries(asst).map(([k, v]) => ({
    name: k, pnl: v.net_pnl || 0,
  })).sort((a, b) => b.pnl - a.pnl);

  const isPos    = (m.net_pnl || 0) >= 0;
  const eqColor  = isPos ? C.green : C.red;
  const fmt      = (n) => `$${Math.abs(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const fmtPct   = (n) => `${(n || 0) >= 0 ? "+" : ""}${(n || 0).toFixed(2)}%`;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0a1420", border: `1px solid ${C.border}`,
                    padding: "6px 10px", borderRadius: 4, fontSize: 11 }}>
        <div style={{ color: eqColor }}>${payload[0].value?.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle title="PERFORMANCE" sub={`${reportData?.period_label || "—"}`} />
        <div style={{ display: "flex", gap: 4 }}>
          {PERIOD_OPTS.map(o => (
            <button key={o.type}
              onClick={() => { setPeriod(o.type); load(o.type); }}
              style={{ background: period === o.type ? "#0e2a40" : C.surface,
                       border: `1px solid ${period === o.type ? "#1a5a80" : C.border}`,
                       color:  period === o.type ? C.blue : C.muted,
                       padding: "4px 12px", borderRadius: 3, cursor: "pointer",
                       fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 200, display: "flex", alignItems: "center",
                      justifyContent: "center", color: C.muted }}>
          Loading performance data…
        </div>
      ) : (
        <>
          {/* ── Equity curve ── */}
          {eqData.length > 1 ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ color: C.muted, fontSize: 9, letterSpacing: ".12em", marginBottom: 10 }}>
                EQUITY CURVE
                <span style={{ color: eqColor, marginLeft: 12, fontWeight: 700 }}>
                  {isPos ? "+" : ""}{fmt(m.net_pnl)}
                  &nbsp;({fmtPct(m.cagr_pct)})
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={eqData} margin={{ top: 4, right: 4, bottom: 0, left: 40 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={eqColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={eqColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                         tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke={eqColor}
                        strokeWidth={2} fill="url(#eqGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                          padding: 32, textAlign: "center", color: C.dim, marginBottom: 12 }}>
              No equity data for this period
            </div>
          )}

          {/* ── Metrics grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { label: "WIN RATE",       curr: `${m.win_rate_pct ?? 0}%`,    delta: comp.win_rate_pct    },
              { label: "PROFIT FACTOR",  curr: (m.profit_factor ?? 0).toFixed(3), delta: comp.profit_factor  },
              { label: "SHARPE RATIO",   curr: (m.sharpe_ratio  ?? 0).toFixed(3), delta: comp.sharpe_ratio   },
              { label: "MAX DRAWDOWN",   curr: `${m.max_drawdown_pct ?? 0}%`, delta: comp.max_drawdown_pct},
              { label: "TOTAL TRADES",   curr: m.total_trades ?? 0,            delta: comp.total_trades    },
              { label: "EXPECTANCY",     curr: fmt(m.expectancy),              delta: comp.expectancy      },
            ].map(row => (
              <MetricCard key={row.label} {...row} />
            ))}
          </div>

          {/* ── Asset P&L bars ── */}
          {assetData.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ color: C.muted, fontSize: 9, letterSpacing: ".12em", marginBottom: 10 }}>
                P&L BY ASSET CLASS
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={assetData} margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" horizontal={false} />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }}
                         axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${v}`}
                         tick={{ fill: C.muted, fontSize: 9 }}
                         axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={v => [`$${v.toFixed(2)}`, "Net P&L"]}
                    contentStyle={{ background: "#0a1420", border: `1px solid ${C.border}`,
                                    fontSize: 11 }}
                    itemStyle={{ color: C.muted }} />
                  <Bar dataKey="pnl" radius={[3,3,0,0]}>
                    {assetData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? C.green : C.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, curr, delta }) {
  const arrowColor = delta?.color === "green" ? C.green
                   : delta?.color === "red"   ? C.red
                   : C.muted;
  return (
    <div style={{ background: "#0a1420", border: `1px solid ${C.border}`, borderRadius: 5, padding: "10px 12px" }}>
      <div style={{ color: C.dim, fontSize: 9, letterSpacing: ".1em", marginBottom: 5 }}>{label}</div>
      <div style={{ color: "#c8d8e8", fontWeight: 600, fontSize: 14 }}>{curr}</div>
      {delta && (
        <div style={{ color: arrowColor, fontSize: 10, marginTop: 3 }}>
          {delta.change_fmt} vs prior
        </div>
      )}
    </div>
  );
}
