import { parseOptions } from './parseOptions.mjs';
import { runFunction } from '../run-function.mjs';
import { TaskResult } from '../task-result.mjs';

export async function settleSeries(funcs, options) {
  const normalizeOptions = parseOptions(options);

  const results = new Array(funcs.length).fill(undefined);
  const errors = new Array(funcs.length).fill(undefined);
  for (let idx = 0; idx < funcs.length; idx++) {
    try {
      results[idx] = await runFunction(funcs[idx], idx, normalizeOptions);
    } catch (e) {
      errors[idx] = e;
    }
  }

  const pureResults = results.filter((r) => r !== undefined);
  const pureErrors = errors.filter((e) => e !== undefined);

  return new TaskResult(pureResults.length ? pureResults : null, pureErrors.length ? pureErrors : null);
}
