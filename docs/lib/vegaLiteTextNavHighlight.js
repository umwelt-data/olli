const TYPE_ENUM = "E";
const TYPE_RANGE_INC = "R";
const TYPE_RANGE_RE = "R-RE";
const TYPE_PRED_LT = "E-LT";
const TYPE_PRED_LTE = "E-LTE";
const TYPE_PRED_GT = "E-GT";
const TYPE_PRED_GTE = "E-GTE";
const TYPE_PRED_VALID = "E-VALID";
const TYPE_PRED_ONE_OF = "E-ONE";

const HIGHLIGHT_TEST = '!length(data("external_state_store")) || vlSelectionTest("external_state_store", datum)';

const predicateToTupleType = (predicate) => {
  if ("equal" in predicate) {
    return TYPE_ENUM;
  }
  if ("lt" in predicate) {
    return TYPE_PRED_LT;
  }
  if ("gt" in predicate) {
    return TYPE_PRED_GT;
  }
  if ("lte" in predicate) {
    return TYPE_PRED_LTE;
  }
  if ("gte" in predicate) {
    return TYPE_PRED_GTE;
  }
  if ("range" in predicate) {
    return predicate.inclusive ? TYPE_RANGE_INC : TYPE_RANGE_RE;
  }
  if ("oneOf" in predicate) {
    return TYPE_PRED_ONE_OF;
  }
  if ("valid" in predicate) {
    return TYPE_PRED_VALID;
  }
  return TYPE_ENUM;
};

const getPredicateValue = (predicate) => {
  const key = Object.keys(predicate).find((candidate) => candidate !== "field");
  return key ? predicate[key] : undefined;
};

export const predicateToSelectionStore = (predicate) => {
  if (!predicate) {
    return null;
  }

  if ("and" in predicate) {
    const stores = predicate.and
      .map((entry) => predicateToSelectionStore(entry))
      .filter(Boolean);
    if (!stores.length) {
      return null;
    }
    return {
      unit: "",
      fields: stores.flatMap((store) => store.fields),
      values: stores.flatMap((store) => store.values),
    };
  }

  if ("or" in predicate || "not" in predicate) {
    return null;
  }

  return {
    unit: "",
    fields: [
      {
        type: predicateToTupleType(predicate),
        field: predicate.field,
      },
    ],
    values: [getPredicateValue(predicate)],
  };
};

const withFillHighlight = (update) => {
  update.opacity = [{ test: HIGHLIGHT_TEST, value: 1 }, { value: 0.2 }];
  update.stroke = { value: "#d1d5db" };
  update.strokeWidth = { value: 1 };
};

const withPointHighlight = (update) => {
  update.opacity = [{ test: HIGHLIGHT_TEST, value: 0.9 }, { value: 0.15 }];
  update.size = [{ test: HIGHLIGHT_TEST, value: 110 }, { value: 70 }];
  update.strokeWidth = [{ test: HIGHLIGHT_TEST, value: 2 }, { value: 1 }];
};

const withLineHighlight = (update) => {
  update.opacity = [{ test: HIGHLIGHT_TEST, value: 1 }, { value: 0.18 }];
  update.strokeWidth = [{ test: HIGHLIGHT_TEST, value: 2 }, { value: 1.25 }];
};

const withArcHighlight = (update) => {
  update.opacity = [{ test: HIGHLIGHT_TEST, value: 1 }, { value: 0.2 }];
  update.stroke = { value: "#d1d5db" };
  update.strokeWidth = { value: 1 };
};

const withShapeHighlight = (update) => {
  update.opacity = [{ test: HIGHLIGHT_TEST, value: 1 }, { value: 0.25 }];
  update.stroke = { value: "#d1d5db" };
  update.strokeWidth = { value: 1 };
};

const applyMarkHighlight = (mark) => {
  if (!mark || !mark.encode || !mark.encode.update) {
    return;
  }

  if (mark.type === "symbol") {
    withPointHighlight(mark.encode.update);
    return;
  }

  if (mark.type === "line") {
    withLineHighlight(mark.encode.update);
    return;
  }

  if (mark.type === "arc") {
    withArcHighlight(mark.encode.update);
    return;
  }

  if (mark.type === "shape") {
    withShapeHighlight(mark.encode.update);
    return;
  }

  if (mark.type === "rect") {
    withFillHighlight(mark.encode.update);
  }
};

const walkMarks = (marks = []) => {
  marks.forEach((mark) => {
    applyMarkHighlight(mark);
    if (mark.marks) {
      walkMarks(mark.marks);
    }
  });
};

export const addTextNavHighlight = (vegaSpec) => {
  const highlightedSpec = structuredClone(vegaSpec);
  highlightedSpec.data = [...(highlightedSpec.data || []), { name: "external_state_store", values: [] }];
  walkMarks(highlightedSpec.marks);
  return highlightedSpec;
};

export const mountHighlightedVegaLiteExample = async ({
  baseSpec,
  visualizationId = "Visualization-Vega-Lite",
  treeId = "AccessibilityTree-Vega-Lite",
}) => {
  const visualizationElement = document.getElementById(visualizationId);
  const treeElement = document.getElementById(treeId);

  const highlightedSpec = addTextNavHighlight(vegaLite.compile(baseSpec).spec);
  const runtime = vega.parse(highlightedSpec);
  const view = await new vega.View(runtime).logLevel(vega.Warn).initialize(visualizationElement).renderer("svg").hover().runAsync();

  const updateFocus = (predicate) => {
    const store = predicateToSelectionStore(predicate);
    view.data("external_state_store", store ? [store] : []).run();
  };

  const olliVisSpec = await OlliAdapters.VegaLiteAdapter(baseSpec);
  treeElement.append(
    olli(olliVisSpec, {
      onTextNavPred: (predicate) => {
        updateFocus(predicate);
      },
    })
  );

  return { view };
};
