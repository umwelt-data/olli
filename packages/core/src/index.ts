import { OlliSpec, UnitOlliSpec } from './Types';
import { ElaboratedOlliNode, OlliGroupNode, OlliNode } from './Structure/Types';
import { OlliRuntime, RuntimeCallbacks } from './Runtime/OlliRuntime';
import { updateGlobalStateOnInitialRender } from './util/globalState';
import { elaborateSpec } from './util/elaborate';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';
export type { OlliGlobalState } from './util/globalState';

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
  onSelection?: (predicate: LogicalComposition<FieldPredicate>) => void;
};

export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);
  addDataHighlights(olliSpec);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  const treeCallbacks: RuntimeCallbacks = {
    onFocus: config?.onFocus,
    onSelection: config?.onSelection,
  };

  const t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
  t.init();
  updateGlobalStateOnInitialRender(t);

  return renderContainer;
}

function addDataHighlights(olliSpec: OlliSpec): OlliSpec {
  const structure = (olliSpec as UnitOlliSpec).structure;
  const list = Array.isArray(structure) ? structure : [structure];
  list.unshift({
    annotations: highlights.map((bin) => {
      return {
        predicate: bin.predicate as LogicalComposition<FieldPredicate>,
        name: bin.name,
        reasoning: bin.explanation,
      };
    }),
  });
  (olliSpec as UnitOlliSpec).structure = list;
  return olliSpec;
}

// function addSemanticBins(olliSpec: OlliSpec): OlliSpec {}

const highlights = [
  {
    name: 'High Yield Varieties in 1931',
    explanation:
      'This group identifies the highest yielding crop varieties in 1931, a crucial year for agricultural research and productivity advancements.',
    predicate: {
      and: [
        {
          field: 'year',
          equal: 1931,
        },
        {
          field: 'yield',
          gt: 55,
        },
      ],
    },
  },
  {
    name: 'Declining Yields Over Years',
    explanation:
      'This group examines varieties that showed a decline in yield from 1931 to 1932, possibly indicating varietal loss or changing soil health/farming practices.',
    predicate: {
      field: 'variety',
      oneOf: [
        'Manchuria',
        'Glabron',
        'Velvet',
        'Trebi',
        'No. 457',
        'No. 462',
        'Peatland',
        'No. 475',
        'Wisconsin No. 38',
      ],
    },
  },
  {
    name: 'Top Performing Sites',
    explanation:
      'This group identifies sites that consistently recorded high yields across multiple varieties in 1931, emphasizing their role in agricultural research.',
    predicate: {
      or: [
        {
          field: 'site',
          oneOf: ['Waseca', 'University Farm', 'Crookston'],
        },
        {
          field: 'yield',
          gt: 40,
        },
      ],
    },
  },
  {
    name: 'Emerging Varieties in 1932',
    explanation:
      'This group focuses on new or lesser-known varieties that achieved noteworthy yields in 1932 compared to previous year, reflecting innovation in crop breeding.',
    predicate: {
      and: [
        {
          field: 'year',
          equal: 1932,
        },
        {
          field: 'yield',
          gte: 40,
        },
        {
          field: 'variety',
          oneOf: ['Trebi', 'No. 462', 'Wisconsin No. 38'],
        },
      ],
    },
  },
];
