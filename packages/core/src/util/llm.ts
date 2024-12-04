import OpenAI from 'openai';
import { OlliPredicateNode } from '../Structure/Types';
import { OlliDataset, OlliFieldDef } from '../Types';
import * as jsonc from 'jsonc-parser';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { backOff } from 'exponential-backoff';
import { simplifyPredicate } from './selection';
import { getDomain, getFieldDef } from './data';

const secrets = process.env.NODE_ENV === 'development' ? require('../secrets/openai.json') : {};
const openai = new OpenAI({
  apiKey: secrets['apiKey'],
  dangerouslyAllowBrowser: true,
});

type LLMResponse = {
  groups: SemanticScaffold[];
};

type SemanticScaffold = {
  name: string;
  explanation: string;
  predicate: LogicalComposition<FieldPredicate>;
};

export async function getDataHighlights(data: OlliDataset, fields: OlliFieldDef[]): Promise<OlliPredicateNode[]> {
  const dataWithActiveFields = data.map((row) => {
    const newRow = {};
    fields.forEach((field) => {
      newRow[field.field] = row[field.field];
    });
    return newRow;
  });
  const csvData = toCSV(dataWithActiveFields);
  const storageKey = 'highlight' + String(hashCode(csvData));
  const cache = localStorage.getItem(storageKey);

  if (cache) {
    console.log('cache hit');
    return JSON.parse(cache);
  } else {
    const prompt = dataHighlightPrompt(csvData);
    console.log(prompt);
    const llmResponse = await queryLLM(prompt);
    console.log('llmResponse', llmResponse.groups);
    const groups = llmResponse.groups.map((group) => {
      return {
        ...group,
        predicate: simplifyPredicate(group.predicate),
      };
    });
    console.log('groups', groups);
    localStorage.setItem(storageKey, JSON.stringify(groups));
    return groups;
  }
}

export async function getSemanticBins(
  data: OlliDataset,
  fields: OlliFieldDef[],
  field: string
): Promise<OlliPredicateNode[]> {
  const fieldDef = getFieldDef(field, fields);

  const dataWithActiveFields = data.map((row) => {
    const newRow = {};
    fields.forEach((field) => {
      newRow[field.field] = row[field.field];
    });
    return newRow;
  });
  const csvData = toCSV(dataWithActiveFields);
  const storageKey = 'bin' + field + String(hashCode(csvData));
  const cache = localStorage.getItem(storageKey);

  if (cache) {
    console.log('cache hit');
    return JSON.parse(cache);
  } else {
    const domain = getDomain(fieldDef, data);
    const prompt = semanticBinPrompt(csvData, fieldDef, domain);
    console.log(prompt);
    const llmResponse = await queryLLM(prompt);
    console.log('llmResponse', llmResponse.groups);
    const groups = llmResponse.groups.map((group) => {
      return {
        ...group,
        predicate: simplifyPredicate(group.predicate),
      };
    });
    console.log('groups', groups);
    localStorage.setItem(storageKey, JSON.stringify(groups));
    return groups;
  }
  return [];
}

const FLAG = true;

async function queryLLM(messages: ChatCompletionMessageParam[]): Promise<LLMResponse> {
  if (!FLAG) {
    console.log('FLAG is false. did not query');
    return { groups: [] };
  }
  console.log('attempting api call');
  const chat = await backOff(() => {
    return openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      seed: 1,
      messages,
    });
  });
  console.log('api call returned');

  return jsonc.parse(chat.choices[0].message.content);
}

const toCSV = (data: OlliDataset) => {
  const header = Object.keys(data[0]).join(',');
  const rows = data.map((row) => Object.values(row).join(','));
  return [header, ...rows].join('\n');
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const predicatePrompt = `
Please return the groups in the format:
{
  "groups": [...]
}
  where each group is in the format:
{
  "name": string,
  "explanation": string,
  "predicate": LogicalComposition<FieldPredicate>
}
Where "predicate" is a Vega-Lite predicate that selects the data points in the group.
A predicate is of the format:
{ "field": [fieldName], [operator]: [value] }.

The valid operators are:
"gt", "gte", "lt", "lte", "equal", "oneOf", "range".

Examples of valid field predicates include:
{ "field": "age", "gt": 18 }
{ "field": "miles", "lte": 27 }
{ "field": "Species", "equal": "Gentoo" }
{ "field": "Horsepower", "range": [100, 150], "inclusive": true }
{ "field": "category", "oneOf": ["a", "b", "c"] }

A logical composition predicate is a JSON object that combines multiple field predicates with "and" or "or" operators.

Here is an example of a logical composition predicate:
{
  "and": [
    { "field": "dob", "range": [1995, 2005], "inclusive": true },
    { "field": "weight", "lt": 150 },
    { "field": "height", "gte": 100 }
  ]
}`;

const dataHighlightPrompt = (csvData: string): ChatCompletionMessageParam[] => {
  return [
    {
      role: 'system',
      content: `You are an expert data analyst. When I provide a dataset, return JSON that groups the data in a semantically meaningful way.`,
    },
    {
      role: 'user',
      content: `Here is the dataset we are analyzing: ${csvData}`,
    },
    {
      role: 'user',
      content: `Consider all the fields in the data.

      You will use domain-specific knowledge, social and political context, and history or current events to identify semantically meaningful groupings of data.

      A good grouping will involve multiple fields, prioritize things that would be interesting or surprising to a data analyst, and require outside knowledge not in the dataset to understand.

      ${predicatePrompt}

      Convert all dates to utc time numeric format. Respond in JSON and return nothing but valid JSON.`,
    },
  ];
};

const semanticBinPrompt = (csvData: string, fieldDef: OlliFieldDef, domain: any[]): ChatCompletionMessageParam[] => {
  if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
    return [
      {
        role: 'system',
        content: `You are an expert data analyst. When I provide a dataset and a field name, return JSON that bins the field in a semantically meaningful way.`,
      },
      {
        role: 'user',
        content: `Here is the dataset we are analyzing: ${csvData}`,
      },
      {
        role: 'user',
        content: `Consider all the fields in the data.

      You will use knowledge of external information relevant to the data, social and political context, and history or current events to identify a semantically meaningful binning of the ${
        fieldDef.field
      } field.

      A binning is a way to group data points into categories. For example, you might bin ages into "child", "adult", and "senior".

      Bins must cover the entire range of the field (i.e. ${domain.toString()}) and be mutually exclusive.

      Please return the bin in the format:
      {
        "groups": [...]
      }
        where each bin is in the format:
      {
        "name": string,
        "explanation": string,
        "predicate": {
          field: "${fieldDef.field}",
          range: [lower, upper],
          inclusive: true
        }
      }

      The "range" field should be an array with two numbers, the lower and upper bounds (inclusive) of the bin.

      Prioritize bins that require contextual knowledge outside of the dataset to understand.

      Convert all dates to utc time numeric format. Respond in JSON and return nothing but valid JSON.`,
      },
    ];
  } else {
    return [
      {
        role: 'system',
        content: `You are an expert data analyst. When I provide a dataset and a field name, return JSON that bins the field in a semantically meaningful way.`,
      },
      {
        role: 'user',
        content: `Here is the dataset we are analyzing: ${csvData}`,
      },
      {
        role: 'user',
        content: `Consider all the fields in the data.

      You will use knowledge of external information relevant to the data, social and political context, and history or current events to identify a semantically meaningful binning of the ${
        fieldDef.field
      } field.

      A binning is a way to group data values into categories. For example, you might bin colors into "primary" and "composite"

      Bins must include every value in the field (i.e. ${domain.toString()}) and be mutually exclusive.

      Please return the bin in the format:
      {
        "groups": [...]
      }
        where each bin is in the format:
      {
        "name": string,
        "explanation": string,
        "predicate": {
          field: "${fieldDef.field}",
          oneOf: [categoryA, categoryB, ...]
        }
      }

      Prioritize bins that require contextual knowledge outside of the dataset to understand.

      Convert all dates to utc time numeric format. Respond in JSON and return nothing but valid JSON.`,
      },
    ];
  }
};
