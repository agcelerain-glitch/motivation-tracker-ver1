'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarDays, faArrowLeft, faPenToSquare, faFaceMeh, faBullseye, faBrain, faRotate } from '@fortawesome/free-solid-svg-icons';
import { COLORS, BAND_COLORS } from '@/config/design';
import { AXES } from '@/config/axes';
import { groupByHighLow, computeAxisDivergence, getTrendStage, computeAxisPairAnalysis, computeSleepAxisAnalysis } from '@/lib/analysis';
import type { Entry } from '@/types/entry';
import AxisCrossChart from '@/components/review/AxisCrossChart';
import CalendarHeatmap from '@/components/review/CalendarHeatmap';
import TrendChart from '@/components/review/TrendChart';
import AxisCompareChart from '@/components/review/AxisCompareChart';

interface ReviewTask {
  id: string;
  title: string;
  why: string;
  deadline: string | null;
  status: 'active' | 'done' | 'paused';
}

const TASK_STATUS_LABEL: Record<ReviewTask['status'], string> = {
  active: '継続中', paused: '一時停止中', done: '達成',
};
const TASK_STATUS_COLOR: Record<ReviewTask['status'], string> = {
  active: '#5FB49C', paused: '#D4B840', done: '#4A8FD4',
};

const EMOTION_CONFIG: Record<string, { label: string; color: string }> = {
  joy:    { label: '喜', color: '#E5C04A' },
  anger:  { label: '怒', color: '#D94F5C' },
  sorrow: { label: '哀', color: '#4A8FD4' },
  fun:    { label: '楽', color: '#5FB49C' },
  calm:   { label: '凪', color: '#7A7F9A' },
};

function EntryDetailContent({ entry }: { entry: Entry }) {
  const axes = entry.axes ?? {};
  const axesToShow = AXES.filter(a => a.id in axes);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>

      {/* 達成度・満足度 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New' }}>達成度　</span>
          <span style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Roboto Mono', fontWeight: 700 }}>
            {entry.achievement ?? '—'} <span style={{ fontSize: 11, color: COLORS.muted }}>/7</span>
          </span>
        </div>
        <div>
          <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New' }}>満足度　</span>
          <span style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Roboto Mono', fontWeight: 700 }}>
            {entry.satisfaction ?? '—'} <span style={{ fontSize: 11, color: COLORS.muted }}>/7</span>
          </span>
        </div>
      </div>

      {/* 感情 */}
      {(entry.emotions?.length ?? 0) > 0 && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New' }}>感情</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {entry.emotions.map(e => {
              const cfg = EMOTION_CONFIG[e];
              return (
                <span key={e} style={{
                  background: `${cfg?.color ?? COLORS.muted}25`,
                  color: cfg?.color ?? COLORS.muted,
                  fontSize: 13, padding: '3px 12px', borderRadius: 20,
                  fontFamily: 'Zen Kaku Gothic New', border: `1px solid ${cfg?.color ?? COLORS.muted}50`,
                }}>
                  {cfg?.label ?? e}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* やったこと */}
      {!entry.did?.skipped && ((entry.did?.tags?.length ?? 0) > 0 || entry.did?.note) && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New' }}>やったこと</p>
          {(entry.did.tags?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: entry.did.note ? 6 : 0 }}>
              {entry.did.tags.map((tag, i) => (
                <span key={i} style={{ background: `${COLORS.sprout}20`, color: COLORS.sprout, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontFamily: 'Zen Kaku Gothic New' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {entry.did.note && (
            <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>{entry.did.note}</p>
          )}
        </div>
      )}

      {/* できなかったこと */}
      {!entry.didnt?.skipped && ((entry.didnt?.tags?.length ?? 0) > 0 || entry.didnt?.note) && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New' }}>できなかったこと</p>
          {(entry.didnt.tags?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: entry.didnt.note ? 6 : 0 }}>
              {entry.didnt.tags.map((tag, i) => (
                <span key={i} style={{ background: '#2A2D45', color: COLORS.muted, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontFamily: 'Zen Kaku Gothic New' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {entry.didnt.note && (
            <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>{entry.didnt.note}</p>
          )}
        </div>
      )}

      {/* 軸スコア */}
      {axesToShow.length > 0 && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 8px', fontFamily: 'Zen Kaku Gothic New' }}>軸スコア</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {axesToShow.map(axisDef => {
              const band = axes[axisDef.id];
              if (band === undefined) return null;
              return (
                <div key={axisDef.id}>
                  {/* 質問文 */}
                  <p style={{ color: COLORS.muted, fontSize: 10, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>
                    {axisDef.question}
                  </p>
                  {band !== null ? (
                    /* 6段階ビジュアルバー */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* 左ラベル（poleA 側 = バンド 1〜3 の場合のみ表示） */}
                      <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden' }}>
                        {band <= 3 && (
                          <span style={{
                            color: BAND_COLORS[band - 1].hex,
                            fontSize: 11, fontFamily: 'Zen Kaku Gothic New',
                            display: 'inline-block', maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {axisDef.poleA}
                          </span>
                        )}
                      </div>
                      {/* 6マス */}
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        {([1,2,3,4,5,6] as const).map(i => (
                          <div key={i} style={{
                            width: 14, height: 14, borderRadius: 3,
                            background: i === band
                              ? BAND_COLORS[i - 1].hex
                              : '#3A3D55',
                          }} />
                        ))}
                      </div>
                      {/* 右ラベル（poleB 側 = バンド 4〜6 の場合のみ表示） */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        {band >= 4 && (
                          <span style={{
                            color: BAND_COLORS[band - 1].hex,
                            fontSize: 11, fontFamily: 'Zen Kaku Gothic New',
                            display: 'inline-block', maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {axisDef.poleB}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: COLORS.muted, fontSize: 11 }}>わからない</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 睡眠 */}
      {entry.reflection?.sleep && (() => {
        const sleepConfig = {
          good:   { label: '熟睡',  color: '#5FB49C' },
          normal: { label: 'ふつう', color: '#7A7F9A' },
          poor:   { label: '寝不足', color: '#8A7BC8' },
        }[entry.reflection.sleep];
        return (
          <div>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>昨夜の睡眠</p>
            <span style={{
              background: `${sleepConfig.color}22`,
              color: sleepConfig.color,
              fontSize: 13, padding: '3px 14px', borderRadius: 20,
              fontFamily: 'Zen Kaku Gothic New', border: `1px solid ${sleepConfig.color}50`,
            }}>
              {sleepConfig.label}
            </span>
          </div>
        );
      })()}

      {/* 気づき・挑戦 */}
      {!entry.reflection?.skipped && (entry.reflection?.insight || entry.reflection?.challenge) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.reflection.insight && (
            <div>
              <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 2px', fontFamily: 'Zen Kaku Gothic New' }}>今日の気づき</p>
              <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>{entry.reflection.insight}</p>
            </div>
          )}
          {entry.reflection.challenge && (
            <div>
              <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 2px', fontFamily: 'Zen Kaku Gothic New' }}>今日の挑戦</p>
              <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>{entry.reflection.challenge}</p>
            </div>
          )}
        </div>
      )}

      {/* 明日のやること */}
      {!entry.tomorrow?.skipped && entry.tomorrow?.text && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 2px', fontFamily: 'Zen Kaku Gothic New' }}>明日のやること</p>
          <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>{entry.tomorrow.text}</p>
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  aiIncludeNotes?: boolean;
  aiFeedbackEnabled?: boolean;
}

interface NotesAnalysis {
  analysis: string;
  generatedAt: { seconds: number } | null;
}

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notesAnalysis, setNotesAnalysis] = useState<NotesAnalysis | null>(null);
  const [analyzingNotes, setAnalyzingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [refreshingTrend, setRefreshingTrend] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);

  const loadEntries = async (uid: string) => {
    const snap = await getDocs(query(collection(db, 'users', uid, 'entries')));
    return snap.docs
      .map(d => d.data() as Entry)
      .sort((a, b) => b.logicalDate.localeCompare(a.logicalDate));
  };

  const handleRefreshTrend = async () => {
    if (!user || refreshingTrend) return;
    setRefreshingTrend(true);
    try {
      const loaded = await loadEntries(user.uid);
      setEntries(loaded);
    } catch (err) {
      console.error('傾向分析の更新エラー:', err);
    } finally {
      setRefreshingTrend(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadEntries(user.uid)
      .then(loaded => {
        setEntries(loaded);
        const { currentThreshold } = getTrendStage(loaded.length);
        setSelectedPeriod(p => p > 0 ? p : currentThreshold);
        setFetching(false);
      })
      .catch(err => {
        console.error('Firestore fetch error:', err);
        setFetchError('データの読み込みに失敗しました。接続を確認してください。');
        setFetching(false);
      });

    const tq = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    getDocs(tq)
      .then(snap => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewTask)));
      })
      .catch(err => console.error('タスク取得エラー:', err));

    // プロファイルと既存のノート分析を取得
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    }).catch(err => console.error('プロファイル取得エラー:', err));

    getDoc(doc(db, 'users', user.uid, 'feedbacks', 'notes-latest')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setNotesAnalysis({ analysis: d.analysis as string, generatedAt: d.generatedAt ?? null });
      }
    }).catch(() => {/* 未存在は正常 */});
  }, [user]);

  const handleAnalyzeNotes = async () => {
    if (!user) return;
    setAnalyzingNotes(true);
    setNotesError(null);
    try {
      const token = await user.getIdToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
      const res = await fetch(`${backendUrl}/api/analyze-notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setNotesError('設定でコメントのAI分析を有効にしてください。');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { analysis: string };
      setNotesAnalysis({ analysis: data.analysis, generatedAt: null });
    } catch (e) {
      console.error('ノート分析エラー:', e);
      setNotesError('分析の取得に失敗しました。しばらく後で再試行してください。');
    } finally {
      setAnalyzingNotes(false);
    }
  };

  const handleDayTap = (date: string) => {
    setSelectedDate(date);
    setOpenDates(prev => ({ ...prev, [date]: true }));
    setTimeout(() => {
      document.getElementById(`entry-${date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const toggleDate = (date: string) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (loading || fetching) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted, fontFamily: 'Zen Kaku Gothic New' }}>読み込み中…</span>
      </div>
    );
  }

  if (!user) { router.replace('/'); return null; }

  const hasEntries = entries.length > 0;
  const totalEntries = entries.length;
  const { currentThreshold } = getTrendStage(totalEntries);
  const availablePeriods = [3, 7, 14, 28].filter(n => n <= totalEntries);
  const effectivePeriod = selectedPeriod > 0 ? selectedPeriod : currentThreshold;
  const { high, low } = effectivePeriod > 0
    ? groupByHighLow(entries, 'satisfaction', effectivePeriod)
    : { high: [], low: [] };
  const divergence = high.length > 0 && low.length > 0 ? computeAxisDivergence(high, low) : [];
  // 全記録を使って相関を計算（多いほど精度が上がる）
  const axisPairs   = hasEntries ? computeAxisPairAnalysis(entries) : [];
  const sleepAxes   = hasEntries ? computeSleepAxisAnalysis(entries) : [];

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
          分析・振り返り
        </h1>
      </header>

      {/* エラー表示 */}
      {fetchError && (
        <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ color: COLORS.alert, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>{fetchError}</p>
        </div>
      )}

      {/* 目標・タスク一覧 */}
      {tasks.length > 0 && (
        <section>
          <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FontAwesomeIcon icon={faBullseye} style={{ color: COLORS.sprout, fontSize: 14 }} />
            目標
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(t => {
              const color = TASK_STATUS_COLOR[t.status];
              const now = new Date();
              const daysLeft = t.deadline
                ? Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86400000)
                : null;
              return (
                <div key={t.id} style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${color}`, opacity: t.status === 'done' ? 0.75 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ color: COLORS.chalk, fontSize: 14, margin: 0, fontFamily: 'Zen Kaku Gothic New', fontWeight: t.status === 'active' ? 700 : 400 }}>
                      {t.title}
                    </p>
                    <span style={{ color, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', padding: '2px 8px', borderRadius: 4, border: `1px solid ${color}50` }}>
                      {TASK_STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  {t.why && (
                    <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.5 }}>{t.why}</p>
                  )}
                  {t.deadline && (
                    <p style={{ color: daysLeft !== null && daysLeft < 3 && t.status === 'active' ? COLORS.alert : COLORS.muted, fontSize: 11, margin: 0, fontFamily: 'Roboto Mono' }}>
                      期限: {t.deadline}
                      {daysLeft !== null && t.status !== 'done' && <span style={{ marginLeft: 8 }}>残り {daysLeft} 日</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => router.push('/tasks')}
            style={{ marginTop: 10, background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted, borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
          >
            タスクを管理する →
          </button>
        </section>
      )}

      {/* カレンダーヒートマップ */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FontAwesomeIcon icon={faCalendarDays} style={{ color: COLORS.sprout, fontSize: 14 }} />
          <span style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho' }}>記録カレンダー</span>
        </div>
        <CalendarHeatmap entries={entries} onDayTap={handleDayTap} selectedDate={selectedDate} />
        {selectedDate && (
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '8px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
            {selectedDate} の記録を下のログに表示しています
          </p>
        )}
      </section>

      {/* 記録なし → 空状態 */}
      {!hasEntries && (
        <div style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>
            <FontAwesomeIcon icon={faFaceMeh} style={{ color: COLORS.muted }} />
          </span>
          <p style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0, lineHeight: 1.8 }}>まだ記録がありません</p>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
            今日の記録をはじめると<br />カレンダーとグラフが表示されます
          </p>
          <button
            onClick={() => router.push('/record')}
            style={{ background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            今日を記録する
          </button>
        </div>
      )}

      {/* 記録あり */}
      {hasEntries && (
        <>
          {/* 記録ログ（日別ブロック） */}
          <section>
            <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12 }}>
              記録ログ
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(entry => {
                const isOpen = openDates[entry.logicalDate] ?? false;
                const isSelected = selectedDate === entry.logicalDate;
                return (
                  <div
                    key={entry.logicalDate}
                    id={`entry-${entry.logicalDate}`}
                    style={{
                      background: COLORS.inkRaised, borderRadius: 10,
                      border: `1px solid ${isSelected ? COLORS.sprout : '#2A2D45'}`,
                      overflow: 'hidden',
                      scrollMarginTop: 16,
                    }}
                  >
                    <button
                      onClick={() => toggleDate(entry.logicalDate)}
                      style={{
                        width: '100%', background: 'none', border: 'none',
                        padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ color: isSelected ? COLORS.sprout : COLORS.muted, fontSize: 12, fontFamily: 'Roboto Mono' }}>
                          {entry.logicalDate}
                        </span>
                        <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New' }}>
                          達成 {entry.achievement ?? '—'}　満足 {entry.satisfaction ?? '—'}
                        </span>
                        {entry.backfilled && (
                          <span style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Zen Kaku Gothic New', background: '#2A2D45', padding: '1px 6px', borderRadius: 4 }}>遡り</span>
                        )}
                      </div>
                      <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {isOpen ? '隠す' : '表示する'}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid #2A2D45' }}>
                        <EntryDetailContent entry={entry} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

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

          {/* 傾向分析 */}
          <AxisCompareChart
            divergence={divergence}
            high={high}
            low={low}
            totalEntries={totalEntries}
            selectedPeriod={effectivePeriod}
            availablePeriods={availablePeriods}
            onPeriodChange={setSelectedPeriod}
            onRefresh={handleRefreshTrend}
            refreshing={refreshingTrend}
          />

          {/* 軸の相関 */}
          <AxisCrossChart pairs={axisPairs} sleepAxes={sleepAxes} totalEntries={totalEntries} />

          {/* AI観察メモ */}
          <section>
            <h2 style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faBrain} style={{ color: COLORS.sprout, fontSize: 14 }} />
              AI観察メモ
            </h2>
            <div style={{ background: COLORS.inkRaised, borderRadius: 12, padding: '14px 16px' }}>
              {!profile?.aiIncludeNotes ? (
                <div>
                  <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: '0 0 10px' }}>
                    設定でコメントのAI分析を有効にすると、気づきや挑戦の記録からAIが傾向を観察します。
                  </p>
                  <button
                    onClick={() => router.push('/settings')}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.sprout}`, color: COLORS.sprout, borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
                  >
                    設定を開く →
                  </button>
                </div>
              ) : (
                <div>
                  {notesAnalysis ? (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ color: COLORS.chalk, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: '0 0 6px' }}>
                        {notesAnalysis.analysis}
                      </p>
                      {notesAnalysis.generatedAt && (
                        <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono', margin: 0 }}>
                          {new Date(notesAnalysis.generatedAt.seconds * 1000).toLocaleDateString('ja-JP')} 生成
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7, margin: '0 0 12px' }}>
                      まだ分析がありません。ボタンを押すと最新の記録から傾向を観察します。
                    </p>
                  )}
                  {notesError && (
                    <p style={{ color: COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 8px' }}>
                      {notesError}
                    </p>
                  )}
                  <button
                    onClick={handleAnalyzeNotes}
                    disabled={analyzingNotes}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${analyzingNotes ? COLORS.muted : COLORS.sprout}`,
                      color: analyzingNotes ? COLORS.muted : COLORS.sprout,
                      borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: analyzingNotes ? 'default' : 'pointer',
                      fontFamily: 'Zen Kaku Gothic New', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <FontAwesomeIcon icon={faRotate} style={{ fontSize: 11 }} />
                    {analyzingNotes ? '観察中…' : '分析を更新する'}
                  </button>
                  <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Zen Kaku Gothic New', margin: '8px 0 0', lineHeight: 1.5 }}>
                    ※ 気づきと挑戦のテキストをAIに送信します
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
