const { parseArgs } = require('./parseArgs.js');
const { runFunction } = require('../../run-function.js');

function settleSeries(...args) {
  const { funcs, options } = parseArgs(args.flat(Infinity));
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      const errors = new Array(funcs.length).fill(undefined);
      for (let idx = 0; idx < funcs.length; idx++) {
        try {
          results[idx] = await runFunction(funcs[idx], idx, options);
        } catch (e) {
          errors[idx] = e;
        }
      }

      const pureResults = results.filter((r) => r !== undefined);
      const pureErrors = errors.filter((e) => e !== undefined);

      return [pureErrors.length ? pureErrors : null, pureResults.length ? pureResults : null];
    }

    run().then(([error, results]) => done(error, results));
  };
}

module.exports = {
  settleSeries,
};
