import type { Hyperedge } from 'olli-core';

/**
 * Payload for diagram-domain hyperedges. Currently empty; reserved for future
 * diagram-specific metadata (e.g., coordinate references, semantic tags).
 */
export interface DiagramPayload {
  readonly _?: never;
}

/**
 * Authoring surface for the diagram domain. At Phase 4 this is a direct list
 * of hyperedges; richer surfaces (declarative composition) can layer on later.
 */
export interface DiagramSpec {
  edges: Hyperedge<DiagramPayload>[];
}
