// =============================================================================
// AlgoTradeAI Dashboard — Risk Panel Component
// =============================================================================
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

// Risk limits (must match Config.mqh and risk_manager.js)
const LIMITS = {
  MAX_DAILY_LOSS_PCT:       2.0,
  MAX_DRAWDOWN_PCT:        10.0,
  MIN_MARGIN_LEVEL:       200.0,
  MAX_OPEN_POSITIONS:      50,
  MAX_SPREAD_FOREX:         3.0,
};

function Gauge({ label, value, max, unit = "%", warnAt = 70, critAt = 90 }) {
  const pct   = Math.min((value / max) * 100, 100);
  const color = pct >= critAt ? C.red : pct >= warnAt ? C.yellow : C.green;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: C.muted, fontSize: 10, letterSpacing: ".08em" }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>
          {value != null ? `${value.toFixed(1)}${unit}` : "—"}
        </span>
      </div>
      <div style={{ background: "#0a1018", borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%",
                      background: color, transition: "width .5s ease",
                      borderRadius: 4 }} />
      </div>
      <div style={{ color: C.dim, fontSize: 9, marginTop: 4 }}>
        Limit: {max}{unit}
      </div>
    </div>
  );
}

function LimitRow({ label, value, limit, ok, unit = "" }) {
  const color = ok ? C.green : C.red;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0", borderBottom: `1px solid #111e2e` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {ok ? <CheckCircle size={12} color={C.green} /> : <XCircle size={12} color={C.red} />}
        <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{ color, fontWeight: 600, fontSize: 12 }}>
          {value != null ? `${value}${unit}` : "—"}
        </span>
        <span style={{ color: C.dim, fontSize: 10, marginLeft: 8 }}>/ {limit}{unit}</span>
      </div>
    </div>
  );
}

export default function RiskPanel() {
  const { data } = usePolling(api.getAccountSnap, 5000);

  const snap      = data?.account       || {};
  const exposure  = data?.exposure      || [];
  const balance   = snap.balance        ?? 0;
  const equity    = snap.equity         ?? 0;
  const margin    = snap.margin         ?? 0;
  const freeMargin= snap.free_margin    ?? 0;
  const marginLvl = snap.margin_level   ?? 0;
  const openPnl   = snap.open_pnl       ?? 0;
  const positions = exposure.reduce((s, e) => s + (e.count || 0), 0);

  // Drawdown from balance
  const drawdown  = balance > 0 ? Math.max(0, ((balance - equity) / balance) * 100) : 0;
  // Daily P&L % (approximate — balance change from start of day is tracked in EA)
  const dailyPnlPct = balance > 0 ? (openPnl / balance) * 100 : 0;

  // Risk checks
  const checks = [
    {
      label: "Daily Loss Limit",
      value: Math.abs(dailyPnlPct).toFixed(2),
      limit: LIMITS.MAX_DAILY_LOSS_PCT,
      ok:    Math.abs(dailyPnlPct) < LIMITS.MAX_DAILY_LOSS_PCT,
      unit:  "%",
    },
    {
      label: "Max Drawdown",
      value: drawdown.toFixed(2),
      limit: LIMITS.MAX_DRAWDOWN_PCT,
      ok:    drawdown < LIMITS.MAX_DRAWDOWN_PCT,
      unit:  "%",
    },
    {
      label: "Margin Level",
      value: marginLvl.toFixed(0),
      limit: LIMITS.MIN_MARGIN_LEVEL,
      ok:    marginLvl === 0 || marginLvl >= LIMITS.MIN_MARGIN_LEVEL,
      unit:  "%",
    },
    {
      label: "Open Positions",
      value: positions,
      limit: LIMITS.MAX_OPEN_POSITIONS,
      ok:    positions < LIMITS.MAX_OPEN_POSITIONS,
      unit:  "",
    },
  ];

  const allOk     = checks.every(c => c.ok);
  const critCount = checks.filter(c => !c.ok).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle title="RISK MONITOR" sub="IC Markets · Real-time" />
        <div style={{ display: "flex", alignItems: "center", gap: 8,
                      background: allOk ? "#0e2a1e" : "#200a10",
                      border: `1px solid ${allOk ? "#003a20" : "#3a1020"}`,
                      padding: "4px 12px", borderRadius: 4 }}>
          <Shield size={12} color={allOk ? C.green : C.red} />
          <span style={{ color: allOk ? C.green : C.red, fontWeight: 700, fontSize: 11 }}>
            {allOk ? "ALL LIMITS SAFE" : `${critCount} LIMIT${critCount > 1 ? "S" : ""} BREACHED`}
          </span>
        </div>
      </div>

      {/* ── Gauge row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <Gauge label="DRAWDOWN"    value={drawdown}   max={LIMITS.MAX_DRAWDOWN_PCT}  warnAt={60} critAt={85} />
        <Gauge label="DAILY P&L"   value={Math.abs(dailyPnlPct)} max={LIMITS.MAX_DAILY_LOSS_PCT} warnAt={60} critAt={85} />
        <Gauge label="POSITIONS"   value={positions}  max={LIMITS.MAX_OPEN_POSITIONS} unit="" warnAt={70} critAt={90} />
      </div>

      {/* ── Limit checks ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ color: C.muted, fontSize: 9, letterSpacing: ".12em", marginBottom: 10 }}>
          RISK LIMIT STATUS
        </div>
        {checks.map(c => (
          <LimitRow key={c.label} {...c} />
        ))}
      </div>

      {/* ── Account health ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "12px 16px" }}>
        <div style={{ color: C.muted, fontSize: 9, letterSpacing: ".12em", marginBottom: 10 }}>
          ACCOUNT HEALTH
        </div>
        {[
          { label: "Balance",      value: `$${balance.toLocaleString("en-US",{minimumFractionDigits:2})}`,    color: C.blue    },
          { label: "Equity",       value: `$${equity.toLocaleString("en-US",{minimumFractionDigits:2})}`,     color: C.purple  },
          { label: "Margin Used",  value: `$${margin.toLocaleString("en-US",{minimumFractionDigits:2})}`,     color: C.orange  },
          { label: "Free Margin",  value: `$${freeMargin.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: C.green   },
          { label: "Margin Level", value: marginLvl > 0 ? `${marginLvl.toFixed(0)}%` : "No margin used",     color: marginLvl < 200 && marginLvl > 0 ? C.red : C.green },
          { label: "Open P&L",     value: `${openPnl >= 0 ? "+" : ""}$${openPnl.toFixed(2)}`,                color: openPnl >= 0 ? C.green : C.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between",
                                     padding: "6px 0", borderBottom: `1px solid #111e2e`,
                                     fontSize: 12 }}>
            <span style={{ color: C.muted }}>{label}</span>
            <span style={{ color, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
