import { parseOptions } from './parseOptions.mjs';
import { runFunction } from '../run-function.mjs';

export async function settleParallel(funcs, options) {
  const normalizeOptions = parseOptions(options);

  const results = new Array(funcs.length).fill(undefined);
  const errors = new Array(funcs.length).fill(undefined);
  await Promise.all(
    funcs.map(async (fn, idx) => {
      try {
        results[idx] = await runFunction(fn, idx, normalizeOptions);
      } catch (e) {
        errors[idx] = e;
      }
    }),
  );

  const pureResults = results.filter((r) => r !== undefined);
  const pureErrors = errors.filter((e) => e !== undefined);

  return [pureErrors.length ? pureErrors : null, pureResults.length ? pureResults : null];
}
