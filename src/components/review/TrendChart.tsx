'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/config/design';
import type { Entry } from '@/types/entry';
import { useState } from 'react';

interface Props {
  entries: Entry[];
}

export default function TrendChart({ entries }: Props) {
  const [period, setPeriod] = useState<30 | 90 | 'all'>(30);

  const sorted = [...entries].sort((a, b) => a.logicalDate.localeCompare(b.logicalDate));
  const sliced = period === 'all' ? sorted : sorted.slice(-period);

  const data = sliced.map(e => ({
    date: e.logicalDate.slice(5),
    achievement: e.achievement ?? undefined,
    satisfaction: e.satisfaction ?? undefined,
  }));

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0 }}>推移グラフ</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {([30, 90, 'all'] as const).map(p => (
            <button key={String(p)} onClick={() => setPeriod(p)} style={{ background: period === p ? COLORS.sprout : '#2A2D45', color: period === p ? COLORS.ink : COLORS.muted, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
              {p === 'all' ? '全期間' : `${p}日`}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: -20, right: 10 }}>
          <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 10 }} tickLine={false} />
          <YAxis domain={[1, 7]} ticks={[1,2,3,4,5,6,7]} tick={{ fill: COLORS.muted, fontSize: 10 }} tickLine={false} />
          <Tooltip contentStyle={{ background: COLORS.inkRaised, border: 'none', borderRadius: 8, color: COLORS.chalk, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: COLORS.muted }} />
          <Line type="monotone" dataKey="achievement" name="達成度" stroke="#5FB49C" strokeWidth={2} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="satisfaction" name="満足度" stroke="#8A7BC8" strokeWidth={2} dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
