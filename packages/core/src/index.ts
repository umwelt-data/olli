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
    name: 'MSFT Price Decline in Early 2000s',
    explanation:
      "This group includes data points showing a significant decrease in Microsoft's stock price during the early 2000s, especially from 2000 to 2001. This period corresponds with the dot-com bubble burst and economic slowdown.",
    predicate: {
      and: [
        {
          field: 'symbol',
          equal: 'MSFT',
        },
        {
          field: 'price',
          lte: 30,
        },
        {
          field: 'date',
          range: [946684800000, 1093756800000],
        },
      ],
    },
  },
  {
    name: 'AMZN Growth Post-2008 Financial Crisis',
    explanation:
      "This group captures Amazon's stock price trajectory showing consistent growth after the 2008 financial crisis, correlating with the rise of e-commerce during and after that economic downturn.",
    predicate: {
      and: [
        {
          field: 'symbol',
          equal: 'AMZN',
        },
        {
          field: 'price',
          gte: 100,
        },
        {
          field: 'date',
          gte: 1220227200000,
        },
      ],
    },
  },
  {
    name: 'IBM Stock Resilience Post-2000 Dot-com Bubble',
    explanation:
      'This group involves price data for IBM, reflecting relative stability in its stock price amidst the volatility of the early 2000s, aligned with its transition towards services and cloud computing.',
    predicate: {
      and: [
        {
          field: 'symbol',
          equal: 'IBM',
        },
        {
          field: 'price',
          gte: 80,
        },
        {
          field: 'date',
          range: [946684800000, 1104537600000],
        },
      ],
    },
  },
  {
    name: 'AAPL Price Surge During the Tech Boom',
    explanation:
      'This group focuses on Apple’s stock price during the late 2000s and early 2010s, highlighting its rise in value matched with the smartphone revolution and innovation of products like the iPhone.',
    predicate: {
      and: [
        {
          field: 'symbol',
          equal: 'AAPL',
        },
        {
          field: 'price',
          gte: 150,
        },
        {
          field: 'date',
          range: [1220227200000, 1356998400000],
        },
      ],
    },
  },
  {
    name: 'GOOG Price Volatility in 2008-2009',
    explanation:
      "This group tracks Google's stock price fluctuations during the 2008 financial crisis, showcasing the company's ability to recover quickly compared to other tech stocks, indicating its strong market position.",
    predicate: {
      and: [
        {
          field: 'symbol',
          equal: 'GOOG',
        },
        {
          field: 'price',
          range: [300, 600],
        },
        {
          field: 'date',
          range: [1199145600000, 1262304000000],
        },
      ],
    },
  },
];
