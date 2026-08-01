'use client';
import { COLORS } from '@/config/design';
import { AXES } from '@/config/axes';
import type { AxisDivergenceResult } from '@/lib/analysis';
import type { Entry } from '@/types/entry';

interface Props {
  divergence: AxisDivergenceResult[];
  high: Entry[];
  low: Entry[];
  totalEntries: number;
  currentThreshold: number;
  nextThreshold: number | null;
}

export default function AxisCompareChart({ divergence, high, low, totalEntries, currentThreshold, nextThreshold }: Props) {
  // 傾向なし（3回未満）
  if (currentThreshold === 0) {
    return (
      <section>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 8 }}>傾向分析</h2>
        <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '16px 14px' }}>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: 0 }}>
            あと{3 - totalEntries}回記録すると最初の傾向が見えます
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            {[3, 7, 14, 28].map(n => (
              <div key={n} style={{
                flex: 1, textAlign: 'center', padding: '4px 0',
                borderRadius: 6,
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
      <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 4 }}>傾向分析</h2>
      <p style={{ color: COLORS.sprout, fontSize: 11, fontFamily: 'Roboto Mono', margin: '0 0 12px' }}>
        直近{currentThreshold}回のデータより
      </p>

      {high.length > 0 && low.length > 0 ? (
        <>
          <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
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

      {/* 次の段階への進捗 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[3, 7, 14, 28].map(n => (
            <div key={n} style={{
              flex: 1, textAlign: 'center', padding: '5px 0',
              borderRadius: 6,
              background: totalEntries >= n ? COLORS.sprout : '#2A2D45',
              border: n === currentThreshold ? `1px solid ${COLORS.sprout}` : 'none',
              opacity: totalEntries >= n ? 1 : 0.4,
            }}>
              <span style={{ color: totalEntries >= n ? COLORS.ink : COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono', fontWeight: n === currentThreshold ? 700 : 400 }}>
                {n}回
              </span>
            </div>
          ))}
        </div>
        {nextThreshold !== null && (
          <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: 0 }}>
            あと{nextThreshold - totalEntries}回記録すると直近{nextThreshold}回の傾向が見えます
          </p>
        )}
      </div>
    </section>
  );
}
