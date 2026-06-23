// View nav (Live ⇄ History). Ports the tab nav from ../frontend/src/App.jsx, but
// the tabs are now Next <Link>s to real routes instead of local state. Active
// state is derived from the current pathname so a hard refresh on /history still
// highlights the right tab.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VIEWS = [
  { key: 'live', label: 'Live', href: '/' },
  { key: 'history', label: 'History', href: '/history' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="view-nav" role="tablist" aria-label="View">
      {VIEWS.map((v) => {
        const active = v.href === '/' ? pathname === '/' : pathname.startsWith(v.href);
        return (
          <Link
            key={v.key}
            href={v.href}
            role="tab"
            className={`view-tab ${active ? 'active' : ''}`}
            aria-selected={active}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
