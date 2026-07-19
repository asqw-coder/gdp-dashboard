// =============================================================================
// AlgoTradeAI Dashboard — ML Model Status Component
// =============================================================================
import { usePolling }    from "../hooks/usePolling.js";
import { api }           from "../api/worker.js";
import { SectionTitle }  from "./AccountOverview.jsx";
import { Brain, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

const C = {
  green: "#00e5a0", red: "#ff4d6d", blue: "#4a9eff",
  purple: "#a78bfa", yellow: "#f5c518", orange: "#f59e0b",
  surface: "#0d1826", border: "#1a2840", muted: "#4a7090", dim: "#2a4060",
};

const MODELS = [
  { key: "LSTM_SHORT",  label: "LSTM Short-Term", tf: "M15",  schedule: "Nightly 00:30 WAT" },
  { key: "LSTM_LONG",   label: "LSTM Long-Term",  tf: "H4",   schedule: "Weekly Sun 01:30 WAT" },
  { key: "XGB_SHORT",   label: "XGBoost Short",   tf: "M15",  schedule: "Nightly 00:30 WAT" },
  { key: "XGB_LONG",    label: "XGBoost Long",    tf: "H4",   schedule: "Weekly Sun 01:30 WAT" },
];

function accColor(acc) {
  if (!acc) return C.muted;
  if (acc >= 75) return C.green;
  if (acc >= 60) return C.yellow;
  return C.red;
}

function ModelCard({ config, info }) {
  const hasInfo   = !!info;
  const acc       = info?.accuracy ?? 0;
  const deployed  = info?.deployed_at ? new Date(info.deployed_at).toLocaleDateString() : "—";
  const version   = info?.version ?? "—";
  const aColor    = accColor(acc);
  const isHealthy = acc >= 60;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "14px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={14} color={C.purple} />
          <span style={{ color: "#c8d8e8", fontWeight: 600, fontSize: 13 }}>{config.label}</span>
        </div>
        {hasInfo
          ? isHealthy
            ? <CheckCircle size={14} color={C.green} />
            : <AlertCircle size={14} color={C.red} />
          : <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.dim }} />
        }
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "VERSION",    value: version,              color: C.blue   },
          { label: "TIMEFRAME",  value: config.tf,            color: C.muted  },
          { label: "ACCURACY",   value: acc ? `${acc.toFixed(1)}%` : "—", color: aColor },
          { label: "DEPLOYED",   value: deployed,             color: C.dim    },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#0a1420", borderRadius: 4, padding: "7px 9px" }}>
            <div style={{ color: C.dim, fontSize: 8, letterSpacing: ".1em", marginBottom: 3 }}>{label}</div>
            <div style={{ color, fontWeight: 600, fontSize: 11 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                    color: C.dim, fontSize: 10 }}>
        <Clock size={10} />
        {config.schedule}
      </div>

      {/* Accuracy bar */}
      {acc > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ background: "#0a1420", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(acc, 100)}%`, height: "100%",
                          background: aColor, transition: "width .6s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MLStatus() {
  // Fetch model info from the system state KV via the report data endpoint
  const { data: dailyData } = usePolling(
    () => api.getReportData("DAILY"),
    60000  // refresh every minute
  );

  const modelInfo = dailyData?.data?.model_info ?? {};

  // Training log (last runs)
  const shortInfo = modelInfo.short || null;
  const longInfo  = modelInfo.long  || null;

  const modelMap = {
    LSTM_SHORT: shortInfo,
    LSTM_LONG:  longInfo,
    XGB_SHORT:  shortInfo ? { ...shortInfo, version: shortInfo.version?.replace("LSTM","XGB") ?? "—" } : null,
    XGB_LONG:   longInfo  ? { ...longInfo,  version: longInfo.version?.replace("LSTM","XGB")  ?? "—" } : null,
  };

  return (
    <div>
      <SectionTitle title="ML MODEL STATUS" sub="LSTM + XGBoost · ONNX deployed on VPS" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 14 }}>
        {MODELS.map(config => (
          <ModelCard key={config.key} config={config} info={modelMap[config.key]} />
        ))}
      </div>

      {/* Training pipeline status */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "14px 16px" }}>
        <div style={{ color: C.muted, fontSize: 9, letterSpacing: ".12em", marginBottom: 12 }}>
          TRAINING PIPELINE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "DATA SOURCE",  value: "IC Markets MT5",   color: C.blue   },
            { label: "HISTORY",      value: "4 Years M15",      color: C.muted  },
            { label: "FRAMEWORK",    value: "TF/Keras + XGB",   color: C.purple },
            { label: "EXPORT",       value: "ONNX opset 12",    color: C.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0a1420", borderRadius: 4, padding: "8px 10px" }}>
              <div style={{ color: C.dim, fontSize: 8, letterSpacing: ".1em", marginBottom: 3 }}>{label}</div>
              <div style={{ color, fontWeight: 600, fontSize: 11 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
