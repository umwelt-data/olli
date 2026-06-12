#!/usr/bin/env node
// Runs the VegaLiteAdapter against every example spec in a vega-lite checkout
// and classifies the result, so adapter changes can be diffed against a saved
// baseline. Not run in CI; see --help.
//
// Usage:
//   node scripts/vl-coverage.mjs [--specs <dir>] [--filter <regex>] [--json]
//                                [--save-baseline <file>] [--baseline <file>]
//
// Requires built dists: pnpm --filter olli-vis --filter olli-adapters build

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..');

// --- CLI args ---

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
if (args.includes('--help')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const specsDir = argValue('--specs') ?? join(workspaceRoot, '..', 'vega-lite', 'examples', 'specs');
const filter = argValue('--filter') ? new RegExp(argValue('--filter')) : null;
const saveBaselinePath = argValue('--save-baseline');
const baselinePath = argValue('--baseline');
const jsonOutput = args.includes('--json');

if (!existsSync(specsDir)) {
  console.error(`Specs directory not found: ${specsDir}\nPass --specs <dir> pointing at a vega-lite checkout's examples/specs.`);
  process.exit(1);
}

// --- Offline data resolution ---
// Specs reference data as relative "data/<file>" urls (plus a couple of absolute
// CDN urls to the same files). Serve them from the vega-datasets package; fall
// back to a disk-cached network fetch for anything else.

const datasetsDir = join(workspaceRoot, 'node_modules', 'vega-datasets', 'data');
const cacheDir = join(workspaceRoot, 'node_modules', '.cache', 'olli-vl-coverage');
const realFetch = globalThis.fetch;

globalThis.fetch = async (url) => {
  const u = String(url);
  const dataMatch = u.match(/(?:^|\/)data\/([^/?#]+)$/);
  if (dataMatch) {
    const local = join(datasetsDir, dataMatch[1]);
    if (existsSync(local)) {
      return new Response(readFileSync(local));
    }
  }
  const cacheFile = join(cacheDir, createHash('sha256').update(u).digest('hex'));
  if (existsSync(cacheFile)) {
    return new Response(readFileSync(cacheFile));
  }
  const res = await realFetch(u);
  const text = await res.text();
  if (res.ok) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cacheFile, text);
  }
  return new Response(text, { status: res.status });
};

// --- Load the built adapter ---

const adapterDist = join(workspaceRoot, 'packages', 'olli-adapters', 'dist', 'index.js');
if (!existsSync(adapterDist)) {
  console.error('Built adapter not found. Run: pnpm --filter olli-vis --filter olli-adapters build');
  process.exit(1);
}
const { VegaLiteAdapter } = await import(adapterDist);

// --- Classification ---

const TIMEOUT_MS = 20000;
const CATEGORY_RANK = { crash: 0, 'empty-output': 1, 'zero-data-rows': 2, ok: 3 };

function unitSkeleton(unit) {
  return {
    mark: unit.mark,
    facet: unit.facet,
    fields: unit.fields?.map((f) => ({ field: f.field, type: f.type })),
    axes: unit.axes?.map((a) => ({ axisType: a.axisType, field: a.field })),
    legends: unit.legends?.map((l) => ({ channel: l.channel, field: l.field })),
    rows: unit.data?.length ?? 0,
  };
}

function skeleton(spec) {
  if ('operator' in spec) {
    return { operator: spec.operator, units: spec.units.map(unitSkeleton) };
  }
  return { units: [unitSkeleton(spec)] };
}

function isEmptyUnit(unit) {
  return !unit.fields?.length && !unit.axes?.length && !unit.legends?.length;
}

async function runSpec(spec) {
  let timer;
  const out = await Promise.race([
    VegaLiteAdapter(spec),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));

  const units = 'operator' in out ? out.units : [out];
  let category = 'ok';
  if (!units.length || units.every(isEmptyUnit)) {
    category = 'empty-output';
  } else if (units.some((u) => !u.data?.length)) {
    category = 'zero-data-rows';
  }
  return { category, skeleton: skeleton(out) };
}

// --- Run all specs ---

const files = readdirSync(specsDir)
  .filter((f) => f.endsWith('.vl.json'))
  .filter((f) => !filter || filter.test(f))
  .sort();

const results = {};
const noop = () => {};
for (const file of files) {
  const spec = JSON.parse(readFileSync(join(specsDir, file), 'utf8'));
  const muted = { warn: console.warn, error: console.error };
  console.warn = noop;
  console.error = noop;
  try {
    results[file] = await runSpec(spec);
  } catch (e) {
    results[file] = { category: 'crash', error: String(e?.message ?? e).slice(0, 200) };
  } finally {
    console.warn = muted.warn;
    console.error = muted.error;
  }
}

// --- Report ---

const counts = {};
for (const r of Object.values(results)) {
  counts[r.category] = (counts[r.category] ?? 0) + 1;
}

if (jsonOutput) {
  console.log(JSON.stringify({ specsDir, counts, results }, null, 2));
} else {
  console.log(`Ran ${files.length} specs from ${specsDir}\n`);
  for (const cat of ['ok', 'zero-data-rows', 'empty-output', 'crash']) {
    console.log(`  ${cat}: ${counts[cat] ?? 0}`);
  }
  for (const cat of ['crash', 'empty-output', 'zero-data-rows']) {
    const names = Object.keys(results).filter((f) => results[f].category === cat);
    if (names.length) {
      console.log(`\n${cat}:`);
      for (const f of names) {
        console.log(`  ${f}${results[f].error ? `  (${results[f].error})` : ''}`);
      }
    }
  }
}

if (saveBaselinePath) {
  writeFileSync(saveBaselinePath, JSON.stringify({ generatedAt: new Date().toISOString(), specsDir, results }, null, 2) + '\n');
  console.log(`\nBaseline saved to ${saveBaselinePath}`);
}

// --- Baseline diff ---

if (baselinePath) {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const regressions = [];
  const improvements = [];
  let unchanged = 0;

  for (const [file, prev] of Object.entries(baseline.results)) {
    const cur = results[file];
    if (!cur) continue; // spec removed or filtered out
    const prevRank = CATEGORY_RANK[prev.category];
    const curRank = CATEGORY_RANK[cur.category];
    if (curRank < prevRank) {
      regressions.push(`${file}: ${prev.category} -> ${cur.category}${cur.error ? ` (${cur.error})` : ''}`);
    } else if (curRank > prevRank) {
      improvements.push(`${file}: ${prev.category} -> ${cur.category}`);
    } else if (prev.category === 'ok' && JSON.stringify(prev.skeleton) !== JSON.stringify(cur.skeleton)) {
      regressions.push(`${file}: ok skeleton changed`);
    } else {
      unchanged++;
    }
  }

  console.log(`\n--- Diff vs ${baselinePath} ---`);
  console.log(`unchanged: ${unchanged}, improvements: ${improvements.length}, regressions: ${regressions.length}`);
  if (improvements.length) {
    console.log('\nImprovements:');
    for (const line of improvements) console.log(`  ${line}`);
  }
  if (regressions.length) {
    console.log('\nRegressions:');
    for (const line of regressions) console.log(`  ${line}`);
    process.exit(1);
  }
}
