'use client';

// Small live / stale / offline indicator (spec §6.2 UI req 6).
//   live    — last successful poll was recent and from the real backend.
//   stale   — backend reachable earlier but the latest poll did not refresh.
//   offline — backend unreachable / errored (no data; no fallback).

function fmtAge(ms) {
  if (ms == null) return '';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
}

export default function StatusIndicator({ source, lastUpdated, stale }) {
  let level, label;
  if (source === 'error') {
    level = 'offline';
    label = 'offline';
  } else if (stale) {
    level = 'stale';
    label = 'stale';
  } else {
    level = 'live';
    label = 'live';
  }

  const age = lastUpdated ? Date.now() - lastUpdated : null;

  return (
    <div className={`status-indicator status-${level}`} title={label}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label">{label}</span>
      {age != null && <span className="status-age">· {fmtAge(age)}</span>}
    </div>
  );
}
