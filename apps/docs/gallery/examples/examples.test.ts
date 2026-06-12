import { describe, it, expect } from 'vitest';
import { examples } from './index.js';
import { galleryGroups } from './groups.js';

// groups.ts drives sidebar navigation and route generation; index.ts drives
// rendering. An example registered in one but not the other is a broken page
// or a missing nav entry.
describe('gallery example registration', () => {
  const groupItems = galleryGroups.flatMap((g) => g.items);

  it('every example in index.ts has a groups.ts entry', () => {
    const groupIds = new Set(groupItems.map((i) => i.id));
    const missing = examples.filter((e) => !groupIds.has(e.id)).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('every groups.ts entry has an example in index.ts', () => {
    const exampleIds = new Set(examples.map((e) => e.id));
    const missing = groupItems.filter((i) => !exampleIds.has(i.id)).map((i) => i.id);
    expect(missing).toEqual([]);
  });

  it('titles match between index.ts and groups.ts', () => {
    const titleById = new Map(examples.map((e) => [e.id, e.title]));
    const mismatched = groupItems
      .filter((i) => titleById.has(i.id) && titleById.get(i.id) !== i.title)
      .map((i) => `${i.id}: "${titleById.get(i.id)}" vs "${i.title}"`);
    expect(mismatched).toEqual([]);
  });

  it('has no duplicate ids', () => {
    const ids = examples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
