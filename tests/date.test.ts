import { describe, it, expect } from 'vitest';
import { getLogicalDate } from '../src/lib/date';

function jst(dateStr: string): Date {
  return new Date(`${dateStr}+09:00`);
}

describe('getLogicalDate', () => {
  it('2026-07-24 12:00 JST → 2026-07-24', () => {
    expect(getLogicalDate(jst('2026-07-24T12:00:00'))).toBe('2026-07-24');
  });

  it('2026-07-24 23:59 JST → 2026-07-24', () => {
    expect(getLogicalDate(jst('2026-07-24T23:59:00'))).toBe('2026-07-24');
  });

  it('2026-07-25 03:59 JST → 2026-07-24（深夜は前日扱い）', () => {
    expect(getLogicalDate(jst('2026-07-25T03:59:00'))).toBe('2026-07-24');
  });

  it('2026-07-25 04:00 JST → 2026-07-25（境界）', () => {
    expect(getLogicalDate(jst('2026-07-25T04:00:00'))).toBe('2026-07-25');
  });

  it('2026-03-01 02:00 JST → 2026-02-28（月またぎ）', () => {
    expect(getLogicalDate(jst('2026-03-01T02:00:00'))).toBe('2026-02-28');
  });

  it('2027-01-01 01:00 JST → 2026-12-31（年またぎ）', () => {
    expect(getLogicalDate(jst('2027-01-01T01:00:00'))).toBe('2026-12-31');
  });
});
