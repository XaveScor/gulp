const { customPromisify } = require('./custom-promisify.js');

async function runFunction(fn, idx, options) {
  const storage = options.create(fn, idx);
  options.before(storage);
  try {
    const result = await customPromisify(fn)();
    if (result instanceof Error) {
      // noinspection ExceptionCaughtLocallyJS
      throw result;
    }
    options.after(result, storage);
    return result;
  } catch (error) {
    options.error(error, storage);
    throw error;
  }
}

module.exports = {
  runFunction,
};
