#!/usr/bin/env node
// Enforces the layer rules from plan/01-architecture.md §3.
// Walks every .ts/.tsx file in each workspace package and fails if it imports
// a workspace package that is above its own layer.

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..');
const packagesDir = join(workspaceRoot, 'packages');

// Higher number = higher layer. A package may only import packages with <= its layer.
const LAYERS = {
  'olli-core': 0,
  'olli-render-solid': 1,
  'olli-vis': 2,
  'olli-diagram': 2,
  'olli-adapters': 3,
  'olli-js': 4,
};

// Explicit allowlists so we don't accidentally let a peer-layer import slip by.
// A package is allowed to import any package with layer < its own layer.
function isAllowed(fromPkg, toPkg) {
  if (!(fromPkg in LAYERS) || !(toPkg in LAYERS)) return true;
  return LAYERS[toPkg] < LAYERS[fromPkg];
}

const IMPORT_RE = /(?:^|\s)(?:import|export)[^'"`]*?from\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\s)import\s+['"]([^'"]+)['"]/g;

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

async function pathExists(p) {
  try { await stat(p); return true; } catch { return false; }
}

let violations = [];

for (const pkgName of Object.keys(LAYERS)) {
  const pkgSrc = join(packagesDir, pkgName, 'src');
  if (!(await pathExists(pkgSrc))) continue;
  const files = await walk(pkgSrc);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const re of [IMPORT_RE, BARE_IMPORT_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(source))) {
        const spec = m[1];
        // ignore relative and type-only builtins; only check workspace imports by name
        if (spec.startsWith('.') || spec.startsWith('node:')) continue;
        // trim subpath imports
        const top = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!(top in LAYERS)) continue;
        if (!isAllowed(pkgName, top)) {
          violations.push({
            from: pkgName,
            to: top,
            file: relative(workspaceRoot, file),
          });
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Import boundary violations:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.from} -> ${v.to} (layer ${LAYERS[v.from]} -> ${LAYERS[v.to]})`);
  }
  process.exit(1);
}

console.log('Import boundaries OK.');
