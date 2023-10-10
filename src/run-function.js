const { customPromisify } = require('./custom-promisify.js');

const cache = new Map();
async function call(fn) {
  const deprecations = await import('./deprecation.mjs');
  const runTaskOnceFlag = deprecations.getTaskRunsOnceDeprecationFlag();

  if (cache.has(fn)) {
    if (!runTaskOnceFlag) {
      deprecations.warn(
        `[DEPRECATED] The task ${fn.name} has been called more than once. This is deprecated. Please visit https://github.com/XaveScor/gulp/blob/master/DEPRECATIONS.md for more information`,
      );
    } else {
      return cache.get(fn);
    }
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
