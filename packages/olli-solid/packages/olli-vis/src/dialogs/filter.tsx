import { For, createSignal } from 'solid-js';
import type { DialogContribution, NavigationRuntime, NavNode, FieldPredicate, FieldValue } from 'olli-core';
import type { VisPayload, OlliFieldDef } from '../spec/types.js';
import { getFieldDef, getDomain } from '../util/data.js';
import { serializeValue } from '../util/values.js';

interface Condition {
  field: string;
  op: string;
  value: string;
  value2: string;
}

function conditionToPredicate(c: Condition, fields: OlliFieldDef[]): FieldPredicate | null {
  const fd = getFieldDef(c.field, fields);
  const serialize = (v: string): FieldValue => serializeValue(fd.type === 'temporal' ? new Date(v) : fd.type === 'quantitative' ? Number(v) : v, fd) as FieldValue;

  switch (c.op) {
    case '=': return { field: c.field, equal: serialize(c.value) };
    case '<': return { field: c.field, lt: serialize(c.value) };
    case '<=': return { field: c.field, lte: serialize(c.value) };
    case '>': return { field: c.field, gt: serialize(c.value) };
    case '>=': return { field: c.field, gte: serialize(c.value) };
    case 'between': return { field: c.field, range: [serialize(c.value), serialize(c.value2)] as [number, number] };
    default: return null;
  }
}

export function filterDialog(): DialogContribution<VisPayload> {
  return {
    id: 'filter',
    triggerKey: 'f',
    render: (runtime: NavigationRuntime<VisPayload>, navNode: NavNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      if (!edge?.payload) return null;

      const spec = edge.payload.spec;
      const fields = spec.fields ?? [];
      const [conditions, setConditions] = createSignal<Condition[]>([]);

      const opsForField = (fieldName: string): string[] => {
        const fd = getFieldDef(fieldName, fields);
        if (fd.type === 'quantitative' || fd.type === 'temporal') {
          return ['between', '<', '<=', '>', '>=', '='];
        }
        return ['='];
      };

      const addCondition = () => {
        const field = fields[0]?.field ?? '';
        setConditions((prev) => [...prev, { field, op: opsForField(field)[0]!, value: '', value2: '' }]);
      };

      const removeCondition = (idx: number) => {
        setConditions((prev) => prev.filter((_, i) => i !== idx));
      };

      const updateCondition = (idx: number, patch: Partial<Condition>) => {
        setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
      };

      const applyFilter = () => {
        const predicates = conditions()
          .map((c) => conditionToPredicate(c, fields))
          .filter((p): p is FieldPredicate => p !== null);
        if (predicates.length > 0) {
          runtime.setSelection({ and: predicates });
        }
      };

      const clearFilter = () => {
        setConditions([]);
        runtime.setSelection({ and: [] });
      };

      return (
        <div class="olli-filter-dialog">
          <h2 id="olli-dialog-title">Filter Menu</h2>
          <p>Define a custom filter.</p>
          <div role="status">{conditions().length} condition{conditions().length !== 1 ? 's' : ''}</div>
          <button onClick={addCondition}>Add condition</button>
          <div>
            <For each={conditions()}>
              {(cond, i) => {
                const ops = () => opsForField(cond.field);
                const fd = () => getFieldDef(cond.field, fields);
                const isNominal = () => fd().type === 'nominal' || fd().type === 'ordinal';
                const domain = () => isNominal() && cond.op === '=' ? getDomain(fd(), spec.data) : [];
                const inputType = () => fd().type === 'temporal' ? 'datetime-local' : 'number';

                return (
                  <div class="olli-filter-condition">
                    <select
                      value={cond.field}
                      onChange={(e) => {
                        const newField = e.currentTarget.value;
                        const newOps = opsForField(newField);
                        updateCondition(i(), { field: newField, op: newOps[0]!, value: '', value2: '' });
                      }}
                    >
                      <For each={fields}>
                        {(fd) => <option value={fd.field}>{fd.field}</option>}
                      </For>
                    </select>
                    <select
                      value={cond.op}
                      onChange={(e) => updateCondition(i(), { op: e.currentTarget.value, value: '', value2: '' })}
                    >
                      <For each={ops()}>
                        {(op) => <option value={op}>{op}</option>}
                      </For>
                    </select>
                    {isNominal() && cond.op === '=' ? (
                      <select
                        value={cond.value}
                        onChange={(e) => updateCondition(i(), { value: e.currentTarget.value })}
                      >
                        <For each={domain()}>
                          {(v) => <option value={String(v)}>{String(v)}</option>}
                        </For>
                      </select>
                    ) : cond.op === 'between' ? (
                      <>
                        <input
                          type={inputType()}
                          value={cond.value}
                          onInput={(e) => updateCondition(i(), { value: e.currentTarget.value })}
                        />
                        <input
                          type={inputType()}
                          value={cond.value2}
                          onInput={(e) => updateCondition(i(), { value2: e.currentTarget.value })}
                        />
                      </>
                    ) : (
                      <input
                        type={inputType()}
                        value={cond.value}
                        onInput={(e) => updateCondition(i(), { value: e.currentTarget.value })}
                      />
                    )}
                    <button onClick={() => removeCondition(i())}>Remove</button>
                  </div>
                );
              }}
            </For>
          </div>
          <button onClick={clearFilter}>Clear conditions</button>
          <button onClick={applyFilter}>Ok</button>
        </div>
      );
    },
  };
}
