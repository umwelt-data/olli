import examplesMeta from '../../../docs/_data/examples.json';

const exampleModules = require.context('../../../docs/_includes/examples', false, /-vl\.html$/);

function extractSpecSource(exampleHtml) {
  const specStart = exampleHtml.indexOf('let spec =');
  const vegaSpecStart = exampleHtml.indexOf('let vegaSpec');
  const constVegaSpecStart = exampleHtml.indexOf('const vegaSpec');
  const specEnd = [vegaSpecStart, constVegaSpecStart].filter((index) => index >= 0).sort((left, right) => left - right)[0];

  if (specStart < 0 || specEnd < 0 || specEnd <= specStart) {
    throw new Error('Could not extract a Vega-Lite spec from the example source.');
  }

  const rawSpecSource = exampleHtml.slice(specStart + 'let spec ='.length, specEnd).trim();
  return rawSpecSource.replace(/;?\s*$/, '').trim();
}

function evaluateSpec(specSource) {
  return Function(`"use strict"; return (${specSource});`)();
}

function getVegaLiteExamples() {
  return Object.entries(examplesMeta)
    .map(([id, entry]) => {
      const adapter = entry.adapters?.find((item) => item.name === 'Vega-Lite');

      if (!adapter) {
        return null;
      }

      const fileName = adapter.code.split('/').pop();
      const exampleHtml = exampleModules(`./${fileName}`);
      const specSource = extractSpecSource(exampleHtml);

      return {
        id,
        title: entry.title,
        galleryUrl: entry.url,
        codePath: fileName,
        developmentOnly: Boolean(entry.development_only),
        htmlSource: exampleHtml.trim(),
        specSource,
        spec: evaluateSpec(specSource),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.title.localeCompare(right.title));
}

export const vegaLiteExamples = getVegaLiteExamples();
