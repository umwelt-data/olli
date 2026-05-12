import type { DescriptionToken, TokenContext } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { VisPayload, OlliNodeType } from '../spec/types.js';
import { getFieldDef, getDomain, getBins } from '../util/data.js';
import { fmtValue, pluralize, averageValue, ordinalSuffix } from '../util/values.js';
import { predicateToDescription } from '../lower/describe.js';

type Ctx = TokenContext<VisPayload>;

function roles(...types: OlliNodeType[]): string[] {
  return types;
}

function getChartType(spec: import('../spec/types.js').UnitOlliVisSpec): string {
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

export function visNameToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visName',
    applicableRoles: roles('root', 'view', 'xAxis', 'yAxis', 'legend', 'guide', 'filteredData', 'annotations'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      switch (p.nodeType) {
        case 'root': {
          const s = spec.description || spec.title || '';
          return { short: s, long: s };
        }
        case 'view': {
          if (p.predicate && 'equal' in p.predicate) {
            const fd = getFieldDef(p.predicate.field, spec.fields ?? []);
            const s = `titled ${fmtValue(p.predicate.equal as import('../spec/types.js').OlliValue, fd)}`;
            return { short: s, long: s };
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
          const s = `${guideType} titled ${label}`;
          return { short: s, long: s };
        }
        case 'annotations':
          return { short: 'Data highlights', long: 'Data highlights' };
        default:
          return { short: '', long: '' };
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
      switch (p.nodeType) {
        case 'root': {
          const ct = getChartType(spec);
          const s = `a ${ct}`;
          return { short: s, long: s };
        }
        case 'view': {
          const viewName = spec.mark ?? p.viewType ?? 'view';
          const s = `a ${viewName}`;
          return { short: s, long: s };
        }
        case 'xAxis':
        case 'yAxis':
        case 'legend':
        case 'guide': {
          if (!p.groupby) return { short: '', long: '' };
          const fd = getFieldDef(p.groupby, spec.fields ?? []);
          const s = `for a ${fd.type ?? 'unknown'} scale`;
          return { short: s, long: s };
        }
        default:
          return { short: '', long: '' };
      }
    },
  };
}

export function visChildrenToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visChildren',
    applicableRoles: roles('root', 'view'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      const axes = spec.axes?.map((a) => {
        const fd = getFieldDef(a.field, spec.fields ?? []);
        return a.title ?? fd.label ?? a.field;
      }).join(' and ');
      if (axes && spec.axes && spec.axes.length > 0) {
        const s = `with ${spec.axes.length > 1 ? 'axes' : 'axis'} ${axes}`;
        return { short: s, long: s };
      }
      return { short: '', long: '' };
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
            const first = fmtValue(bins[0]![0]!, fd);
            const last = fmtValue(bins[bins.length - 1]![1]!, fd);
            const s = `with values from ${first} to ${last}`;
            return { short: s, long: s };
          }
        } else {
          const domain = getDomain(fd, data);
          if (domain.length > 0) {
            const first = fmtValue(domain[0]!, fd);
            const last = fmtValue(domain[domain.length - 1]!, fd);
            const s = `with ${pluralize(domain.length, 'value')} from ${first} to ${last}`;
            return { short: s, long: s };
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
        const s = `with ${childCount} views for ${p.groupby}`;
        return { short: s, long: s };
      }
      if (p.nodeType === 'filteredData') {
        const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
        const sel = selectionTest(data, ctx.fullPredicate);
        const s = pluralize(sel.length, 'value');
        return { short: s, long: s };
      }
      if (p.nodeType === 'annotations') {
        const s = `${ctx.edge?.children.length ?? 0} highlights`;
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
        const s = `the ${label} value is ${fmtValue(selection[0]![fd.field]!, fd)}`;
        return { short: s, long: s };
      }
      const avg = averageValue(selection, fd.field);
      const max = selection.reduce((a, b) => Math.max(a, Number(b[fd.field])), Number(selection[0]![fd.field]));
      const min = selection.reduce((a, b) => Math.min(a, Number(b[fd.field])), Number(selection[0]![fd.field]));
      const short = `avg ${label}: ${fmtValue(avg, fd)}`;
      const long = `the average value for the ${label} field is ${fmtValue(avg, fd)}, the maximum is ${fmtValue(max, fd)}, and the minimum is ${fmtValue(min, fd)}`;
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
      const s = `this section's average ${label} is in the ${ordinalSuffix(quartile)} quartile of all sections`;
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

export function visParentToken(): DescriptionToken<VisPayload> {
  return {
    name: 'visParent',
    applicableRoles: roles('xAxis', 'yAxis', 'legend', 'guide', 'filteredData'),
    compute: (ctx: Ctx) => {
      const p = ctx.edge?.payload;
      if (!p) return { short: '', long: '' };
      const spec = p.spec;
      // walk up to find enclosing view
      let cur = ctx.navNode;
      while (cur.parentNavId) {
        const parent = ctx.runtime.getNavNode(cur.parentNavId);
        if (!parent?.hyperedgeId) break;
        const parentEdge = ctx.runtime.getHyperedge(parent.hyperedgeId);
        if (parentEdge?.payload?.nodeType === 'view' && parentEdge.payload.predicate && 'equal' in parentEdge.payload.predicate) {
          const fd = getFieldDef(parentEdge.payload.predicate.field, spec.fields ?? []);
          const s = fmtValue(parentEdge.payload.predicate.equal as import('../spec/types.js').OlliValue, fd);
          return { short: s, long: s };
        }
        cur = parent;
      }
      return { short: '', long: '' };
    },
  };
}

export function allVisTokens(): DescriptionToken<VisPayload>[] {
  return [
    visNameToken(),
    visTypeToken(),
    visChildrenToken(),
    visDataToken(),
    visSizeToken(),
    visAggregateToken(),
    visQuartileToken(),
    visParentToken(),
    visInstructionsToken(),
  ];
}
