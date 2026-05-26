import { For, Show, createSignal } from 'solid-js';
import type { DialogContribution, DialogRenderResult, NavigationRuntime, NavNode, FieldPredicate, FieldValue, Selection } from 'olli-core';
import type { VisPayload, OlliFieldDef } from '../spec/types.js';
import { getFieldDef, getDomain } from '../util/data.js';
import { serializeValue } from '../util/values.js';

interface Condition {
  field: string;
  op: string;
  value: string;
  value2: string;
}

function predicateToCondition(p: FieldPredicate): Condition {
  const field = p.field;
  if ('equal' in p) return { field, op: '=', value: String(p.equal), value2: '' };
  if ('lt' in p) return { field, op: '<', value: String(p.lt), value2: '' };
  if ('lte' in p) return { field, op: '<=', value: String(p.lte), value2: '' };
  if ('gt' in p) return { field, op: '>', value: String(p.gt), value2: '' };
  if ('gte' in p) return { field, op: '>=', value: String(p.gte), value2: '' };
  if ('range' in p) return { field, op: 'between', value: String(p.range[0]), value2: String(p.range[1]) };
  return { field, op: '=', value: '', value2: '' };
}

function selectionToConditions(sel: Selection): Condition[] {
  if ('and' in sel) return sel.and.filter((p): p is FieldPredicate => 'field' in p).map(predicateToCondition);
  if ('field' in sel) return [predicateToCondition(sel as FieldPredicate)];
  return [];
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
    label: 'filter menu',
    triggerKey: 'f',
    render: (runtime: NavigationRuntime<VisPayload>, navNode: NavNode): DialogRenderResult => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      if (!edge?.payload) return { title: 'Filter Menu', content: null };

      const spec = edge.payload.spec;
      const fields = spec.fields ?? [];
      const [conditions, setConditions] = createSignal<Condition[]>(selectionToConditions(runtime.selection()));

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

      return {
        title: 'Filter Menu',
        description: 'Define a custom filter.',
        content: (
          <div class="olli-filter-dialog">
            <div role="status">{conditions().length} condition{conditions().length !== 1 ? 's' : ''}</div>
            <button onClick={addCondition}>Add condition</button>
            <div>
              <For each={conditions()}>
                {(cond, i) => {
                  const ops = () => opsForField(cond.field);
                  const fd = () => getFieldDef(cond.field, fields);
                  const isNominal = () => fd().type === 'nominal' || fd().type === 'ordinal';
                  const domain = () => isNominal() && cond.op === '=' ? getDomain(fd(), spec.data) : [];
                  const inputType = () => {
                    const f = fd();
                    if (f.type !== 'temporal') return 'number';
                    if (f.timeUnit && /hours|minutes|seconds/.test(f.timeUnit)) return 'datetime-local';
                    if (f.timeUnit) return 'date';
                    const vals = getDomain(f, spec.data);
                    const hasTime = vals.some((v) => v instanceof Date && (v.getHours() !== 0 || v.getMinutes() !== 0 || v.getSeconds() !== 0));
                    return hasTime ? 'datetime-local' : 'date';
                  };
                  const bounds = () => {
                    const f = fd();
                    if (f.type !== 'quantitative' && f.type !== 'temporal') return { min: undefined, max: undefined };
                    const vals = getDomain(f, spec.data);
                    if (vals.length === 0) return { min: undefined, max: undefined };
                    const lo = vals[0]!;
                    const hi = vals[vals.length - 1]!;
                    if (f.type === 'temporal') {
                      const len = inputType() === 'date' ? 10 : 16;
                      const fmt = (v: unknown) => v instanceof Date ? v.toISOString().slice(0, len) : String(v);
                      return { min: fmt(lo), max: fmt(hi) };
                    }
                    return { min: String(lo), max: String(hi) };
                  };

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
                            min={bounds().min}
                            max={bounds().max}
                            value={cond.value}
                            onInput={(e) => updateCondition(i(), { value: e.currentTarget.value })}
                          />
                          <input
                            type={inputType()}
                            min={bounds().min}
                            max={bounds().max}
                            value={cond.value2}
                            onInput={(e) => updateCondition(i(), { value2: e.currentTarget.value })}
                          />
                        </>
                      ) : (
                        <input
                          type={inputType()}
                          min={bounds().min}
                          max={bounds().max}
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
            <Show when={conditions().length > 0}>
              <button onClick={clearFilter}>Clear conditions</button>
            </Show>
          </div>
        ),
        onSubmit: applyFilter,
      };
    },
  };
}
