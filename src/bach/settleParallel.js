const { runFunction } = require('../run-function.js');
const { parseOptions } = require('./parseArgs');

function settleParallel(funcs, options) {
  const normalizeOptions = parseOptions(options);
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      const errors = new Array(funcs.length).fill(undefined);
      await Promise.all(
        funcs.map(async (fn, idx) => {
          try {
            results[idx] = await runFunction(fn, idx, normalizeOptions);
          } catch (e) {
            errors[idx] = e;
          }
        }),
      );

      const pureResults = results.filter((r) => r !== undefined);
      const pureErrors = errors.filter((e) => e !== undefined);

      return [pureErrors.length ? pureErrors : null, pureResults.length ? pureResults : null];
    }

    run().then(([error, results]) => {
      return done(error, results);
    });
  };
}

module.exports = {
  settleParallel,
};
