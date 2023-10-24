const { EventEmitter } = require('node:events');
const DefaultRegistry = require('undertaker-registry');
const map = require('collection-map');
const metadata = require('./undertaker/metadata');
const normalizeArgs = require('./undertaker/normalizeArgs');
const createExtensions = require('./undertaker/createExtensions');
const buildTree = require('./undertaker/buildTree');
const retrieveLastRun = require('last-run');
const validateRegistry = require('./undertaker/validateRegistry');
const assert = require('assert');
const vfs = require('vinyl-fs');
const { watch } = require('./watcher/index.cjs');
const { declareTask } = require('./declare-task.cjs');

class Gulp extends EventEmitter {
  Gulp = Gulp;

  constructor(customRegistry = null) {
    super();

    this._registry = new DefaultRegistry();
    if (customRegistry) {
      this.registry(customRegistry);
    }

    this._settle = process.env.UNDERTAKER_SETTLE === 'true';
  }

  tree = (opts = {}) => {
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
  };

  task = (name, fn) => {
    if (typeof name === 'function') {
      fn = name;
      name = fn.displayName || fn.name;
    }

    if (!fn) {
      return this._getTask(name);
    }

    this._setTask(name, fn);
  };

  series = (...args) => {
    const normalizedArgs = normalizeArgs(this._registry, args);
    const extensions = createExtensions(this);
    const fn = (done) => {
      const run = async () => {
        const { settleSeries, series } = await import('./bach/index.mjs');
        const create = this._settle ? settleSeries : series;

        return create(normalizedArgs, extensions);
      };

      run().then(([error, results]) => {
        return done?.(error, results);
      });
    };
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
  };

  lastRun = (task, timeResolution) => {
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
  };

  parallel = (...args) => {
    const normalizedArgs = normalizeArgs(this._registry, args);
    const extensions = createExtensions(this);
    const fn = (done) => {
      const run = async () => {
        const { parallel, settleParallel } = await import('./bach/index.mjs');
        const create = this._settle ? settleParallel : parallel;
        return create(normalizedArgs, extensions);
      };

      run().then(([errors, results]) => {
        done?.(errors, results);
      });
    };
    const name = '<parallel>';

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
  };

  registry = (newRegistry) => {
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
  };

  _getTask(name) {
    return this._registry.get(name);
  }

  _setTask(name, fn) {
    assert(name, 'Task name must be specified');
    assert(typeof name === 'string', 'Task name must be a string');
    assert(typeof fn === 'function', 'Task function must be specified');

    declareTask({ name, fn, registry: this._registry, once: false });
  }

  src = vfs.src.bind(this);
  dest = vfs.dest.bind(this);
  symlink = vfs.symlink.bind(this);

  watch = (glob, opt, task) => {
    if (typeof opt === 'string' || typeof task === 'string' || Array.isArray(opt) || Array.isArray(task)) {
      throw new Error('watching ' + glob + ': watch task has to be ' + 'a function (optionally generated by using gulp.parallel ' + 'or gulp.series)');
    }

    if (typeof opt === 'function') {
      task = opt;
      opt = {};
    }

    let fn;
    if (typeof task === 'function') {
      fn = this.parallel(task);
    }

    return watch({
      glob,
      options: opt,
      callback: fn,
    });
  };
}

module.exports = {
  Gulp,
};
