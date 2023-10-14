const { runFunction } = require('../run-function');
const { parseOptions } = require('./parseArgs');

function series(funcs, options) {
  const normalizeOptions = parseOptions(options);
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      let error = null;
      try {
        for (let idx = 0; idx < funcs.length; idx++) {
          results[idx] = await runFunction(funcs[idx], idx, normalizeOptions);
        }
      } catch (e) {
        error = e;
      }
      return [error, results];
    }

    run().then(([error, results]) => done(error, results));
  };
}

module.exports = {
  series,
};
