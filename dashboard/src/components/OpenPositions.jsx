// =============================================================================
// AlgoTradeAI Dashboard — Open Positions Component
// =============================================================================
import { useState }     from "react";
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import { X, TrendingUp, TrendingDown } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const ENGINE_COLORS = {
  AI_SHORT: C.blue, AI_LONG: C.purple,
  ML_SHORT: C.green, ML_LONG: "#00c4ff",
  ARB: C.orange, UNKNOWN: C.muted,
};

export default function OpenPositions({ onSymbolClick }) {
  const { data, loading, lastUpdate } = usePolling(api.getPositions, 4000);
  const [filter, setFilter] = useState("ALL");

  const positions = data?.positions || [];
  const assetClasses = ["ALL", ...new Set(positions.map(p => p.asset_class).filter(Boolean))];

  const filtered = filter === "ALL"
    ? positions
    : positions.filter(p => p.asset_class === filter);

  const fmt = (n) => n != null
    ? `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

  const age = (openTime) => {
    if (!openTime) return "—";
    const diff = Math.floor((Date.now() - new Date(openTime)) / 60000);
    if (diff < 60)   return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle title="OPEN POSITIONS" sub={`${positions.length} active · updated ${lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}`} />
        {/* Asset class filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {assetClasses.map(cls => (
            <button key={cls} onClick={() => setFilter(cls)}
              style={{ background: filter === cls ? "#0e2a40" : "#0d1826",
                       border:     `1px solid ${filter === cls ? "#1a5a80" : C.border}`,
                       color:      filter === cls ? C.blue : C.muted,
                       padding: "3px 10px", borderRadius: 3,
                       cursor: "pointer", fontSize: 10, fontWeight: 600,
                       fontFamily: "inherit" }}>
              {cls}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingRows /> : filtered.length === 0 ? <Empty /> : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid",
                        gridTemplateColumns: "90px 55px 60px 85px 85px 85px 70px 70px 1fr",
                        padding: "7px 14px", background: "#0a1020",
                        color: C.dim, fontSize: 9, letterSpacing: ".1em" }}>
            {["SYMBOL","DIR","CLASS","ENTRY","CURRENT","UNREAL P&L","ENGINE","OPEN FOR","SL / TP"].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {filtered.map((pos, i) => {
            const engColor = ENGINE_COLORS[pos.strategy_engine] || C.muted;
            const dirColor = pos.direction === "BUY" ? C.green : C.red;

            return (
              <div key={pos.id || i}
                onClick={() => onSymbolClick?.(pos.symbol)}
                style={{ display: "grid",
                         gridTemplateColumns: "90px 55px 60px 85px 85px 85px 70px 70px 1fr",
                         padding: "9px 14px", borderTop: `1px solid #111e2e`,
                         cursor: "pointer", transition: "background .1s",
                         fontSize: 11, alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "#0e1a28"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: C.blue, fontWeight: 600 }}>{pos.symbol}</span>
                <span style={{ color: dirColor, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                  {pos.direction === "BUY" ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                  {pos.direction}
                </span>
                <span style={{ color: C.muted, fontSize: 10 }}>{pos.asset_class}</span>
                <span>{pos.open_price?.toFixed?.(5) ?? "—"}</span>
                <span style={{ color: C.muted }}>—</span>
                <span style={{ color: C.muted, fontStyle: "italic", fontSize: 10 }}>Pending</span>
                <span style={{ color: engColor, fontSize: 10, fontWeight: 600 }}>{pos.strategy_engine}</span>
                <span style={{ color: C.muted }}>{age(pos.open_time)}</span>
                <span style={{ color: C.dim, fontSize: 10 }}>
                  {pos.stop_loss ? `SL ${pos.stop_loss?.toFixed?.(5)}` : "—"}
                  {pos.take_profit ? ` / TP ${pos.take_profit?.toFixed?.(5)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary row */}
      {positions.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: C.muted }}>
          <span>Long: <span style={{ color: C.green }}>
            {positions.filter(p => p.direction === "BUY").length}
          </span></span>
          <span>Short: <span style={{ color: C.red }}>
            {positions.filter(p => p.direction === "SELL").length}
          </span></span>
          <span>Arb: <span style={{ color: C.orange }}>
            {positions.filter(p => p.strategy_engine?.startsWith?.("ARB")).length}
          </span></span>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 32, textAlign: "center", color: "#2a4060",
                  border: `1px solid #1a2840`, borderRadius: 6 }}>
      No open positions
    </div>
  );
}

function LoadingRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 38, background: "#0d1826",
                              border: "1px solid #1a2840", borderRadius: 4,
                              animation: "shimmer 1.5s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
    </div>
  );
}
