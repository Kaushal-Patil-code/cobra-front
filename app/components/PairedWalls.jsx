// Paired-by-level wall table (v3). Instead of two separate index blocks, each row
// is a NIFTY strike next to the SENSEX strike closest to its level-equivalent
// (Nifty × the LIVE ratio = sensex_spot / nifty_spot, ~3.20 — not hardcoded), with
// an ALIGNED / DIVERGENT column so you see at a glance whether the two indices
// agree. Shows Δ% (window) AND absolute OI for each leg.

// Both legs moving the same way = ALIGNED; opposite = DIVERGENT; one flat = —.
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

// Rank each index's legs by offset-from-wall (… -1 = one rung below the wall,
// 0 = the wall, +1 = one above …). Pairing on that offset guarantees wall↔wall
// (the cross-check the verdict is built on) and below↔below / above↔above — which
// is robust even though the two walls sit at different absolute levels. (True
// level-mapping across the FULL ladder needs all 8 rungs in /state; that lands
// with the dynamic-wall pass.)
function ranked(wallSignal) {
  if (!wallSignal) return new Map();
  const ls = [wallSignal.wall, ...(wallSignal.neighbors || [])].sort((a, b) => b.strike - a.strike);
  const wi = Math.max(0, ls.findIndex((l) => l.is_wall));
  return new Map(ls.map((l, i) => [i - wi, l]));
}

function pairByOffset(nifty, sensex) {
  const n = ranked(nifty);
  const s = ranked(sensex);
  const offsets = [...new Set([...n.keys(), ...s.keys()])].sort((a, b) => b - a);
  return offsets.map((off) => {
    const nn = n.get(off) || null;
    const ss = s.get(off) || null;
    return { nifty: nn, sensex: ss, agree: agreement(nn, ss) };
  });
}

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

export default function PairedWalls({ nifty, sensex, ratio, window: win, optionType }) {
  const pairs = pairByOffset(nifty, sensex);
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
        {pairs.map((p, i) => (
          <tr key={i} className={(p.nifty?.is_wall || p.sensex?.is_wall) ? 'row-wall' : 'row-neighbor'}>
            <Leg sig={p.nifty} />
            <Leg sig={p.sensex} />
            <td className={`col-agree agree-${(p.agree || 'none').toLowerCase()}`}>
              {p.agree || '—'}
            </td>
          </tr>
        ))}
        {pairs.length === 0 && (
          <tr><td colSpan={7} className="ptable-empty">No wall data.</td></tr>
        )}
      </tbody>
    </table>
  );
}
