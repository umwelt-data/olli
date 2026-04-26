export type {
  DiagramElement,
  DiagramRelation,
  ConnectionRelation,
  ContainmentRelation,
  AlignmentRelation,
  DistributionRelation,
  GroupingRelation,
  DiagramSpec,
  DiagramPayload,
} from './spec/types.js';
export { lowerDiagramSpec } from './lower/lower.js';
export { diagramPredicateProvider } from './predicates.js';
export { elementKindToken } from './tokens/elementKind.js';
export { diagramDomain } from './domain.js';
export { pulleySpec } from './examples/pulley.js';
