// =============================================================================
// AlgoTradeAI Dashboard — Main App
// =============================================================================
import { useState, useCallback } from "react";
import Header          from "./components/Header.jsx";
import AccountOverview from "./components/AccountOverview.jsx";
import OpenPositions   from "./components/OpenPositions.jsx";
import SignalFeed      from "./components/SignalFeed.jsx";
import ArbFeed         from "./components/ArbFeed.jsx";
import PerformanceChart from "./components/PerformanceChart.jsx";
import MLStatus        from "./components/MLStatus.jsx";
import ReportsPanel    from "./components/ReportsPanel.jsx";
import ActivityLog     from "./components/ActivityLog.jsx";
import RiskPanel       from "./components/RiskPanel.jsx";

const C = {
  green: "#00e5a0", blue: "#4a9eff", muted: "#4a7090",
  surface: "#0d1826", border: "#1a2840", dim: "#2a4060",
};

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #080c14;
    color: #c8d8e8;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    min-height: 100vh;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0e1520; }
  ::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 2px; }
  button { cursor: pointer; font-family: inherit; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeIn .2s ease; }
`;

export default function App() {
  const [tab, setTab] = useState("overview");

  const handleTabChange = useCallback((newTab) => setTab(newTab), []);

  return (
    <>
      <style>{STYLES}</style>

      <Header onTabChange={handleTabChange} activeTab={tab} />

      <main style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ══════════════════════════════════════════
            OVERVIEW TAB — primary landing view
            ══════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="fade-in">
            {/* Account KPIs always at top */}
            <div style={{ marginBottom: 20 }}>
              <AccountOverview />
            </div>

            {/* Two-column layout: positions + risk */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>
              <OpenPositions onSymbolClick={(sym) => setTab("signals")} />
              <RiskPanel />
            </div>

            {/* Two-column layout: signals preview + arb summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <QuickSignalCard onViewAll={() => setTab("signals")} />
              <QuickArbCard   onViewAll={() => setTab("arb")} />
            </div>

            {/* Activity log at bottom */}
            <ActivityLog />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "positions" && (
          <div className="fade-in">
            <div style={{ marginBottom: 20 }}><AccountOverview /></div>
            <OpenPositions onSymbolClick={() => {}} />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "signals" && (
          <div className="fade-in">
            <SignalFeed />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "arb" && (
          <div className="fade-in">
            <ArbFeed />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "performance" && (
          <div className="fade-in">
            <PerformanceChart />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "models" && (
          <div className="fade-in">
            <MLStatus />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "reports" && (
          <div className="fade-in">
            <ReportsPanel />
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {tab === "log" && (
          <div className="fade-in">
            <ActivityLog />
          </div>
        )}
      </main>
    </>
  );
}

// ─── Quick signal preview card (shown on overview tab) ────────────────────────
function QuickSignalCard({ onViewAll }) {
  const SIGNALS = [
    { sym: "EURUSD", sig: "BUY",  conf: 78, src: "CONSENSUS" },
    { sym: "XAUUSD", sig: "HOLD", conf: 52, src: "AI_CLAUDE" },
    { sym: "BTCUSD", sig: "BUY",  conf: 81, src: "ML_SHORT"  },
    { sym: "NVDA.US",sig: "SELL", conf: 69, src: "AI_CLAUDE" },
  ];
  const SIG_C = { BUY: C.green, SELL: "#ff4d6d", HOLD: "#f5c518" };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "#0a1020", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted, fontSize: 10, letterSpacing: ".12em" }}>LATEST SIGNALS</span>
        <button onClick={onViewAll}
          style={{ background: "none", border: "none", color: C.blue,
                   fontSize: 10, padding: 0, fontFamily: "inherit" }}>
          VIEW ALL →
        </button>
      </div>
      {SIGNALS.map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between",
                               alignItems: "center", padding: "9px 14px",
                               borderBottom: i < SIGNALS.length - 1 ? `1px solid #111e2e` : "none" }}>
          <span style={{ color: C.blue, fontWeight: 600, fontSize: 12 }}>{s.sym}</span>
          <span style={{ color: C.dim, fontSize: 10 }}>{s.src.replace(/_/g, " ")}</span>
          <span style={{ color: SIG_C[s.sig], fontWeight: 700, fontSize: 11 }}>{s.sig}</span>
          <span style={{ color: C.muted, fontSize: 10 }}>{s.conf}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Quick arb preview card (shown on overview tab) ───────────────────────────
function QuickArbCard({ onViewAll }) {
  const ROWS = [
    { type: "TRIANGULAR",    syms: "EUR/GBP/EURGBP", net: "0.0041%", color: C.green  },
    { type: "CROSS_EXCHANGE",syms: "AAPL.US / AAPL",  net: "0.0028%", color: C.blue   },
    { type: "TRIANGULAR",    syms: "USD/JPY/USDJPY",  net: "0.0019%", color: C.green  },
    { type: "LATENCY",       syms: "XAUUSD",          net: "0.0012%", color: "#f59e0b" },
  ];

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "#0a1020", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted, fontSize: 10, letterSpacing: ".12em" }}>ARB OPPORTUNITIES</span>
        <button onClick={onViewAll}
          style={{ background: "none", border: "none", color: C.blue,
                   fontSize: 10, padding: 0, fontFamily: "inherit" }}>
          VIEW ALL →
        </button>
      </div>
      {ROWS.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between",
                               alignItems: "center", padding: "9px 14px",
                               borderBottom: i < ROWS.length - 1 ? `1px solid #111e2e` : "none" }}>
          <span style={{ color: r.color, fontWeight: 600, fontSize: 10 }}>
            {r.type.replace(/_/g, " ")}
          </span>
          <span style={{ color: C.muted, fontSize: 11 }}>{r.syms}</span>
          <span style={{ color: C.green, fontWeight: 700, fontSize: 11 }}>{r.net}</span>
        </div>
      ))}
    </div>
  );
}
