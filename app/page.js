// COBRA — Live dashboard (route: /).
//
// Pure data display: polls GET /api/state every ~30s and renders the dashboard.
// The window toggle (15 / 30 min) re-requests /api/state?window=<n> immediately.
// v3 has NO manual input — the ladder is anchored on live spot — so there's no
// "set zones" form. Real data only: if the backend is unreachable it shows an
// explicit "offline" state (no sample fallback).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchState } from './lib/api.js';
import ExpiryBanner from './components/ExpiryBanner.jsx';
import MetricsPanel from './components/MetricsPanel.jsx';
import SideCard from './components/SideCard.jsx';
import WindowToggle from './components/WindowToggle.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';

const POLL_MS = 30000;

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
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [state, setState] = useState(null);
  const [source, setSource] = useState('live'); // 'live' | 'error'
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keep the latest requested window in a ref so the interval callback always
  // polls the current window without re-creating the timer.
  const windowRef = useRef(windowMinutes);
  windowRef.current = windowMinutes;

  const load = useCallback(async (win) => {
    const { state: next, source: src, error: err } = await fetchState(win);
    if (win !== windowRef.current) return;   // ignore stale response if window changed
    if (next) setState(next);                // keep the last good state on a transient error
    setSource(src);
    setError(err);
    setStale(false);
    if (next) setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(windowMinutes);
  }, [windowMinutes, load]);

  useEffect(() => {
    const id = setInterval(() => load(windowRef.current), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!lastUpdated) return undefined;
    const id = setTimeout(() => setStale(true), POLL_MS * 2.5);
    return () => clearTimeout(id);
  }, [lastUpdated]);

  const onWindowChange = (n) => setWindowMinutes(n);

  const sides = state ? orderSides(state.sides) : [];
  const rangeBroken = (state && state.range_broken) || [];

  return (
    <>
      <div className="header-top">
        <div className="header-meta">
          {state && (
            <span className="trading-date">
              {state.weekday} · {state.trading_date}
            </span>
          )}
          <span className="last-updated">updated {fmtTs(state && state.ts)}</span>
          <StatusIndicator source={source} lastUpdated={lastUpdated} stale={stale} />
        </div>
      </div>

      <div className="header-controls">
        <WindowToggle value={windowMinutes} onChange={onWindowChange} disabled={loading} />
      </div>

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
          <SideCard key={`${side.side}-${side.option_type}`} side={side} />
        ))}
      </main>
    </>
  );
}
