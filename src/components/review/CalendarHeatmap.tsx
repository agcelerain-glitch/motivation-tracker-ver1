'use client';
import { COLORS } from '@/config/design';
import type { Entry } from '@/types/entry';

interface Props {
  entries: Entry[];
}

function heatColor(value: number | null): string {
  if (value === null) return 'transparent';
  const ratio = (value - 1) / 6;
  const lightness = 20 + ratio * 40;
  return `hsl(162, 35%, ${lightness}%)`;
}

export default function CalendarHeatmap({ entries }: Props) {
  const byDate = new Map(entries.map(e => [e.logicalDate, e]));

  const today = new Date();
  const days: string[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const weeks: string[][] = [];
  let week: string[] = [];
  days.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  return (
    <section>
      <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12 }}>記録カレンダー（直近12週）</h2>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {w.map(day => {
              const e = byDate.get(day);
              const v = e?.satisfaction ?? null;
              return (
                <div
                  key={day}
                  title={`${day}: 満足度 ${v ?? '未記録'}`}
                  style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: v !== null ? heatColor(v) : '#2A2D45',
                    border: v !== null ? 'none' : '1px solid #3A3D55',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 8 }}>
        <span style={{ color: COLORS.muted, fontSize: 10 }}>低</span>
        {[1,2,3,4,5,6,7].map(v => (
          <div key={v} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(v) }} />
        ))}
        <span style={{ color: COLORS.muted, fontSize: 10 }}>高</span>
      </div>
    </section>
  );
}
