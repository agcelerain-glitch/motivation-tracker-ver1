'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/config/design';
import { groupByHighLow, computeAxisDivergence } from '@/lib/analysis';
import { AXES } from '@/config/axes';
import type { Entry } from '@/types/entry';
import CalendarHeatmap from '@/components/review/CalendarHeatmap';
import TrendChart from '@/components/review/TrendChart';
import AxisCompareChart from '@/components/review/AxisCompareChart';

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'entries'), orderBy('logicalDate', 'desc'));
    getDocs(q).then(snap => {
      setEntries(snap.docs.map(d => d.data() as Entry));
      setFetching(false);
    });
  }, [user]);

  if (loading || fetching) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted, fontFamily: 'Zen Kaku Gothic New' }}>読み込み中…</span>
      </div>
    );
  }

  if (!user) { router.replace('/'); return null; }

  const { high, low } = groupByHighLow(entries);
  const divergence = computeAxisDivergence(high, low);

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>分析・振り返り</h1>
      </header>

      <CalendarHeatmap entries={entries} />
      <TrendChart entries={entries} />
      <AxisCompareChart divergence={divergence} high={high} low={low} />

      {entries.length > 0 && (
        <section>
          <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12 }}>振り返りメモ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.filter(e => e.reflection?.insight || e.reflection?.challenge).slice(0, 10).map(e => (
              <div key={e.logicalDate} style={{ background: COLORS.inkRaised, borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Roboto Mono' }}>{e.logicalDate}</p>
                {e.reflection.insight   && <p style={{ color: COLORS.chalk, fontSize: 13, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>気づき: {e.reflection.insight}</p>}
                {e.reflection.challenge && <p style={{ color: COLORS.muted, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>挑戦: {e.reflection.challenge}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
