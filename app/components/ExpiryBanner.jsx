// Expiry banner (v3 §4). Shows both DTEs + the expiry.label. v3 runs all 5 days:
// a 0-DTE index is tagged EXPIRY/PIN (not suppressed). Sensex data missing →
// NIFTY-ONLY. 1-DTE → a subtle "near-expiry, low weight" tag.

export default function ExpiryBanner({ expiry }) {
  if (!expiry) return null;

  const { nifty, sensex, sensex_missing, nifty_pin, sensex_pin, low_weight, label } = expiry;
  const dteN = nifty ? nifty.dte : null;
  const dteS = sensex ? sensex.dte : null;
  const pinned = nifty_pin || sensex_pin;

  return (
    <div className={`expiry-banner ${pinned ? 'pinned' : ''} ${sensex_missing ? 'suppressed' : ''}`}>
      <div className="expiry-dtes">
        <span className="dte-chip dte-nifty">
          NIFTY · DTE {dteN != null ? dteN : '—'}
          {nifty && nifty.expiry ? ` (${nifty.expiry})` : ''}
          {nifty_pin && <span className="pin-badge" title="0-DTE — walls pin">PIN</span>}
        </span>
        <span className="dte-chip dte-sensex">
          {sensex
            ? `SENSEX · DTE ${dteS != null ? dteS : '—'} (${sensex.expiry})`
            : 'SENSEX · n/a'}
          {sensex_pin && <span className="pin-badge" title="0-DTE — walls pin">PIN</span>}
        </span>
      </div>

      {pinned ? (
        <span className="expiry-flag flag-pinned" title="0-DTE: unwind = settlement, read as PIN/HOLD">
          EXPIRY/PIN — settlement on the 0-DTE index, no false breakouts
        </span>
      ) : sensex_missing ? (
        <span className="expiry-flag flag-suppressed">NIFTY-ONLY — Sensex unavailable</span>
      ) : (
        <span className="expiry-label">{label}</span>
      )}

      {low_weight && !pinned && (
        <span className="expiry-flag flag-lowweight">near-expiry, low weight</span>
      )}
    </div>
  );
}
