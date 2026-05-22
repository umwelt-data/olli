/**
 * Gallery example groupings for sidebar navigation and the index page.
 *
 * Lightweight — no heavy imports — so it can be used in VitePress config
 * (Node context) and Vue components (browser context).
 */
export const galleryGroups: { label: string; items: { id: string; title: string }[] }[] = [
  {
    label: 'Bar Charts',
    items: [
      { id: 'bar-chart', title: 'Bar chart' },
      { id: 'aggregate-bar-chart', title: 'Aggregate bar chart' },
      { id: 'grouped-bar-chart', title: 'Grouped bar chart' },
      { id: 'stacked-bar-chart', title: 'Stacked bar chart' },
      { id: 'population-pyramid', title: 'Population pyramid' },
    ],
  },
  {
    label: 'Histograms',
    items: [{ id: 'histogram', title: 'Histogram' }],
  },
  {
    label: 'Scatter & Strip Plots',
    items: [
      { id: 'scatterplot', title: 'Scatterplot' },
      { id: 'bubble-plot', title: 'Bubble plot' },
      { id: 'strip-plot', title: 'Strip plot' },
    ],
  },
  {
    label: 'Line Charts',
    items: [
      { id: 'line-chart', title: 'Line chart' },
      { id: 'multi-series-line', title: 'Multi-series line chart' },
    ],
  },
  {
    label: 'Area Charts & Streamgraphs',
    items: [
      { id: 'area-chart', title: 'Area chart' },
      { id: 'stacked-area-chart', title: 'Stacked area chart' },
      { id: 'streamgraph', title: 'Streamgraph' },
    ],
  },
  {
    label: 'Table-based Plots',
    items: [
      { id: 'heatmap', title: 'Heatmap' },
      { id: 'lasagna-plot', title: 'Lasagna plot' },
    ],
  },
  {
    label: 'Multi-View Displays',
    items: [
      { id: 'faceted-chart', title: 'Faceted chart' },
      { id: 'layered-chart', title: 'Layered chart' },
      { id: 'concat-chart', title: 'Concatenated chart' },
    ],
  },
  {
    label: 'Pie & Donut Charts',
    items: [
      { id: 'pie-chart', title: 'Pie chart' },
      { id: 'donut-chart', title: 'Donut chart' },
    ],
  },
  {
    label: 'Diagrams',
    items: [{ id: 'pulley', title: 'Pulley diagram' }],
  },
];
