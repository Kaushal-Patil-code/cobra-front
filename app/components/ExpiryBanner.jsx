// Expiry banner (v3 §4). Shows each index's NEAREST EXPIRY DATE + DTE. v3 runs
// all 5 days: a 0-DTE index is tagged EXPIRY/PIN (settlement, not a breakout);
// Sensex data missing → NIFTY-ONLY. (Nifty expires Tue, Sensex Thu — they're
// never at the same DTE, hence both dates.)

import { dteLabel } from '../lib/labels.js';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function ExpiryChip({ name, idx, pin }) {
  if (!idx) return <span className="dte-chip">{name} · n/a</span>;
  return (
    <span className="dte-chip">
      <span className="dte-idx">{name}</span> exp {fmtDate(idx.expiry)}
      <span className="dte-dte"> · {dteLabel(idx.dte)}</span>
      {pin && <span className="pin-badge" title="0-DTE — walls pin (settlement)">PIN</span>}
    </span>
  );
}

export default function ExpiryBanner({ expiry }) {
  if (!expiry) return null;
  const { nifty, sensex, sensex_missing, nifty_pin, sensex_pin } = expiry;
  const pinned = nifty_pin || sensex_pin;

  return (
    <div className={`expiry-banner ${pinned ? 'pinned' : ''} ${sensex_missing ? 'suppressed' : ''}`}>
      <div className="expiry-dtes">
        <ExpiryChip name="NIFTY" idx={nifty} pin={nifty_pin} />
        <ExpiryChip name="SENSEX" idx={sensex_missing ? null : sensex} pin={sensex_pin} />
      </div>

      {pinned && (
        <span className="expiry-flag flag-pinned" title="0-DTE: an OI unwind is settlement, read as PIN/HOLD">
          EXPIRY/PIN — no false breakouts on the 0-DTE index
        </span>
      )}
      {sensex_missing && !pinned && (
        <span className="expiry-flag flag-suppressed">NIFTY-ONLY — Sensex unavailable</span>
      )}
    </div>
  );
}
