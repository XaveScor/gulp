const { series } = await import('./series.js');
const { parallel } = await import('./parallel.js');
const { settleSeries } = await import('./settleSeries.js');
const { settleParallel } = await import('./settleParallel.js');

export { series, parallel, settleSeries, settleParallel };
