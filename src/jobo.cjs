const { Gulp } = require('./gulp.cjs');
const { declareTask: _declareTask, TaskWithNameAlreadyExistsError, CallbackTaskIsNotAllowedError } = require('./declare-task.cjs');
const { Deprecations, deprecationFlagsEnum, DeprecationWarnings } = require('./deprecation.cjs');

class Jobo extends Gulp {
  declareTask = ({ name, fn }) => {
    if (this._registry.get(name)) {
      throw new TaskWithNameAlreadyExistsError(name);
    }
    if (fn.length > 0) {
      throw new CallbackTaskIsNotAllowedError(name);
    }

    _declareTask({ name, fn, registry: this._registry, once: true });

    return name;
  };

  _deprecations = new Deprecations();
  /**
   *
   * @param flags {{ legacyTask: boolean }}
   */
  disableBehavior = (flags) => {
    this._deprecations.disableBehavior(flags);
  };

  _warnings = new DeprecationWarnings();
  /**
   *
   * @param flags {Array<string>}
   */
  disableDeprecationWarnings = (flags) => {
    this._warnings.disableDeprecationWarnings(flags);
  };

  task = (name, fn) => {
    this._deprecations.deprecate(deprecationFlagsEnum.legacyTask, `fix the task with name ${fn.displayName || name}`);
    this._warnings.warn(
      deprecationFlagsEnum.legacyTask,
      `jobo.task is deprecated, use jobo.declareTask({ name, fn }) instead. Please, fix the task(name: ${fn.displayName || name})`,
    );

    return super._task(name, fn);
  };

  deprecationFlagsEnum = deprecationFlagsEnum;
}

module.exports = {
  Jobo,
};
