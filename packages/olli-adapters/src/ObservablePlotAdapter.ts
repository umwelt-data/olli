import type { UnitOlliVisSpec, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import type { VisAdapter } from './types.js';

export const ObservablePlotAdapter: VisAdapter<any> = async (plotObject: any): Promise<UnitOlliVisSpec> => {
  const Plot = await import('@observablehq/plot');
  const plotSVG = await (Plot as any).plot(plotObject);
  const description: string | undefined = plotObject.ariaDescription;
  return plotToOlliSpec(plotObject, plotSVG, description);
};

function plotToOlliSpec(plot: any, svg: Element, description?: string): UnitOlliVisSpec {
  const chartSVG = svg.tagName !== 'svg' ? Object.values(svg.children).find((n) => (n as Element).tagName === 'svg')! as Element : svg;
  const axes: OlliAxis[] = ['x-axis', 'y-axis'].reduce((parsedAxes: OlliAxis[], s: string) => {
    const axisSVG = findHtmlElement(chartSVG, s);
    if (axisSVG) {
      parsedAxes.push(parseAxis(plot, axisSVG));
    }
    return parsedAxes;
  }, []);
  const legends: OlliLegend[] = [];
  if (plot.color && plot.color.legend) legends.push(parseLegend(plot, svg.children[0]!));

  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];

  let facetField: string | undefined;
  if (plot.facet) {
    facetField = plot.facet.y ? plot.facet.y : plot.facet.x;
  } else if (plotMark && plotMark.ariaLabel === 'line') {
    facetField = flatChannels(plot.marks.find((mark: any) => mark.ariaLabel === 'line').channels).find(
      (c: any) => c.name === 'stroke',
    )?.value;
  }

  const result: UnitOlliVisSpec = {
    data: plotMark.data,
    axes,
    legends,
  };
  const mark = plotMarkToOlliMark(plotMark.ariaLabel);
  if (mark !== undefined) result.mark = mark;
  if (facetField !== undefined) result.facet = facetField;
  if (description !== undefined) result.description = description;
  return result;
}

function parseAxis(plot: any, svg: Element): OlliAxis {
  const axisType: 'x' | 'y' = svg?.getAttribute('aria-label') === 'y-axis' ? 'y' : 'x';
  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];
  const channel = flatChannels(plotMark.channels).find((c: any) => c.scale === axisType);
  const field: string = typeof channel.value === 'object' ? channel.value.label : channel.value;

  const guide: OlliAxis = {
    field,
    axisType,
  };

  if (channel.type) {
    guide.scaleType = channel.type;
  }

  return guide;
}

function parseLegend(plot: any, svg: Element): OlliLegend {
  const legendChannels = ['fill'];
  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];
  const channel = flatChannels(plotMark.channels).find((c: any) => legendChannels.includes(c.name));
  const field: string = typeof channel.value === 'object' ? channel.value.label : channel.value;

  return {
    field,
    channel: channel.name,
  };
}

function findHtmlElement(svg: Element, label: string): Element | undefined {
  const attributeToCompare = 'aria-label';
  for (let i = 0; i < svg.children.length; i++) {
    const childElement = svg.children[i]!;
    if (childElement.getAttribute(attributeToCompare) === label) {
      return childElement;
    }
  }
  return undefined;
}

function plotMarkToOlliMark(m: string): OlliMark | undefined {
  switch (m) {
    case 'dot':
      return 'point';
    case 'bar':
      return 'bar';
    case 'line':
      return 'line';
    default:
      return undefined;
  }
}

function flatChannels(channels: any): any[] {
  return channels.find ? channels : Object.entries(channels).map(([name, chan]) => ({ ...(chan as {}), name }));
}
