/**
 * Run: `npm run gen-fixtures` (from packages/core).
 *
 * Consumes vega-lite specs from the shared examples/vl-specs/ directory,
 * runs them through VegaLiteAdapter, and writes the resulting OlliSpec
 * JSON into test/fixtures/olli-specs/. The committed fixtures let the
 * core test suite run without loading the adapter package — and give the
 * adapter package its own stable comparison point later.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TopLevelSpec } from 'vega-lite';
import { VegaLiteAdapter } from '../../adapters/src/VegaLiteAdapter';
import { EXCLUDED_SPECS } from '../test/fixtures/excluded';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VL_SPECS_DIR = path.resolve(__dirname, '../../../examples/vl-specs');
const OUT_DIR = path.resolve(__dirname, '../test/fixtures/olli-specs');

// Dates become ISO strings in JSON; preserve that when re-reading.
const replacer = (_key: string, value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  return value;
};

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(VL_SPECS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const skipped: string[] = [];
  const failed: { name: string; error: string }[] = [];
  const written: string[] = [];

  for (const file of files) {
    const name = path.basename(file, '.json');
    if (EXCLUDED_SPECS.has(name)) {
      skipped.push(name);
      continue;
    }

    const specPath = path.join(VL_SPECS_DIR, file);
    const spec = JSON.parse(readFileSync(specPath, 'utf-8')) as TopLevelSpec;

    try {
      const olliSpec = await VegaLiteAdapter(spec);
      const outPath = path.join(OUT_DIR, `${name}.json`);
      writeFileSync(outPath, JSON.stringify(olliSpec, replacer, 2) + '\n', 'utf-8');
      written.push(name);
    } catch (err) {
      failed.push({ name, error: (err as Error).message ?? String(err) });
    }
  }

  console.log(`wrote ${written.length} fixtures to ${path.relative(process.cwd(), OUT_DIR)}`);
  if (skipped.length) console.log(`skipped (excluded): ${skipped.join(', ')}`);
  if (failed.length) {
    console.error(`failed: ${failed.length}`);
    for (const f of failed) console.error(`  ${f.name}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
