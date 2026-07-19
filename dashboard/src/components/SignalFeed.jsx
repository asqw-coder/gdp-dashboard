// =============================================================================
// AlgoTradeAI Dashboard — Signal Feed Component
// =============================================================================
import { useState, useCallback } from "react";
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import { Zap, Brain, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const WATCHED_SYMBOLS = [
  "EURUSD","GBPUSD","USDJPY","XAUUSD","BTCUSD",
  "ETHUSD","NVDA.US","AAPL.US","XTIUSD","XAGUSD",
];

const SIG_COLOR = { BUY: C.green, SELL: C.red, HOLD: C.yellow };
const SIG_ICON  = {
  BUY:  <TrendingUp  size={14} />,
  SELL: <TrendingDown size={14} />,
  HOLD: <Minus size={14} />,
};
const RISK_COLOR = { LOW: C.green, MEDIUM: C.yellow, HIGH: C.red };

export default function SignalFeed() {
  const [signals,   setSignals]   = useState({});
  const [loading,   setLoading]   = useState({});
  const [selected,  setSelected]  = useState("EURUSD");
  const [scanAll,   setScanAll]   = useState(false);

  const fetchSignal = useCallback(async (symbol) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const result = await api.getSignal(symbol);
      if (result) {
        setSignals(prev => ({ ...prev, [symbol]: { ...result, fetched_at: new Date() } }));
      }
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  }, []);

  const scanAllSignals = async () => {
    setScanAll(true);
    for (const sym of WATCHED_SYMBOLS) {
      await fetchSignal(sym);
      await new Promise(r => setTimeout(r, 300)); // stagger to avoid rate limit
    }
    setScanAll(false);
  };

  const sig = signals[selected];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle title="SIGNAL FEED" sub="AI + ML Consensus · Cloudflare Workers AI" />
        <button onClick={scanAllSignals} disabled={scanAll}
          style={{ background: "#0e1e30", color: C.blue, border: `1px solid #1a3a50`,
                   padding: "4px 12px", borderRadius: 3, cursor: "pointer",
                   fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                   opacity: scanAll ? .5 : 1, display: "flex", alignItems: "center", gap: 5 }}>
          <RefreshCw size={10} style={{ animation: scanAll ? "spin 1s linear infinite" : "none" }} />
          SCAN ALL
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}>
        {/* ── Symbol selector ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ padding: "7px 12px", background: "#0a1020",
                        color: C.dim, fontSize: 9, letterSpacing: ".12em" }}>
            WATCHLIST
          </div>
          {WATCHED_SYMBOLS.map(sym => {
            const s        = signals[sym];
            const isActive = selected === sym;
            const color    = s ? SIG_COLOR[s.signal] : C.dim;
            return (
              <div key={sym}
                onClick={() => setSelected(sym)}
                style={{ display: "flex", justifyContent: "space-between",
                         alignItems: "center", padding: "8px 12px",
                         borderTop: `1px solid #111e2e`, cursor: "pointer",
                         background: isActive ? "#0e1a28" : "transparent",
                         transition: "background .1s" }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = "#0a1420")}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ color: isActive ? C.blue : C.muted,
                               fontWeight: isActive ? 700 : 400, fontSize: 12 }}>
                  {sym}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {loading[sym] ? (
                    <span style={{ color: C.muted, fontSize: 9 }}>…</span>
                  ) : s ? (
                    <>
                      <span style={{ color, fontWeight: 700, fontSize: 10 }}>{s.signal}</span>
                      <span style={{ color: C.dim, fontSize: 9 }}>{Math.round(s.confidence || 0)}%</span>
                    </>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); fetchSignal(sym); }}
                      style={{ background: "none", border: "none", color: C.dim,
                               cursor: "pointer", fontSize: 9, padding: 0, fontFamily: "inherit" }}>
                      FETCH
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Signal detail ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}>
          {!sig && !loading[selected] ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ color: C.dim, marginBottom: 16 }}>
                No signal loaded for <span style={{ color: C.blue }}>{selected}</span>
              </div>
              <button onClick={() => fetchSignal(selected)}
                style={{ background: "#001a0e", color: C.green, border: `1px solid #003a20`,
                         padding: "8px 20px", borderRadius: 4, cursor: "pointer",
                         fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                <Zap size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
                GENERATE SIGNAL
              </button>
            </div>
          ) : loading[selected] ? (
            <div style={{ padding: 40, textAlign: "center", color: C.blue,
                          animation: "pulse 1s infinite" }}>
              Calling Workers AI…
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
            </div>
          ) : sig && (
            <div style={{ padding: 20 }}>
              {/* Signal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <span style={{ color: C.blue, fontSize: 18, fontWeight: 700, marginRight: 10 }}>{selected}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>
                    {sig.fetched_at?.toLocaleTimeString?.() ?? ""}
                  </span>
                </div>
                <button onClick={() => fetchSignal(selected)}
                  style={{ background: "#0e1e30", border: `1px solid #1a3a50`,
                           color: C.blue, padding: "4px 10px", borderRadius: 3,
                           cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>
                  ↺ REFRESH
                </button>
              </div>

              {/* Big signal */}
              <div style={{ textAlign: "center", padding: "16px 0 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                              gap: 10, marginBottom: 6 }}>
                  <span style={{ color: SIG_COLOR[sig.signal] }}>{SIG_ICON[sig.signal]}</span>
                  <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: 6,
                                 color: SIG_COLOR[sig.signal] }}>
                    {sig.signal}
                  </span>
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>
                  Confidence:&nbsp;
                  <span style={{ color: SIG_COLOR[sig.signal], fontWeight: 700 }}>
                    {Math.round(sig.confidence || 0)}%
                  </span>
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  ["TARGET PRICE",  sig.target_price?.toFixed?.(5) ?? "—", C.green ],
                  ["STOP LOSS",     sig.stop_loss?.toFixed?.(5) ?? "—",    C.red   ],
                  ["RISK LEVEL",    sig.risk_level ?? "—",
                    RISK_COLOR[sig.risk_level] ?? C.muted ],
                  ["TRADE TYPE",    sig.trade_type ?? "—",                  C.blue  ],
                  ["SOURCE",        sig.source?.replace?.(/_/g," ") ?? "AI",C.purple],
                  ["ML CONF",       sig.sources?.mlShort
                    ? `${Math.round(sig.sources.mlShort.confidence || 0)}%`
                    : "—",                                                   C.muted ],
                ].map(([lbl, val, col]) => (
                  <div key={lbl} style={{ background: "#0a1420", borderRadius: 4, padding: "8px 10px" }}>
                    <div style={{ color: C.dim, fontSize: 9, marginBottom: 3 }}>{lbl}</div>
                    <div style={{ color: col, fontWeight: 600, fontSize: 12 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Reasoning */}
              {sig.reasoning && (
                <div style={{ background: "#0a1420", borderRadius: 4, padding: "10px 12px",
                              color: "#8aa", fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                  <Brain size={11} style={{ marginRight: 6, color: C.purple, verticalAlign: "middle" }} />
                  {sig.reasoning}
                </div>
              )}

              {/* Source breakdown */}
              {sig.sources && (
                <SourceBreakdown sources={sig.sources} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceBreakdown({ sources }) {
  const rows = [
    ["AI CLAUDE",    sources.ai,      "#4a9eff"],
    ["ML SHORT",     sources.mlShort, "#00e5a0"],
    ["ML LONG",      sources.mlLong,  "#a78bfa"],
  ].filter(([, s]) => s);

  if (!rows.length) return null;

  return (
    <div style={{ borderTop: `1px solid #1a2840`, paddingTop: 12 }}>
      <div style={{ color: "#2a5060", fontSize: 9, letterSpacing: ".1em", marginBottom: 8 }}>
        SIGNAL SOURCES
      </div>
      {rows.map(([label, src, color]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between",
                                   padding: "4px 0", fontSize: 11 }}>
          <span style={{ color: "#4a7090" }}>{label}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color, fontWeight: 700 }}>{src.signal}</span>
            <span style={{ color: "#2a4060" }}>{Math.round(src.confidence || 0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
