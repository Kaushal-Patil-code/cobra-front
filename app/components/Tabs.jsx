// Generic tab bar. Controlled by the parent: pass `tabs` ([{key,label}]),
// the `active` key, and `onSelect`. Used by the History view to switch tables.

'use client';

export default function Tabs({ tabs, active, onSelect }) {
  return (
    <div className="tabs" role="tablist" aria-label="Tables">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
