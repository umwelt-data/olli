import type { OlliVisSpec } from 'olli-vis';

export type VisAdapter<T> = (spec: T) => Promise<OlliVisSpec>;
