'use client';
import { COLORS } from '@/config/design';
import { AXES } from '@/config/axes';
import type { AxisDivergenceResult } from '@/lib/analysis';
import type { Entry } from '@/types/entry';

const ALL_PERIODS = [3, 7, 14, 28] as const;

interface Props {
  divergence: AxisDivergenceResult[];
  high: Entry[];
  low: Entry[];
  totalEntries: number;
  selectedPeriod: number;
  availablePeriods: number[];
  onPeriodChange: (n: number) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

function RefreshButton({ onClick, refreshing }: { onClick: () => void; refreshing: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      aria-label="傾向分析を更新"
      style={{
        background: 'none', border: 'none', cursor: refreshing ? 'default' : 'pointer',
        color: refreshing ? COLORS.muted : COLORS.sprout,
        fontSize: 13, padding: '2px 6px', borderRadius: 6, lineHeight: 1,
        transition: 'color 0.15s',
      }}
    >
      <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
    </button>
  );
}

export default function AxisCompareChart({
  divergence, high, low, totalEntries,
  selectedPeriod, availablePeriods, onPeriodChange,
  onRefresh, refreshing,
}: Props) {

  const nextMilestone = ALL_PERIODS.find(n => n > totalEntries) ?? null;

  // データ不足（3回未満）
  if (totalEntries < 3) {
    return (
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0 }}>傾向分析</h2>
          <RefreshButton onClick={onRefresh} refreshing={refreshing} />
        </div>
        <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '16px 14px' }}>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: '0 0 12px' }}>
            あと{3 - totalEntries}回記録すると最初の傾向が見えます
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALL_PERIODS.map(n => (
              <div key={n} style={{
                flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6,
                background: totalEntries >= n ? COLORS.sprout : '#2A2D45',
                opacity: totalEntries >= n ? 1 : 0.4,
              }}>
                <span style={{ color: totalEntries >= n ? COLORS.ink : COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono' }}>{n}回</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const top3 = divergence.slice(0, 3);
  const axisDefs = new Map(AXES.map(a => [a.id, a]));

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0 }}>傾向分析</h2>
        <RefreshButton onClick={onRefresh} refreshing={refreshing} />
      </div>

      {/* 期間選択ボタン */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {ALL_PERIODS.map(n => {
          const available = availablePeriods.includes(n);
          const selected  = n === selectedPeriod;
          return (
            <button
              key={n}
              onClick={() => available && onPeriodChange(n)}
              disabled={!available}
              style={{
                flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 6, border: 'none',
                cursor: available ? 'pointer' : 'default',
                background: selected ? COLORS.sprout : available ? '#2A2D45' : '#1F2238',
                color: selected ? COLORS.ink : available ? COLORS.chalk : COLORS.muted,
                fontSize: 11, fontFamily: 'Roboto Mono', fontWeight: selected ? 700 : 400,
                opacity: available ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
            >
              {n}回
            </button>
          );
        })}
      </div>

      <p style={{ color: COLORS.sprout, fontSize: 11, fontFamily: 'Roboto Mono', margin: '0 0 12px' }}>
        直近{selectedPeriod}回のデータより
      </p>

      {high.length > 0 && low.length > 0 ? (
        <>
          {/* サマリーブロック */}
          <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 8px', fontFamily: 'Zen Kaku Gothic New' }}>満足度が高かった日は</p>
            {top3.map(r => {
              const axis = axisDefs.get(r.axisId);
              if (!axis) return null;
              const highLeans = r.highAvg < r.lowAvg ? axis.poleA : axis.poleB;
              return (
                <p key={r.axisId} style={{ color: COLORS.chalk, fontSize: 13, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
                  ・「{highLeans}」寄りだった（差 {r.diff.toFixed(1)}）
                </p>
              );
            })}
            <p style={{ color: COLORS.muted, fontSize: 10, margin: '8px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
              ※ 相関であり因果ではありません
            </p>
          </div>

          {/* 凡例・読み方の説明 */}
          <div style={{ background: '#252840', border: '1px solid #3A3D55', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 5px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
              <span style={{ color: '#5FB49C', fontWeight: 700 }}>高満足</span>　直近{selectedPeriod}回のうち満足度が上位30%だった日の、各軸の平均値
            </p>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
              <span style={{ color: '#8A7BC8', fontWeight: 700 }}>低満足</span>　下位30%の日の平均値。棒の長さはバンド1〜6における位置を示します
            </p>
          </div>

          {/* 軸別バー */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {divergence.map(r => {
              const axis = axisDefs.get(r.axisId);
              if (!axis) return null;
              const maxVal = 5;
              const highBarW = (r.highAvg / maxVal) * 100;
              const lowBarW  = (r.lowAvg  / maxVal) * 100;
              return (
                <div key={r.axisId}>
                  <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>
                    {axis.poleA} ↔ {axis.poleB}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#5FB49C', fontSize: 9, width: 42, flexShrink: 0, fontFamily: 'Roboto Mono' }}>高満足</span>
                      <div style={{ flex: 1, height: 8, background: '#2A2D45', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${highBarW}%`, background: '#5FB49C', borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#8A7BC8', fontSize: 9, width: 42, flexShrink: 0, fontFamily: 'Roboto Mono' }}>低満足</span>
                      <div style={{ flex: 1, height: 8, background: '#2A2D45', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${lowBarW}%`, background: '#8A7BC8', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: 0 }}>
            軸のデータがまだ少ないため傾向を計算できません
          </p>
        </div>
      )}

      {/* 次のマイルストーンへの進捗 */}
      {nextMilestone !== null && (
        <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: '14px 0 0' }}>
          あと{nextMilestone - totalEntries}回記録すると直近{nextMilestone}回の傾向が選べます
        </p>
      )}
    </section>
  );
}
