const assert = require('assert');

const forEach = require('array-each');

function noop() {}

function getExtensions(lastArg) {
  if (typeof lastArg !== 'function') {
    return lastArg;
  }
}

function filterSuccess(elem) {
  return elem.state === 'success';
}

function filterError(elem) {
  return elem.state === 'error';
}

function buildOnSettled(done) {
  if (typeof done !== 'function') {
    done = noop;
  }

  function onSettled(error, result) {
    if (error) {
      return done(error, null);
    }

    const settledErrors = result.filter(filterError);
    const settledResults = result.filter(filterSuccess);


    const errors = settledErrors.map(e => e.value);
    const results = settledResults.map(r => r.value);

    done(errors.length ? errors : null, results.length ? results : null);
  }

  return onSettled;
}

function verifyArguments(args) {
  args = [...args].flat(Infinity);
  const lastIdx = args.length - 1;

  assert.ok(args.length, 'A set of functions to combine is required');

  forEach(args, function(arg, argIdx) {
    const isFunction = typeof arg === 'function';
    if (isFunction) {
      return;
    }

    if (argIdx === lastIdx) {
      // Last arg can be an object of extension points
      return;
    }

    const msg = 'Only functions can be combined, got ' + typeof arg +
      ' for argument ' + argIdx;
    assert.ok(isFunction, msg);
  });

  return args;
}

module.exports = {
  getExtensions: getExtensions,
  onSettled: buildOnSettled,
  verifyArguments: verifyArguments,
};
