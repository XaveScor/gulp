import { parseOptions } from './parseOptions.mjs';
import { runFunction } from '../run-function.mjs';

export async function parallel(funcs, options) {
  const normalizeOptions = parseOptions(options);

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
