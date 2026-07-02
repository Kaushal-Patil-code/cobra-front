// Wall STRENGTH chip (1–5): the SIZE of the wall vs its ladder (dominance =
// wall OI ÷ median of the other rungs), not its change. A "flat but huge" wall
// is strength 5 (very fade-able); a "building but tiny" one is strength 1 (skip).

export default function StrengthChip({ value, dominance, label }) {
  if (value == null) {
    return label ? <span className="strength-chip strength-na">{label} WALL SIZE —</span> : null;
  }
  const title =
    `${label ? label + ' ' : ''}wall size ${value}/5 (dominance)` +
    (dominance != null ? ` · ${dominance}× the ladder median OI` : '');
  return (
    <span className={`strength-chip strength-s${value}`} title={title}>
      {label ? `${label} ` : ''}WALL SIZE {value}/5
    </span>
  );
}
