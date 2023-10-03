const { promisify } = require('node:util');
const eos = require('end-of-stream');
const exhaust = require('stream-exhaust');

/**
 * should work with:
 * - async functions
 * - callback functions
 * - sync functions with return value
 * - node streams
 * @param fn
 * @returns {Function}
 */
function customPromisify(fn) {
  const argsNumber = fn.length;
  return promisify((done) => {
    const fnRes = fn(done);
    if (argsNumber > 0) {
      // it's a callback function.
      return;
    }

    if (fnRes?.on) {
      eos(exhaust(fnRes), { error: false }, done);
      return;
    }

    Promise.resolve(fnRes)
      .then(async (result) => done(null, result))
      .catch((error) => done(error));
  });
}

module.exports = {
  customPromisify,
};
