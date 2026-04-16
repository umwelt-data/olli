export type HyperedgeId = string;

export interface Hyperedge<P = unknown> {
  id: HyperedgeId;
  displayName: string;
  description?: string;
  role?: string;
  children: HyperedgeId[];
  parents: HyperedgeId[];
  payload?: P;
}

export interface Hypergraph<P = unknown> {
  edges: ReadonlyMap<HyperedgeId, Hyperedge<P>>;
  roots: readonly HyperedgeId[];
}
