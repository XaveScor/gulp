import { parseOptions } from './parseOptions.mjs';
import { runFunction } from '../run-function.mjs';

export async function series(funcs, options) {
  const normalizeOptions = parseOptions(options);

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
