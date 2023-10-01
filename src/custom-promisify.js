const { promisify } = require('node:util');

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
      .then((result) => {
        if (result === undefined) {
          return;
        }
        // nodejs stream
        if (result?.on) {
          result.on('close', () => done(null, null));
          result.on('finish', () => done(null, null));
          result.on('end', () => done(null, null));
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
