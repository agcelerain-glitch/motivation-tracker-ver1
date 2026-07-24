'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { getLogicalDate } from '@/lib/date';
import { getEntry } from '@/lib/firestore/entries';
import { COLORS } from '@/config/design';
import type { Entry } from '@/types/entry';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [todayEntry, setTodayEntry] = useState<Entry | null | undefined>(undefined);

  useEffect(() => {
    if (!user) { setTodayEntry(null); return; }
    getEntry(user.uid, getLogicalDate()).then(setTodayEntry);
  }, [user]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error(e); }
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
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '40px 24px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: COLORS.chalk, fontSize: 22, fontFamily: 'Shippori Mincho, serif', margin: 0 }}>
          モチトラ
        </h1>
        {user ? (
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
            ログアウト
          </button>
        ) : null}
      </header>

      {!user ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <p style={{ color: COLORS.chalk, fontSize: 18, fontFamily: 'Shippori Mincho', textAlign: 'center', lineHeight: 1.8 }}>
            今日の半歩を記録しよう
          </p>
          <p style={{ color: COLORS.muted, fontSize: 14, fontFamily: 'Zen Kaku Gothic New', textAlign: 'center', lineHeight: 1.8 }}>
            日々の行動と内面状態を記録し、<br />「なぜ続いたか」を自己分析できます
          </p>
          <button
            onClick={handleLogin}
            style={{
              background: COLORS.sprout, color: COLORS.ink, border: 'none',
              borderRadius: 8, padding: '14px 32px', fontSize: 16, cursor: 'pointer',
              fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, marginTop: 8,
            }}
          >
            Googleでログイン
          </button>
        </div>
      ) : (
        <>
          <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: 20 }}>
            <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 12px', fontFamily: 'Roboto Mono, monospace' }}>
              {getLogicalDate()}
            </p>
            {todayEntry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: COLORS.chalk, fontSize: 16, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>
                  今日の記録済み — 達成度 {todayEntry.achievement ?? '—'} / 満足度 {todayEntry.satisfaction ?? '—'}
                </p>
                <button
                  onClick={() => router.push('/record')}
                  style={{
                    background: 'transparent', border: `1px solid ${COLORS.sprout}`,
                    color: COLORS.sprout, borderRadius: 8, padding: '10px', fontSize: 14,
                    cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
                  }}
                >
                  記録を上書きする
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/record')}
                style={{
                  width: '100%', background: COLORS.sprout, color: COLORS.ink, border: 'none',
                  borderRadius: 8, padding: '16px', fontSize: 18, cursor: 'pointer',
                  fontFamily: 'Zen Kaku Gothic New', fontWeight: 700,
                }}
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
                style={{
                  flex: 1, background: COLORS.inkRaised, border: 'none', color: COLORS.muted,
                  borderRadius: 8, padding: '12px 8px', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Zen Kaku Gothic New',
                }}
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
