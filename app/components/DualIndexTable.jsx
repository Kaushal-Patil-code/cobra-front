// Dual-index table comparing NIFTY vs SENSEX walls for one zone (spec §6.2 UI
// req 3). Columns: Index | Wall strike | Δ% (window) | Direction | Magnitude |
// Streak | Trend. The WALL row is shown prominently; its neighbors follow in a
// lighter style. "M-notation" = magnitude rendered as a badge next to the
// signed Δ% (e.g. "+12.6% · signal"). If `sensex` is null, the Sensex rows
// collapse to a single "— paused —" row.

function fmtPct(v) {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function DirectionCell({ direction, insufficient }) {
  if (insufficient) return <span className="dir dir-flat" title="insufficient history">–</span>;
  if (direction === 'up') return <span className="dir dir-up" title="building">↑ building</span>;
  if (direction === 'down') return <span className="dir dir-down" title="unwinding">↓ unwinding</span>;
  return <span className="dir dir-flat" title="flat">– flat</span>;
}

function MagnitudeBadge({ magnitude }) {
  return <span className={`mag mag-${magnitude || 'noise'}`}>{magnitude || 'noise'}</span>;
}

// One <tr> for a strike. `kind` is 'wall' | 'neighbor'.
function StrikeRow({ index, sig, kind, pin }) {
  const isWall = kind === 'wall';
  return (
    <tr className={isWall ? 'row-wall' : 'row-neighbor'}>
      <td className="col-index">
        {isWall ? (
          <>
            <span className="idx-name">{index}</span>
            <span className="role-tag tag-wall">WALL</span>
            {pin && <span className="pin-badge" title="0-DTE — walls pin">PIN</span>}
          </>
        ) : (
          <span className="role-tag tag-neighbor">neighbor</span>
        )}
      </td>
      <td className="col-strike">{sig.strike != null ? sig.strike : '—'}</td>
      <td className="col-delta">
        <span
          className={`delta ${
            sig.direction === 'up' ? 'delta-up' : sig.direction === 'down' ? 'delta-down' : 'delta-flat'
          }`}
        >
          {fmtPct(sig.change_pct)}
        </span>
        {' · '}
        <MagnitudeBadge magnitude={sig.magnitude} />
      </td>
      <td className="col-dir">
        <DirectionCell direction={sig.direction} insufficient={sig.insufficient} />
      </td>
      <td className="col-mag">
        <MagnitudeBadge magnitude={sig.magnitude} />
      </td>
      <td className="col-streak">{sig.streak != null ? sig.streak : 0}</td>
      <td className="col-trend">
        {sig.trend ? <span className="trend-yes">TREND</span> : <span className="trend-no">—</span>}
      </td>
    </tr>
  );
}

function indexBlock(name, wallSignal) {
  if (!wallSignal) {
    return (
      <tr className="row-paused" key={`${name}-paused`}>
        <td className="col-index">
          <span className="idx-name">{name}</span>
        </td>
        <td colSpan={6} className="paused-cell">
          — paused —
        </td>
      </tr>
    );
  }
  const rows = [
    <StrikeRow key={`${name}-wall`} index={name} sig={wallSignal.wall} kind="wall" pin={wallSignal.pin} />,
  ];
  (wallSignal.neighbors || []).forEach((nb, i) => {
    rows.push(<StrikeRow key={`${name}-nb-${i}`} index={name} sig={nb} kind="neighbor" />);
  });
  return rows;
}

export default function DualIndexTable({ nifty, sensex }) {
  return (
    <table className="dual-table">
      <thead>
        <tr>
          <th>Index</th>
          <th>Wall strike</th>
          <th>Δ% (window)</th>
          <th>Direction</th>
          <th>Magnitude</th>
          <th>Streak</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        {indexBlock('NIFTY', nifty)}
        {indexBlock('SENSEX', sensex)}
      </tbody>
    </table>
  );
}
