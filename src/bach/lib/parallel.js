const initial = require('array-initial');
const last = require('array-last');
const asyncDone = require('async-done');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncDone(fn, cb);
}

function buildParallel() {
  let args = helpers.verifyArguments(arguments);

  const extensions = helpers.getExtensions(last(args));

  if (extensions) {
    args = initial(args);
  }

  function parallel(done) {
    nowAndLater.map(args, iterator, extensions, done);
  }

  return parallel;
}

module.exports = buildParallel;
