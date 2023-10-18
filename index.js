const { Jobo } = require('./src/jobo.cjs');

const inst = new Jobo();

inst.setDeprecationFlags = async (flags) => {
  const deprecation = await import('./src/deprecation.mjs');
  deprecation.setDeprecationFlags(flags);
};

(async () => {
  const deprecation = await import('./src/deprecation.mjs');

  deprecation.showDeprecationWarning();
})();

module.exports = inst;
