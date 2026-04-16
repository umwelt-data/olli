import type { HyperedgeId } from './types.js';

export function generateStableId(parentPath: readonly string[], index: number): HyperedgeId {
  const base = parentPath.length > 0 ? parentPath.join('/') + '/' : '';
  return `${base}${index}`;
}
