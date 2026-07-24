'use client';
import { COLORS, BAND_COLORS } from '@/config/design';
import { AXES } from '@/config/axes';
import type { AxisDivergenceResult } from '@/lib/analysis';
import type { Entry } from '@/types/entry';

interface Props {
  divergence: AxisDivergenceResult[];
  high: Entry[];
  low: Entry[];
}

const MIN_SAMPLE = 5;

export default function AxisCompareChart({ divergence, high, low }: Props) {
  if (high.length < MIN_SAMPLE || low.length < MIN_SAMPLE) {
    return (
      <section>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 8 }}>傾向分析</h2>
        <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
          あと{Math.max(0, MIN_SAMPLE - high.length) + Math.max(0, MIN_SAMPLE - low.length)}日記録すると傾向が見えます
        </p>
      </section>
    );
  }

  const top3 = divergence.slice(0, 3);
  const axisDefs = new Map(AXES.map(a => [a.id, a]));

  return (
    <section>
      <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 8 }}>傾向分析</h2>
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
    </section>
  );
}
