import { promisify } from 'node:util';

const { default: eos } = await import('end-of-stream');
const { default: exhaust } = await import('stream-exhaust');

/**
 * should work with:
 * - async functions
 * - callback functions
 * - sync functions with return value
 * - node streams
 * @param fn
 * @returns {Function}
 */
export function customPromisify(fn) {
  const argsNumber = fn.length;
  return promisify((done) => {
    const fnRes = fn(done);
    if (argsNumber > 0) {
      // it's a callback function.
      return;
    }

    if (fnRes?.on) {
      eos(exhaust(fnRes), { error: false }, done);
      return;
    }

    Promise.resolve(fnRes)
      .then(async (result) => done(null, result))
      .catch((error) => done(error));
  });
}
