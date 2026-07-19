// =============================================================================
// AlgoTradeAI Dashboard — Activity Log Component
// =============================================================================
import { useState, useEffect, useRef } from "react";
import { SectionTitle } from "./AccountOverview.jsx";
import { Terminal } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

// Color per component
const COMP_COLOR = {
  SIGNAL_ENGINE: C.blue,
  ARB_ENGINE:    C.green,
  TRADE_API:     C.orange,
  REPORT_ENGINE: C.purple,
  ML_PIPELINE:   "#00c4ff",
  SCHEDULER:     C.yellow,
  EA:            C.green,
  RISK_MANAGER:  C.red,
};

// Level colors
const LEVEL_COLOR = {
  INFO:  C.muted,
  ERROR: C.red,
  DEBUG: C.dim,
  WARN:  C.yellow,
};

// Simulated boot log — shown before real data arrives
const BOOT_LOG = [
  { time: "SYSTEM", component: "SYSTEM",       level: "INFO",  message: "AlgoTradeAI v2.0 initializing…"                          },
  { time: "SYSTEM", component: "SIGNAL_ENGINE", level: "INFO",  message: "Signal Worker deployed — /signal/ai /signal/ml /signal/consensus" },
  { time: "SYSTEM", component: "ARB_ENGINE",    level: "INFO",  message: "Arb engine active — Cross-exchange, Triangular, Latency" },
  { time: "SYSTEM", component: "TRADE_API",     level: "INFO",  message: "Trade API live — /trade/open /trade/close /trade/heartbeat" },
  { time: "SYSTEM", component: "REPORT_ENGINE", level: "INFO",  message: "Report engine ready — Daily/Weekly/Monthly/Quarterly/Yearly" },
  { time: "SYSTEM", component: "ML_PIPELINE",   level: "INFO",  message: "LSTM + XGBoost models loaded from R2"                   },
  { time: "SYSTEM", component: "SCHEDULER",     level: "INFO",  message: "Cron active: 50 22 * * * (22:50 UTC = 23:50 WAT)"       },
];

export default function ActivityLog({ externalLogs = [] }) {
  const [logs, setLogs]           = useState(BOOT_LOG);
  const [filter, setFilter]       = useState("ALL");
  const [autoScroll, setScroll]   = useState(true);
  const logRef                    = useRef(null);

  // Merge external logs (from parent component / WebSocket / polling)
  useEffect(() => {
    if (externalLogs.length > 0) {
      setLogs(prev => {
        const combined = [...prev, ...externalLogs].slice(-200); // keep last 200
        return combined;
      });
    }
  }, [externalLogs]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const components = ["ALL", ...new Set(logs.map(l => l.component).filter(Boolean))];
  const filtered   = filter === "ALL" ? logs : logs.filter(l => l.component === filter);

  const now = new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos" });

  // Simulate live log entries every few seconds
  useEffect(() => {
    const DEMO_MSGS = [
      { component: "TRADE_API",     level: "INFO",  message: `Heartbeat received — ${Math.floor(Math.random()*20)} positions open`         },
      { component: "SIGNAL_ENGINE", level: "INFO",  message: `AI signal generated: EURUSD BUY ${Math.floor(65+Math.random()*25)}% confidence` },
      { component: "ARB_ENGINE",    level: "INFO",  message: `Triangular arb scanned: EURUSD/GBPUSD/EURGBP — ${(Math.random()*0.04).toFixed(4)}% net` },
      { component: "ML_PIPELINE",   level: "INFO",  message: `LSTM short prediction: XAUUSD HOLD (${Math.floor(55+Math.random()*20)}% conf)`  },
      { component: "TRADE_API",     level: "INFO",  message: `Position updated — KV cache refreshed`                                          },
      { component: "SIGNAL_ENGINE", level: "INFO",  message: `KV cache hit for BTCUSD signal (38s remaining TTL)`                             },
      { component: "SCHEDULER",     level: "INFO",  message: `Next report: Daily @ 22:50 WAT`                                                 },
      { component: "ARB_ENGINE",    level: "INFO",  message: `Price pushed to Worker: 27 symbols @ ${new Date().toLocaleTimeString()}`         },
    ];

    const id = setInterval(() => {
      const entry = DEMO_MSGS[Math.floor(Math.random() * DEMO_MSGS.length)];
      setLogs(prev => [
        ...prev.slice(-199),
        { ...entry, time: new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos" }) }
      ]);
    }, 3500);

    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle title="ACTIVITY LOG" sub={`${filtered.length} entries · ${now} WAT`} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Component filter */}
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted,
                     padding: "3px 8px", borderRadius: 3, fontSize: 10,
                     fontFamily: "inherit", cursor: "pointer" }}>
            {components.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Auto-scroll toggle */}
          <button onClick={() => setScroll(p => !p)}
            style={{ background: autoScroll ? "#0e2a1e" : C.surface,
                     border: `1px solid ${autoScroll ? "#003a20" : C.border}`,
                     color: autoScroll ? C.green : C.muted,
                     padding: "3px 10px", borderRadius: 3, cursor: "pointer",
                     fontSize: 10, fontFamily: "inherit" }}>
            AUTO-SCROLL {autoScroll ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Log viewport */}
      <div ref={logRef}
        style={{ background: "#060b12", border: `1px solid ${C.border}`,
                 borderRadius: 6, height: 420, overflowY: "auto",
                 padding: "10px 0", fontFamily: "'Courier New', monospace" }}
        onScroll={e => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setScroll(atBottom);
        }}
      >
        {filtered.map((entry, i) => {
          const compColor  = COMP_COLOR[entry.component] || C.muted;
          const levelColor = LEVEL_COLOR[entry.level]    || C.muted;
          const isError    = entry.level === "ERROR";

          return (
            <div key={i}
              style={{ display: "grid",
                       gridTemplateColumns: "70px 130px 55px 1fr",
                       padding: "3px 14px", fontSize: 11, lineHeight: 1.6,
                       background: isError ? "#0a0508" : "transparent",
                       borderLeft: isError ? `2px solid ${C.red}` : "2px solid transparent",
                       transition: "background .1s" }}
              onMouseEnter={e => !isError && (e.currentTarget.style.background = "#0a1018")}
              onMouseLeave={e => !isError && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: C.dim }}>{entry.time}</span>
              <span style={{ color: compColor, fontWeight: 600, fontSize: 10 }}>
                [{entry.component}]
              </span>
              <span style={{ color: levelColor, fontSize: 10 }}>{entry.level}</span>
              <span style={{ color: isError ? C.red : "#8aa" }}>{entry.message}</span>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "5px 10px", background: "#060b12",
                    border: `1px solid ${C.border}`, borderTop: "none",
                    borderRadius: "0 0 6px 6px", fontSize: 10, color: C.dim }}>
        <span>
          <Terminal size={9} style={{ marginRight: 5, verticalAlign: "middle" }} />
          AlgoTradeAI System Log
        </span>
        <span>{filtered.length} entries displayed</span>
      </div>
    </div>
  );
}
