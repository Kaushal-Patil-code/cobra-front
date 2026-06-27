// Paired-by-level wall table (v3 item 1). Each row is a NIFTY rung beside the
// SENSEX rung closest to its level-equivalent (Nifty × the LIVE ratio =
// sensex_spot / nifty_spot, ~3.20 — not hardcoded), with an ALIGNED / DIVERGENT
// column. The rows, the level match, and the agreement are computed by the backend
// (compute/pairing.py); this component just renders `side.paired`. Shows Δ% (window)
// AND absolute OI for each leg. Outer Nifty rungs with no Sensex strike at their
// level show "—" (the two ladders don't fully overlap).

// Wall-banner agreement (computed off the two wall signals in SideCard) — both legs
// moving the same way = ALIGNED, opposite = DIVERGENT, one flat/missing = —.
export function agreement(a, b) {
  if (!a || !b) return null;
  const moving = (d) => d === 'up' || d === 'down';
  if (!moving(a.direction) || !moving(b.direction)) return null;
  return a.direction === b.direction ? 'ALIGNED' : 'DIVERGENT';
}

function fmtPct(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

// Compact OI in Indian units (lakh / crore) — OI runs into the millions.
export function fmtOI(v) {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${(v / 1e5).toFixed(2)} L`;
  return v.toLocaleString('en-IN');
}

const dirClass = (d) => (d === 'up' ? 'dir-up' : d === 'down' ? 'dir-down' : 'dir-flat');
const dirArrow = (d) => (d === 'up' ? '↑' : d === 'down' ? '↓' : '–');

function Leg({ sig }) {
  if (!sig) {
    return (
      <>
        <td className="col-strike">—</td>
        <td className="col-delta">—</td>
        <td className="col-oi">—</td>
      </>
    );
  }
  return (
    <>
      <td className="col-strike">
        {sig.strike}
        {sig.is_wall && <span className="role-tag tag-wall">WALL</span>}
      </td>
      <td className={`col-delta ${dirClass(sig.direction)}`}>
        {dirArrow(sig.direction)} {fmtPct(sig.change_pct)}
      </td>
      <td className="col-oi">{fmtOI(sig.oi_latest)}</td>
    </>
  );
}

export default function PairedWalls({ paired, ratio, window: win, optionType }) {
  const rows = paired || [];
  const ratioStr = ratio ? `× ${ratio.toFixed(3)}` : null;
  return (
    <table className="paired-table">
      <thead>
        <tr className="paired-grouphead">
          <th colSpan={3}>NIFTY · {optionType}</th>
          <th colSpan={3}>
            SENSEX · {optionType}
            {ratioStr && <span className="ratio-note" title="live Sensex/Nifty ratio"> {ratioStr}</span>}
          </th>
          <th>Agree</th>
        </tr>
        <tr className="paired-subhead">
          <th>Strike</th><th>Δ% ({win}m)</th><th>OI</th>
          <th>Strike</th><th>Δ% ({win}m)</th><th>OI</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => (
          <tr key={i} className={p.is_wall ? 'row-wall' : 'row-neighbor'}>
            <Leg sig={p.nifty} />
            <Leg sig={p.sensex} />
            <td className={`col-agree agree-${(p.agree || 'none').toLowerCase()}`}>
              {p.agree || '—'}
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={7} className="ptable-empty">No wall data.</td></tr>
        )}
      </tbody>
    </table>
  );
}
