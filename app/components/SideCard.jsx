// Per-side card (v3). Headline is the ACTION verb (FADE OK / DON'T FADE / WAIT) —
// the decision you want mid-trade — with the diagnosis (verdict · conviction ·
// ALIGNED/DIVERGENT) as a secondary line. Shows spot's distance to the wall, the
// wall STRENGTH (1–5) per index, and the paired Nifty↔Sensex table. CAP = call
// wall (resistance), FLOOR = put wall (support).

import PairedWalls, { agreement } from './PairedWalls.jsx';
import StrengthChip from './StrengthChip.jsx';
import {
  distanceLabel, migrationLabel, plainAgree, plainConviction, plainVerdict,
  proxLabel, tagLabel,
} from '../lib/labels.js';

// ACTION → color class.
function actionClass(action) {
  const a = (action || '').toUpperCase();
  if (a.includes('FADE OK')) return 'act-fade';      // green — fade the wall
  if (a.includes("DON'T")) return 'act-dont';        // red — respect the break
  return 'act-wait';                                  // amber — no clean edge
}

export default function SideCard({ side, liveRatio, window: win }) {
  if (!side) return null;

  const {
    side: name, option_type, wall_strike, verdict, conviction, action, meaning,
    action_line, wait_reason, tag, nifty, sensex, suppressed, paired, wall_callout,
    dist_pts, dist_pct, prox,
  } = side;

  const niftyOnly = suppressed || !sensex;
  // The live Sensex/Nifty ratio is the exact value the backend paired with; show
  // "—" (omit the × note) when it's unavailable — never a hardcoded fallback.
  const ratio = liveRatio ?? null;
  // §4/§5.4: distance (pts + %) and the proximity word come from the backend now.
  const dist = distanceLabel(name, dist_pts, dist_pct);
  const proxWord = proxLabel(prox);
  const wallAgree = nifty && sensex ? agreement(nifty.wall, sensex.wall) : null;
  const niftyMigration = migrationLabel(nifty && nifty.migration, name);
  const sensexMigration = migrationLabel(sensex && sensex.migration, name);
  const sideWord = name === 'CAP' ? 'top' : 'bottom';
  // For a PARTIAL read, name the index that's actually moving (the other is quiet).
  const moving = (s) => s === 'building' || s === 'unwinding';
  const movingIndex = nifty && moving(nifty.state)
    ? 'Nifty'
    : sensex && moving(sensex.state) ? 'Sensex' : null;

  return (
    <section className="zone-card">
      <div className="zone-header">
        <h2 className="zone-title">
          <span className="zone-role">{name}</span>
          <span className="zone-type">{option_type}</span>
          {wall_strike != null && <span className="wall-strike-tag">wall {wall_strike}</span>}
          {dist && <span className="spot-dist">{dist}</span>}
          {proxWord && (
            <span className={`prox-chip prox-${(prox || '').toLowerCase()}`} title="a fade only exists near the wall">
              {proxWord}
            </span>
          )}
          {nifty?.broken_level != null && (
            <span className="broken-badge" title="spot cleared this former wall — trend, don't fade">
              {`Old ${sideWord} ${nifty.broken_level} broke — don't fade the ${sideWord}`}
            </span>
          )}
        </h2>
        <div className="zone-tags">
          {tag && (
            <span
              className={`pin-tag ${tag === 'NEAR-EXPIRY' ? 'near-expiry-tag' : ''}`}
              title={
                tag === 'NEAR-EXPIRY'
                  ? '1-DTE — wall matured near expiry (stronger hold-trust)'
                  : '0-DTE — settlement, read as PIN/HOLD'
              }
            >
              {tagLabel(tag)}
            </span>
          )}
          {niftyOnly && <span className="nifty-only-badge" title="Sensex data unavailable">NIFTY-ONLY</span>}
        </div>
      </div>

      {/* The verb — the headline. WAIT carries its reason inline (§5.2). */}
      <div className={`action-banner ${actionClass(action)}`}>
        <span className="action-verb">
          {action || 'WAIT'}
          {(action || 'WAIT') === 'WAIT' && wait_reason && (
            <span className="wait-reason"> {wait_reason}</span>
          )}
        </span>
        {/* Plain diagnosis (§3): Top holding · Strong · Agree — canonical strings mapped. */}
        <span className="action-diagnosis">
          {plainVerdict(verdict, name, movingIndex)}
          {plainConviction(conviction) && <> · {plainConviction(conviction)}</>}
          {wallAgree && (
            <span className={`agree-inline agree-${wallAgree.toLowerCase()}`}> · {plainAgree(wallAgree)}</span>
          )}
        </span>
        {/* The one plain instruction — the #1 add (§5.1). */}
        {action_line && <p className="action-line">{action_line}</p>}
        {meaning && <p className="action-meaning">{meaning}</p>}
      </div>

      {/* Wall strength (size, not change) per index. */}
      <div className="strength-row">
        <StrengthChip label="NIFTY" value={nifty?.strength} dominance={nifty?.dominance} />
        {sensex && <StrengthChip label="SENSEX" value={sensex?.strength} dominance={sensex?.dominance} />}
      </div>

      {(niftyMigration || sensexMigration) && (
        <div className="migration-flags">
          {niftyMigration && (
            <span className="migration-flag" title="a bigger neighbour is emerging — context only, the wall is not moved">
              NIFTY · {niftyMigration}
            </span>
          )}
          {sensexMigration && (
            <span className="migration-flag" title="a bigger neighbour is emerging — context only, the wall is not moved">
              SENSEX · {sensexMigration}
            </span>
          )}
        </div>
      )}

      <PairedWalls paired={paired} callout={wall_callout} ratio={ratio} window={win} optionType={option_type} />
    </section>
  );
}
