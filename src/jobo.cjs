const { Gulp } = require('./gulp.cjs');
const { declareTask: _declareTask, TaskWithNameAlreadyExistsError, CallbackTaskIsNotAllowedError } = require('./declare-task.cjs');

class Jobo extends Gulp {
  declareTask = ({ name, fn }) => {
    if (this._registry.get(name)) {
      throw new TaskWithNameAlreadyExistsError(name);
    }
    if (fn.length > 0) {
      throw new CallbackTaskIsNotAllowedError(name);
    }

    _declareTask({ name, fn, registry: this._registry });

    return name;
  };

  setDeprecationFlags = async (flags) => {
    const deprecation = await import('./deprecation.mjs');
    deprecation.setDeprecationFlags(flags);
  };
}

module.exports = {
  Jobo,
};
