/**
 * Corpus-driven regression test over every vega-lite example under
 * examples/vl-specs/, using the committed OlliSpec fixtures in
 * test/fixtures/olli-specs/ (produced by `npm run gen-fixtures`).
 *
 * Each fixture drives three checks:
 *   1. olliSpecToTree builds a non-empty tree without throwing.
 *   2. Every node gets a non-empty customized description (what the
 *      tree renderer writes into each <span>). Description *wording* is
 *      intentionally not snapshotted — only structure — so copy tweaks
 *      don't churn the baseline.
 *   3. A normalized tree-shape snapshot matches the committed baseline.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { elaborateSpec } from '../../src/util/elaborate';
import { olliSpecToTree } from '../../src/Structure';
import { getCustomizedDescription } from '../../src/Customization';
import type { ElaboratedOlliNode } from '../../src/Structure/Types';
import type { OlliSpec, UnitOlliSpec } from '../../src/Types';
import { EXCLUDED_SPECS } from '../fixtures/excluded';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/olli-specs');
const VL_SPECS_DIR = path.resolve(__dirname, '../../../../examples/vl-specs');

// Rehydrate temporal fields: the generator serialized Date → ISO string,
// so before exercising Structure we convert back into Date objects.
const rehydrateUnit = (unit: UnitOlliSpec): UnitOlliSpec => {
  const temporal = (unit.fields ?? [])
    .filter((f) => f.type === 'temporal')
    .map((f) => f.field);
  if (!temporal.length) return unit;
  unit.data.forEach((datum) => {
    for (const field of temporal) {
      const v = datum[field];
      if (typeof v === 'string') datum[field] = new Date(v);
    }
  });
  return unit;
};

const loadFixture = (name: string): OlliSpec => {
  const raw = JSON.parse(readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8')) as OlliSpec;
  if ('units' in raw) {
    raw.units.forEach(rehydrateUnit);
  } else {
    rehydrateUnit(raw);
  }
  return raw;
};

// Strip ids + descriptions + parent refs; keep only the structural fingerprint
// so snapshots don't rot when Math.random changes or wording is tweaked.
const summarize = (node: ElaboratedOlliNode): unknown => ({
  nodeType: node.nodeType,
  level: node.level,
  viewType: node.viewType ?? null,
  groupby: node.groupby ?? null,
  hasPredicate: node.predicate !== undefined,
  childCount: node.children.length,
  children: node.children.map(summarize),
});

const walk = (node: ElaboratedOlliNode, fn: (n: ElaboratedOlliNode) => void) => {
  fn(node);
  node.children.forEach((c) => walk(c, fn));
};

const fixtureNames = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => path.basename(f, '.json'))
  .sort();

describe('OlliSpec corpus (all VL examples)', () => {
  it('covers every non-excluded example', () => {
    const vlNames = readdirSync(VL_SPECS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.basename(f, '.json'))
      .filter((n) => !EXCLUDED_SPECS.has(n))
      .sort();
    // Every example (minus exclusions) must have a committed fixture so
    // nobody silently drops coverage when adding new specs.
    expect(fixtureNames).toEqual(vlNames);
  });

  describe.each(fixtureNames)('%s', (name) => {
    it('builds a non-empty tree', () => {
      const spec = loadFixture(name);
      const tree = olliSpecToTree(elaborateSpec(spec));
      expect(tree).toBeDefined();
      expect(tree.children.length + 1).toBeGreaterThan(0);
    });

    it('produces a non-empty customized description for every node', () => {
      const spec = loadFixture(name);
      const tree = olliSpecToTree(elaborateSpec(spec));
      walk(tree, (node) => {
        const text = getCustomizedDescription(node).trim();
        // "." is the empty fallback — require at least one real token.
        expect(text.length).toBeGreaterThan(1);
      });
    });

    it('matches the normalized tree-shape snapshot', () => {
      const spec = loadFixture(name);
      const tree = olliSpecToTree(elaborateSpec(spec));
      expect(summarize(tree)).toMatchSnapshot();
    });
  });
});
