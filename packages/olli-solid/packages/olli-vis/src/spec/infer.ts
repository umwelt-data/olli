import type { OlliAxis, OlliGuide, OlliLegend, OlliNode, UnitOlliVisSpec } from './types.js';
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

  if (spec.mark === 'line' && spec.legends?.length) {
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

  if (spec.mark === 'bar') {
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

  if (spec.axes?.length || spec.legends?.length) {
    return nodesFromGuides(spec.axes, spec.legends);
  }

  return (spec.fields ?? []).map((f) => ({ groupby: f.field, children: [] }));
}

function dedupeGroupby(nodes: OlliNode[]): OlliNode[] {
  return nodes.filter((node, idx, arr) => {
    if ('groupby' in node) {
      return arr.findIndex((n) => 'groupby' in n && n.groupby === node.groupby) === idx;
    }
    return true;
  });
}
