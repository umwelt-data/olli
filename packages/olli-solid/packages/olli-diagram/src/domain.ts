import type { OlliDomain } from 'olli-core';
import { lowerDiagramSpec } from './lower/lower.js';
import { diagramPredicateProvider } from './predicates.js';
import type { DiagramPayload, DiagramSpec } from './spec/types.js';
import { elementKindToken } from './tokens/elementKind.js';

export const diagramDomain: OlliDomain<DiagramSpec, DiagramPayload> = {
  name: 'diagram',
  toHypergraph: lowerDiagramSpec,
  tokens: [elementKindToken],
  predicateProviders: [diagramPredicateProvider()],
};
