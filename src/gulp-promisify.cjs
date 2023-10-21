const { TaskResult } = require('./task-result.cjs');

function gulpPromisify(fn) {
  if (fn.length === 0) {
    return fn;
  }
  return () => {
    return new Promise((resolve) => {
      fn((err, result) => {
        resolve(new TaskResult(result, err));
      });
    });
  };
}

module.exports = {
  gulpPromisify,
};
