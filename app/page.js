// COBRA — Live dashboard (route: /).
//
// Pure data display: polls GET /api/state every ~30s and renders the dashboard.
// A manual Refresh button re-requests immediately. v3 has NO manual input — the
// ladder is anchored on live spot — so there's no "set zones" form. Real data
// only: if the backend is unreachable it shows an explicit "offline" state (no
// sample fallback).

'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchState } from './lib/api.js';
import ExpiryBanner from './components/ExpiryBanner.jsx';
import MetricsPanel from './components/MetricsPanel.jsx';
import SideCard from './components/SideCard.jsx';
import RefreshButton from './components/RefreshButton.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import OptionCalculator from './components/OptionCalculator.jsx';

const POLL_MS = 30000;
// Fixed OI lookback window — the 15/30-min toggle was removed. 15 is the backend
// default (config.thresholds.DEFAULT_WINDOW_MINUTES); it also clamps anything else.
const WINDOW_MINUTES = 15;

function fmtTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// CAP (resistance) first, then FLOOR (support).
function orderSides(sides) {
  const rank = { CAP: 0, FLOOR: 1 };
  return [...(sides || [])].sort((a, b) => (rank[a.side] ?? 9) - (rank[b.side] ?? 9));
}

export default function LivePage() {
  const [state, setState] = useState(null);
  const [source, setSource] = useState('live'); // 'live' | 'error'
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const load = useCallback(async () => {
    const { state: next, source: src, error: err } = await fetchState(WINDOW_MINUTES);
    if (next) setState(next);                // keep the last good state on a transient error
    setSource(src);
    setError(err);
    setStale(false);
    if (next) setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!lastUpdated) return undefined;
    const id = setTimeout(() => setStale(true), POLL_MS * 2.5);
    return () => clearTimeout(id);
  }, [lastUpdated]);

  // Manual refresh — fetch now instead of waiting for the next poll.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const sides = state ? orderSides(state.sides) : [];
  const rangeBroken = (state && state.range_broken) || [];
  // Live spot per index (for spot-to-wall distance + the Nifty↔Sensex ratio).
  const spots = {};
  ((state && state.metrics) || []).forEach((m) => { spots[m.index_name] = m.spot; });

  return (
    <>
      <div className="header-top">
        <div className="header-meta">
          {state && (
            <span className="trading-date">
              {state.weekday} · {state.trading_date}
            </span>
          )}
          <span className="last-updated">last updated {fmtTs(state && state.data_ts)}</span>
          <StatusIndicator source={source} lastUpdated={lastUpdated} stale={stale} />
          <RefreshButton onClick={refresh} busy={refreshing} disabled={loading} />
          <button
            type="button"
            className="calc-open-btn"
            onClick={() => setCalcOpen(true)}
            title="Option price projector"
          >
            <span aria-hidden="true">🧮</span> OI Calc
          </button>
        </div>
      </div>

      <OptionCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />

      {state && <ExpiryBanner expiry={state.expiry} />}

      {rangeBroken.length > 0 && (
        <div className="range-broken-banner" role="alert">
          RANGE BROKEN — {rangeBroken.join(' & ')} spot left the ladder · likely trend day, stop fading
        </div>
      )}

      {state && <MetricsPanel metrics={state.metrics} />}

      <main className="app-main">
        {loading && !state && <div className="loading">Loading…</div>}

        {!loading && !state && source === 'error' && (
          <div className="state-note error-note">
            Backend unavailable — could not reach /api/state{error ? ` (${error})` : ''}.
            Is the server running on the configured base URL?
          </div>
        )}

        {state && state.note && <div className="state-note">{state.note}</div>}

        {state && sides.length === 0 && !state.note && (
          <div className="state-note">No walls locked yet — waiting for the first tick.</div>
        )}

        {sides.map((side) => (
          <SideCard
            key={`${side.side}-${side.option_type}`}
            side={side}
            spots={spots}
            liveRatio={state.live_ratio}
            window={state.window_minutes}
          />
        ))}
      </main>
    </>
  );
}
