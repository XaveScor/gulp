const asyncSettle = require('async-settle');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncSettle(fn, cb);
}

function buildSettleSeries() {
  let args = helpers.verifyArguments(arguments);
  const lastEl = args.length === 0 ? null : args[args.length - 1];
  const extensions = helpers.getExtensions(lastEl);

  if (extensions) {
    args = args.slice(0, args.length - 1);
  }

  function settleSeries(done) {
    const onSettled = helpers.onSettled(done);
    nowAndLater.mapSeries(args, iterator, extensions, onSettled);
  }

  return settleSeries;
}

module.exports = buildSettleSeries;
