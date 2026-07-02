'use client';

// History / Backtest view (v3 §4/§11). Reviews the logged `verdicts` dataset
// returned by `/history`. Two sections:
//   (a) Weekday buckets — the headline: one card per weekday with the total count
//       and a compact stacked breakdown of by_verdict (per-weekday judging; the
//       "cleanest reads are Friday" lens). Same verdict colors as the Live view.
//   (b) Verdict log — a dense, newest-first table of records, filterable by side.
//
// Pure display + a local side filter. Reuses the verdict/conviction colour
// conventions from SideCard (HOLDING→green, BREAKOUT/BREAKDOWN→red,
// DIVERGENCE→amber, PARTIAL→muted, NO SIGNAL→grey).

import { useMemo, useState } from 'react';

// Map verdict strings → a style class (same contract as SideCard).
function verdictClass(verdict) {
  const v = (verdict || '').toUpperCase();
  if (v.includes('HOLDING')) return 'v-hold'; // CAP HOLDING / FLOOR HOLDING → green
  if (v.includes('BREAKOUT') || v.includes('BREAKDOWN')) return 'v-break'; // red
  if (v.includes('DIVERGENCE')) return 'v-warn'; // amber
  if (v.includes('PARTIAL')) return 'v-caution'; // muted
  if (v.includes('NO SIGNAL')) return 'v-none'; // grey
  return 'v-none';
}

function convictionClass(conviction) {
  return `conv conv-${(conviction || 'NONE').toLowerCase()}`;
}

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const SIDE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'CAP', label: 'CAP' },
  { key: 'FLOOR', label: 'FLOOR' },
];

// Compact stacked bar of by_verdict counts for one weekday bucket.
function BucketBar({ byVerdict, total }) {
  const entries = Object.entries(byVerdict || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length || !total) {
    return <div className="bucket-bar bucket-bar-empty" />;
  }
  return (
    <>
      <div className="bucket-bar" role="img" aria-label="verdict breakdown">
        {entries.map(([verdict, count]) => (
          <span
            key={verdict}
            className={`bucket-seg ${verdictClass(verdict)}`}
            style={{ flexGrow: count }}
            title={`${verdict}: ${count}`}
          />
        ))}
      </div>
      <ul className="bucket-legend">
        {entries.map(([verdict, count]) => (
          <li key={verdict} className="bucket-legend-item">
            <span className={`bucket-dot ${verdictClass(verdict)}`} aria-hidden="true" />
            <span className="bucket-legend-label">{verdict}</span>
            <span className="bucket-legend-count">{count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function HistoryView({ history }) {
  const [side, setSide] = useState('ALL');

  const buckets = (history && history.weekday_buckets) || [];

  // Newest-first, then apply the side filter. `allRecords` is derived INSIDE the
  // callback so the `|| []` fallback (a fresh array on every render while records
  // are absent) can't churn the memo deps — recompute keys off the stable `history`
  // prop + `side` instead.
  const rows = useMemo(() => {
    const allRecords = (history && history.records) || [];
    const sorted = [...allRecords].sort((a, b) => {
      const ta = new Date(a.ts).getTime();
      const tb = new Date(b.ts).getTime();
      if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
      return tb - ta;
    });
    if (side === 'ALL') return sorted;
    return sorted.filter((r) => r.side === side);
  }, [history, side]);

  const range = history && (history.start || history.end)
    ? `${history.start || '…'} → ${history.end || '…'}`
    : '—';

  return (
    <div className="history-view">
      {/* (a) Weekday buckets — the headline */}
      <section className="history-section">
        <div className="history-section-head">
          <h2 className="history-section-title">Weekday buckets</h2>
          <span className="history-section-sub">
            per-weekday judging · cleanest reads are Friday
          </span>
        </div>
        {buckets.length === 0 ? (
          <div className="state-note">No logged verdicts yet.</div>
        ) : (
          <div className="bucket-grid">
            {buckets.map((b) => (
              <div key={b.bucket} className="bucket-card">
                <div className="bucket-head">
                  <span className="bucket-weekday">{b.bucket}</span>
                  <span className="bucket-count">{b.count}</span>
                </div>
                <BucketBar byVerdict={b.by_verdict} total={b.count} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* (b) Verdict log */}
      <section className="history-section">
        <div className="history-section-head">
          <h2 className="history-section-title">Verdict log</h2>
          <div className="log-controls">
            <span className="log-range" title="date range">{range}</span>
            <span className="log-count">{rows.length} rows</span>
            <div className="role-filter" role="group" aria-label="Filter by side">
              {SIDE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`role-btn ${side === f.key ? 'active' : ''}`}
                  aria-pressed={side === f.key}
                  onClick={() => setSide(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="state-note">No records for this filter.</div>
        ) : (
          <div className="log-scroll">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Side</th>
                  <th>Verdict</th>
                  <th>Conviction</th>
                  <th className="col-center">DTE n/s</th>
                  <th>NIFTY</th>
                  <th>SENSEX</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.ts}-${r.side}-${r.option_type}-${i}`}>
                    <td className="col-mono">{fmtTime(r.ts)}</td>
                    <td className="col-mono">{r.trading_date || '—'}</td>
                    <td>{r.weekday || '—'}</td>
                    <td className="col-zone">
                      <span className="log-role">{r.side}</span>
                      <span className="log-optype">{r.option_type}</span>
                      {r.tag && (
                        <span
                          className="pin-tag"
                          title={r.tag === 'NEAR-EXPIRY'
                            ? '1-DTE — wall matured near expiry (stronger hold-trust)'
                            : '0-DTE — settlement / pin'}
                        >
                          {r.tag}
                        </span>
                      )}
                      {r.suppressed && (
                        <span className="suppressed-tag" title="NIFTY-only (Sensex data missing)">
                          NIFTY-only
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`log-verdict ${verdictClass(r.verdict)}`}>
                        {r.verdict}
                      </span>
                    </td>
                    <td>
                      <span className={convictionClass(r.conviction)}>{r.conviction}</span>
                    </td>
                    <td className="col-center col-mono">
                      {r.dte_n == null ? '—' : r.dte_n}
                      {' / '}
                      {r.dte_s == null ? '—' : r.dte_s}
                    </td>
                    <td className="col-mono col-sig">{r.nifty_sig || '—'}</td>
                    <td className="col-mono col-sig">
                      {r.sensex_sig == null ? <span className="sig-paused">—</span> : r.sensex_sig}
                    </td>
                    <td className="col-outcome">
                      {r.outcome ? (
                        <span className="outcome-tag" title={r.notes || ''}>{r.outcome}</span>
                      ) : (
                        <span className="dash">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
