'use client';
import { COLORS } from '@/config/design';
import { AXES } from '@/config/axes';
import type { AxisPairResult, SleepAxisResult } from '@/lib/analysis';

interface Props {
  pairs: AxisPairResult[];
  sleepAxes: SleepAxisResult[];
  totalEntries: number;
}

const SLEEP_COLOR = { good: '#5FB49C', normal: '#7A7F9A', poor: '#8A7BC8' };
const SLEEP_LABEL = { good: '熟睡', normal: 'ふつう', poor: '寝不足' };

function BarRow({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (value === null) return null;
  const pct = ((value - 1) / 5) * 100; // 1-6 → 0-100%
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ color, fontSize: 9, width: 36, flexShrink: 0, fontFamily: 'Roboto Mono' }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: '#2A2D45', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ color: COLORS.muted, fontSize: 9, fontFamily: 'Roboto Mono', width: 22, textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function AxisCrossChart({ pairs, sleepAxes, totalEntries }: Props) {
  const axisDefs = new Map(AXES.map(a => [a.id, a]));
  const hasSleep = sleepAxes.some(s => s.totalSample >= 5);
  const hasEnoughForPairs = totalEntries >= 7;

  if (!hasEnoughForPairs && !hasSleep) {
    return (
      <section>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 8 }}>軸の相関</h2>
        <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7 }}>
          記録が増えると軸同士の傾向が表示されます
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 16 }}>軸の相関</h2>

      {/* 睡眠×軸 */}
      {hasSleep && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: COLORS.sprout, fontSize: 11, fontFamily: 'Roboto Mono', margin: '0 0 10px' }}>
            睡眠の質と各軸
          </p>
          <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 14px', lineHeight: 1.5 }}>
            ※ バーが右ほど poleB 側、左ほど poleA 側です
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sleepAxes.slice(0, 5).map(s => {
              const axis = axisDefs.get(s.axisId);
              if (!axis) return null;
              // 熟睡と寝不足の差が小さい軸は表示しない
              if (Math.abs(s.diff) < 0.4) return null;
              const higherSleep = s.diff > 0 ? '熟睡' : '寝不足';
              const leansPole = s.diff > 0 ? axis.poleB : axis.poleA;
              return (
                <div key={s.axisId}>
                  <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New' }}>
                    {axis.poleA} ↔ {axis.poleB}
                  </p>
                  <BarRow label={SLEEP_LABEL.good}   value={s.goodAvg}   color={SLEEP_COLOR.good} />
                  <BarRow label={SLEEP_LABEL.normal} value={s.normalAvg} color={SLEEP_COLOR.normal} />
                  <BarRow label={SLEEP_LABEL.poor}   value={s.poorAvg}   color={SLEEP_COLOR.poor} />
                  <p style={{ color: COLORS.muted, fontSize: 10, margin: '4px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
                    {higherSleep}の日ほど「{leansPole}」寄りの傾向（差 {Math.abs(s.diff).toFixed(1)}）
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 軸×軸 */}
      {hasEnoughForPairs && pairs.length > 0 && (
        <div>
          <p style={{ color: COLORS.sprout, fontSize: 11, fontFamily: 'Roboto Mono', margin: '0 0 10px' }}>
            軸同士の傾向（上位{Math.min(pairs.length, 5)}ペア）
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pairs.slice(0, 5).map(r => {
              const axisA = axisDefs.get(r.axisIdA);
              const axisB = axisDefs.get(r.axisIdB);
              if (!axisA || !axisB) return null;
              // A が poleB 側（4-6）のとき、B はどちら？
              const aPole = axisA.poleB; // 高い側 (4-6)
              const bPole = r.diff > 0 ? axisB.poleB : axisB.poleA; // diff > 0 なら B も高い
              const strength = Math.abs(r.diff) >= 1.5 ? '顕著な' : Math.abs(r.diff) >= 0.8 ? 'やや' : '';
              return (
                <div key={`${r.axisIdA}-${r.axisIdB}`} style={{ background: COLORS.inkRaised, borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ color: COLORS.chalk, fontSize: 12, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
                    「{aPole}」の日は「{bPole}」{strength}寄りの傾向
                  </p>
                  <p style={{ color: COLORS.muted, fontSize: 10, margin: 0, fontFamily: 'Roboto Mono' }}>
                    {axisA.poleA}↔{axisA.poleB} / {axisB.poleA}↔{axisB.poleB}　差 {Math.abs(r.diff).toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>
          {pairs.length === 0 && (
            <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
              まだ有意な傾向が見つかりません。記録が増えると現れることがあります。
            </p>
          )}
        </div>
      )}

      {hasEnoughForPairs && pairs.length === 0 && !hasSleep && (
        <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
          まだ有意な軸間の傾向が見つかりません。記録が増えると現れることがあります。
        </p>
      )}

      <p style={{ color: COLORS.muted, fontSize: 10, margin: '14px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
        ※ 相関であり因果ではありません
      </p>
    </section>
  );
}
