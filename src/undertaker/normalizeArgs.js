'use strict';

const assert = require('assert');

const levenshtein = require('fast-levenshtein');

function normalizeArgs(registry, args) {
  function getFunction(task) {
    if (typeof task === 'function') {
      return task;
    }

    const fn = registry.get(task);
    if (!fn) {
      const similar = similarTasks(registry, task);
      if (similar.length > 0) {
        assert(false, 'Task never defined: ' + task + ' - did you mean? ' + similar.join(', '));
      } else {
        assert(false, 'Task never defined: ' + task);
      }
    }
    return fn;
  }

  const flattenArgs = [...args].flat(Infinity);
  assert(flattenArgs.length, 'One or more tasks should be combined using series or parallel');

  return flattenArgs.map((task) => getFunction(task));
}

function similarTasks(registry, queryTask) {
  if (typeof queryTask !== 'string') {
    return [];
  }

  const tasks = registry.tasks();
  const similarTasks = [];
  for (let task in tasks) {
    if (tasks.hasOwnProperty(task)) {
      const distance = levenshtein.get(task, queryTask);
      const allowedDistance = Math.floor(0.4 * task.length) + 1;
      if (distance < allowedDistance) {
        similarTasks.push(task);
      }
    }
  }
  return similarTasks;
}

module.exports = normalizeArgs;
