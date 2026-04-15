/**
 * Adapter-side corpus regression: runs every VL spec in examples/vl-specs/
 * through VegaLiteAdapter and compares the serialized OlliSpec to the
 * committed fixture in packages/core/test/fixtures/olli-specs/.
 *
 * This is the contract boundary between the adapter and core tests — if
 * this file's assertions and the core corpus both pass, both packages
 * agree on what the adapter produces today.
 *
 * When the adapter's behavior changes intentionally, regenerate with
 * `npm run gen-fixtures` in packages/core and commit the diff.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TopLevelSpec } from 'vega-lite';
import { VegaLiteAdapter } from '../../src/VegaLiteAdapter';
import { EXCLUDED_SPECS } from '../../../core/test/fixtures/excluded';

const VL_SPECS_DIR = path.resolve(__dirname, '../../../../examples/vl-specs');
const FIXTURES_DIR = path.resolve(__dirname, '../../../core/test/fixtures/olli-specs');

// Matches the replacer used by scripts/gen-fixtures.ts.
const replacer = (_key: string, value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  return value;
};

const fixtureNames = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => path.basename(f, '.json'))
  .sort();

describe('VegaLiteAdapter corpus', () => {
  it('covers every non-excluded example', () => {
    const vlNames = readdirSync(VL_SPECS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.basename(f, '.json'))
      .filter((n) => !EXCLUDED_SPECS.has(n))
      .sort();
    expect(fixtureNames).toEqual(vlNames);
  });

  describe.each(fixtureNames)('%s', (name) => {
    it('matches committed OlliSpec fixture', async () => {
      const vlSpec = JSON.parse(
        readFileSync(path.join(VL_SPECS_DIR, `${name}.json`), 'utf-8')
      ) as TopLevelSpec;

      const olliSpec = await VegaLiteAdapter(vlSpec);
      const actual = JSON.stringify(olliSpec, replacer, 2) + '\n';
      const expected = readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
      expect(actual).toBe(expected);
    });
  });
});
