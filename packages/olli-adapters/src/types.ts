import type { OlliVisSpec } from 'olli-vis';
import type { DiagramSpec } from 'olli-diagram';

export type VisAdapter<T> = (spec: T) => Promise<OlliVisSpec>;

export type DiagramAdapter<T> = (spec: T) => DiagramSpec;
