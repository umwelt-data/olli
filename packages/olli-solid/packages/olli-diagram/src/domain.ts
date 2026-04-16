import type { OlliDomain } from 'olli-core';
import { lowerDiagramSpec } from './lower/lower.js';
import type { DiagramPayload, DiagramSpec } from './spec/types.js';

export const diagramDomain: OlliDomain<DiagramSpec, DiagramPayload> = {
  name: 'diagram',
  toHypergraph: lowerDiagramSpec,
};
