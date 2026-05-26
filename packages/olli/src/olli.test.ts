import { describe, it, expect, afterEach } from 'vitest';
import { olli } from './olli.js';
import { buildHypergraph } from 'olli-core';
import type { OlliHandle } from './handle.js';

const graph = buildHypergraph([
  { id: 'root', displayName: 'Root', children: ['a', 'b'], parents: [] },
  { id: 'a', displayName: 'Node A', children: [], parents: ['root'] },
  { id: 'b', displayName: 'Node B', children: [], parents: ['root'] },
]);

let handle: OlliHandle | undefined;
let container: HTMLElement;

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  container?.remove();
});

describe('olli (domain-agnostic)', () => {
  it('mounts a raw hypergraph and renders a tree view', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    handle = olli(graph, container);

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    expect(handle.getFocusedNavId()).toBeTruthy();
  });

  it('getDescription returns generic descriptions', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    handle = olli(graph, container);

    const desc = handle.getDescription(handle.getFocusedNavId());
    expect(desc).toContain('Root');
  });

  it('destroy clears the DOM', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    handle = olli(graph, container);

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    handle.destroy();
    handle = undefined;
    expect(container.querySelector('[role="tree"]')).toBeNull();
  });
});
