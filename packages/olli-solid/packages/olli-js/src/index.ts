export { olli } from './olli.js';
export { olliVis } from './olliVis.js';
export { olliDiagram } from './olliDiagram.js';
export { type OlliHandle, type OlliOptions } from './handle.js';
export { bridgeSignal } from './bridge.js';

// Re-export adapters
export { VegaAdapter, VegaLiteAdapter, ObservablePlotAdapter, type VisAdapter } from 'olli-adapters';

// Re-export core types
export type {
  NavNodeId,
  Selection,
  Customization,
  HyperedgeId,
  Hyperedge,
  Hypergraph,
} from 'olli-core';

// Re-export vis spec types
export type {
  OlliVisSpec,
  UnitOlliVisSpec,
  MultiOlliVisSpec,
  OlliNode,
  OlliFieldDef,
  OlliAxis,
  OlliLegend,
  OlliGuide,
  OlliMark,
  OlliDataset,
  OlliDatum,
  OlliValue,
  MeasureType,
  VisPayload,
} from 'olli-vis';

// Re-export diagram spec types
export type { DiagramSpec, DiagramPayload } from 'olli-diagram';
