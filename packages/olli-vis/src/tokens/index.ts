import type { DescriptionToken, JoinHint, TokenContext } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { VisPayload, OlliNodeType, UnitOlliVisSpec, OlliValue } from '../spec/types.js';
import { getFieldDef, getDomain, getBins } from '../util/data.js';
import { fmtDataValue, wrapForMonospace, pluralize, averageValue, ordinalSuffix } from '../util/values.js';
import { predicateToDescription } from '../lower/describe.js';

type Ctx = TokenContext<VisPayload>;

function roles(...types: OlliNodeType[]): string[] {
  return types;
}

function getChartType(spec: UnitOlliVisSpec): string {
  if (!spec.mark) return 'dataset';
  if (spec.mark === 'point' && spec.axes?.length === 2) {
    const allQuant = spec.axes.every(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'quantitative',
    );
    if (allQuant) return 'scatterplot';
    const hasQuant = spec.axes.some(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'quantitative',
    );
    const noTemporal = !spec.axes.some(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'temporal',
    );
    if (hasQuant && noTemporal) return 'dotplot';
  }
  return `${spec.mark} chart`;
}

export function nameToken(): DescriptionToken<VisPayload> {
  return {
    name: 'name',
    applicableRoles: '*' as const,
    compute: (ctx: Ctx) => {
      if (ctx.navNode.kind === 'virtualParentContext') {
        return { short: 'Grouping', long: 'Grouping' };
      }
      const p = ctx.edge?.payload;
      if (!p) {
        if (!ctx.edge) return { short: '', long: '' };
        const short = ctx.edge.displayName;
        const long = ctx.edge.description ? `${ctx.edge.displayName}. ${ctx.edge.description}` : short;
        return { short, long };
      }
      const spec = p.spec;
      switch (p.nodeType) {
        case 'root': {
          const s = spec.description || spec.title || '';
          return { short: s, long: s };
        }
        case 'view': {
          if (p.predicate && 'equal' in p.predicate) {
            const fd = getFieldDef(p.predicate.field, spec.fields ?? []);
            const s = `titled ${fmtDataValue(p.predicate.equal as OlliValue, fd)}`;
            return { short: s, long: s, joinHint: 'clause' };
          }
          return { short: '', long: '' };
        }
        case 'xAxis':
        case 'yAxis':
        case 'legend':
        case 'guide': {
          const fd = getFieldDef(p.groupby!, spec.fields ?? []);
          const guide =
            spec.axes?.find((a) => a.field === p.groupby) ??
            spec.legends?.find((l) => l.field === p.groupby) ??
            spec.guides?.find((g) => g.field === p.groupby);
          const guideType =
            p.nodeType === 'xAxis' ? 'x-axis' :
            p.nodeType === 'yAxis' ? 'y-axis' :
            p.nodeType === 'legend' ? 'legend' :
            guide?.channel ?? 'guide';
          const label = guide?.title ?? fd.label ?? fd.field;
          const s = `${guideType} titled ${wrapForMonospace(label)}`;
          return { short: s, long: s };
        }
        case 'annotations':
          return { short: 'Data highlights', long: 'Data highlights' };
        default: {
          if (!ctx.edge) return { short: '', long: '' };
          const short = ctx.edge.displayName;
          const long = ctx.edge.description ? `${ctx.edge.displayName}. ${ctx.edge.description}` : short;
          return { short, long };
        }
      }
    },
  };
}

export function visTypeToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visType',
    applicableRoles: roles('root', 'view', 'xAxis', 'yAxis', 'legend', 'guide'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      const joinHint: JoinHint = 'clause';
      switch (p.nodeType) {
        case 'root': {
          const childTypes: string[] = [];
          for (const childId of ctx.navNode.childNavIds) {
            const childNode = ctx.runtime.getNavNode(childId);
            if (!childNode?.hyperedgeId) continue;
            const childEdge = ctx.hypergraph.edges.get(childNode.hyperedgeId);
            if (childEdge?.payload?.nodeType === 'view' && childEdge.payload.spec) {
              childTypes.push(getChartType(childEdge.payload.spec));
            }
          }
          const unique = [...new Set(childTypes)];
          const ct = unique.length > 1
            ? unique.join(' and ')
            : getChartType(spec);
          const s = `a ${ct}`;
          return { short: s, long: s, joinHint };
        }
        case 'view': {
          const ct = (p.viewType === 'facet' && spec.mark === 'line')
            ? 'line'
            : getChartType(spec);
          const s = `a ${ct}`;
          return { short: s, long: s, joinHint };
        }
        case 'xAxis':
        case 'yAxis':
        case 'legend':
        case 'guide': {
          if (!p.groupby) return { short: '', long: '' };
          const fd = getFieldDef(p.groupby, spec.fields ?? []);
          const s = `for a ${fd.type ?? 'unknown'} scale`;
          return { short: s, long: s, joinHint };
        }
        default:
          return { short: '', long: '' };
      }
    },
  };
}

export function childrenToken(): DescriptionToken<VisPayload> {
  return {
    name: 'children',
    applicableRoles: '*' as const,
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (p && (p.nodeType === 'root' || p.nodeType === 'view')) {
        const spec = p.spec;
        const axes = spec.axes?.map((a) => {
          const fd = getFieldDef(a.field, spec.fields ?? []);
          return wrapForMonospace(a.title ?? fd.label ?? a.field);
        }).join(' and ');
        if (axes && spec.axes && spec.axes.length > 0) {
          const s = `with ${spec.axes.length > 1 ? 'axes' : 'axis'} ${axes}`;
          return { short: s, long: s, joinHint: 'clause' as const };
        }
      }
      const count = ctx.navNode.childNavIds.length;
      if (count === 0) return { short: '', long: '' };
      const short = `${count} ${count === 1 ? 'child' : 'children'}`;
      const names = ctx.navNode.childNavIds
        .map((id) => ctx.runtime.getNavNode(id))
        .map((n) => (n && n.hyperedgeId ? ctx.hypergraph.edges.get(n.hyperedgeId)?.displayName : undefined))
        .filter((s): s is string => !!s);
      const long = names.length > 0 ? `${short}: ${names.join(', ')}` : short;
      return { short, long };
    },
  };
}

export function visDataToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visData',
    applicableRoles: roles('xAxis', 'yAxis', 'legend', 'guide', 'filteredData', 'other'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      if ((p.nodeType === 'xAxis' || p.nodeType === 'yAxis' || p.nodeType === 'legend' || p.nodeType === 'guide') && p.groupby) {
        const fd = getFieldDef(p.groupby, spec.fields ?? []);
        const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
        if (fd.type === 'quantitative' || fd.type === 'temporal') {
          const axis = spec.axes?.find((a) => a.field === p.groupby);
          const bins = getBins(p.groupby, data, spec.fields ?? [], axis?.ticks);
          if (bins.length > 0) {
            const first = fmtDataValue(bins[0]![0]!, fd);
            const last = fmtDataValue(bins[bins.length - 1]![1]!, fd);
            const s = `with values from ${first} to ${last}`;
            return { short: s, long: s, joinHint: 'clause' as const };
          }
        } else {
          const domain = getDomain(fd, data);
          if (domain.length > 0) {
            const first = fmtDataValue(domain[0]!, fd);
            const last = fmtDataValue(domain[domain.length - 1]!, fd);
            const s = `with ${pluralize(domain.length, 'value')} from ${first} to ${last}`;
            return { short: s, long: s, joinHint: 'clause' as const };
          }
        }
      }
      if (p.nodeType === 'filteredData' && p.predicate) {
        const s = predicateToDescription(p.predicate, spec.fields ?? []);
        return { short: s, long: s };
      }
      return { short: '', long: '' };
    },
  };
}

export function visSizeToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visSize',
    applicableRoles: roles('root', 'filteredData', 'annotations', 'other'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      if (p.nodeType === 'root' && p.groupby) {
        const childCount = ctx.edge?.children.length ?? 0;
        const s = `with ${childCount} views for ${wrapForMonospace(p.groupby)}`;
        return { short: s, long: s, joinHint: 'clause' as const };
      }
      if (p.nodeType === 'filteredData') {
        const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
        const sel = selectionTest(data, ctx.fullPredicate);
        const s = pluralize(sel.length, 'value');
        return { short: s, long: s };
      }
      if (p.nodeType === 'annotations') {
        const s = pluralize(ctx.edge?.children.length ?? 0, 'highlight');
        return { short: s, long: s };
      }
      return { short: '', long: '' };
    },
  };
}

export function visAggregateToken(): DescriptionToken<VisPayload> {
  return {
    name: 'aggregate',
    applicableRoles: roles('xAxis', 'yAxis', 'legend', 'filteredData'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;

      let fd = p.groupby ? getFieldDef(p.groupby, spec.fields ?? []) : undefined;
      if (!fd || fd.type !== 'quantitative') {
        const axisType = p.nodeType === 'xAxis' ? 'x' : 'y';
        const otherAxis = spec.axes?.find((a) => a.axisType !== axisType);
        if (!otherAxis) return { short: '', long: '' };
        fd = getFieldDef(otherAxis.field, spec.fields ?? []);
        if (fd.type !== 'quantitative') return { short: '', long: '' };
      }

      const label = fd.label ?? fd.field;
      const selection = selectionTest(data, ctx.fullPredicate);
      if (selection.length === 0) return { short: '', long: '' };
      if (selection.length === 1) {
        const s = `the ${wrapForMonospace(label)} value is ${fmtDataValue(selection[0]![fd.field]!, fd)}`;
        return { short: s, long: s };
      }
      const avg = averageValue(selection, fd.field);
      const max = selection.reduce((a, b) => Math.max(a, Number(b[fd.field])), Number(selection[0]![fd.field]));
      const min = selection.reduce((a, b) => Math.min(a, Number(b[fd.field])), Number(selection[0]![fd.field]));
      const short = `avg ${wrapForMonospace(label)}: ${fmtDataValue(avg, fd)}`;
      const long = `the average value for the ${wrapForMonospace(label)} field is ${fmtDataValue(avg, fd)}, the maximum is ${fmtDataValue(max, fd)}, and the minimum is ${fmtDataValue(min, fd)}`;
      return { short, long };
    },
  };
}

export function visQuartileToken(): DescriptionToken<VisPayload> {
  return {
    name: 'quartile',
    applicableRoles: roles('filteredData'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p || !p.spec.axes) return { short: '', long: '' };
      const spec = p.spec;
      const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;

      // find the "other" axis (the quantitative one)
      const parentEdge = ctx.navNode.parentNavId
        ? ctx.runtime.getHyperedge(ctx.runtime.getNavNode(ctx.navNode.parentNavId)?.hyperedgeId ?? '')
        : undefined;
      const parentNodeType = parentEdge?.payload?.nodeType;
      const axisType = parentNodeType === 'xAxis' ? 'x' : 'y';
      const otherAxis = spec.axes?.find((a) => a.axisType !== axisType);
      if (!otherAxis) return { short: '', long: '' };
      const fd = getFieldDef(otherAxis.field, spec.fields ?? []);
      if (fd.type !== 'quantitative') return { short: '', long: '' };

      const label = fd.label ?? fd.field;

      // collect averages for all siblings
      const parentNode = ctx.navNode.parentNavId ? ctx.runtime.getNavNode(ctx.navNode.parentNavId) : undefined;
      if (!parentNode) return { short: '', long: '' };
      const avgs: number[] = [];
      for (const sibId of parentNode.childNavIds) {
        const sibNode = ctx.runtime.getNavNode(sibId);
        if (!sibNode?.hyperedgeId) continue;
        const sibPred = ctx.runtime.fullPredicate(sibId);
        const interval = selectionTest(data, sibPred);
        avgs.push(interval.length === 0 ? 0 : averageValue(interval, fd.field));
      }
      avgs.sort((a, b) => a - b);

      const sel = selectionTest(data, ctx.fullPredicate);
      const thisAvg = sel.length === 0 ? 0 : averageValue(sel, fd.field);
      const pos = avgs.indexOf(thisAvg) / avgs.length;
      const quartile = Math.max(1, Math.ceil(pos * 4));
      const s = `this section's average ${wrapForMonospace(label)} is in the ${ordinalSuffix(quartile)} quartile of all sections`;
      return { short: s, long: s };
    },
  };
}

export function visInstructionsToken(): DescriptionToken<VisPayload> {
  return {
    name: 'instructions',
    applicableRoles: roles('filteredData', 'other'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      if (p.predicate) {
        const spec = p.spec;
        const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
        const sel = selectionTest(data, ctx.fullPredicate);
        if (sel.length > 0) {
          const s = 'press t to open table';
          return { short: s, long: s };
        }
      }
      return { short: '', long: '' };
    },
  };
}

export function parentToken(): DescriptionToken<VisPayload> {
  return {
    name: 'parent',
    applicableRoles: '*' as const,
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (p && (p.nodeType === 'xAxis' || p.nodeType === 'yAxis' || p.nodeType === 'legend' || p.nodeType === 'guide' || p.nodeType === 'filteredData')) {
        const spec = p.spec;
        let cur = ctx.navNode;
        while (cur.parentNavId) {
          const parent = ctx.runtime.getNavNode(cur.parentNavId);
          if (!parent?.hyperedgeId) break;
          const parentEdge = ctx.runtime.getHyperedge(parent.hyperedgeId);
          if (parentEdge?.payload?.nodeType === 'view' && parentEdge.payload.predicate && 'equal' in parentEdge.payload.predicate) {
            const fd = getFieldDef(parentEdge.payload.predicate.field, spec.fields ?? []);
            const s = fmtDataValue(parentEdge.payload.predicate.equal as OlliValue, fd);
            return { short: s, long: s };
          }
          cur = parent;
        }
      }
      if (!ctx.navNode.parentNavId) return { short: '', long: '' };
      const parent = ctx.runtime.getNavNode(ctx.navNode.parentNavId);
      if (!parent || parent.hyperedgeId === null) return { short: '', long: '' };
      const parentEdge = ctx.hypergraph.edges.get(parent.hyperedgeId);
      const name = parentEdge?.displayName ?? '';
      if (!name) return { short: '', long: '' };
      if (ctx.edge && ctx.edge.parents.length > 1) {
        return { short: `grouping: ${name}`, long: `current grouping: ${name}` };
      }
      return { short: name, long: `parent: ${name}` };
    },
  };
}

export function allVisTokens(): DescriptionToken<VisPayload>[] {
  return [
    nameToken(),
    visTypeToken(),
    childrenToken(),
    visDataToken(),
    visSizeToken(),
    visAggregateToken(),
    visQuartileToken(),
    parentToken(),
    visInstructionsToken(),
  ];
}
