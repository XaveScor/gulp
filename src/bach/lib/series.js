const { parseArgs } = require('./parseArgs.js');
const { customPromisify } = require('../../custom-promisify.js');

function series(...args) {
  const { series, options } = parseArgs(args.flat(Infinity));
  return (done) => {
    async function run() {
      const results = new Array(series.length).fill(undefined);
      for (let idx = 0; idx < series.length; idx++) {
        const fn = series[idx];
        const storage = options.create(fn, idx);
        options.before(storage);
        let result;
        try {
          result = await customPromisify(fn)();
          if (result instanceof Error) {
            // noinspection ExceptionCaughtLocallyJS
            throw result;
          }
          options.after(result, storage);
        } catch (error) {
          options.error(error, storage);
          return [error, results];
        }
        results[idx] = result;
      }
      return [null, results];
    }

    run().then(([error, results]) => done(error, results));
  };
}

module.exports = {
  series,
};
