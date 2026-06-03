import type { OlliAxis, OlliGuide, OlliLegend, OlliNode, UnitOlliVisSpec } from './types.js';
import { getMarkType } from './types.js';
import { getFieldDef } from '../util/data.js';

export function inferStructure(spec: UnitOlliVisSpec): OlliNode | OlliNode[] {
  function nodesFromGuides(
    axes?: OlliAxis[],
    legends?: OlliLegend[],
    guides?: OlliGuide[],
  ): OlliNode[] {
    let nodes: OlliNode[] = [];
    if (axes) {
      nodes = nodes.concat(axes.map((a) => ({ groupby: a.field, children: [] })));
    }
    if (legends) {
      nodes = nodes.concat(legends.map((l) => ({ groupby: l.field, children: [] })));
    }
    if (guides) {
      nodes = nodes.concat(guides.map((g) => ({ groupby: g.field, children: [] })));
    }
    return dedupeGroupby(nodes);
  }

  if (spec.facet) {
    if (spec.axes?.length || spec.legends?.length) {
      return {
        groupby: spec.facet,
        children: nodesFromGuides(spec.axes, spec.legends, spec.guides),
      };
    }
    return {
      groupby: spec.facet,
      children: (spec.fields ?? [])
        .filter((f) => f.field !== spec.facet)
        .map((f) => ({ groupby: f.field })),
    };
  }

  if (getMarkType(spec.mark) === 'line' && spec.legends?.length) {
    const colorLegend = spec.legends.find((l) => l.channel === 'color');
    if (colorLegend) {
      return {
        groupby: colorLegend.field,
        children: nodesFromGuides(
          spec.axes,
          spec.legends.filter((l) => l !== colorLegend),
          spec.guides,
        ),
      };
    }
  }

  if (getMarkType(spec.mark) === 'bar') {
    if (spec.axes?.length) {
      const quantAxis = spec.axes.find((a) => {
        const fd = getFieldDef(a.field, spec.fields ?? []);
        return fd.type === 'quantitative' && !fd.bin;
      });
      return nodesFromGuides(
        spec.axes.filter((a) => a !== quantAxis),
        spec.legends,
      );
    }
    const quantField = (spec.fields ?? []).find((f) => f.type === 'quantitative');
    return (spec.fields ?? [])
      .filter((f) => f !== quantField)
      .map((f) => ({ groupby: f.field, children: [] }));
  }

  if (getMarkType(spec.mark) === 'geoshape') {
    const nodes: OlliNode[] = [];
    if (spec.legends?.length) {
      nodes.push(...spec.legends.map((l) => ({ groupby: l.field, children: [] as OlliNode[] })));
    }
    const hasRegion = spec.fields?.some((f) => f.field === 'region');
    const hasState = spec.fields?.some((f) => f.field === 'state');
    if (hasRegion && hasState) {
      nodes.push({ groupby: ['region', 'state'] });
    } else if (hasState) {
      nodes.push({ groupby: 'state' });
    }
    if (nodes.length) return nodes;
  }

  if (spec.axes?.length || spec.legends?.length) {
    return nodesFromGuides(spec.axes, spec.legends);
  }

  return (spec.fields ?? []).map((f) => ({ groupby: f.field, children: [] }));
}

function dedupeGroupby(nodes: OlliNode[]): OlliNode[] {
  return nodes.filter((node, idx, arr) => {
    if ('groupby' in node) {
      const field = Array.isArray(node.groupby) ? node.groupby[0] : node.groupby;
      return arr.findIndex((n) => {
        if (!('groupby' in n)) return false;
        const nField = Array.isArray(n.groupby) ? n.groupby[0] : n.groupby;
        return nField === field;
      }) === idx;
    }
    return true;
  });
}
