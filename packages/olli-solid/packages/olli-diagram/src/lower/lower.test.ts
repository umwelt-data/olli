import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { diagramDomain } from '../domain.js';
import { pulleyMedium } from '../examples/pulleyMedium.js';
import { lowerDiagramSpec } from './lower.js';

describe('lowerDiagramSpec + pulleyMedium', () => {
  it('lowers the pulley spec to a valid hypergraph', () => {
    const g = lowerDiagramSpec(pulleyMedium);
    expect(g.roots).toEqual(['0']);
    expect(g.edges.size).toBe(pulleyMedium.edges.length);
    for (const authored of pulleyMedium.edges) {
      const found = g.edges.get(authored.id);
      expect(found).toBeDefined();
      expect(found!.displayName).toBe(authored.displayName);
      expect(found!.parents).toEqual(authored.parents);
      expect(found!.children).toEqual(authored.children);
    }
  });

  it('has the expected multi-parent structure (Floor has 3 parents)', () => {
    const g = lowerDiagramSpec(pulleyMedium);
    const floor = g.edges.get('7')!;
    expect(floor.parents).toEqual(['0', '24', '25']);

    // Spot-check two other multi-parent edges from the spec.
    expect(g.edges.get('4')!.parents).toEqual(['0', '18']); // Box B1
    expect(g.edges.get('13')!.parents).toEqual(['1', '21']); // Rope r
  });

  it('diagramDomain.toHypergraph registers cleanly on a runtime', () => {
    createRoot((dispose) => {
      const g = diagramDomain.toHypergraph(pulleyMedium);
      const rt = createNavigationRuntime(g);
      registerDomain(rt, diagramDomain);
      // No tokens/keybindings/dialogs registered by diagram.
      expect(rt.tokens.all().map((t) => t.name)).toEqual(
        expect.arrayContaining(['name', 'index', 'parent', 'children']),
      );
      expect(rt.keybindings.list().length).toBe(0);
      expect(rt.dialogs.list().length).toBe(0);
      dispose();
    });
  });
});
