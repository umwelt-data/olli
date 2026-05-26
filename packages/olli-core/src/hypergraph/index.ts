export type { HyperedgeId, Hyperedge, Hypergraph } from './types.js';
export { buildHypergraph, HypergraphValidationError } from './build.js';
export { descendants, ancestors, neighbors, isLeaf } from './traversal.js';
export { generateStableId } from './ids.js';
