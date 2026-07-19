// =============================================================================
// AlgoTradeAI Dashboard — Reports Panel Component
// =============================================================================
import { useState, useCallback } from "react";
import { usePolling }   from "../hooks/usePolling.js";
import { api }          from "../api/worker.js";
import { SectionTitle } from "./AccountOverview.jsx";
import { FileText, Send, CheckCircle, XCircle, Clock } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const REPORT_TYPES = [
  { type: "DAILY",     label: "Daily",     color: C.blue,    schedule: "Every day @ 22:50 WAT"       },
  { type: "WEEKLY",    label: "Weekly",    color: C.green,   schedule: "Every Sunday @ 22:50 WAT"     },
  { type: "MONTHLY",   label: "Monthly",   color: C.purple,  schedule: "Last day of month @ 22:50 WAT"},
  { type: "QUARTERLY", label: "Quarterly", color: C.orange,  schedule: "Quarter end @ 22:50 WAT"      },
  { type: "YEARLY",    label: "Yearly",    color: C.yellow,  schedule: "Dec 31 @ 22:50 WAT"           },
];

export default function ReportsPanel() {
  const [triggering, setTriggering] = useState({});
  const [triggered,  setTriggered]  = useState({});

  const { data, refresh } = usePolling(
    () => api.getReportHistory(""),
    30000
  );

  const reports = data?.reports || [];

  const trigger = useCallback(async (type) => {
    setTriggering(prev => ({ ...prev, [type]: true }));
    try {
      await api.triggerReport(type);
      setTriggered(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setTriggered(prev => ({ ...prev, [type]: false })), 5000);
      setTimeout(refresh, 8000);
    } finally {
      setTriggering(prev => ({ ...prev, [type]: false }));
    }
  }, [refresh]);

  return (
    <div>
      <SectionTitle title="REPORT ENGINE" sub="PDF · SendGrid · Cloudflare R2 · 22:50 WAT" />

      {/* ── Trigger buttons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {REPORT_TYPES.map(r => {
          const isTriggering = triggering[r.type];
          const isTriggered  = triggered[r.type];
          return (
            <div key={r.type} style={{ background: C.surface, border: `1px solid ${C.border}`,
                                        borderRadius: 6, padding: "14px 12px", textAlign: "center" }}>
              <FileText size={16} color={r.color} style={{ marginBottom: 8 }} />
              <div style={{ color: "#c8d8e8", fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                {r.label}
              </div>
              <div style={{ color: C.dim, fontSize: 9, marginBottom: 12 }}>{r.schedule}</div>
              <button onClick={() => trigger(r.type)}
                disabled={isTriggering || isTriggered}
                style={{ background: isTriggered ? "#001a0e" : "#0e1e30",
                         border: `1px solid ${isTriggered ? "#003a20" : "#1a3a50"}`,
                         color: isTriggered ? C.green : r.color,
                         padding: "5px 0", borderRadius: 3, cursor: "pointer",
                         fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                         width: "100%", display: "flex", alignItems: "center",
                         justifyContent: "center", gap: 5,
                         opacity: isTriggering ? .6 : 1 }}>
                {isTriggering ? (
                  <><Clock size={10} style={{ animation: "spin 1s linear infinite" }} /> SENDING…</>
                ) : isTriggered ? (
                  <><CheckCircle size={10} /> TRIGGERED</>
                ) : (
                  <><Send size={10} /> SEND NOW</>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Report history ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", background: "#0a1020",
                      color: C.dim, fontSize: 9, letterSpacing: ".12em",
                      display: "flex", justifyContent: "space-between" }}>
          <span>REPORT HISTORY</span>
          <span>{reports.length} records</span>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.dim }}>
            No reports sent yet
          </div>
        ) : (
          <>
            <div style={{ display: "grid",
                          gridTemplateColumns: "80px 120px 90px 80px 80px 80px 70px",
                          padding: "7px 14px", background: "#09101a",
                          color: C.dim, fontSize: 9, letterSpacing: ".1em",
                          borderBottom: `1px solid ${C.border}` }}>
              {["TYPE","PERIOD","NET P&L","WIN RATE","SHARPE","TRADES","STATUS"].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {reports.map((r, i) => {
              const typeInfo = REPORT_TYPES.find(t => t.type === r.report_type);
              const color    = typeInfo?.color ?? C.muted;
              const pnl      = r.net_pnl ?? 0;
              const isOk     = r.status === "SENT";

              return (
                <div key={i} style={{ display: "grid",
                                       gridTemplateColumns: "80px 120px 90px 80px 80px 80px 70px",
                                       padding: "9px 14px", borderTop: `1px solid #111e2e`,
                                       fontSize: 11, alignItems: "center" }}>
                  <span style={{ color, fontWeight: 600, fontSize: 10 }}>{r.report_type}</span>
                  <span style={{ color: C.muted, fontSize: 10 }}>
                    {r.period_end ? new Date(r.period_end).toLocaleDateString() : "—"}
                  </span>
                  <span style={{ color: pnl >= 0 ? C.green : C.red, fontWeight: 600 }}>
                    {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)}
                  </span>
                  <span>{r.win_rate != null ? `${(r.win_rate * 100).toFixed(1)}%` : "—"}</span>
                  <span style={{ color: (r.sharpe_ratio ?? 0) >= 1 ? C.green : C.muted }}>
                    {r.sharpe_ratio?.toFixed(3) ?? "—"}
                  </span>
                  <span>{r.total_trades ?? "—"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4,
                                 color: isOk ? C.green : C.red, fontSize: 10 }}>
                    {isOk ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {r.status}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
