const initial = require('array-initial');
const last = require('array-last');
const asyncSettle = require('async-settle');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncSettle(fn, cb);
}

function buildSettleSeries() {
  let args = helpers.verifyArguments(arguments);

  const extensions = helpers.getExtensions(last(args));

  if (extensions) {
    args = initial(args);
  }

  function settleSeries(done) {
    const onSettled = helpers.onSettled(done);
    nowAndLater.mapSeries(args, iterator, extensions, onSettled);
  }

  return settleSeries;
}

module.exports = buildSettleSeries;
