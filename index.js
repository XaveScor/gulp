const { Jobo } = require('./src/jobo.cjs');

const inst = new Jobo();

(async () => {
  const deprecation = await import('./src/deprecation.mjs');

  deprecation.showDeprecationWarning();
})();

module.exports = inst;
