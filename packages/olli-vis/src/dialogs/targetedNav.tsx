import { For, createSignal } from 'solid-js';
import type { DialogContribution, NavigationRuntime, NavNode } from 'olli-core';
import type { VisPayload } from '../spec/types.js';

export function targetedNavDialog(): DialogContribution<VisPayload> {
  return {
    id: 'targetedNav',
    triggerKey: 'r',
    render: (runtime: NavigationRuntime<VisPayload>, _navNode: NavNode) => {
      const tree = runtime.navTree();
      const roots = tree.roots;

      const [selectedNavId, setSelectedNavId] = createSignal(roots[0] ?? '');

      const childrenOf = (navId: string): string[] => {
        const node = tree.byNavId.get(navId);
        return node?.childNavIds ?? [];
      };

      const labelOf = (navId: string): string => {
        return runtime.getDescriptionFor(navId)();
      };

      const buildSelectors = (parentNavId: string): any => {
        const kids = childrenOf(parentNavId);
        if (kids.length === 0) return null;

        const [chosen, setChosen] = createSignal(kids[0] ?? '');

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
            {childrenOf(chosen()).length > 0 && buildSelectors(chosen())}
          </div>
        );
      };

      const goToSelected = () => {
        const navId = selectedNavId();
        if (navId) {
          runtime.focus(navId);
        }
      };

      return (
        <div class="olli-targeted-nav-dialog">
          <h2 id="olli-dialog-title">Targeted Navigation</h2>
          <p>Jump to a location in this chart.</p>
          {roots.length > 0 && buildSelectors(roots[0]!)}
          <button onClick={goToSelected}>Ok</button>
        </div>
      );
    },
  };
}
