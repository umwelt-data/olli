// === Elements ===

export interface DiagramElement {
  id: string;
  label: string;
  kind?: string;
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
  label?: string;
}

// === Spec ===

export interface DiagramSpec {
  elements: DiagramElement[];
  relations: DiagramRelation[];
  title?: string;
  description?: string;
}

// === Payload ===

export interface DiagramPayload {
  sourceRelation?: DiagramRelation;
  sourceElement?: DiagramElement;
}
