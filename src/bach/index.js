const { series } = require('./lib/series');

module.exports = {
  series,
  parallel: require('./lib/parallel'),
  settleSeries: require('./lib/settleSeries'),
  settleParallel: require('./lib/settleParallel'),
};
