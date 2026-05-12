import { For } from 'solid-js';
import type { DialogContribution, NavigationRuntime, NavNode } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { VisPayload } from '../spec/types.js';
import { fmtValue } from '../util/values.js';
import { getFieldDef } from '../util/data.js';
import { predicateToDescription } from '../lower/describe.js';

export function tableDialog(): DialogContribution<VisPayload> {
  return {
    id: 'table',
    applicableRoles: ['filteredData', 'other'],
    triggerKey: 't',
    render: (runtime: NavigationRuntime<VisPayload>, navNode: NavNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      if (!edge?.payload) return null;

      const spec = edge.payload.spec;
      const fields = spec.fields ?? [];
      const fullPred = runtime.fullPredicate(navNode.navId);
      const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
      const rows = selectionTest(data, fullPred);
      const title = predicateToDescription(fullPred, fields);

      return (
        <div class="olli-table-dialog">
          <h2 id="olli-dialog-title">Table View</h2>
          <p>{title}</p>
          <table>
            <thead>
              <tr>
                <For each={fields}>
                  {(fd) => <th scope="col">{fd.label ?? fd.field}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={rows}>
                {(row) => (
                  <tr>
                    <For each={fields}>
                      {(fd) => {
                        const val = row[fd.field];
                        return <td>{val !== undefined ? fmtValue(val, fd) : ''}</td>;
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      );
    },
  };
}
