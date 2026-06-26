'use client';

// Window toggle: 15 / 30 min (spec §6.2 UI req 4). Switching re-fetches
// `/state?window=<n>` (handled by the parent's onChange).

const OPTIONS = [15, 30];

const WINDOW_HELP =
  'Δ% lookback: each wall’s OI now vs ~N minutes ago. ' +
  '15m = more reactive, 30m = smoother. It only changes the Δ% / streak — not which strikes are shown.';

export default function WindowToggle({ value, onChange, disabled }) {
  return (
    <div className="window-toggle" role="group" aria-label="OI window">
      <span className="window-toggle-label" title={WINDOW_HELP}>
        Window <span className="window-help" aria-hidden="true">ⓘ</span>
      </span>
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`window-btn ${value === opt ? 'active' : ''}`}
          aria-pressed={value === opt}
          disabled={disabled}
          onClick={() => value !== opt && onChange(opt)}
          title={WINDOW_HELP}
        >
          {opt}m
        </button>
      ))}
    </div>
  );
}
