'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signOut, type AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { getLogicalDate } from '@/lib/date';
import { getEntry } from '@/lib/firestore/entries';
import { COLORS } from '@/config/design';
import { checkFirebaseConfig, allConfigOk, authErrorMessage } from '@/lib/firebaseConfig';
import type { Entry } from '@/types/entry';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, authError: initError } = useAuthState();
  const [todayEntry, setTodayEntry] = useState<Entry | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const configChecks = checkFirebaseConfig();
  const configOk = allConfigOk();

  useEffect(() => {
    if (!user) return;
    getEntry(user.uid, getLogicalDate())
      .then(e => setTodayEntry(e ?? null))
      .catch(e => { console.error('Firestoreエラー:', e); });
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

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted, fontFamily: 'Zen Kaku Gothic New' }}>読み込み中…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '40px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: COLORS.chalk, fontSize: 22, fontFamily: 'Shippori Mincho, serif', margin: 0 }}>
          モチトラ
        </h1>
        {user && (
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
            ログアウト
          </button>
        )}
      </header>

      {/* Firebase 設定エラーパネル（環境変数が未設定の場合に表示） */}
      {!configOk && (
        <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ color: COLORS.alert, fontSize: 13, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 10px', fontWeight: 700 }}>
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
              {c.ok && c.value && (
                <span style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono' }}>
                  {c.value.slice(0, 8)}…
                </span>
              )}
            </div>
          ))}
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '10px 0 0', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
            Vercel → Settings → Environment Variables に設定し、再デプロイしてください。
          </p>
        </div>
      )}

      {/* Firebase Auth 初期化エラー */}
      {initError && (
        <ErrorBanner message={initError} />
      )}

      {!user ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <p style={{ color: COLORS.chalk, fontSize: 18, fontFamily: 'Shippori Mincho', textAlign: 'center', lineHeight: 1.8 }}>
            今日の半歩を記録しよう
          </p>
          <p style={{ color: COLORS.muted, fontSize: 14, fontFamily: 'Zen Kaku Gothic New', textAlign: 'center', lineHeight: 1.8 }}>
            日々の行動と内面状態を記録し、<br />「なぜ続いたか」を自己分析できます
          </p>

          <button
            onClick={handleLogin}
            disabled={loggingIn || !configOk}
            style={{
              background: configOk ? COLORS.sprout : '#3A3D55',
              color: COLORS.ink, border: 'none',
              borderRadius: 8, padding: '14px 32px', fontSize: 16, cursor: configOk ? 'pointer' : 'not-allowed',
              fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, marginTop: 8,
              opacity: loggingIn ? 0.7 : 1,
            }}
          >
            {loggingIn ? 'ログイン中…' : 'Googleでログイン'}
          </button>

          {/* ログインエラー表示 */}
          {loginError && (
            <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px', maxWidth: 340 }}>
              <p style={{ color: COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
                {loginError}
              </p>
            </div>
          )}

          <button
            onClick={() => router.push('/dev/firebase')}
            style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Roboto Mono', textDecoration: 'underline' }}
          >
            Firebase 設定を診断する
          </button>
        </div>
      ) : (
        <>
          <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: 20 }}>
            <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 4px', fontFamily: 'Roboto Mono' }}>
              {getLogicalDate()}
            </p>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 12px', fontFamily: 'Zen Kaku Gothic New' }}>
              {user.email}
            </p>
            {todayEntry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: COLORS.chalk, fontSize: 16, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>
                  今日の記録済み — 達成度 {todayEntry.achievement ?? '—'} / 満足度 {todayEntry.satisfaction ?? '—'}
                </p>
                <button
                  onClick={() => router.push('/record')}
                  style={{ background: 'transparent', border: `1px solid ${COLORS.sprout}`, color: COLORS.sprout, borderRadius: 8, padding: '10px', fontSize: 14, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
                >
                  記録を上書きする
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/record')}
                style={{ width: '100%', background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '16px', fontSize: 18, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}
              >
                今日を記録する
              </button>
            )}
          </section>

          <nav style={{ display: 'flex', gap: 12 }}>
            {[
              { label: '分析・振り返り', path: '/review' },
              { label: 'タスク',         path: '/tasks' },
              { label: '設定',           path: '/settings' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{ flex: 1, background: COLORS.inkRaised, border: 'none', color: COLORS.muted, borderRadius: 8, padding: '12px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ color: COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.7 }}>
        {message}
      </p>
    </div>
  );
}
