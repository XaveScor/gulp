'use strict';

var validateRegistry = require('./helpers/validateRegistry');

function registry(newRegistry) {
  if (!newRegistry) {
    return this._registry;
  }

  validateRegistry(newRegistry);

  var tasks = this._registry.tasks();

  this._registry = newRegistry;
  for (let taskName in tasks) {
    if (Object.hasOwn(tasks, taskName)) {
      this._registry.set(taskName, tasks[taskName]);
    }
  }

  this._registry.init(this);
}

module.exports = registry;
