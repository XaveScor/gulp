const { series } = require('./lib/series');
const { parallel } = require('./lib/parallel');

module.exports = {
  series,
  parallel,
  settleSeries: require('./lib/settleSeries'),
  settleParallel: require('./lib/settleParallel'),
};
