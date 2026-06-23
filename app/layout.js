// COBRA — OI Confirmation Dashboard root layout.
//
// The persistent shell (brand + view nav + footer) that wraps every page. In the
// original Vite SPA (../frontend/src/App.jsx) the two views were switched by a
// client-side tab; here each is a real Next route and this layout is the chrome
// they share:
//   - /         → the Live dashboard (app/page.js)
//   - /history  → the Phase-5 backtest review (app/history/page.js)
//
// The <main> landmark and the per-view meta row (trading date / status) live
// inside each page, OUTSIDE this <header>, matching the original structure.

import './globals.css';
import Nav from './components/Nav.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

export const metadata = {
  title: 'COBRA — OI Confirmation Dashboard',
};

export const viewport = {
  colorScheme: 'light dark',
};

// Runs before first paint: apply the saved theme (or the OS preference) so there's
// no light→dark flash on load. Kept tiny and dependency-free.
const themeScript = `(function(){try{var t=localStorage.getItem('cobra-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Apply the saved/OS theme before the body paints (first child, runs in
            document order). suppressHydrationWarning: this inline script's content
            is intentionally client-managed, so React shouldn't diff it. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <div className="app">
          <header className="app-header">
            <div className="header-brand-row">
              <div className="brand">
                <span className="brand-name">COBRA</span>
                <span className="brand-sub">OI Confirmation Dashboard</span>
              </div>
              <div className="header-actions">
                <Nav />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* View body lives OUTSIDE <header> so <main> is a top-level landmark. */}
          {children}

          <footer className="app-footer">
            Confirmation layer only — not a signal generator. Verdicts are unvalidated
            hypotheses (paper-test). Dual-index rule is suppressed near expiry.
          </footer>
        </div>
      </body>
    </html>
  );
}
