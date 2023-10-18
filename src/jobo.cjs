const { Gulp } = require('./gulp.cjs');
const { declareTask: _declareTask, TaskShouldBeNotCallbackError } = require('./undertaker/declare-task.cjs');

class Jobo extends Gulp {
  /**
   *
   * @param name {string}
   * @param fn {Function}
   */
  declareTask = ({ name, fn }) => {
    if (fn.length > 0) {
      throw new TaskShouldBeNotCallbackError(name);
    }

    return _declareTask({ name, fn, ctx: this, runOnce: true });
  };
}

module.exports = {
  Jobo,
};
