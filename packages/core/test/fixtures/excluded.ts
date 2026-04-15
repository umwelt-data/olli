// Specs that exist in examples/vl-specs/ but are not yet supported by Olli.
// Matches the commented-out entries in docs/examples.html — these render in
// Vega-Lite but currently produce broken or empty Olli trees, so we exclude
// them from the corpus-driven tests rather than pinning a broken baseline.
export const EXCLUDED_SPECS: ReadonlySet<string> = new Set([
  'wilkinsonDotPlot',
  'densityPlot',
  'stackedDensityPlot',
  'isotypeDotPlot',
  'pieChart',
]);
