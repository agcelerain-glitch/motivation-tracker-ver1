'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarDays, faArrowLeft, faPenToSquare, faFaceMeh } from '@fortawesome/free-solid-svg-icons';
import { COLORS } from '@/config/design';
import { groupByHighLow, computeAxisDivergence } from '@/lib/analysis';
import type { Entry } from '@/types/entry';
import CalendarHeatmap from '@/components/review/CalendarHeatmap';
import TrendChart from '@/components/review/TrendChart';
import AxisCompareChart from '@/components/review/AxisCompareChart';

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'entries'));
    getDocs(q)
      .then(snap => {
        const loaded = snap.docs
          .map(d => d.data() as Entry)
          .sort((a, b) => b.logicalDate.localeCompare(a.logicalDate));
        setEntries(loaded);
        setFetching(false);
      })
      .catch(err => {
        console.error('Firestore fetch error:', err);
        setFetchError('データの読み込みに失敗しました。接続を確認してください。');
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

  const hasEntries = entries.length > 0;
  const { high, low } = hasEntries ? groupByHighLow(entries) : { high: [], low: [] };
  const divergence = high.length > 0 && low.length > 0 ? computeAxisDivergence(high, low) : [];

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
          aria-label="ホームへ"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>
          📊 分析・振り返り
        </h1>
      </header>

      {/* エラー表示 */}
      {fetchError && (
        <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ color: COLORS.alert, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>{fetchError}</p>
        </div>
      )}

      {/* カレンダーヒートマップ（常に表示） */}
      <section>
        <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faCalendarDays} style={{ color: COLORS.sprout, fontSize: 14 }} />
          記録カレンダー
        </h2>
        <CalendarHeatmap entries={entries} />
      </section>

      {/* 記録なし → 空状態 */}
      {!hasEntries && (
        <div style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>
            <FontAwesomeIcon icon={faFaceMeh} style={{ color: COLORS.muted }} />
          </span>
          <p style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0, lineHeight: 1.8 }}>
            まだ記録がありません
          </p>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
            今日の記録をはじめると<br />カレンダーとグラフが表示されます ✨
          </p>
          <button
            onClick={() => router.push('/record')}
            style={{
              background: COLORS.sprout, color: COLORS.ink, border: 'none',
              borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer',
              fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            今日を記録する
          </button>
        </div>
      )}

      {/* 記録あり → グラフ類 */}
      {hasEntries && (
        <>
          {/* 推移グラフ */}
          <section>
            <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.sprout, fontSize: 14 }} />
              スコア推移
            </h2>
            <div style={{ background: COLORS.inkRaised, borderRadius: 12, padding: '16px 8px 8px' }}>
              <TrendChart entries={entries} />
            </div>
          </section>

          {/* 傾向分析（データ十分な場合のみ内部で表示） */}
          {divergence.length > 0 && (
            <AxisCompareChart divergence={divergence} high={high} low={low} />
          )}

          {/* 振り返りメモ */}
          {entries.some(e => e.reflection?.insight || e.reflection?.challenge) && (
            <section>
              <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12 }}>
                💭 振り返りメモ
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries
                  .filter(e => e.reflection?.insight || e.reflection?.challenge)
                  .slice(0, 10)
                  .map(e => (
                    <div key={e.logicalDate} style={{ background: COLORS.inkRaised, borderRadius: 8, padding: '12px 14px' }}>
                      <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Roboto Mono' }}>
                        {e.logicalDate}
                      </p>
                      {e.reflection.insight && (
                        <p style={{ color: COLORS.chalk, fontSize: 13, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
                          💡 {e.reflection.insight}
                        </p>
                      )}
                      {e.reflection.challenge && (
                        <p style={{ color: COLORS.muted, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
                          🌱 {e.reflection.challenge}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
