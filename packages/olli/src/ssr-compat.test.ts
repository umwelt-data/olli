// @vitest-environment node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

describe('olli/adapters SSR compatibility', () => {
  it('does not import from solid-js/web', () => {
    const content = readFileSync(resolve(distDir, 'adapters.js'), 'utf8');
    expect(content).not.toMatch(/from ['"]solid-js\/web['"]/);
  });

  it('does not import from solid-js', () => {
    const content = readFileSync(resolve(distDir, 'adapters.js'), 'utf8');
    expect(content).not.toMatch(/from ['"]solid-js['"]/);
    expect(content).not.toMatch(/import ['"]solid-js['"]/);
  });
});
