const { Gulp } = require('./gulp.cjs');
const { declareTask: _declareTask, TaskShouldBeNotCallbackError, TaskAlreadyDefinedError } = require('./undertaker/declare-task.cjs');

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

    if (this._getTask(name)) {
      throw new TaskAlreadyDefinedError(name);
    }

    return _declareTask({ name, fn, ctx: this, runOnce: true });
  };
}

module.exports = {
  Jobo,
};
