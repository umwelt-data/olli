import { OlliDataset, OlliFieldDef, OlliValue } from '../Types';
import { UnitOlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNodeType } from '../Structure/Types';
import { getBins } from '../util/bin';
import { getDomain, getFieldDef } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';
import {
  capitalizeFirst,
  removeFinalPeriod,
  getChartType,
  pluralize,
  chartTypePrefix,
  averageValue,
  ordinal_suffix_of,
} from '../util/description';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalComposition } from 'vega-lite/src/logical';
import { CustomizeSetting } from './Types';
import { defaultSetting } from './data';
import Storage from 'versioned-storage';

export function getSettingsStorage(): Storage<CustomizeSetting> {
  let settingsStorage: Storage<CustomizeSetting>;
  const STORAGE_VERSION = 1;
  try {
    settingsStorage = new Storage<CustomizeSetting>('settingsData'); // Get the storage of existing version
    switch ((settingsStorage as any).version) {
      // add migrations here
      default:
        throw new Error('Incompatible legacy storage schema');
    }
  } catch (_error) {
    settingsStorage = new Storage<CustomizeSetting>('settingsData', STORAGE_VERSION); // Start from scratch if not migratable
    settingsStorage.write(defaultSetting);
  }
  return settingsStorage;
}

export function getCustomizedDescription(node: ElaboratedOlliNode) {
  const store = getSettingsStorage();
  const settings: CustomizeSetting = store.read();

  return (
    Array.from(node.description)
      // customize based on settings for this node type
      .filter(([type, _]) => settings[type])
      // format text of description
      .map(([_, desc]) => desc)
      .filter((desc) => desc.length > 0)
      .map(capitalizeFirst)
      .map(removeFinalPeriod)
      .join('. ') + '.'
  );
}

export function nodeToDescription(
  node: ElaboratedOlliNode,
  dataset: OlliDataset,
  olliSpec: UnitOlliSpec
): Map<string, string> {
  const indexStr = `${(node.parent?.children.indexOf(node) || 0) + 1} of ${(node.parent?.children || []).length}`;
  const description = olliSpec.description || '';
  const chartType = getChartType(olliSpec);
  const axes = olliSpec.axes
    ?.map((a) => {
      const fieldDef = getFieldDef(a.field, olliSpec.fields);
      return a.title || fieldDef.label || a.field;
    })
    .join(' and ');

  function name(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return description;
        }
        if (olliSpec.mark) {
          return olliSpec.description || '';
        }
        return '';
      case 'view':
        if ('predicate' in node && 'equal' in node.predicate) {
          return `titled ${fmtValue(node.predicate.equal as any, getFieldDef(node.predicate.field, olliSpec.fields))}`;
        }
        return '';
      case 'xAxis':
      case 'yAxis':
      case 'legend':
      case 'guide':
        const fieldDef = getFieldDef(node.groupby, olliSpec.fields);
        const guide =
          olliSpec.axes?.find((axis) => axis.field === node.groupby) ||
          olliSpec.legends?.find((legend) => legend.field === node.groupby) ||
          olliSpec.guides?.find((guide) => guide.field === node.groupby);
        const guideType =
          node.nodeType === 'xAxis'
            ? 'x-axis'
            : node.nodeType === 'yAxis'
            ? 'y-axis'
            : node.nodeType === 'legend'
            ? 'legend'
            : guide.channel
            ? guide.channel
            : 'guide';
        const label = guide.title || fieldDef.label || fieldDef.field;
        return `${guideType} titled ${label}`;
      case 'filteredData':
        if ('name' in node && 'explanation' in node) {
          return `<strong>${node.name}.</strong> ${node.explanation}${node.explanation.endsWith('.') ? '' : '.'}`;
        }
        return '';
      case 'annotations':
        return 'Data highlights.';
      default:
        throw `Node type ${node.nodeType} does not have the 'name' token.`;
    }
  }

  function index(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'view':
      case 'filteredData':
      case 'other':
        return indexStr;
      default:
        throw `Node type ${node.nodeType} does not have the 'index' token.`;
    }
  }

  function type(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return `a ${chartTypePrefix(node, olliSpec)}${chartType}`;
        }
        if (olliSpec.mark) {
          return `a ${chartType}`;
        }
        if (node.children.length) {
          if (node.children[0].viewType === 'layer') {
            return 'a layered chart';
          }
          if (node.children[0].viewType === 'concat') {
            return 'a multi-view chart';
          }
        }
        return 'a dataset';
      case 'view':
        const viewName =
          olliSpec.mark === 'line' ? 'line' : olliSpec.mark ? chartType : node.viewType ? node.viewType : 'view';
        return `a ${viewName}`;
      case 'xAxis':
      case 'yAxis':
      case 'legend':
      case 'guide':
        if ('groupby' in node) {
          const fieldDef = getFieldDef(node.groupby, olliSpec.fields);
          if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
            const guide =
              olliSpec.axes?.find((axis) => axis.field === node.groupby) ||
              olliSpec.legends?.find((legend) => legend.field === node.groupby) ||
              olliSpec.guides?.find((guide) => guide.field === node.groupby);
            const bins = getBins(
              node.groupby,
              dataset,
              olliSpec.fields,
              'ticks' in guide && Array.isArray(guide.ticks) ? guide.ticks : undefined
            );
            if (bins.length) {
              return `for a ${'scaleType' in guide ? guide.scaleType || fieldDef.type : fieldDef.type} scale`;
            }
          } else {
            return `for a ${fieldDef.type} scale`;
          }
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'type' token.`;
    }
  }

  function children(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node || (olliSpec.mark && olliSpec.axes?.length)) {
          return `with ${olliSpec.axes.length > 1 ? 'axes' : 'axis'} ${axes}`;
        }
        const fields = olliSpec.fields.map((f) => f.label || f.field);
        if (fields.length <= 3) {
          return ' ' + [...fields].join(', ');
        }
        return '';
      case 'view':
        if (olliSpec.axes?.length) {
          return `with ${olliSpec.axes.length > 1 ? 'axes' : 'axis'} ${axes}`;
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'children' token.`;
    }
  }

  function data(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'xAxis':
      case 'yAxis':
      case 'legend':
      case 'guide':
        if ('groupby' in node) {
          const fieldDef = getFieldDef(node.groupby, olliSpec.fields);
          let first, last;
          if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
            const axis = olliSpec.axes?.find((axis) => axis.field === node.groupby);
            const bins = getBins(node.groupby, dataset, olliSpec.fields, axis ? axis.ticks : undefined);
            if (bins.length) {
              first = fmtValue(bins[0][0], fieldDef);
              last = fmtValue(bins[bins.length - 1][1], fieldDef);
              return `with values from ${first} to ${last}`;
            }
          } else {
            const domain = getDomain(fieldDef, dataset);
            if (domain.length) {
              first = fmtValue(domain[0], fieldDef);
              last = fmtValue(domain[domain.length - 1], fieldDef);
              return `with ${pluralize(domain.length, 'value')} from ${first} to ${last}`;
            }
          }
        }
        return '';
      case 'filteredData':
        if ('predicate' in node) {
          return predicateToDescription(node.predicate, olliSpec.fields);
        }
        return '';
      case 'other':
        if ('groupby' in node) {
          return `grouped by ${node.groupby}`;
        } else if ('predicate' in node) {
          return predicateToDescription(node.predicate, olliSpec.fields);
        }
      default:
        throw `Node type ${node.nodeType} does not have the 'data' token.`;
    }
  }

  function size(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return `with ${node.children.length} views for ${node.groupby}`;
        }
        if ((olliSpec.mark && olliSpec.axes?.length) || olliSpec.mark) {
          return '';
        }
        return `with ${olliSpec.fields.length} fields`;
      case 'filteredData':
        if ('predicate' in node) {
          const selection = selectionTest(dataset, node.fullPredicate);
          return `${pluralize(selection.length, 'value')}`;
        }
        return '';
      case 'annotations':
        return `${node.children.length} highlights.`;
      case 'other':
        if ('groupby' in node) {
          return `${node.children.length} groups`;
        } else if ('predicate' in node) {
          const selection = selectionTest(dataset, node.fullPredicate);
          return `${pluralize(selection.length, 'value')}`;
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'size' token.`;
    }
  }

  function level(node: ElaboratedOlliNode): string {
    return `level ${node.level}`;
  }

  function parent(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'xAxis':
      case 'yAxis':
      case 'legend':
      case 'guide':
      case 'filteredData':
        let view = node;
        while (view.parent && view.nodeType != 'view') {
          view = view.parent;
        }
        if ('predicate' in view && 'equal' in view.predicate) {
          return `${fmtValue(view.predicate.equal as any, getFieldDef(view.predicate.field, olliSpec.fields))}`;
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'parent' token.`;
    }
  }

  function aggregate(node: ElaboratedOlliNode): string {
    let axisType: string;
    switch (node.nodeType) {
      case 'xAxis':
      case 'yAxis':
      case 'legend':
        axisType = node.nodeType === 'xAxis' ? 'x' : 'y';
      case 'filteredData':
        if (!axisType) axisType = node.parent.nodeType === 'xAxis' ? 'x' : 'y';

        // TODO this should use key semantics
        let fieldDef = getFieldDef(node.groupby, olliSpec.fields);
        if (!fieldDef || fieldDef.type !== 'quantitative') {
          const otherAxis = olliSpec.axes?.find((axis) => axis.axisType !== axisType);
          if (!otherAxis) return '';
          const otherAxisFieldDef = getFieldDef(otherAxis.field, olliSpec.fields);
          if (otherAxisFieldDef.type !== 'quantitative') {
            return '';
          }
          fieldDef = otherAxisFieldDef;
        }

        const label = fieldDef.label || fieldDef.field;
        const field = fieldDef.field;

        const selection = selectionTest(dataset, node.fullPredicate);
        if (selection.length === 0) {
          return '';
        }
        if (selection.length === 1) {
          return `the ${label} value is ${fmtValue(selection[0][field], fieldDef)}`;
        }
        const average = averageValue(selection, field);
        const maximum = selection.reduce((a, b) => Math.max(a, Number(b[field])), Number(selection[0][field]));
        const minimum = selection.reduce((a, b) => Math.min(a, Number(b[field])), Number(selection[0][field]));
        return `the average value for the ${label} field is ${fmtValue(average, fieldDef)}, the maximum is ${fmtValue(
          maximum,
          fieldDef
        )}, and the minimum is ${fmtValue(minimum, fieldDef)}`;

      default:
        throw `Node type ${node.nodeType} does not have the 'aggregate' token.`;
    }
  }

  function quartile(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'filteredData':
        const axisType = node.parent.nodeType === 'xAxis' ? 'x' : 'y';
        const otherAxis = olliSpec.axes?.find((axis) => axis.axisType !== axisType);
        if (!otherAxis) return '';
        const otherAxisFieldDef = getFieldDef(otherAxis.field, olliSpec.fields);
        if (otherAxisFieldDef.type !== 'quantitative') {
          return '';
        }
        const label = otherAxisFieldDef.label || otherAxisFieldDef.field;
        const field = otherAxisFieldDef.field;

        const avgs: number[] = [];
        node.parent.children.forEach((section) => {
          const interval = selectionTest(dataset, section.fullPredicate);
          if (interval.length == 0) {
            avgs.push(0);
            return;
          }
          avgs.push(Number(averageValue(interval, field)));
        });
        avgs.sort(function (a, b) {
          return a - b;
        });

        const selection = selectionTest(dataset, node.fullPredicate);
        const thisAvg = selection.length == 0 ? 0 : averageValue(selection, field);
        const sectionsPos = avgs.indexOf(Number(thisAvg)) / avgs.length;
        const sectionsQuart = Math.max(1, Math.ceil(sectionsPos * 4)); // pos is btwn 0 and 1, no quartile 0
        return `this section's average ${label} is in the ${ordinal_suffix_of(
          sectionsQuart
        )} quartile  of all sections`;
      default:
        throw `Node type ${node.nodeType} does not have the 'quartile' token.`;
    }
  }

  function instructions(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'filteredData':
      case 'other':
        if ('predicate' in node) {
          const selection = selectionTest(dataset, node.fullPredicate);
          return selection.length ? 'press t to open table' : '';
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'instructions' token.`;
    }
  }

  const nodeTypeToTokens = new Map<OlliNodeType, string[]>([
    ['root', ['name', 'type', 'size', 'children', 'level']],
    ['view', ['index', 'type', 'name', 'children', 'level']],
    ['xAxis', ['name', 'type', 'data', 'parent', 'aggregate', 'level']],
    ['yAxis', ['name', 'type', 'data', 'parent', 'aggregate', 'level']],
    ['legend', ['name', 'type', 'data', 'parent', 'aggregate', 'level']],
    ['guide', ['name', 'type', 'data', 'parent', 'level']],
    ['filteredData', ['index', 'name', 'data', 'size']],
    // ['filteredData', ['index', 'name', 'data', 'size', 'parent', 'aggregate', 'quartile', 'level', 'instructions']],
    ['annotations', ['name', 'size', 'level']],
    ['other', ['index', 'data', 'size', 'level', 'instructions']],
  ]);

  const tokenFunctions = new Map<string, Function>([
    ['name', name],
    ['index', index],
    ['type', type],
    ['children', children],
    ['data', data],
    ['size', size],
    ['level', level],
    ['parent', parent],
    ['quartile', quartile],
    ['aggregate', aggregate],
    ['instructions', instructions],
  ]);

  const resultDescription = new Map<string, string>();
  const tokens = nodeTypeToTokens.get(node.nodeType);
  if (tokens !== undefined) {
    for (const token of tokens) {
      const tokenFunc = tokenFunctions.get(token);
      if (tokenFunc !== undefined) {
        resultDescription.set(token, tokenFunc(node));
      }
    }
  }

  return resultDescription;
}

export function predicateToDescription(predicate: LogicalComposition<FieldPredicate>, fields: OlliFieldDef[]) {
  if ('and' in predicate) {
    return predicate.and
      .map((p) => predicateToDescription(p, fields))
      .filter((s) => s.trim().length)
      .join(' and ');
  }
  if ('or' in predicate) {
    return predicate.or.map((p) => predicateToDescription(p, fields)).join(' or ');
  }
  if ('not' in predicate) {
    return `not ${predicateToDescription(predicate.not, fields)}`;
  }
  return fieldPredicateToDescription(predicate, fields);
}

function fieldPredicateToDescription(predicate: FieldPredicate, fields: OlliFieldDef[]) {
  const fieldDef = getFieldDef(predicate.field, fields);
  if (!fieldDef) {
    debugger;
  }
  const field = fieldDef.label || fieldDef.field;
  if ('equal' in predicate) {
    return `${field} equals ${fmtValue(predicate.equal as OlliValue, fieldDef)}`;
  }
  if ('range' in predicate) {
    return `${field} is between ${fmtValue(predicate.range[0], fieldDef)} and ${fmtValue(
      predicate.range[1],
      fieldDef
    )}`;
  }
  if ('lt' in predicate) {
    return `${field} is less than ${fmtValue(predicate.lt as OlliValue, fieldDef)}`;
  }
  if ('lte' in predicate) {
    return `${field} is less than or equal to ${fmtValue(predicate.lte as OlliValue, fieldDef)}`;
  }
  if ('gt' in predicate) {
    return `${field} is greater than ${fmtValue(predicate.gt as OlliValue, fieldDef)}`;
  }
  if ('gte' in predicate) {
    return `${field} is greater than or equal to ${fmtValue(predicate.gte as OlliValue, fieldDef)}`;
  }
  if ('oneOf' in predicate) {
    return `${field} is one of ${predicate.oneOf.map((value) => fmtValue(value, fieldDef)).join(', ')}`;
  }

  return '';
}
