const initial = require('array-initial');
const last = require('array-last');
const asyncDone = require('async-done');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncDone(fn, cb);
}

function buildSeries() {
  let args = helpers.verifyArguments(arguments);

  const extensions = helpers.getExtensions(last(args));

  if (extensions) {
    args = initial(args);
  }

  function series(done) {
    nowAndLater.mapSeries(args, iterator, extensions, done);
  }

  return series;
}

module.exports = buildSeries;
