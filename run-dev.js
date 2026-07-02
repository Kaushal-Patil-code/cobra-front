// Local dev launcher — works around two quirks of this E: drive (a virtual/
// sync-backed filesystem), neither of which affects normal disks or CI/Vercel:
//
//   1. readlink() returns the non-standard EISDIR (instead of EINVAL) on regular
//      files, which crashes webpack's module resolution. readlink-shim.js rewrites
//      EISDIR->EINVAL so the toolchain behaves as on a correct filesystem.
//   2. `npm ci` couldn't create the node_modules/.bin/next shim on this FS, so
//      `npx next` / `npm run dev` fail with "'next' is not recognized". We invoke
//      Next's CLI directly in this (patched) process instead.
//
// Usage (from frontend-next/):
//   node run-dev.js            → next dev on port 4000
//   node run-dev.js -p 3001    → next dev on a different port
//   node run-dev.js build      → any other next command still works
'use strict';

const path = require('path');
const shim = path.resolve(__dirname, 'readlink-shim.js');

// Patch this process, and make every child Next spawns inherit the patch.
require(shim);
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--require ' + JSON.stringify(shim)]
  .filter(Boolean)
  .join(' ');

// Build the Next CLI argv: default to `dev -p 4000`, but respect anything passed.
const passed = process.argv.slice(2);
const args = passed[0] && !passed[0].startsWith('-') ? passed.slice() : ['dev', ...passed];
if (args[0] === 'dev' && !args.includes('-p') && !args.includes('--port')) {
  args.push('-p', '4000');
}
process.argv = [process.argv[0], process.argv[1], ...args];

require('next/dist/bin/next');
