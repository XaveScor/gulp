const { series } = require('./lib/series');
const { parallel } = require('./lib/parallel');
const { settleSeries } = require('./lib/settleSeries');

module.exports = {
  series,
  parallel,
  settleSeries,
  settleParallel: require('./lib/settleParallel'),
};
