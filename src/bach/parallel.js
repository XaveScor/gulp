const { runFunction } = require('../run-function');
const { parseOptions } = require('./parseArgs');

function parallel(funcs, options) {
  const normalizeOptions = parseOptions(options);
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      let error = null;
      try {
        await Promise.all(
          funcs.map(async (fn, idx) => {
            results[idx] = await runFunction(fn, idx, normalizeOptions);
          }),
        );
      } catch (e) {
        error = e;
      }
      return [error, results];
    }

    run().then(([error, results]) => {
      return done(error, results);
    });
  };
}

module.exports = {
  parallel,
};
