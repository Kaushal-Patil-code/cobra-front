// Per-side card (v3 §5/§6): a big verdict banner (verdict text + conviction chip,
// color-coded) with the meaning line and an EXPIRY/PIN tag when a 0-DTE index is
// involved, then the dual-index table. CAP = call wall (resistance), FLOOR = put
// wall (support). Surfaces NIFTY-ONLY whenever the Sensex side is unavailable.

import DualIndexTable from './DualIndexTable.jsx';

// Map verdict strings → a style class.
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

export default function SideCard({ side }) {
  if (!side) return null;

  const {
    side: name, option_type, wall_strike, verdict, conviction, meaning, tag,
    nifty, sensex, suppressed,
  } = side;

  // NIFTY-ONLY whenever the Sensex side is missing (Sensex data unavailable).
  const niftyOnly = suppressed || !sensex;
  const niftyMigration = nifty && nifty.migration;
  const sensexMigration = sensex && sensex.migration;

  return (
    <section className="zone-card">
      <div className="zone-header">
        <h2 className="zone-title">
          <span className="zone-role">{name}</span>
          <span className="zone-type">{option_type}</span>
          {wall_strike != null && <span className="wall-strike-tag">wall {wall_strike}</span>}
        </h2>
        <div className="zone-tags">
          {tag && <span className="pin-tag" title="0-DTE — settlement, read as PIN/HOLD">{tag}</span>}
          {niftyOnly && (
            <span className="nifty-only-badge" title="Sensex data unavailable">
              NIFTY-ONLY
            </span>
          )}
        </div>
      </div>

      <div className={`verdict-banner ${verdictClass(verdict)}`}>
        <div className="verdict-main">
          <span className="verdict-text">{verdict}</span>
          <span className={convictionClass(conviction)}>{conviction}</span>
        </div>
        <p className="verdict-meaning">{meaning}</p>
      </div>

      {(niftyMigration || sensexMigration) && (
        <div className="migration-flags">
          {niftyMigration && <span className="migration-flag">NIFTY: {niftyMigration}</span>}
          {sensexMigration && <span className="migration-flag">SENSEX: {sensexMigration}</span>}
        </div>
      )}

      <DualIndexTable nifty={nifty} sensex={sensex} />
    </section>
  );
}
