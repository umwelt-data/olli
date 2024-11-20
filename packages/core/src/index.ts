import { OlliSpec, UnitOlliSpec } from './Types';
import { ElaboratedOlliNode, OlliNode } from './Structure/Types';
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
  ((olliSpec as UnitOlliSpec).structure as OlliNode[]).unshift({
    annotations: highlights.map((bin) => {
      return {
        predicate: bin.predicate as LogicalComposition<FieldPredicate>,
        name: bin.name,
        reasoning: bin.explanation,
      };
    }),
  });
  return olliSpec;
}

// function addSemanticBins(olliSpec: OlliSpec): OlliSpec {}

const highlights = [
  {
    name: 'High Horsepower American Cars',
    explanation:
      'This group includes cars with high horsepower, indicating performance and possibly sportiness, which are often associated with American automotive culture.',
    predicate: {
      and: [
        {
          field: 'Horsepower',
          gt: 200,
        },
        {
          field: 'Origin',
          equal: 'USA',
        },
      ],
    },
  },
  {
    name: 'Fuel Efficient Japanese Cars',
    explanation:
      'This group represents cars from Japan that are known for their fuel efficiency, reflecting Japanese automotive engineering and consumer trends towards sustainable driving.',
    predicate: {
      and: [
        {
          field: 'Miles_per_Gallon',
          gte: 25,
        },
        {
          field: 'Origin',
          equal: 'Japan',
        },
      ],
    },
  },
  {
    name: 'Low Horsepower European Cars',
    explanation:
      'This group highlights cars from Europe with lower horsepower, often focusing on economy, practicality, and urban commuting.',
    predicate: {
      and: [
        {
          field: 'Horsepower',
          lte: 70,
        },
        {
          field: 'Origin',
          equal: 'Europe',
        },
      ],
    },
  },
  {
    name: 'Performance versus Fuel Economy',
    explanation:
      'This group contrasts cars focusing on high performance (higher horsepower) against those prioritized for fuel economy (higher MPG), indicative of consumer choices based on economic conditions and environmental awareness.',
    predicate: {
      and: [
        {
          field: 'Horsepower',
          gt: 150,
        },
        {
          field: 'Miles_per_Gallon',
          lte: 20,
        },
      ],
    },
  },
  {
    name: 'Trends in American Car Efficiency',
    explanation:
      'This group focuses on American cars that have a wide range of fuel efficiency, reflecting changing trends in designs toward more eco-friendly options without compromising performance.',
    predicate: {
      and: [
        {
          field: 'Origin',
          equal: 'USA',
        },
        {
          field: 'Miles_per_Gallon',
          range: [15, 30],
        },
      ],
    },
  },
];
