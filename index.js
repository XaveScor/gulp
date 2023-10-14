const { Gulp } = require('./src/gulp.cjs');

const inst = new Gulp();

inst.setDeprecationFlags = async (flags) => {
  const deprecation = await import('./src/deprecation.mjs');
  deprecation.setDeprecationFlags(flags);
};

(async () => {
  const deprecation = await import('./src/deprecation.mjs');

  deprecation.showDeprecationWarning();
})();

module.exports = inst;
