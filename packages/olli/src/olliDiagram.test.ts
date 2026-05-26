import { describe, it, expect, afterEach } from 'vitest';
import { olliDiagram } from './olliDiagram.js';
import type { OlliHandle } from './handle.js';
import type { DiagramSpec } from 'olli-diagram';

const spec: DiagramSpec = {
  title: 'Test System',
  elements: [
    { id: 'a', label: 'Component A' },
    { id: 'b', label: 'Component B' },
    { id: 'shared', label: 'Shared Resource' },
  ],
  relations: [
    { kind: 'grouping', id: 'gA', members: ['a', 'shared'], label: 'Group A' },
    { kind: 'grouping', id: 'gB', members: ['b', 'shared'], label: 'Group B' },
  ],
};

let handle: OlliHandle | undefined;
let container: HTMLElement;

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  container?.remove();
});

function setup() {
  container = document.createElement('div');
  document.body.appendChild(container);
  handle = olliDiagram(spec, container);
  return handle;
}

describe('olliDiagram', () => {
  it('mounts and renders a tree view', () => {
    const h = setup();
    const tree = container.querySelector('[role="tree"]');
    expect(tree).not.toBeNull();
    expect(h.getFocusedNavId()).toBeTruthy();
  });

  it('getDescription returns a string', () => {
    const h = setup();
    const desc = h.getDescription(h.getFocusedNavId());
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('destroy removes DOM content', () => {
    const h = setup();
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    h.destroy();
    handle = undefined;
    expect(container.querySelector('[role="tree"]')).toBeNull();
  });

  it('focus and getFocusedNavId work', () => {
    const h = setup();
    const rootId = h.getFocusedNavId();
    expect(rootId).toContain('root');
  });
});
