import { describe, it, expect } from 'vitest';
import { shouldShowNudge } from '../src/lib/carryOver';
import type { TomorrowPlan } from '../src/types/entry';

function plan(count: number, text: string | null = '30分ランニング'): TomorrowPlan {
  return {
    text,
    carriedOver: count > 0,
    carryOverCount: count,
    nudgeShown: false,
    nudgeChoice: null,
    skipped: false,
  };
}

describe('shouldShowNudge', () => {
  it('count=0 → false', () => expect(shouldShowNudge(plan(0))).toBe(false));
  it('count=1 → false', () => expect(shouldShowNudge(plan(1))).toBe(false));
  it('count=2 → false', () => expect(shouldShowNudge(plan(2))).toBe(false));
  it('count=3 → true（閾値到達）', () => expect(shouldShowNudge(plan(3))).toBe(true));
  it('count=4 → false', () => expect(shouldShowNudge(plan(4))).toBe(false));
  it('count=5 → false', () => expect(shouldShowNudge(plan(5))).toBe(false));
  it('count=6 → true（3回ごと）', () => expect(shouldShowNudge(plan(6))).toBe(true));
  it('text=null → 常にfalse', () => expect(shouldShowNudge(plan(3, null))).toBe(false));
  it('null入力 → false', () => expect(shouldShowNudge(null)).toBe(false));
  it('undefined入力 → false', () => expect(shouldShowNudge(undefined)).toBe(false));
});
