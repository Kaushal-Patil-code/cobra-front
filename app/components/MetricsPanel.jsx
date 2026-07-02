// v3 §6 — per-index chain metrics panel: max-pain (the pin magnet) + PCR + spot
// + ATM, for NIFTY and SENSEX. Max-pain is surfaced prominently because it's the
// pin target on the 0-DTE index (Rule 33: max-pain dominates on expiry).

import { pcrLabel } from '../lib/labels.js';

function fmtNum(v) {
  if (v == null) return '—';
  return typeof v === 'number' ? v.toLocaleString('en-IN') : String(v);
}

function MetricCard({ m }) {
  if (!m) return null;
  return (
    <div className="metric-card">
      <div className="metric-index">{m.index_name}</div>
      <div className="metric-grid">
        <div className="metric-cell">
          <span className="metric-label">Pin magnet</span>
          <span className="metric-value metric-maxpain" title="max-pain — where price is drawn">
            {fmtNum(m.max_pain)}
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">PCR</span>
          <span className="metric-value">{pcrLabel(m.pcr)}</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Spot</span>
          <span className="metric-value">{m.spot == null ? '—' : fmtNum(Math.round(m.spot))}</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">ATM</span>
          <span className="metric-value">{fmtNum(m.atm)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsPanel({ metrics }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <div className="metrics-panel">
      {metrics.map((m) => (
        <MetricCard key={m.index_name} m={m} />
      ))}
    </div>
  );
}
