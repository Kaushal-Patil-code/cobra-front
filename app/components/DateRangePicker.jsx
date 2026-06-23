// Shared start/end date range for the History view. Controlled by the parent;
// uses native date inputs (they pick up the theme via color-scheme). Changing a
// bound resets every tab's pagination (the parent re-keys its fetches on these).

'use client';

export default function DateRangePicker({ start, end, onStart, onEnd }) {
  return (
    <div className="date-range" role="group" aria-label="Date range">
      <label className="date-range-field">
        <span className="date-range-label">From</span>
        <input
          type="date"
          value={start}
          max={end || undefined}
          onChange={(e) => onStart(e.target.value)}
        />
      </label>
      <span className="date-range-sep">→</span>
      <label className="date-range-field">
        <span className="date-range-label">To</span>
        <input
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => onEnd(e.target.value)}
        />
      </label>
    </div>
  );
}
