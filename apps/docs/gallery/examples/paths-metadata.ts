/**
 * Lightweight id/title metadata for VitePress dynamic routes ([id].paths.ts).
 *
 * Must not import from olli-adapters, olli-vis, olli-render-solid, or any
 * package that contains SolidJS JSX — those can't be loaded in the plain
 * Node.js context VitePress uses for .paths files.
 *
 * Keep in sync with the export order in index.ts.
 */
export const galleryPathsMetadata: { id: string; title: string }[] = [
  { id: 'bar-chart', title: 'Bar chart' },
  { id: 'aggregate-bar-chart', title: 'Aggregate bar chart' },
  { id: 'grouped-bar-chart', title: 'Grouped bar chart' },
  { id: 'stacked-bar-chart', title: 'Stacked bar chart' },
  { id: 'population-pyramid', title: 'Population pyramid' },
  { id: 'histogram', title: 'Histogram' },
  { id: 'scatterplot', title: 'Scatterplot' },
  { id: 'strip-plot', title: 'Strip plot' },
  { id: 'line-chart', title: 'Line chart' },
  { id: 'multi-series-line', title: 'Multi-series line chart' },
  { id: 'area-chart', title: 'Area chart' },
  { id: 'stacked-area-chart', title: 'Stacked area chart' },
  { id: 'streamgraph', title: 'Streamgraph' },
  { id: 'heatmap', title: 'Heatmap' },
  { id: 'lasagna-plot', title: 'Lasagna plot' },
  { id: 'faceted-chart', title: 'Faceted chart' },
  { id: 'layered-chart', title: 'Layered chart' },
  { id: 'concat-chart', title: 'Concatenated chart' },
  { id: 'pulley', title: 'Pulley diagram' },
];
