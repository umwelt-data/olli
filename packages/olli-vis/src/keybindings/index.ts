import type { KeybindingContribution } from 'olli-core';
import type { VisPayload } from '../spec/types.js';

function jumpToNodeType(
  nodeType: string,
): KeybindingContribution<VisPayload> {
  const label = nodeType === 'xAxis' ? 'Jump to X axis'
    : nodeType === 'yAxis' ? 'Jump to Y axis'
    : 'Jump to legend';
  return {
    key: nodeType === 'xAxis' ? 'x' : nodeType === 'yAxis' ? 'y' : 'l',
    label,
    group: 'Jump to section',
    handler: (runtime) => {
      const graph = runtime.hypergraph();
      for (const [, edge] of graph.edges) {
        if (edge.payload?.nodeType === nodeType) {
          const navTree = runtime.navTree();
          for (const [navId, node] of navTree.byNavId) {
            if (node.hyperedgeId === edge.id) {
              runtime.focus(navId);
              return true;
            }
          }
        }
      }
      return false;
    },
  };
}

export function visKeybindings(): KeybindingContribution<VisPayload>[] {
  return [
    jumpToNodeType('xAxis'),
    jumpToNodeType('yAxis'),
    jumpToNodeType('legend'),
  ];
}
