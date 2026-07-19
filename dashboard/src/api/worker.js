// =============================================================================
// AlgoTradeAI Dashboard — Worker API Client
// =============================================================================
// All API calls to Cloudflare Workers go through this module.
// Reads Worker URL and API key from environment (set in CF Pages dashboard).
// =============================================================================

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "";
const API_KEY    = import.meta.env.VITE_API_KEY    || "";

const headers = {
  "Content-Type":   "application/json",
  "x-algo-api-key": API_KEY,
};

async function get(path) {
  try {
    const res  = await fetch(`${WORKER_URL}${path}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`GET ${path} failed:`, err.message);
    return null;
  }
}

async function post(path, body) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`POST ${path} failed:`, err.message);
    return null;
  }
}

// ── System health ─────────────────────────────────────────────────────────────
export const api = {
  getHealth:        () => get("/signal/status"),
  getAccountSnap:   () => get("/trade/risk"),
  getPositions:     () => get("/trade/positions"),

  // Signals
  getSignal:        (symbol) => post("/signal/consensus", { symbol }),
  getSignalStatus:  () => get("/signal/status"),

  // Arbitrage
  getArbSummary:    () => get("/arb/summary"),
  runArbScan:       (symbols) => post("/arb/scan", { symbols }),

  // Reports
  getReportHistory: (type)  => get(`/report/history?type=${type}&limit=10`),
  getReportData:    (type)  => get(`/report/data?type=${type}`),
  triggerReport:    (type)  => get(`/scheduler/trigger?type=${type}`),

  // System log
  getSystemLog: async (limit = 30) => {
    // Query D1 directly via Worker (if you add this endpoint)
    // Fallback: return empty for now
    return { logs: [] };
  },
};
