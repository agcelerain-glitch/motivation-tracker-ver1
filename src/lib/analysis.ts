import type { Entry, AxisId } from '@/types/entry';
import { AXES } from '@/config/axes';

export interface AxisDivergenceResult {
  axisId: AxisId;
  highAvg: number;
  lowAvg: number;
  diff: number;
}

export const TREND_THRESHOLDS = [3, 7, 14, 28] as const;

export interface TrendStage {
  currentThreshold: number;
  nextThreshold: number | null;
}

/** 記録回数から現在の傾向段階と次の段階を返す */
export function getTrendStage(n: number): TrendStage {
  for (let i = TREND_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= TREND_THRESHOLDS[i]) {
      return {
        currentThreshold: TREND_THRESHOLDS[i],
        nextThreshold: (TREND_THRESHOLDS[i + 1] as number | undefined) ?? null,
      };
    }
  }
  return { currentThreshold: 0, nextThreshold: 3 };
}

export function groupByHighLow(
  entries: Entry[],
  field: 'satisfaction' | 'achievement' = 'satisfaction',
  limit?: number,
): { high: Entry[]; low: Entry[] } {
  // entries は日付降順でソート済みと仮定。limit 件だけ使う
  const target = limit ? entries.slice(0, limit) : entries;
  const sorted = target
    .filter(e => e[field] !== null && e[field] !== undefined)
    .sort((a, b) => (b[field] ?? 0) - (a[field] ?? 0));

  const threshold = Math.max(1, Math.floor(sorted.length * 0.3));
  return {
    high: sorted.slice(0, threshold),
    low:  sorted.slice(sorted.length - threshold),
  };
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function computeAxisDivergence(
  high: Entry[],
  low: Entry[],
): AxisDivergenceResult[] {
  return AXES.map(axis => {
    const pick = (entries: Entry[]) =>
      entries
        .map(e => e.axes[axis.id])
        .filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined)
        .map(v => axis.centerIsIdeal ? Math.abs(v - 3.5) : v);

    const highAvg = avg(pick(high)) ?? 0;
    const lowAvg  = avg(pick(low))  ?? 0;
    return {
      axisId: axis.id,
      highAvg,
      lowAvg,
      diff: Math.abs(highAvg - lowAvg),
    };
  }).sort((a, b) => b.diff - a.diff);
}
