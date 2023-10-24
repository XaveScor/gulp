const metadata = require('./undertaker/metadata');

class TaskWithNameAlreadyExistsError extends Error {
  constructor(taskName) {
    super(`Task with name "${taskName}" already exists`);
  }
}

class CallbackTaskIsNotAllowedError extends Error {
  constructor(taskName) {
    super(`Task with name "${taskName}" is a callback task and is not allowed. Please, use async-await instead.\n
      Visit https://github.com/XaveScor/gulp/blob/master/DEPRECATIONS.md for more information`);
  }
}

function declareTask({ name, fn, registry }) {
  function taskWrapper(...args) {
    return fn.apply(this, args);
  }

  Object.defineProperty(taskWrapper, 'length', { value: fn.length });
  taskWrapper.unwrap = () => fn;
  taskWrapper.displayName = name;

  const meta = metadata.get(fn) || {};
  const nodes = [];
  if (meta.branch) {
    nodes.push(meta.tree);
  }

  const task = registry.set(name, taskWrapper) || taskWrapper;

  metadata.set(task, {
    name: name,
    orig: fn,
    tree: {
      label: name,
      type: 'task',
      nodes: nodes,
    },
  });
}

module.exports = {
  declareTask,
  TaskWithNameAlreadyExistsError,
  CallbackTaskIsNotAllowedError,
};
