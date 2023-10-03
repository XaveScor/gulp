const { parseArgs } = require('./parseArgs.js');
const { runFunction } = require('../../run-function');

function parallel(...args) {
  const { funcs, options } = parseArgs(args.flat(Infinity));
  return (done) => {
    async function run() {
      const results = new Array(funcs.length).fill(undefined);
      let error = null;
      try {
        await Promise.all(
          funcs.map(async (fn, idx) => {
            results[idx] = await runFunction(fn, idx, options);
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
