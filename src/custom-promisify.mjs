import { finished } from 'node:stream/promises';

const { default: exhaust } = await import('stream-exhaust');

/**
 * should work with:
 * - promises
 * - async functions
 * - sync functions with return value
 * - sync functions with node streams as return value
 * @param fn
 * @returns {Function}
 */
export async function customPromisify(fn) {
  if (fn.then) {
    return fn;
  }

  const fnRes = await fn();

  if (fnRes?.on) {
    await finished(exhaust(fnRes), { error: true });
    return;
  }

  return fnRes;
}
