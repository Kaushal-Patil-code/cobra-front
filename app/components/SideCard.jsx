// Per-side card (v3). Headline is the ACTION verb (FADE OK / DON'T FADE / WAIT) —
// the decision you want mid-trade — with the diagnosis (verdict · conviction ·
// ALIGNED/DIVERGENT) as a secondary line. Shows spot's distance to the wall, the
// wall STRENGTH (1–5) per index, and the paired Nifty↔Sensex table. CAP = call
// wall (resistance), FLOOR = put wall (support).

import PairedWalls, { agreement } from './PairedWalls.jsx';
import StrengthChip from './StrengthChip.jsx';

const DEFAULT_RATIO = 3.2; // fallback only; the live ratio comes from the two spots

// ACTION → color class.
function actionClass(action) {
  const a = (action || '').toUpperCase();
  if (a.includes('FADE OK')) return 'act-fade';      // green — fade the wall
  if (a.includes("DON'T")) return 'act-dont';        // red — respect the break
  return 'act-wait';                                  // amber — no clean edge
}

// "spot 119 pts below cap" / "spot 160 pts above floor"; warns (!) if spot is on
// the wrong side of the wall (cap breached / floor breached).
function spotDistance(side, spot, wall) {
  if (spot == null || wall == null) return null;
  const s = Math.round(spot);
  const gap = Math.abs(s - wall);
  if (side === 'CAP') {
    return s <= wall
      ? `spot ${gap} pts below cap`
      : `spot ${gap} pts ABOVE cap (!)`;
  }
  return s >= wall
    ? `spot ${gap} pts above floor`
    : `spot ${gap} pts BELOW floor (!)`;
}

export default function SideCard({ side, spots = {}, window: win }) {
  if (!side) return null;

  const {
    side: name, option_type, wall_strike, verdict, conviction, action, meaning,
    tag, nifty, sensex, suppressed,
  } = side;

  const niftyOnly = suppressed || !sensex;
  const niftySpot = spots.NIFTY;
  const sensexSpot = spots.SENSEX;
  const ratio = niftySpot && sensexSpot ? sensexSpot / niftySpot : DEFAULT_RATIO;
  const dist = spotDistance(name, niftySpot, wall_strike);
  const wallAgree = nifty && sensex ? agreement(nifty.wall, sensex.wall) : null;
  const niftyMigration = nifty && nifty.migration;
  const sensexMigration = sensex && sensex.migration;

  return (
    <section className="zone-card">
      <div className="zone-header">
        <h2 className="zone-title">
          <span className="zone-role">{name}</span>
          <span className="zone-type">{option_type}</span>
          {wall_strike != null && <span className="wall-strike-tag">wall {wall_strike}</span>}
          {dist && <span className="spot-dist">{dist}</span>}
        </h2>
        <div className="zone-tags">
          {tag && <span className="pin-tag" title="0-DTE — settlement, read as PIN/HOLD">{tag}</span>}
          {niftyOnly && <span className="nifty-only-badge" title="Sensex data unavailable">NIFTY-ONLY</span>}
        </div>
      </div>

      {/* The verb — the headline. */}
      <div className={`action-banner ${actionClass(action)}`}>
        <span className="action-verb">{action || 'WAIT'}</span>
        <span className="action-diagnosis">
          {verdict} · {conviction}
          {wallAgree && <span className={`agree-inline agree-${wallAgree.toLowerCase()}`}> · {wallAgree}</span>}
        </span>
        <p className="action-meaning">{meaning}</p>
      </div>

      {/* Wall strength (size, not change) per index. */}
      <div className="strength-row">
        <StrengthChip label="NIFTY" value={nifty?.strength} dominance={nifty?.dominance} />
        {sensex && <StrengthChip label="SENSEX" value={sensex?.strength} dominance={sensex?.dominance} />}
      </div>

      {(niftyMigration || sensexMigration) && (
        <div className="migration-flags">
          {niftyMigration && <span className="migration-flag">NIFTY: {niftyMigration}</span>}
          {sensexMigration && <span className="migration-flag">SENSEX: {sensexMigration}</span>}
        </div>
      )}

      <PairedWalls nifty={nifty} sensex={sensex} ratio={ratio} window={win} optionType={option_type} />
    </section>
  );
}
