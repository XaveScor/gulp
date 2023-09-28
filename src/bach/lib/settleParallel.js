const initial = require('array-initial');
const last = require('array-last');
const asyncSettle = require('async-settle');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncSettle(fn, cb);
}

function buildSettleParallel() {
  let args = helpers.verifyArguments(arguments);

  const extensions = helpers.getExtensions(last(args));

  if (extensions) {
    args = initial(args);
  }

  function settleParallel(done) {
    const onSettled = helpers.onSettled(done);
    nowAndLater.map(args, iterator, extensions, onSettled);
  }

  return settleParallel;
}

module.exports = buildSettleParallel;
