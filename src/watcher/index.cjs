var chokidar = require('chokidar');
var debounce = require('just-debounce');
var defaults = require('object.defaults/immutable');
const { createRunQueue } = require('./run-queue.cjs');
const { customPromisify } = require('../custom-promisify.cjs');

var defaultOpts = {
  delay: 200,
  events: ['add', 'change', 'unlink'],
  ignored: [],
  ignoreInitial: true,
  queue: true,
  awaitWriteFinish: {
    stabilityThreshold: 50,
    pollInterval: 100,
  },
};

function listenerCount(ee, evtName) {
  if (typeof ee.listenerCount === 'function') {
    return ee.listenerCount(evtName);
  }

  return ee.listeners(evtName).length;
}

function hasErrorListener(ee) {
  return listenerCount(ee, 'error') !== 0;
}

function noop() {}

function watch({ glob, options = {}, callback = noop }) {
  const opt = defaults(options, defaultOpts);

  if (!Array.isArray(opt.events)) {
    opt.events = [opt.events];
  }

  if (Array.isArray(glob)) {
    // We slice so we don't mutate the passed globs array
    glob = [...glob];
  } else {
    glob = [glob];
  }
  const watcher = chokidar.watch(glob, opt);

  const queue = createRunQueue(opt.queue);
  const awaitableCallback = customPromisify(callback);

  function onChange() {
    queue.add(awaitableCallback, (err) => {
      if (hasErrorListener(watcher)) {
        watcher.emit('error', err);
      }
    });
  }

  const fn = debounce(onChange, opt.delay);

  for (const eventName of opt.events) {
    watcher.on(eventName, fn);
  }

  return watcher;
}

module.exports = {
  watch,
};
