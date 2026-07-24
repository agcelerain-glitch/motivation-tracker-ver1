'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signOut, type AuthError } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { getLogicalDate } from '@/lib/date';
import { getEntry } from '@/lib/firestore/entries';
import { COLORS } from '@/config/design';
import { checkFirebaseConfig, allConfigOk, authErrorMessage } from '@/lib/firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket, faPenToSquare, faChartLine,
  faBullseye, faGear, faTriangleExclamation, faChevronDown,
  faCircleCheck, faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import type { Entry } from '@/types/entry';

interface ActiveTask {
  id: string;
  title: string;
  why: string;
  deadline: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading, authError: initError } = useAuthState();
  const [todayEntry, setTodayEntry] = useState<Entry | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const configChecks = checkFirebaseConfig();
  const configOk = allConfigOk();

  useEffect(() => {
    if (!user) return;
    getEntry(user.uid, getLogicalDate())
      .then(e => setTodayEntry(e ?? null))
      .catch(e => { console.error('Firestoreエラー:', e); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(
      collection(db, 'users', user.uid, 'tasks'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )).then(snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActiveTask)));
    }).catch(e => { console.error('タスク取得エラー:', e); });
  }, [user]);

  const handleLogin = async () => {
    setLoginError(null);
    setLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const err = e as AuthError;
      console.error('[Auth Error]', err.code, err.message);
      setLoginError(authErrorMessage(err.code ?? 'unknown'));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleStartRecord = () => {
    if (selectedTaskId) {
      sessionStorage.setItem('selectedTaskId', selectedTaskId);
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) sessionStorage.setItem('selectedTaskTitle', task.title);
    } else {
      sessionStorage.removeItem('selectedTaskId');
      sessionStorage.removeItem('selectedTaskTitle');
    }
    router.push('/record');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted, fontFamily: 'Zen Kaku Gothic New' }}>読み込み中…</span>
      </div>
    );
  }

  /* ── ログアウト状態 ─────────────────── */
  if (!user) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '48px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 40, margin: '0 0 8px' }}>🌱</p>
          <h1 style={{ color: COLORS.chalk, fontSize: 26, fontFamily: 'Shippori Mincho', margin: '0 0 8px' }}>モチトラ</h1>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.8 }}>
            今日の半歩を記録しよう
          </p>
        </div>

        {/* Firebase 設定エラーパネル */}
        {!configOk && (
          <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '14px 16px', width: '100%', maxWidth: 360 }}>
            <p style={{ color: COLORS.alert, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 10px', fontWeight: 700 }}>
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />
              Firebase 環境変数が不足しています
            </p>
            {configChecks.map(c => (
              <div key={c.envVar} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: c.ok ? COLORS.sprout : COLORS.alert, fontSize: 12, fontFamily: 'Roboto Mono', width: 12 }}>
                  {c.ok ? '✓' : '✗'}
                </span>
                <span style={{ color: c.ok ? COLORS.muted : COLORS.chalk, fontSize: 11, fontFamily: 'Roboto Mono' }}>
                  {c.envVar}
                </span>
              </div>
            ))}
          </div>
        )}

        {initError && <ErrorBanner message={initError} />}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 360 }}>
          <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
            日々の行動と内面状態を記録し、<br />「なぜ続いたか」を自己分析できます 📈
          </p>

          <button
            onClick={handleLogin}
            disabled={loggingIn || !configOk}
            style={{
              background: configOk ? COLORS.sprout : '#3A3D55',
              color: COLORS.ink, border: 'none', borderRadius: 12,
              padding: '15px 32px', fontSize: 16, cursor: configOk ? 'pointer' : 'not-allowed',
              fontFamily: 'Zen Kaku Gothic New', fontWeight: 700,
              opacity: loggingIn ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon icon={faGoogle} />
            {loggingIn ? 'ログイン中…' : 'Googleでログイン'}
          </button>

          {loginError && (
            <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px', width: '100%' }}>
              <p style={{ color: COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
                {loginError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── ログイン後 ────────────────────── */
  const today = getLogicalDate();

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: COLORS.chalk, fontSize: 22, fontFamily: 'Shippori Mincho', margin: 0 }}>
            🌱 モチトラ
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Roboto Mono', margin: '2px 0 0' }}>
            {today} · {user.displayName ?? user.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 18, cursor: 'pointer', padding: 8, borderRadius: 8 }}
          title="ログアウト"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </header>

      {/* タスクセレクター */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '16px' }}>
        <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FontAwesomeIcon icon={faBullseye} style={{ color: COLORS.sprout }} />
          今日はどのタスクに取り組む？
        </p>

        {tasks.length === 0 ? (
          /* タスクなし → 警告 */
          <div style={{ background: '#2A2415', border: '1px solid #6A5A20', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ color: '#D4B840', fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              タスクが設定されていません
            </p>
            <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.6 }}>
              まずは目標と期限から設定してください。<br />目標があると記録の意味がより明確になります ✨
            </p>
            <button
              onClick={() => router.push('/tasks')}
              style={{
                background: 'transparent', border: '1px solid #6A5A20', color: '#D4B840',
                borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
              }}
            >
              <FontAwesomeIcon icon={faBullseye} />
              目標を設定する →
            </button>
          </div>
        ) : (
          /* タスクあり → プルダウン */
          <div style={{ position: 'relative' }}>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              style={{
                width: '100%', background: '#2A2D45', border: `1px solid ${selectedTaskId ? COLORS.sprout : '#3A3D55'}`,
                borderRadius: 10, color: selectedTaskId ? COLORS.chalk : COLORS.muted,
                padding: '12px 40px 12px 14px', fontSize: 14,
                fontFamily: 'Zen Kaku Gothic New', cursor: 'pointer', outline: 'none',
                appearance: 'none', WebkitAppearance: 'none',
              }}
            >
              <option value="">タスクを選択する（任意）</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 12, pointerEvents: 'none' }}
            />
            {selectedTaskId && (
              <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: '6px 2px 0', lineHeight: 1.5 }}>
                💡 {tasks.find(t => t.id === selectedTaskId)?.why}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 今日の記録ボタン */}
      <section>
        {todayEntry ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: COLORS.sprout }} />
              </span>
              <div>
                <p style={{ color: COLORS.chalk, fontSize: 14, fontFamily: 'Zen Kaku Gothic New', margin: 0 }}>今日の記録済み</p>
                <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Roboto Mono', margin: '2px 0 0' }}>
                  ⭐ 達成度 {todayEntry.achievement ?? '—'} &nbsp;／&nbsp; 💙 満足度 {todayEntry.satisfaction ?? '—'}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartRecord}
              style={{
                width: '100%', background: 'transparent', border: `1px solid ${COLORS.sprout}`, color: COLORS.sprout,
                borderRadius: 12, padding: '14px', fontSize: 15, cursor: 'pointer',
                fontFamily: 'Zen Kaku Gothic New', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              記録を上書きする
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartRecord}
            style={{
              width: '100%', background: COLORS.sprout, color: COLORS.ink, border: 'none',
              borderRadius: 14, padding: '18px', fontSize: 18, cursor: 'pointer',
              fontFamily: 'Zen Kaku Gothic New', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              boxShadow: `0 4px 20px ${COLORS.sprout}40`,
            }}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            今日を記録する
          </button>
        )}
      </section>

      {/* 底部ナビゲーション */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: COLORS.inkRaised, borderTop: '1px solid #2A2D45',
        padding: '10px 0 20px', display: 'flex',
      }}>
        {[
          { label: '分析', icon: faChartLine, path: '/review', emoji: '📊' },
          { label: 'タスク', icon: faBullseye, path: '/tasks', emoji: '🎯' },
          { label: '設定', icon: faGear, path: '/settings', emoji: '⚙️' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              flex: 1, background: 'none', border: 'none', color: COLORS.muted,
              cursor: 'pointer', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <FontAwesomeIcon icon={item.icon} style={{ fontSize: 18 }} />
            <span style={{ fontSize: 10, fontFamily: 'Zen Kaku Gothic New' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px', width: '100%', maxWidth: 360 }}>
      <p style={{ color: COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
        {message}
      </p>
    </div>
  );
}
