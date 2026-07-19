// =============================================================================
// AlgoTradeAI Dashboard — Header Component
// =============================================================================
import { usePolling }    from "../hooks/usePolling.js";
import { api }           from "../api/worker.js";
import { Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  muted: "#4a7090", dim: "#2a4060", border: "#1a2840",
  surface: "#0a1018",
};

export default function Header({ onTabChange, activeTab, lastGlobalUpdate }) {
  const { data: health } = usePolling(api.getHealth, 15000);

  const isOnline    = health?.status === "ok";
  const mt5Online   = health?.mt5_connected !== false;
  const now         = new Date();
  const timeStr     = now.toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos" });
  const dateStr     = now.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos",
                        day: "2-digit", month: "short", year: "numeric" });

  const tabs = [
    { id: "overview",   label: "OVERVIEW"   },
    { id: "positions",  label: "POSITIONS"  },
    { id: "signals",    label: "SIGNALS"    },
    { id: "arb",        label: "ARBITRAGE"  },
    { id: "performance",label: "PERFORMANCE"},
    { id: "models",     label: "MODELS"     },
    { id: "reports",    label: "REPORTS"    },
    { id: "log",        label: "ACTIVITY"   },
  ];

  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
      {/* ── Top bar ── */}
      <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: C.green, fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
            ALGO·TRADE·AI
          </div>
          <span style={{ background: "#0e2a1e", color: C.green, padding: "2px 8px",
                         borderRadius: 3, fontSize: 10, fontWeight: 600 }}>
            v2.0
          </span>
        </div>

        {/* Status indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Worker status */}
          <StatusBadge
            label="WORKER"
            ok={isOnline}
            color={C.blue}
            Icon={isOnline ? Wifi : WifiOff}
          />
          {/* MT5 status */}
          <StatusBadge
            label="MT5"
            ok={mt5Online}
            color={C.green}
            Icon={Activity}
          />
          {/* IC Markets */}
          <div style={{ color: C.dim, fontSize: 10 }}>
            IC MARKETS · RAW SPREAD
          </div>
          {/* Time */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{timeStr}</div>
            <div style={{ color: C.dim,   fontSize: 10 }}>{dateStr} WAT</div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div style={{ display: "flex", paddingLeft: 20, gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              background:   "transparent",
              border:       "none",
              borderBottom: activeTab === t.id ? `2px solid ${C.green}` : "2px solid transparent",
              color:        activeTab === t.id ? C.green : C.muted,
              padding:      "7px 14px",
              cursor:       "pointer",
              fontSize:     10,
              fontWeight:   600,
              letterSpacing:".1em",
              fontFamily:   "inherit",
              transition:   "all .15s",
            }}
          >{t.label}</button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ label, ok, color, Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%",
                    background: ok ? color : C.red,
                    boxShadow:  ok ? `0 0 6px ${color}` : "none",
                    animation:  ok ? "pulse 2s infinite" : "none" }} />
      <Icon size={12} color={ok ? color : C.red} />
      <span style={{ fontSize: 10, color: ok ? color : C.red, fontWeight: 600 }}>
        {label}
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
