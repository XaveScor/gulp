const initial = require('array-initial');
const asyncDone = require('async-done');
const nowAndLater = require('now-and-later');

const helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncDone(fn, cb);
}

function buildSeries() {
  let args = helpers.verifyArguments(arguments);
  const lastEl = args.length === 0 ? null : args[args.length - 1];
  const extensions = helpers.getExtensions(lastEl);

  if (extensions) {
    args = initial(args);
  }

  function series(done) {
    nowAndLater.mapSeries(args, iterator, extensions, done);
  }

  return series;
}

module.exports = buildSeries;
