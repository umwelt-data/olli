import { describe, expect, it } from 'vitest';
import { assembleParts } from './describe.js';

describe('assembleParts', () => {
  it('returns empty string for empty array', () => {
    expect(assembleParts([])).toBe('');
  });

  it('capitalizes a single sentence part and adds trailing period', () => {
    expect(assembleParts([{ text: 'hello world', joinHint: 'sentence' }])).toBe('Hello world.');
  });

  it('capitalizes a single clause part and adds trailing period', () => {
    expect(assembleParts([{ text: 'with axes X and Y', joinHint: 'clause' }])).toBe('With axes X and Y.');
  });

  it('joins multiple sentence parts with period and capitalizes each', () => {
    expect(assembleParts([
      { text: 'first part', joinHint: 'sentence' },
      { text: 'second part', joinHint: 'sentence' },
    ])).toBe('First part. Second part.');
  });

  it('joins sentence followed by clause with comma', () => {
    expect(assembleParts([
      { text: 'a bar chart', joinHint: 'sentence' },
      { text: 'with axes Category and Value', joinHint: 'clause' },
    ])).toBe('A bar chart, with axes Category and Value.');
  });

  it('joins sentence + clause + sentence correctly', () => {
    expect(assembleParts([
      { text: 'x-axis titled Category', joinHint: 'sentence' },
      { text: 'for a nominal scale', joinHint: 'clause' },
      { text: 'avg value: 20', joinHint: 'sentence' },
    ])).toBe('X-axis titled Category, for a nominal scale. Avg value: 20.');
  });

  it('strips trailing period from fragments before joining', () => {
    expect(assembleParts([
      { text: 'Group A.', joinHint: 'sentence' },
      { text: 'Diagram.', joinHint: 'sentence' },
    ])).toBe('Group A. Diagram.');
  });

  it('does not produce double periods', () => {
    const result = assembleParts([
      { text: 'Sales by Category.', joinHint: 'sentence' },
      { text: 'a bar chart', joinHint: 'clause' },
    ]);
    expect(result).not.toContain('..');
    expect(result).toBe('Sales by Category, a bar chart.');
  });

  it('handles already-capitalized text', () => {
    expect(assembleParts([
      { text: 'Already Capitalized', joinHint: 'sentence' },
    ])).toBe('Already Capitalized.');
  });

  it('handles multiple consecutive clause parts', () => {
    expect(assembleParts([
      { text: 'a bar chart', joinHint: 'sentence' },
      { text: 'with axes X and Y', joinHint: 'clause' },
      { text: 'for a nominal scale', joinHint: 'clause' },
    ])).toBe('A bar chart, with axes X and Y, for a nominal scale.');
  });
});
