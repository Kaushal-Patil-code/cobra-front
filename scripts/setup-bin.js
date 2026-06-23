// Recreate node_modules/.bin/next as a regular-file wrapper.
//
// This drive is exFAT (no symlink support), so npm runs with bin-links=false
// (see .npmrc) and cannot create the usual node_modules/.bin/* symlinks. Both
// `npx` and `npm run` look in .bin to find a binary, so here we write a tiny
// shell wrapper there — a *regular file*, which exFAT allows — that execs the
// locally-installed `next`. This runs automatically via the postinstall hook,
// so a plain `npm i` is enough and `npx next dev -p 3001` then works.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

if (!fs.existsSync(nextBin)) {
  // next isn't installed yet — nothing to wire up.
  process.exit(0);
}

const binDir = path.join(root, 'node_modules', '.bin');
fs.mkdirSync(binDir, { recursive: true });

const wrapper = path.join(binDir, 'next');
fs.writeFileSync(wrapper, `#!/bin/sh\nexec node "${nextBin}" "$@"\n`);
fs.chmodSync(wrapper, 0o755);
console.log('[setup-bin] wrote .bin/next wrapper ->', nextBin);
