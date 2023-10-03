const { customPromisify } = require('./custom-promisify.js');

const cache = new Map();
async function call(fn) {
  if (cache.has(fn)) {
    return cache.get(fn);
  }
  const result = await customPromisify(fn)();
  cache.set(fn, result);

  return result;
}

async function runFunction(fn, idx, options) {
  const storage = options.create(fn, idx);
  options.before(storage);
  try {
    const result = await call(fn);
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
