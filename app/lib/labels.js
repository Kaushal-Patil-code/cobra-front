// Plain-English display mapping for the verdict box (spec §3).
//
// The backend `verdict` / `conviction` / `agree` strings stay CANONICAL — the
// colour classifiers (SideCard, HistoryView) and the backtest `verdicts` log key
// off them. This layer only translates those canonical values into the plainer
// wording the trader reads on screen, so nothing downstream breaks.

// verdict → plain, using the side for the Top/Bottom word.
// CAP HOLDING → "Top holding" · FLOOR HOLDING → "Bottom holding"
// BREAKOUT → "Top breaking up" · BREAKDOWN → "Bottom breaking down"
// DIVERGENCE → "Nifty & Sensex disagree" · PARTIAL → "Only one index moving, other quiet"
// NO SIGNAL → "Both quiet — nothing to do" · (NIFTY-ONLY) → append "Sensex missing — Nifty alone, careful"
export function plainVerdict(verdict, side, movingIndex) {
  const v = (verdict || '').toUpperCase();
  const sideWord = side === 'CAP' ? 'Top' : 'Bottom';
  const niftyOnly = v.includes('NIFTY-ONLY');
  let base;
  if (v.includes('HOLDING')) base = `${sideWord} holding`;
  else if (v.includes('BREAKOUT')) base = `${sideWord} breaking up`;
  else if (v.includes('BREAKDOWN')) base = `${sideWord} breaking down`;
  else if (v.includes('DIVERGENCE')) base = 'Nifty & Sensex disagree';
  else if (v.startsWith('PARTIAL')) base = `Only ${movingIndex || 'one index'} moving, other quiet`;
  else if (v.includes('NO SIGNAL')) base = 'Both quiet — nothing to do';
  else base = verdict || '';
  if (niftyOnly && !base.includes('Nifty alone')) {
    base += ' · Sensex missing — Nifty alone, careful';
  }
  return base;
}

// conviction → plain. HIGH → "Strong", MODERATE → "OK", UNCONFIRMED → "Not
// confirmed — 1 read only", LOW → "Low", NONE → '' (hidden).
export function plainConviction(conviction) {
  switch ((conviction || '').toUpperCase()) {
    case 'HIGH': return 'Strong';
    case 'MODERATE': return 'OK';
    case 'UNCONFIRMED': return 'Not confirmed — 1 read only';
    case 'LOW': return 'Low';
    default: return '';
  }
}

// ALIGNED / DIVERGENT → Agree / Disagree (per-row and wall-banner cross-check).
export function plainAgree(agree) {
  if (agree === 'ALIGNED') return 'Agree';
  if (agree === 'DIVERGENT') return 'Disagree';
  return null;
}

// ── §4 tags / badges / row / header wording ─────────────────────────────────

// Expiry tag → plain wording. NEAR-EXPIRY (1-DTE) = higher trust; EXPIRY/PIN (0-DTE) = pinning.
export function tagLabel(tag) {
  if (tag === 'NEAR-EXPIRY') return 'Expiry near — wall matured, higher trust';
  if (tag === 'EXPIRY/PIN') return 'Expiry today — wall pinning';
  return tag || '';
}

// Distance (§4): "X pts (Y%) below top" / "above bottom"; "(!)" when the wall is
// breached (spot on the wrong side). Uses the backend's signed dist_pts/dist_pct.
export function distanceLabel(side, distPts, distPct) {
  if (distPts == null) return null;
  const top = side === 'CAP';
  const word = top ? 'top' : 'bottom';
  const pts = Math.abs(distPts);
  const pctStr = distPct == null ? '' : ` (${Math.abs(distPct).toFixed(1)}%)`;
  // Normal: CAP wall above spot (dist ≥ 0 → spot below the top); FLOOR wall below
  // spot (dist ≤ 0 → spot above the bottom). Otherwise the wall has been breached.
  const normal = top ? distPts >= 0 : distPts <= 0;
  if (normal) return `${pts} pts${pctStr} ${top ? 'below' : 'above'} ${word}`;
  return `${pts} pts${pctStr} ${top ? 'ABOVE' : 'BELOW'} ${word} (!)`;
}

// §5.4 proximity → the "when to watch" word.
export function proxLabel(prox) {
  if (prox === 'AT') return 'AT WALL';
  if (prox === 'APPROACHING') return 'APPROACHING';
  if (prox === 'FAR') return 'FAR';
  return null;
}

// Wall shift (§4): backend "OI peak shifting up: X → Y" → "top moving up: X → Y".
export function migrationLabel(migration, side) {
  if (!migration) return null;
  const word = side === 'CAP' ? 'top' : 'bottom';
  return migration.replace('OI peak shifting', `${word} moving`);
}

// Header PCR (§4): "0.84 (call-heavy)" if <1, "(put-heavy)" if >1.
export function pcrLabel(pcr) {
  if (pcr == null) return '—';
  const bias = pcr < 1 ? 'call-heavy' : pcr > 1 ? 'put-heavy' : 'balanced';
  return `${pcr.toFixed(2)} (${bias})`;
}

// Header DTE (§4): "1 day to expiry" / "N days to expiry" / "expiry today".
export function dteLabel(dte) {
  if (dte == null) return '—';
  if (dte === 0) return 'expiry today';
  if (dte === 1) return '1 day to expiry';
  return `${dte} days to expiry`;
}

// Row-label direction (§4), plain wording for the paired-table tooltip.
export function directionLabel(direction) {
  if (direction === 'up') return 'OI rising (wall stronger)';
  if (direction === 'down') return 'OI falling (wall weaker)';
  return 'no change';
}
