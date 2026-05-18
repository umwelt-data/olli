import { describe, it, expect } from 'vitest';
import { predicateToDescription } from './describe.js';
import type { OlliFieldDef } from '../spec/types.js';

const fields: OlliFieldDef[] = [
  { field: 'price', label: 'Price (USD)', type: 'quantitative' },
  { field: 'category', type: 'nominal' },
  { field: 'date', type: 'temporal' },
];

describe('predicateToDescription', () => {
  describe('field predicates', () => {
    it('describes equal predicate', () => {
      const result = predicateToDescription({ field: 'category', equal: 'Books' }, fields);
      expect(result).toBe('`category` equals `Books`');
    });

    it('uses label when available', () => {
      const result = predicateToDescription({ field: 'price', equal: 42 }, fields);
      expect(result).toContain('`Price (USD)`');
    });

    it('describes range predicate', () => {
      const result = predicateToDescription({ field: 'price', range: [10, 50] }, fields);
      expect(result).toBe('`Price (USD)` is between `10` and `50`');
    });

    it('describes lt predicate', () => {
      const result = predicateToDescription({ field: 'price', lt: 100 }, fields);
      expect(result).toBe('`Price (USD)` is less than `100`');
    });

    it('describes lte predicate', () => {
      const result = predicateToDescription({ field: 'price', lte: 100 }, fields);
      expect(result).toBe('`Price (USD)` is less than or equal to `100`');
    });

    it('describes gt predicate', () => {
      const result = predicateToDescription({ field: 'price', gt: 0 }, fields);
      expect(result).toBe('`Price (USD)` is greater than `0`');
    });

    it('describes gte predicate', () => {
      const result = predicateToDescription({ field: 'price', gte: 0 }, fields);
      expect(result).toBe('`Price (USD)` is greater than or equal to `0`');
    });

    it('describes oneOf predicate', () => {
      const result = predicateToDescription({ field: 'category', oneOf: ['A', 'B', 'C'] }, fields);
      expect(result).toBe('`category` is one of `A`, `B`, `C`');
    });

    it('falls back to field name when no label', () => {
      const result = predicateToDescription({ field: 'category', equal: 'X' }, fields);
      expect(result).toContain('`category`');
    });
  });

  describe('logical composition', () => {
    it('joins with and', () => {
      const result = predicateToDescription(
        { and: [{ field: 'price', gt: 10 }, { field: 'price', lt: 100 }] },
        fields,
      );
      expect(result).toContain(' and ');
      expect(result).toContain('greater than');
      expect(result).toContain('less than');
    });

    it('joins with or', () => {
      const result = predicateToDescription(
        { or: [{ field: 'category', equal: 'A' }, { field: 'category', equal: 'B' }] },
        fields,
      );
      expect(result).toContain(' or ');
    });

    it('prefixes with not', () => {
      const result = predicateToDescription(
        { not: { field: 'category', equal: 'A' } },
        fields,
      );
      expect(result).toMatch(/^not /);
    });

    it('handles nested composition', () => {
      const result = predicateToDescription(
        { and: [{ field: 'price', gt: 10 }, { not: { field: 'category', equal: 'A' } }] },
        fields,
      );
      expect(result).toContain(' and ');
      expect(result).toContain('not ');
    });
  });

  it('returns empty string for unknown predicate shape', () => {
    const result = predicateToDescription({ field: 'x' } as any, fields);
    expect(result).toBe('');
  });
});
