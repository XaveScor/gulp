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
  return promisify((done) => {
    Promise.resolve(fn(done))
      .then(async (result) => {
        if (result === undefined) {
          // if undefined, then it's a callback function.
          // We are waiting for the `done` to be called.
          return;
        }
        // nodejs stream
        if (result?.on) {
          eos(exhaust(result), { error: false }, done);
          return;
        }

        done(null, result);
      })
      .catch((error) => done(error));
  });
}

module.exports = {
  customPromisify,
};
