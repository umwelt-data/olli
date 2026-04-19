import type { GalleryExample } from './types.js';
import { barChart } from './vega-lite/bar-chart.js';
import { aggregateBarChart } from './vega-lite/aggregate-bar-chart.js';
import { groupedBarChart } from './vega-lite/grouped-bar-chart.js';
import { stackedBarChart } from './vega-lite/stacked-bar-chart.js';
import { populationPyramid } from './vega-lite/population-pyramid.js';
import { histogram } from './vega-lite/histogram.js';
import { scatterplot } from './vega-lite/scatterplot.js';
import { stripPlot } from './vega-lite/strip-plot.js';
import { lineChart } from './vega-lite/line-chart.js';
import { multiSeriesLine } from './vega-lite/multi-series-line.js';
import { areaChart } from './vega-lite/area-chart.js';
import { stackedAreaChart } from './vega-lite/stacked-area-chart.js';
import { streamgraph } from './vega-lite/streamgraph.js';
import { heatmap } from './vega-lite/heatmap.js';
import { lasagnaPlot } from './vega-lite/lasagna-plot.js';
import { facetedChart } from './vega-lite/faceted-chart.js';
import { layeredChart } from './vega-lite/layered-chart.js';
import { concatChart } from './vega-lite/concat-chart.js';

/**
 * All gallery examples, in display order.
 * Add a new export here to register it. The `id` field becomes the URL slug.
 */
export const examples: GalleryExample[] = [
  barChart,
  aggregateBarChart,
  groupedBarChart,
  stackedBarChart,
  populationPyramid,
  histogram,
  scatterplot,
  stripPlot,
  lineChart,
  multiSeriesLine,
  areaChart,
  stackedAreaChart,
  streamgraph,
  heatmap,
  lasagnaPlot,
  facetedChart,
  layeredChart,
  concatChart,
];

export function findExample(id: string): GalleryExample | undefined {
  return examples.find((e) => e.id === id);
}

export type { GalleryExample, VisualizationExample, DiagramExample } from './types.js';
