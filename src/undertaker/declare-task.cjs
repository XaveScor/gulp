const metadata = require('./metadata.js');

class TaskAlreadyDefinedError extends Error {
  constructor(name) {
    super(`Task "${name}" already defined`);
  }
}

class TaskShouldBeNotCallbackError extends Error {
  constructor(name) {
    super(`Task "${name}" should not be a callback function. Please, use Promise or async/await instead \n
    See https://github.com/XaveScor/gulp/blob/master/DEPRECATIONS.md for more information`);
  }
}

/**
 *
 * @param name {string}
 * @param fn {Function}
 * @param ctx {import('./../gulp.cjs').Gulp}
 * @param runOnce {boolean}
 */
function declareTask({ name, fn, ctx, runOnce = true }) {
  ctx ??= require('../../index.js');

  if (ctx._getTask(name)) {
    throw new TaskAlreadyDefinedError(name);
  }

  function taskWrapper(...args) {
    return fn.apply(this, args);
  }

  Object.defineProperty(taskWrapper, 'length', { value: fn.length });
  taskWrapper.unwrap = () => fn;
  taskWrapper.displayName = name;
  taskWrapper.runOnce = runOnce;

  const meta = metadata.get(fn) || {};
  const nodes = [];
  if (meta.branch) {
    nodes.push(meta.tree);
  }

  const task = ctx._registry.set(name, taskWrapper) ?? taskWrapper;

  metadata.set(task, {
    name: name,
    orig: fn,
    tree: {
      label: name,
      type: 'task',
      nodes: nodes,
    },
  });

  return task;
}

module.exports = {
  declareTask,
  TaskShouldBeNotCallbackError,
};
