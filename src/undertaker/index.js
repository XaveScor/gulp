const EventEmitter = require('events').EventEmitter;
const bach = require('../bach/index.js');
const DefaultRegistry = require('undertaker-registry');

const metadata = require('./metadata');
const buildTree = require('./buildTree');
const normalizeArgs = require('./normalizeArgs');
const createExtensions = require('./createExtensions');
const map = require('collection-map');
const retrieveLastRun = require('last-run');
const validateRegistry = require('./validateRegistry');
const assert = require('assert');

class Undertaker extends EventEmitter {
  constructor(customRegistry) {
    super();

    this._registry = new DefaultRegistry();
    if (customRegistry) {
      this.registry(customRegistry);
    }

    this._settle = process.env.UNDERTAKER_SETTLE === 'true';
  }

  tree(opts = {}) {
    opts = {
      deep: false,
      ...opts,
    };

    const tasks = this._registry.tasks();
    const nodes = map(tasks, function (task) {
      const meta = metadata.get(task);

      if (opts.deep) {
        return meta.tree;
      }

      return meta.tree.label;
    });

    return {
      label: 'Tasks',
      nodes: nodes,
    };
  }

  task(name, fn) {
    if (typeof name === 'function') {
      fn = name;
      name = fn.displayName || fn.name;
    }

    if (!fn) {
      return this._getTask(name);
    }

    this._setTask(name, fn);
  }

  series(...args) {
    const create = this._settle ? bach.settleSeries : bach.series;

    const normalizedArgs = normalizeArgs(this._registry, args);
    const extensions = createExtensions(this);
    const fn = create(normalizedArgs, extensions);
    const name = '<series>';

    metadata.set(fn, {
      name: name,
      branch: true,
      tree: {
        label: name,
        type: 'function',
        branch: true,
        nodes: buildTree(normalizedArgs),
      },
    });
    return fn;
  }

  lastRun(task, timeResolution) {
    if (timeResolution == null) {
      timeResolution = process.env.UNDERTAKER_TIME_RESOLUTION;
    }

    let fn = task;
    if (typeof task === 'string') {
      fn = this._getTask(task);
    }

    const meta = metadata.get(fn);

    if (meta) {
      fn = meta.orig || fn;
    }

    return retrieveLastRun(fn, timeResolution);
  }

  parallel() {
    const create = this._settle ? bach.settleParallel : bach.parallel;

    const args = normalizeArgs(this._registry, arguments);
    const extensions = createExtensions(this);
    const fn = create(args, extensions);
    const name = '<parallel>';

    metadata.set(fn, {
      name: name,
      branch: true,
      tree: {
        label: name,
        type: 'function',
        branch: true,
        nodes: buildTree(args),
      },
    });
    return fn;
  }

  registry(newRegistry) {
    if (!newRegistry) {
      return this._registry;
    }

    validateRegistry(newRegistry);

    const tasks = this._registry.tasks();

    this._registry = newRegistry;
    for (let taskName in tasks) {
      if (Object.hasOwn(tasks, taskName)) {
        this._registry.set(taskName, tasks[taskName]);
      }
    }

    this._registry.init(this);
  }

  _getTask(name) {
    return this._registry.get(name);
  }

  _setTask(name, fn) {
    assert(name, 'Task name must be specified');
    assert(typeof name === 'string', 'Task name must be a string');
    assert(typeof fn === 'function', 'Task function must be specified');

    function taskWrapper() {
      return fn.apply(this, arguments);
    }

    taskWrapper.unwrap = () => fn;
    taskWrapper.displayName = name;

    const meta = metadata.get(fn) || {};
    const nodes = [];
    if (meta.branch) {
      nodes.push(meta.tree);
    }

    const task = this._registry.set(name, taskWrapper) || taskWrapper;

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
}

module.exports = Undertaker;
