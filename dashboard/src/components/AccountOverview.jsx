// =============================================================================
// AlgoTradeAI Dashboard — Account Overview Component
// =============================================================================
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { TrendingUp, TrendingDown, DollarSign,
         BarChart2, Shield, Layers }   from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

function KPI({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "14px 16px", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 10, letterSpacing: ".12em", marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ color, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
            {value ?? "—"}
          </div>
          <div style={{ color: C.dim, fontSize: 10, marginTop: 4 }}>{sub}</div>
        </div>
        {Icon && <Icon size={18} color={color} style={{ opacity: .6 }} />}
      </div>
    </div>
  );
}

export default function AccountOverview() {
  const { data, loading } = usePolling(api.getAccountSnap, 5000);

  const snap      = data?.account || {};
  const exposure  = data?.exposure || [];
  const bal       = snap.balance   ?? 0;
  const equity    = snap.equity    ?? 0;
  const openPnl   = snap.open_pnl  ?? 0;
  const margin    = snap.margin    ?? 0;
  const free      = snap.free_margin ?? 0;
  const level     = snap.margin_level ?? 0;
  const positions = data?.exposure?.reduce((s, e) => s + (e.count || 0), 0) ?? 0;

  const fmt  = (n, d=2) => n != null ? `$${Math.abs(n).toLocaleString("en-US", {minimumFractionDigits:d, maximumFractionDigits:d})}` : "—";
  const sign = (n)      => n >= 0 ? "+" : "";

  if (loading) return <Skeleton />;

  return (
    <div>
      <SectionTitle title="ACCOUNT OVERVIEW" sub="IC Markets Raw Spread · Live" />

      {/* ── KPI row ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <KPI label="BALANCE"      value={fmt(bal)}                          sub="Account balance"         color={C.blue}   Icon={DollarSign} />
        <KPI label="EQUITY"       value={fmt(equity)}                        sub="Including open P&L"     color={C.purple} Icon={BarChart2}  />
        <KPI label="OPEN P&L"     value={`${sign(openPnl)}${fmt(openPnl)}`}  sub={`${positions} positions open`} color={openPnl>=0?C.green:C.red} Icon={openPnl>=0?TrendingUp:TrendingDown} />
        <KPI label="FREE MARGIN"  value={fmt(free)}                          sub={`Level: ${level.toFixed(0)}%`}  color={level<200?C.yellow:C.green} Icon={Shield} />
        <KPI label="USED MARGIN"  value={fmt(margin)}                        sub="Allocated collateral"   color={C.orange} Icon={Layers} />
      </div>

      {/* ── Exposure by asset class ── */}
      {exposure.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px",
                        padding: "7px 14px", background: "#0a1020",
                        color: C.dim, fontSize: 10, letterSpacing: ".1em" }}>
            <span>ASSET CLASS</span><span>POSITIONS</span><span>TOTAL LOTS</span>
          </div>
          {exposure.map(e => (
            <div key={e.asset_class}
              style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px",
                       padding: "8px 14px", borderTop: `1px solid #111e2e`,
                       fontSize: 12 }}>
              <span style={{ color: C.blue, fontWeight: 600 }}>{e.asset_class}</span>
              <span>{e.count}</span>
              <span style={{ color: C.muted }}>{(e.total_lots || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ color: "#4a7090", fontSize: 10, letterSpacing: ".12em", fontWeight: 600 }}>
        {title}
      </span>
      {sub && <span style={{ color: "#2a4060", fontSize: 10, marginLeft: 8 }}>— {sub}</span>}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ flex: 1, height: 80, background: "#0d1826",
                              border: "1px solid #1a2840", borderRadius: 6,
                              animation: "shimmer 1.5s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
    </div>
  );
}
