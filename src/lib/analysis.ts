import type { Entry, AxisId, SleepQuality } from '@/types/entry';
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

// ── 軸×軸のクロス分析 ─────────────────────────────────────────────────────────

export interface AxisPairResult {
  axisIdA: AxisId;
  axisIdB: AxisId;
  /** axisA が 4-6 のエントリにおける axisB の平均 */
  highAvg: number;
  /** axisA が 1-3 のエントリにおける axisB の平均 */
  lowAvg: number;
  /** highAvg - lowAvg（正: 同方向、負: 逆方向） */
  diff: number;
  sampleHigh: number;
  sampleLow: number;
}

const MIN_GROUP = 3; // 各グループの最低サンプル数

export function computeAxisPairAnalysis(entries: Entry[]): AxisPairResult[] {
  const results: AxisPairResult[] = [];

  for (let i = 0; i < AXES.length; i++) {
    for (let j = 0; j < AXES.length; j++) {
      if (i === j) continue;
      const axisA = AXES[i];
      const axisB = AXES[j];

      const highGroup = entries.filter(e => {
        const a = e.axes[axisA.id];
        return a !== null && a !== undefined && a >= 4;
      });
      const lowGroup = entries.filter(e => {
        const a = e.axes[axisA.id];
        return a !== null && a !== undefined && a <= 3;
      });

      if (highGroup.length < MIN_GROUP || lowGroup.length < MIN_GROUP) continue;

      const pickB = (group: Entry[]): number[] =>
        group
          .map(e => e.axes[axisB.id])
          .filter(v => v !== null && v !== undefined) as number[];

      const highBVals = pickB(highGroup);
      const lowBVals  = pickB(lowGroup);
      if (highBVals.length < MIN_GROUP || lowBVals.length < MIN_GROUP) continue;

      const highAvg = avg(highBVals) ?? 0;
      const lowAvg  = avg(lowBVals)  ?? 0;
      const diff = highAvg - lowAvg;

      if (Math.abs(diff) < 0.4) continue; // 差が小さすぎるペアは除外

      results.push({
        axisIdA: axisA.id,
        axisIdB: axisB.id,
        highAvg,
        lowAvg,
        diff,
        sampleHigh: highBVals.length,
        sampleLow:  lowBVals.length,
      });
    }
  }

  // |diff| 降順、重複ペア(A-B と B-A)を除きながらソート
  const seen = new Set<string>();
  return results
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .filter(r => {
      const key = [r.axisIdA, r.axisIdB].sort().join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ── 睡眠×軸のクロス分析 ──────────────────────────────────────────────────────

export interface SleepAxisResult {
  axisId: AxisId;
  goodAvg: number | null;
  normalAvg: number | null;
  poorAvg: number | null;
  /** goodAvg - poorAvg（差が大きいほど睡眠との関連が強い） */
  diff: number;
  totalSample: number;
}

export function computeSleepAxisAnalysis(entries: Entry[]): SleepAxisResult[] {
  const sleepEntries = entries.filter(e => e.reflection?.sleep != null);
  if (sleepEntries.length < 5) return [];

  const byQuality = (q: SleepQuality) =>
    sleepEntries.filter(e => e.reflection.sleep === q);

  const good   = byQuality('good');
  const normal = byQuality('normal');
  const poor   = byQuality('poor');

  return AXES.map(axis => {
    const pickAxis = (group: Entry[]): number[] =>
      group
        .map(e => e.axes[axis.id])
        .filter(v => v !== null && v !== undefined) as number[];

    const goodAvg   = avg(pickAxis(good));
    const normalAvg = avg(pickAxis(normal));
    const poorAvg   = avg(pickAxis(poor));

    const diff = goodAvg !== null && poorAvg !== null
      ? goodAvg - poorAvg
      : 0;

    return {
      axisId: axis.id,
      goodAvg,
      normalAvg,
      poorAvg,
      diff,
      totalSample: sleepEntries.length,
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}
