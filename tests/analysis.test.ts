import { describe, it, expect } from 'vitest';
import { computeAxisDivergence, groupByHighLow } from '../src/lib/analysis';
import type { Entry } from '../src/types/entry';

function makeEntry(satisfaction: number | null, axisValue: number | null, date: string): Partial<Entry> {
  return {
    logicalDate: date,
    satisfaction: satisfaction as Entry['satisfaction'],
    axes: axisValue !== null ? { expectation_crisis: axisValue as Entry['axes']['expectation_crisis'] } : {},
  };
}

describe('groupByHighLow', () => {
  const entries = [
    makeEntry(7, 1, '2026-01-01'),
    makeEntry(6, 2, '2026-01-02'),
    makeEntry(5, 3, '2026-01-03'),
    makeEntry(4, 4, '2026-01-04'),
    makeEntry(3, 5, '2026-01-05'),
    makeEntry(2, 6, '2026-01-06'),
    makeEntry(1, 1, '2026-01-07'),
  ] as Entry[];

  it('上位30%・下位30%を正しく分ける', () => {
    const { high, low } = groupByHighLow(entries);
    expect(high.length).toBeGreaterThan(0);
    expect(low.length).toBeGreaterThan(0);
    const minHigh = Math.min(...high.map(e => e.satisfaction ?? 0));
    const maxLow = Math.max(...low.map(e => e.satisfaction ?? 0));
    expect(minHigh).toBeGreaterThan(maxLow);
  });
});

describe('computeAxisDivergence', () => {
  it('nullを除外して平均を計算する', () => {
    const high = [
      { axes: { expectation_crisis: 1 } },
      { axes: { expectation_crisis: null } },
      { axes: { expectation_crisis: 2 } },
    ] as unknown as Entry[];
    const low = [
      { axes: { expectation_crisis: 5 } },
      { axes: { expectation_crisis: 6 } },
    ] as unknown as Entry[];
    const result = computeAxisDivergence(high, low);
    const ec = result.find(r => r.axisId === 'expectation_crisis');
    expect(ec).toBeDefined();
    expect(ec!.highAvg).toBeCloseTo(1.5);
    expect(ec!.lowAvg).toBeCloseTo(5.5);
  });
});
