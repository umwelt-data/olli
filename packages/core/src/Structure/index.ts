import { LogicalAnd, LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { UnitOlliSpec, OlliDataset, OlliSpec, isMultiOlliSpec } from '../Types';
import { fieldToPredicates, selectionTest } from '../util/selection';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup, OlliNodeType } from './Types';
import { nodeToDescription } from '../Customization';

export function olliSpecToTree(olliSpec: OlliSpec): ElaboratedOlliNode {
  const namespace = (Math.random() + 1).toString(36).substring(7);
  const isTopLevelMapGroup = (spec: UnitOlliSpec, level: number) => spec.mark === 'geoshape' && level === 0;
  /**
   * If the top level has multiple nodes, we wrap them in a single node
   */
  function ensureFirstLayerHasOneRoot(nodes: ElaboratedOlliNode[]): ElaboratedOlliNode {
    if (nodes.length === 1 && !['xAxis', 'yAxis'].includes(nodes[0].nodeType)) {
      return nodes[0];
    }

    // before wrapping, need to increase level of old nodes
    function recursivelyIncreaseLevel(node) {
      node.level = node.level + 1;
      node.children.forEach(recursivelyIncreaseLevel);
    }
    nodes.forEach(recursivelyIncreaseLevel);

    return {
      id: namespace,
      nodeType: 'root',
      fullPredicate: { and: [] },
      description: new Map<string, string>(),
      children: nodes,
      level: 1,
    };
  }

  function nodeTypeFromGroupField(field: string, olliSpec: UnitOlliSpec): OlliNodeType {
    if (field === olliSpec.facet) return 'root';
    const axis = olliSpec.axes?.find((a) => a.field === field);
    if (axis) {
      switch (axis.axisType) {
        case 'x':
          return 'xAxis';
        case 'y':
          return 'yAxis';
      }
    }
    const legend = olliSpec.legends?.find((l) => l.field === field);
    if (legend) {
      return 'legend';
    }
    const guide = olliSpec.guides?.find((g) => g.field === field);
    if (guide) {
      return 'guide';
    }
    return 'other';
  }

  function elaborateOlliNodes(
    olliSpec: UnitOlliSpec,
    specIndex: number,
    olliNodes: OlliNode[],
    data: OlliDataset,
    fullPredicate: LogicalComposition<FieldPredicate>,
    idPrefix: string,
    level: number
  ): ElaboratedOlliNode[] {
    if (!olliNodes) {
      return [];
    }
    return olliNodes.map((node, idx) => {
      if ('groupby' in node) {
        const nodeType = isTopLevelMapGroup(olliSpec, level) ? 'root' : nodeTypeFromGroupField(node.groupby, olliSpec);
        const axis = olliSpec.axes?.find((a) => a.field === node.groupby);
        const childPreds = fieldToPredicates(node.groupby, data, olliSpec.fields, axis ? axis.ticks : undefined);

        return {
          id: `${idPrefix}-${idx}`,
          fullPredicate,
          nodeType,
          specIndex,
          groupby: node.groupby,
          description: new Map<string, string>(),
          children: childPreds.map((p, childIdx) => {
            const childFullPred = {
              and: [...(fullPredicate as LogicalAnd<FieldPredicate>).and, p], // TODO handle other compositions
            };
            const childId = `${idPrefix}-${idx}-${childIdx}`;
            return {
              id: childId,
              nodeType: nodeType === 'root' ? 'view' : 'filteredData',
              viewType: nodeType === 'root' ? 'facet' : undefined,
              specIndex,
              predicate: p,
              fullPredicate: childFullPred,
              description: new Map<string, string>(),
              children: elaborateOlliNodes(olliSpec, specIndex, node.children, data, childFullPred, childId, level + 2),
              level: level + 2,
            };
          }),
          level: level + 1,
        };
      } else if ('predicate' in node) {
        const predicate = node.predicate;
        let nextFullPred: LogicalComposition<FieldPredicate>;
        if ('name' in node && 'reasoning' in node) {
          nextFullPred = predicate;
        } else {
          nextFullPred = {
            and: [...(fullPredicate as LogicalAnd<FieldPredicate>).and, predicate],
          };
        }
        const nextId = `${idPrefix}-${idx}`;
        return {
          id: nextId,
          name: (node as any).name,
          reasoning: (node as any).reasoning,
          nodeType: 'filteredData',
          specIndex,
          fullPredicate: nextFullPred,
          predicate,
          description: new Map<string, string>(),
          children: elaborateOlliNodes(olliSpec, specIndex, node.children, data, nextFullPred, nextId, level + 1),
          level: level + 1,
        };
      } else if ('annotations' in node) {
        const id = `${idPrefix}-${idx}`;
        return {
          id: id,
          fullPredicate,
          nodeType: 'annotations',
          specIndex,
          description: new Map<string, string>(),
          children: elaborateOlliNodes(olliSpec, specIndex, node.annotations, data, fullPredicate, id, level + 1),
          level: level + 1,
        };
      } else {
        throw new Error('Invalid node type');
      }
    });
  }

  if (isMultiOlliSpec(olliSpec)) {
    const viewNodes = olliSpec.units.map((spec, idx) => {
      const nodes = Array.isArray(spec.structure) ? spec.structure : [spec.structure];
      const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
      const elaborated = elaborateOlliNodes(spec, idx, nodes, data, { and: [] }, `${namespace}-${idx}`, 1);
      return {
        id: `${namespace}-${idx}`,
        nodeType: 'view' as OlliNodeType,
        viewType: olliSpec.operator,
        specIndex: idx,
        fullPredicate: { and: [] },
        description: new Map<string, string>(),
        children: elaborated,
        level: 1,
      };
    });
    const tree = ensureFirstLayerHasOneRoot(viewNodes);
    postProcessTree(tree, olliSpec);
    return tree;
  } else {
    const nodes = Array.isArray(olliSpec.structure) ? olliSpec.structure : [olliSpec.structure];
    const data = olliSpec.selection ? selectionTest(olliSpec.data, olliSpec.selection) : olliSpec.data;
    const tree = ensureFirstLayerHasOneRoot(
      elaborateOlliNodes(olliSpec, undefined, nodes, data, { and: [] }, namespace, 0)
    );
    postProcessTree(tree, olliSpec);
    return tree;
  }
}

export function postProcessTree(tree: ElaboratedOlliNode, olliSpec: OlliSpec) {
  function postProcess(node: ElaboratedOlliNode) {
    // add parent refs
    node.children.forEach((child) => {
      child.parent = node;
    });
    // initialize descriptions
    const spec =
      getSpecForNode(node, olliSpec) ||
      (isMultiOlliSpec(olliSpec)
        ? {
            data: olliSpec.units.flatMap((s) => s.data),
            selection: null,
            fields: olliSpec.units.flatMap((s) => s.fields).filter((f) => f !== undefined),
            axes: olliSpec.units.flatMap((s) => s.axes).filter((f) => f !== undefined),
            legends: olliSpec.units.flatMap((s) => s.legends).filter((f) => f !== undefined),
          }
        : olliSpec);
    const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
    node.description = nodeToDescription(node, data, spec);
  }

  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    postProcess(node);
    queue.push(...node.children);
  }
}

export function treeToNodeLookup(tree: ElaboratedOlliNode): OlliNodeLookup {
  const nodeLookup = {};
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    nodeLookup[node.id] = node;
    queue.push(...node.children);
  }
  return nodeLookup;
}

export function getSpecForNode(node: ElaboratedOlliNode, olliSpec: OlliSpec): UnitOlliSpec {
  return isMultiOlliSpec(olliSpec) ? olliSpec.units[node.specIndex] : olliSpec;
}
