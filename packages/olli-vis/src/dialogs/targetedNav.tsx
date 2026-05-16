import { For, createSignal } from 'solid-js';
import type { DialogContribution, DialogRenderResult, NavigationRuntime, NavNode } from 'olli-core';
import type { VisPayload } from '../spec/types.js';

export function targetedNavDialog(): DialogContribution<VisPayload> {
  return {
    id: 'targetedNav',
    label: 'targeted navigation',
    triggerKey: 'r',
    render: (runtime: NavigationRuntime<VisPayload>, navNode: NavNode): DialogRenderResult => {
      const tree = runtime.navTree();
      const roots = tree.roots;

      const childrenOf = (navId: string): string[] => {
        const node = tree.byNavId.get(navId);
        return node?.childNavIds ?? [];
      };

      // Build ancestor path from root down to the focused node
      const ancestorPath: string[] = [];
      let cur: string | null = navNode.navId;
      while (cur) {
        ancestorPath.unshift(cur);
        cur = tree.byNavId.get(cur)?.parentNavId ?? null;
      }

      const initialSelection = ancestorPath.length > 1 ? navNode.navId : (childrenOf(roots[0]!)[0] ?? navNode.navId);
      const [selectedNavId, setSelectedNavId] = createSignal(initialSelection);

      const labelOf = (navId: string): string => {
        return runtime.getDescriptionFor(navId)();
      };

      const buildSelectors = (parentNavId: string, depth: number): any => {
        const kids = childrenOf(parentNavId);
        if (kids.length === 0) return null;

        const initialChoice = ancestorPath[depth + 1] ?? kids[0] ?? '';
        const [chosen, setChosen] = createSignal(initialChoice);

        const handleChange = (navId: string) => {
          setChosen(navId);
          setSelectedNavId(navId);
        };

        return (
          <div class="olli-targeted-nav-level">
            <select
              value={chosen()}
              onChange={(e) => handleChange(e.currentTarget.value)}
            >
              <For each={kids}>
                {(kidId) => (
                  <option value={kidId}>{labelOf(kidId)}</option>
                )}
              </For>
            </select>
            {childrenOf(chosen()).length > 0 && buildSelectors(chosen(), depth + 1)}
          </div>
        );
      };

      const goToSelected = () => {
        const navId = selectedNavId();
        if (navId) {
          runtime.focus(navId);
        }
      };

      return {
        title: 'Targeted Navigation',
        description: 'Jump to a location in this chart.',
        content: (
          <div class="olli-targeted-nav-dialog">
            {roots.length > 0 && buildSelectors(roots[0]!, 0)}
          </div>
        ),
        onSubmit: goToSelected,
      };
    },
  };
}
