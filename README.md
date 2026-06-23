# COBRA — OI Confirmation Dashboard (Next.js)

A faithful, page-by-page port of the Vite + React app in [`../frontend`](../frontend)
to **Next.js (App Router)**. Same dark trading theme, same components, same data
contract and sample-fixture fallback — restructured so each view is a real route.

## Routes (the "pages")

| Route      | Source             | What it is |
|------------|--------------------|------------|
| `/`        | `app/page.js`      | **Live** dashboard — polls `/api/state` every ~30s, window toggle (15/30m), collapsible "set zones" form, expiry banner, per-zone verdict cards. |
| `/history` | `app/history/page.js` | **History / Backtest** review — fetches `/api/history` once, renders weekday buckets + the verdict log table. |

The shared chrome (brand, Live ⇄ History nav, footer) lives in `app/layout.js`.
The nav (`app/components/Nav.jsx`) uses Next `<Link>`s with active state derived
from the pathname — replacing the original client-side tab state.

## Structure

```
app/
  layout.js              root shell (header + nav + footer), imports globals.css
  globals.css            theme, ported verbatim from ../frontend/src/styles.css
  page.js                Live dashboard  (was LiveDashboard in App.jsx)
  history/page.js        History view    (was HistoryDashboard in App.jsx)
  components/            ExpiryBanner, ZoneCard, DualIndexTable, WindowToggle,
                        SetZonesForm, StatusIndicator, HistoryView, Nav
  lib/                   api.js, sampleState.js, sampleHistory.js
```

## Data layer & backend proxy

`app/lib/api.js` calls the data endpoints under **`/api/*`**:
`/api/state`, `/api/history`, `/api/set-zones`. `next.config.js` rewrites those
to the Flask backend (`COBRA_BACKEND`, default `http://localhost:8000`), stripping
the `/api` prefix so the backend still serves its bare `/state`, `/history`,
`/set-zones` routes.

> **Why `/api/*` and not the bare paths?** Here the History *view* is a real page
> route at `/history`, so that URL is owned by the page — the data endpoint can't
> also live there. Namespacing every data call under `/api/*` keeps page routes and
> data routes from colliding. This is the only deviation from `../frontend`.

When the backend is down (or before Phase 6 wires it up), every helper falls back
to the bundled fixtures (`app/lib/sampleState.js`, `app/lib/sampleHistory.js`),
flagging `source: 'sample'` — so the app is fully demoable offline, exactly like
the original.

## Develop

```bash
npm i
npx next dev -p 3001     # http://localhost:3001
```

Point at a running backend with `COBRA_BACKEND=http://localhost:8000 npx next dev -p 3001`.

> This drive is exFAT (no symlinks), so `.npmrc` sets `bin-links=false` — a plain
> `npm i` works, and a `postinstall` hook (`scripts/setup-bin.js`) writes a
> regular-file `node_modules/.bin/next` wrapper so `npx next …` finds the local
> Next 14 instead of downloading one.

## Build

```bash
npx next build && npx next start -p 3001
```

## Deploy to Vercel

The app is configured for Vercel via [`vercel.json`](vercel.json).

1. **Import the repo** in Vercel and set **Root Directory = `frontend-next`** (the
   Next app lives in a subfolder of the monorepo).
2. **Environment variable** — Project Settings → Environment Variables:
   - `COBRA_BACKEND = https://<your-render-backend>.onrender.com`
   This is what `/api/*` proxies to. The rewrites are baked at **build time**, so
   changing it requires a redeploy. A dashboard value overrides the committed
   `.env`, so the local `http://localhost:8001` never leaks to production.
3. **Deploy.** Framework preset is auto-detected (Next.js); `vercel.json` pins
   `installCommand: npm install --bin-links` so Vercel ignores the repo's exFAT
   `bin-links=false` (`.npmrc`) and resolves `next` normally on its native FS.

> CORS isn't a concern: the browser only calls same-origin `/api/*`; Vercel's edge
> proxies those to the Render backend server-side.

## Theme

Light, pastel (soft lavender page, white cards, periwinkle / mint / rose / apricot
accents). Defined entirely in `app/globals.css` `:root`.
