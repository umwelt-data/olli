import { describe, it, expect } from 'vitest';
import { enrichWithUSGeo, looksLikeFips } from './enrichGeoData.js';

describe('enrichWithUSGeo', () => {
  it('adds county, state, and region for 5-digit FIPS', () => {
    const data = [
      { id: 6037, rate: 0.1 },
      { id: 17031, rate: 0.05 },
    ];
    const enriched = enrichWithUSGeo(data as any, 'id');
    expect(enriched[0]!['county_name']).toBe('Los Angeles');
    expect(enriched[0]!['state_name']).toBe('California');
    expect(enriched[0]!['region']).toBe('West');
    expect(enriched[1]!['county_name']).toBe('Cook');
    expect(enriched[1]!['state_name']).toBe('Illinois');
    expect(enriched[1]!['region']).toBe('Midwest');
  });

  it('handles string FIPS codes', () => {
    const data = [{ id: '01001', rate: 0.07 }];
    const enriched = enrichWithUSGeo(data as any, 'id');
    expect(enriched[0]!['county_name']).toBe('Autauga');
    expect(enriched[0]!['state_name']).toBe('Alabama');
    expect(enriched[0]!['region']).toBe('South');
  });

  it('gracefully handles unknown FIPS codes', () => {
    const data = [{ id: 99999, rate: 0.01 }];
    const enriched = enrichWithUSGeo(data as any, 'id');
    expect(enriched[0]!['county_name']).toBeUndefined();
    expect(enriched[0]!['rate']).toBe(0.01);
  });

  it('preserves original data fields', () => {
    const data = [{ id: 6037, rate: 0.1, extra: 'keep' }];
    const enriched = enrichWithUSGeo(data as any, 'id');
    expect(enriched[0]!['rate']).toBe(0.1);
    expect(enriched[0]!['extra']).toBe('keep');
  });
});

describe('looksLikeFips', () => {
  it('returns true for numeric ID data', () => {
    const data = [
      { id: 1001 },
      { id: 6037 },
      { id: 17031 },
    ];
    expect(looksLikeFips(data as any, 'id')).toBe(true);
  });

  it('returns true for string FIPS codes', () => {
    const data = [
      { id: '01001' },
      { id: '06037' },
    ];
    expect(looksLikeFips(data as any, 'id')).toBe(true);
  });

  it('returns false for non-numeric IDs', () => {
    const data = [
      { id: 'california' },
      { id: 'texas' },
    ];
    expect(looksLikeFips(data as any, 'id')).toBe(false);
  });

  it('returns false for empty data', () => {
    expect(looksLikeFips([], 'id')).toBe(false);
  });
});
