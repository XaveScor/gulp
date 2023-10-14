const { series } = await import('./series.js');
const { settleSeries } = await import('./settleSeries.js');

export { series, settleSeries };
export { parallel } from './parallel.mjs';
export { settleParallel } from './settleParallel.mjs';
