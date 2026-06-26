// Wall STRENGTH chip (1–5): the SIZE of the wall vs its ladder (dominance =
// wall OI ÷ median of the other rungs), not its change. A "flat but huge" wall
// is strength 5 (very fade-able); a "building but tiny" one is strength 1 (skip).

export default function StrengthChip({ value, dominance, label }) {
  if (value == null) {
    return label ? <span className="strength-chip strength-na">{label} STR —</span> : null;
  }
  const title =
    `${label ? label + ' ' : ''}wall strength ${value}/5` +
    (dominance != null ? ` · ${dominance}× the ladder median OI` : '');
  return (
    <span className={`strength-chip strength-s${value}`} title={title}>
      {label ? `${label} ` : ''}STR {value}/5
    </span>
  );
}
