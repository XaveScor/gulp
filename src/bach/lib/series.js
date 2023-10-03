const { parseArgs } = require('./parseArgs.js');
const { runFunction } = require('../../run-function');

function series(...args) {
  const { funcs, options } = parseArgs(args.flat(Infinity));
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      let error = null;
      try {
        for (let idx = 0; idx < funcs.length; idx++) {
          results[idx] = await runFunction(funcs[idx], idx, options);
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
