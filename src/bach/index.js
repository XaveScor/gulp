const { series } = require('./lib/series');
const { parallel } = require('./lib/parallel');
const { settleSeries } = require('./lib/settleSeries');
const { settleParallel } = require('./lib/settleParallel');

module.exports = {
  series,
  parallel,
  settleSeries,
  settleParallel,
};
