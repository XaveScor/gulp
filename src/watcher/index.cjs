const path = require('node:path');
var chokidar = require('chokidar');
var debounce = require('just-debounce');
var defaults = require('object.defaults/immutable');
var isNegatedGlob = require('is-negated-glob');
var anymatch = require('anymatch');
const { createRunQueue } = require('./run-queue.cjs');
const { customPromisify } = require('../custom-promisify.cjs');

var defaultOpts = {
  delay: 200,
  events: ['add', 'change', 'unlink'],
  ignored: [],
  ignoreInitial: true,
  queue: true,
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

function exists(val) {
  return val != null;
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

  // These use sparse arrays to keep track of the index in the
  // original globs array
  var positives = new Array(glob.length);
  var negatives = new Array(glob.length);

  // Reverse the glob here so we don't end up with a positive
  // and negative glob in position 0 after a reverse
  glob.reverse().forEach(sortGlobs);

  function sortGlobs(globString, index) {
    var result = isNegatedGlob(globString);
    if (result.negated) {
      negatives[index] = result.pattern;
    } else {
      positives[index] = result.pattern;
    }
  }

  var toWatch = positives.filter(exists);

  function joinCwd(glob) {
    if (glob && opt.cwd) {
      return path.normalize(opt.cwd + '/' + glob);
    }

    return glob;
  }

  // We only do add our custom `ignored` if there are some negative globs
  // TODO: I'm not sure how to test this
  if (negatives.some(exists)) {
    var normalizedPositives = positives.map(joinCwd);
    var normalizedNegatives = negatives.map(joinCwd);
    var shouldBeIgnored = function (path) {
      var positiveMatch = anymatch(normalizedPositives, path, true);
      var negativeMatch = anymatch(normalizedNegatives, path, true);
      // If negativeMatch is -1, that means it was never negated
      if (negativeMatch === -1) {
        return false;
      }

      // If the negative is "less than" the positive, that means
      // it came later in the glob array before we reversed them
      return negativeMatch < positiveMatch;
    };

    opt.ignored = [].concat(opt.ignored, shouldBeIgnored);
  }
  const watcher = chokidar.watch(toWatch, opt);

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
