'use client';

// Window toggle: 15 / 30 min (spec §6.2 UI req 4). Switching re-fetches
// `/state?window=<n>` (handled by the parent's onChange).

const OPTIONS = [15, 30];

export default function WindowToggle({ value, onChange, disabled }) {
  return (
    <div className="window-toggle" role="group" aria-label="OI window">
      <span className="window-toggle-label">Window</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`window-btn ${value === opt ? 'active' : ''}`}
          aria-pressed={value === opt}
          disabled={disabled}
          onClick={() => value !== opt && onChange(opt)}
        >
          {opt}m
        </button>
      ))}
    </div>
  );
}
