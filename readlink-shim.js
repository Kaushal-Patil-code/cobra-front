// Patch-only fs shim (safe to preload via NODE_OPTIONS=--require in any process).
//
// This E: drive (a virtual/sync-backed filesystem) returns the non-standard EISDIR
// from readlink() on regular files; a correct FS returns EINVAL, which webpack's
// resolver treats as "not a symlink" and ignores. EISDIR is unexpected and crashes
// the Next build/dev compile. We rewrite EISDIR->EINVAL inside readlink only.
// Nothing else is touched. Not needed on normal disks or CI/Vercel (Linux).
'use strict';

const fs = require('fs');

function toEINVAL(p) {
  const e = new Error("EINVAL: invalid argument, readlink '" + p + "'");
  e.code = 'EINVAL';
  e.errno = -22;
  e.syscall = 'readlink';
  e.path = p;
  return e;
}

const origSync = fs.readlinkSync;
fs.readlinkSync = function (p, o) {
  try { return origSync.call(fs, p, o); }
  catch (e) { if (e && e.code === 'EISDIR') throw toEINVAL(p); throw e; }
};

const origCb = fs.readlink;
fs.readlink = function (p, o, cb) {
  if (typeof o === 'function') { cb = o; o = undefined; }
  return origCb.call(fs, p, o, function (e, r) {
    if (e && e.code === 'EISDIR') return cb(toEINVAL(p));
    return cb(e, r);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origP = fs.promises.readlink.bind(fs.promises);
  fs.promises.readlink = function (p, o) {
    return origP(p, o).catch(function (e) {
      if (e && e.code === 'EISDIR') throw toEINVAL(p);
      throw e;
    });
  };
}

module.exports = true;
