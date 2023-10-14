const noop = () => {};
/**
 *
 * @param options {Object}
 */
function parseOptions(options = {}) {
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
    create,
    before,
    after,
    error,
  };
}

module.exports = {
  parseOptions,
};
