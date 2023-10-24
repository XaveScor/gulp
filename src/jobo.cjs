const { Gulp } = require('./gulp.cjs');

class Jobo extends Gulp {
  setDeprecationFlags = async (flags) => {
    const deprecation = await import('./deprecation.mjs');
    deprecation.setDeprecationFlags(flags);
  };
}

module.exports = {
  Jobo,
};
