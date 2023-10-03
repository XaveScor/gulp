const assert = require('assert');

const noop = () => {};
/**
 *
 * @param options {Object}
 */
function parseOptions(options = {}) {
  if (options.concurrency != null && typeof options.concurrency !== 'number' && options.concurrency <= 0) {
    console.warn('bach: `concurrency` option must be a number greater than 0, got ' + typeof options.concurrency + ' ' + options.concurrency);
  }
  const concurrency = options.concurrency ?? 1;

  if (options.create != null && typeof options.create !== 'function') {
    console.warn('bach: `create` option must be a function, got ' + typeof options.create + ' ' + options.create);
  }
  const create = options.create ?? noop;

  if (options.before != null && typeof options.before !== 'function') {
    console.warn('bach: `before` option must be a function, got ' + typeof options.before + ' ' + options.before);
  }
  const before = options.before ?? noop;

  if (options.after != null && typeof options.after !== 'function') {
    console.warn('bach: `after` option must be a function, got ' + typeof options.after + ' ' + options.after);
  }
  const after = options.after ?? noop;

  if (options.error != null && typeof options.error !== 'function') {
    console.warn('bach: `error` option must be a function, got ' + typeof options.error + ' ' + options.error);
  }
  const error = options.error ?? noop;

  return {
    concurrency,
    create,
    before,
    after,
    error,
  };
}

/**
 * [func, func, func, ..., options] => {series: [func, func, func, ...], options: options}
 * @param args {Array<Function|Object>}
 */
function parseArgs(args) {
  assert.ok(args.length, 'A set of functions to combine is required');

  const funcs = [...args];
  let options = parseOptions({});
  const lastIdx = funcs.length - 1;
  if (typeof funcs[lastIdx] === 'object') {
    options = parseOptions(funcs.pop());
  }

  const nonFunctionId = funcs.findIndex((arg) => typeof arg !== 'function');
  console.assert(nonFunctionId === -1, 'Only functions can be combined, got ' + typeof funcs[nonFunctionId] + ' for argument ' + nonFunctionId);

  return {
    funcs,
    options,
  };
}

module.exports = {
  parseArgs,
};
