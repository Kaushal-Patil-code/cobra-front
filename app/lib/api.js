// Data layer for the COBRA dashboard (v3).
//
// Fetches REAL data from the Flask backend through the /api/* proxy — next.config.js
// rewrites those to COBRA_BACKEND (see frontend-next/.env). There is no sample
// fallback: on any failure the helpers return null data + an error string and
// `source: 'error'`, so the UI shows an explicit "unavailable" state instead of
// masking an outage with fake data.

// Generous so a Render free cold start / slow first DB connection surfaces the
// real response instead of aborting early as a "timeout".
const REQUEST_TIMEOUT_MS = 25000;

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

function errMsg(err) {
  if (err && err.name === 'AbortError') return 'timeout';
  return String(err && err.message ? err.message : err);
}

function qs(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== null && v !== undefined && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function getJSON(path) {
  const t = withTimeout(REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/${path}`, {
      headers: { Accept: 'application/json' },
      signal: t.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { json: await res.json(), error: null };
  } catch (err) {
    return { json: null, error: errMsg(err) };
  } finally {
    t.clear();
  }
}

/**
 * Latest dashboard state for a window. @returns {{state, source, error}}
 */
export async function fetchState(windowMinutes = 15) {
  const { json, error } = await getJSON(`state?window=${encodeURIComponent(windowMinutes)}`);
  return { state: json, source: error ? 'error' : 'live', error };
}

/**
 * Logged verdicts + weekday buckets. @returns {{history, source, error}}
 */
export async function fetchHistory(start, end, side) {
  const path = `history${qs({ start, end, side: side && side !== 'ALL' ? side : undefined })}`;
  const { json, error } = await getJSON(path);
  return { history: json, source: error ? 'error' : 'live', error };
}

// ── History "all tables" — keyset-paginated table reads ───────────────────────
// Each returns { data: {items, page} | null, source: 'live'|'error', error }.
// `params` carries filters + pagination (start, end, index, side, option_type,
// strike, expiry, limit, cursor, order); null/'' values are dropped.
async function fetchTable(path, params) {
  const { json, error } = await getJSON(`${path}${qs(params)}`);
  return { data: json, source: error ? 'error' : 'live', error };
}

export const fetchSnapshots = (params) => fetchTable('snapshots', params);
export const fetchMetrics = (params) => fetchTable('metrics', params);
export const fetchLadders = (params) => fetchTable('ladders', params);
export const fetchWalls = (params) => fetchTable('walls', params);
export const fetchInstruments = (params) => fetchTable('instruments', params);
