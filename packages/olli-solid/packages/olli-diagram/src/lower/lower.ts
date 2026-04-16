import type { Hypergraph } from 'olli-core';
import { buildHypergraph } from 'olli-core';
import type { DiagramPayload, DiagramSpec } from '../spec/types.js';

export function lowerDiagramSpec(spec: DiagramSpec): Hypergraph<DiagramPayload> {
  return buildHypergraph(spec.edges);
}
