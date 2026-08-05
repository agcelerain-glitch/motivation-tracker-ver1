'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, type AuthError } from 'firebase/auth';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { getLogicalDate, previousLogicalDate } from '@/lib/date';
import { getEntry } from '@/lib/firestore/entries';
import { COLORS } from '@/config/design';
import { checkFirebaseConfig, allConfigOk, authErrorMessage } from '@/lib/firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket, faPenToSquare, faChartLine,
  faBullseye, faGear, faTriangleExclamation,
  faCircleCheck, faRotateLeft, faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import type { Entry } from '@/types/entry';

function isLineApp(): boolean {
  return typeof navigator !== 'undefined' && /Line\//i.test(navigator.userAgent);
}

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
  const [prevEntry, setPrevEntry] = useState<Entry | null>(null);
  const [reloading, setReloading] = useState(false);
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
    // orderBy を外してフロントでフィルタ（複合インデックス不要）
    getDocs(query(
      collection(db, 'users', user.uid, 'tasks'),
      where('status', '==', 'active'),
    )).then(snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActiveTask)));
    }).catch(e => { console.error('タスク取得エラー:', e); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const prev = previousLogicalDate(getLogicalDate());
    getEntry(user.uid, prev)
      .then(e => setPrevEntry(e ?? null))
      .catch(e => { console.error('前日エントリ取得エラー:', e); });
  }, [user]);

  // LINE WebView などリダイレクトログイン後の結果を受け取る
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async result => {
        if (!result?.user) return;
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        }, { merge: true });
      })
      .catch(e => {
        const err = e as AuthError;
        console.error('[Redirect Auth Error]', err.code, err.message);
        setLoginError(authErrorMessage(err.code ?? 'unknown'));
      });
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    setLoggingIn(true);
    // LINE WebView はポップアップをブロックするため、リダイレクトフローを使う
    if (isLineApp()) {
      try {
        await signInWithRedirect(auth, googleProvider);
        // ページが遷移するため以降は実行されない
      } catch (e) {
        const err = e as AuthError;
        console.error('[Redirect Auth Error]', err.code, err.message);
        setLoginError(authErrorMessage(err.code ?? 'unknown'));
        setLoggingIn(false);
      }
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      }, { merge: true });
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
    sessionStorage.removeItem('selectedTaskId');
    sessionStorage.removeItem('selectedTaskTitle');
    router.push('/record');
  };

  const handlePageReload = async () => {
    if (!user || reloading) return;
    setReloading(true);
    try {
      const today = getLogicalDate();
      const prev = previousLogicalDate(today);
      const [entry, prevE, tasksSnap] = await Promise.all([
        getEntry(user.uid, today),
        getEntry(user.uid, prev),
        getDocs(query(collection(db, 'users', user.uid, 'tasks'), where('status', '==', 'active'))),
      ]);
      setTodayEntry(entry ?? null);
      setPrevEntry(prevE ?? null);
      setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as ActiveTask)));
    } catch (err) {
      console.error('ページの更新エラー:', err);
    } finally {
      setReloading(false);
    }
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
            日々の行動と内面状態を記録し、<br />「なぜ続いたか」を自己分析できます
          </p>

          {isLineApp() && (
            <div style={{ background: '#1A2A1F', border: `1px solid ${COLORS.sprout}40`, borderRadius: 10, padding: '12px 14px', width: '100%' }}>
              <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
                LINEアプリ内ブラウザを検出しました。ログインボタンをタップするとGoogleのログイン画面へ移動します。完了後、このページに戻ります。
              </p>
            </div>
          )}

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
  const now = new Date();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handlePageReload}
            disabled={reloading}
            aria-label="ページを更新"
            style={{ background: 'none', border: 'none', color: reloading ? '#A06020' : '#E8893D', fontSize: 18, cursor: reloading ? 'default' : 'pointer', padding: 8, borderRadius: 8 }}
          >
            <FontAwesomeIcon icon={faRotate} style={{ display: 'inline-block', animation: reloading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 18, cursor: 'pointer', padding: 8, borderRadius: 8 }}
            title="ログアウト"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </header>

      {/* 進行中タスク（表示のみ・常時点灯） */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '16px' }}>
        <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FontAwesomeIcon icon={faBullseye} style={{ color: COLORS.sprout }} />
          進行中のタスク
        </p>

        {tasks.length === 0 ? (
          <div style={{ background: '#2A2415', border: '1px solid #6A5A20', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ color: '#D4B840', fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              目標が設定されていません
            </p>
            <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.6 }}>
              目標と期限を設定すると記録を開始できます。
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.map(t => {
              const daysLeft = t.deadline
                ? Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86400000)
                : null;
              return (
                <div
                  key={t.id}
                  style={{
                    background: '#1E2E2A',
                    border: `1px solid ${COLORS.sprout}`,
                    borderRadius: 10, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: COLORS.chalk, fontSize: 14, fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}>
                    {t.title}
                  </span>
                  {daysLeft !== null && (
                    <span style={{ color: daysLeft < 3 ? COLORS.alert : COLORS.muted, fontSize: 11, fontFamily: 'Roboto Mono', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      残り{daysLeft}日
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 今日やること（前日の「明日のやること」） */}
      {prevEntry?.tomorrow?.text && !prevEntry.tomorrow.skipped && (
        <section style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            今日やること
          </p>
          <p style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
            {prevEntry.tomorrow.text}
          </p>
        </section>
      )}

      {/* 今日の記録ボタン（タスクあり時のみ表示） */}
      {tasks.length > 0 && <section>
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
      </section>}

      {/* 明日やること（今日の記録から） */}
      {todayEntry?.tomorrow?.text && !todayEntry.tomorrow.skipped && (
        <section style={{ background: COLORS.inkRaised, borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 8px' }}>
            明日やること
          </p>
          <p style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
            {todayEntry.tomorrow.text}
          </p>
        </section>
      )}

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
