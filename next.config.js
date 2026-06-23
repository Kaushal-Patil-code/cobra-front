/** @type {import('next').NextConfig} */

// COBRA dashboard server config.
//
// Replaces the Vite dev-proxy (../frontend/vite.config.js). The data endpoints
// are namespaced under /api/* and rewritten to the Flask backend (default :8000)
// so `npm run dev` hits the real /state + /history + the paginated table reads
// (/snapshots, /metrics, /ladders, /walls, /instruments) when the backend is up,
// and falls back to the bundled sample fixtures otherwise.
//
// Why /api/*? In Next.js the History view is a real page route at /history, so
// the path /history is owned by the page — the data endpoint cannot also live
// there. Namespacing every data call under /api/* keeps page routes and data
// routes from colliding while still proxying to the backend's bare paths.
const BACKEND = process.env.COBRA_BACKEND || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Live
      { source: '/api/state', destination: `${BACKEND}/state` },
      // History — verdicts + all browsable tables (keyset-paginated)
      { source: '/api/history', destination: `${BACKEND}/history` },
      { source: '/api/snapshots', destination: `${BACKEND}/snapshots` },
      { source: '/api/metrics', destination: `${BACKEND}/metrics` },
      { source: '/api/ladders', destination: `${BACKEND}/ladders` },
      { source: '/api/walls', destination: `${BACKEND}/walls` },
      { source: '/api/instruments', destination: `${BACKEND}/instruments` },
    ];
  },
};

module.exports = nextConfig;
