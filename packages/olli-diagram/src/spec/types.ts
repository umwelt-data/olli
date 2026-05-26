// === Elements ===

export interface DiagramElement {
  id: string;
  /** Short display name — the identity of the element (e.g., "Adapter"). Becomes `displayName` on the hyperedge. */
  label: string;
  /** Explanatory text — what the element does or represents. Appended after label in screen reader output. */
  description?: string;
  kind?: string;
  connector?: boolean;
}

// === Relations ===

export type DiagramRelation =
  | ConnectionRelation
  | ContainmentRelation
  | AlignmentRelation
  | DistributionRelation
  | GroupingRelation;

export interface ConnectionRelation {
  kind: 'connection';
  id: string;
  endpoints: [string, string];
  directed?: boolean;
  /** Overrides the auto-generated display name for this connection. */
  label?: string;
  semantic?: string;
}

export interface ContainmentRelation {
  kind: 'containment';
  id: string;
  container: string;
  contents: string[];
  label?: string;
}

export interface AlignmentRelation {
  kind: 'alignment';
  id: string;
  members: string[];
  axis: 'horizontal' | 'vertical' | 'both';
  label?: string;
}

export interface DistributionRelation {
  kind: 'distribution';
  id: string;
  members: string[];
  direction: 'horizontal' | 'vertical';
  label?: string;
}

export interface GroupingRelation {
  kind: 'grouping';
  id: string;
  members: string[];
  /** Short display name for the group (e.g., "Input"). Becomes `displayName` on the hyperedge. */
  label?: string;
  /** Explanatory text — the group's purpose. Appended after label in screen reader output. */
  description?: string;
}

// === Spec ===

export interface DiagramSpec {
  elements: DiagramElement[];
  relations: DiagramRelation[];
  /** Short display name for the diagram root (e.g., "Olli architecture"). */
  title?: string;
  /** Explanatory text for the diagram root. Appended after title in screen reader output. */
  description?: string;
}

// === Payload ===

export interface DiagramPayload {
  sourceRelation?: DiagramRelation;
  sourceElement?: DiagramElement;
}
