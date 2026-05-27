// Minimal DOM stubs so solid-js's client bundle can load in Node
const el = () => ({
  innerHTML: '',
  content: { firstChild: null, cloneNode: () => el() },
  addEventListener: () => {},
  firstChild: null,
  cloneNode: () => el(),
});
const doc = { createElement: () => el(), createTextNode: () => ({}), addEventListener: () => {} };
globalThis.window = { document: doc };
globalThis.document = doc;

import { existsSync } from 'fs';

const m = await import('./dist/index.js');
const a = await import('./dist/adapters.js');

for (const [name, keys] of [
  ['olli', ['olli', 'olliVis']],
  ['olli/adapters', ['VegaLiteAdapter', 'ObservablePlotAdapter']],
]) {
  const mod = name === 'olli' ? m : a;
  for (const k of keys) {
    if (typeof mod[k] !== 'function') {
      throw new Error(`${name}: export "${k}" is ${typeof mod[k]}, expected function`);
    }
  }
}

if (!existsSync('dist/styles.css')) {
  throw new Error('missing dist/styles.css');
}

console.log('Smoke test passed');
