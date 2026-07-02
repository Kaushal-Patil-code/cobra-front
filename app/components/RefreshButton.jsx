'use client';

// Manual refresh: re-requests /state right now instead of waiting for the ~30s
// poll. `busy` spins the icon and blocks re-entry while a fetch is in flight;
// `disabled` also covers the initial load. Purely triggers the parent's fetch.

export default function RefreshButton({ onClick, busy = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`refresh-btn ${busy ? 'is-busy' : ''}`}
      onClick={onClick}
      disabled={busy || disabled}
      aria-label="Refresh now"
      title="Refresh now"
    >
      <span className="refresh-icon" aria-hidden="true">⟳</span>
      {busy ? 'Refreshing…' : 'Refresh'}
    </button>
  );
}
