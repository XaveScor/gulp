const assert = require('assert');

function isFunction(fn) {
  return typeof fn === 'function';
}

function isConstructor(registry) {
  if (!(registry && registry.prototype)) {
    return false;
  }

  const hasProtoGet = isFunction(registry.prototype.get);
  const hasProtoSet = isFunction(registry.prototype.set);
  const hasProtoInit = isFunction(registry.prototype.init);
  const hasProtoTasks = isFunction(registry.prototype.tasks);

  if (hasProtoGet || hasProtoSet || hasProtoInit || hasProtoTasks) {
    return true;
  }

  return false;
}

function validateRegistry(registry) {
  try {
    assert(isFunction(registry.get), 'Custom registry must have `get` function');
    assert(isFunction(registry.set), 'Custom registry must have `set` function');
    assert(isFunction(registry.init), 'Custom registry must have `init` function');
    assert(isFunction(registry.tasks), 'Custom registry must have `tasks` function');
  } catch (err) {
    if (isConstructor(registry)) {
      assert(false, 'Custom registries must be instantiated, but it looks like you passed a constructor');
    } else {
      throw err;
    }
  }
}

module.exports = validateRegistry;
