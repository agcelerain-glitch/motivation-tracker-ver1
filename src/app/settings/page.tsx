'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/config/design';

interface Profile {
  aiFeedbackEnabled: boolean;
  aiIncludeNotes: boolean;
  carryOverNudgeEnabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [profile, setProfile] = useState<Profile>({ aiFeedbackEnabled: false, aiIncludeNotes: false, carryOverNudgeEnabled: true });

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(p => ({ ...p, ...snap.data() }));
    });
  }, [user]);

  const save = async (updates: Partial<Profile>) => {
    if (!user) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    await setDoc(doc(db, 'users', user.uid), next, { merge: true });
  };

  if (loading) {
    return <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: COLORS.muted }}>読み込み中…</span></div>;
  }
  if (!user) { router.replace('/'); return null; }

  const toggleRow = (label: string, key: keyof Profile, desc: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #2A2D45' }}>
      <div>
        <p style={{ color: COLORS.chalk, fontSize: 14, margin: '0 0 2px', fontFamily: 'Zen Kaku Gothic New' }}>{label}</p>
        <p style={{ color: COLORS.muted, fontSize: 11, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>{desc}</p>
      </div>
      <button
        onClick={() => save({ [key]: !profile[key] })}
        style={{
          width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
          background: profile[key] ? COLORS.sprout : '#3A3D55',
          position: 'relative', flexShrink: 0,
        }}
        aria-checked={profile[key]}
        role="switch"
      >
        <span style={{
          position: 'absolute', top: 3, left: profile[key] ? 20 : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>設定</h1>
      </header>

      <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: '0 16px' }}>
        <div style={{ padding: '14px 0', borderBottom: '1px solid #2A2D45' }}>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>ログイン中</p>
          <p style={{ color: COLORS.chalk, fontSize: 14, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>{user.email}</p>
        </div>
        {toggleRow('AIフィードバック（スコアのみ）', 'aiFeedbackEnabled', '週次フィードバックをLINEで受け取る')}
        {toggleRow('メモ本文もAIに送る', 'aiIncludeNotes', '気づき・挑戦の文章も含めてフィードバックを生成する')}
        {toggleRow('繰り越しナッジ', 'carryOverNudgeEnabled', '同じやることが続いたときにアドバイスを表示する')}
      </section>

      <button
        onClick={() => signOut(auth).then(() => router.replace('/'))}
        style={{ background: 'transparent', border: `1px solid #3A3D55`, color: COLORS.muted, borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
      >
        ログアウト
      </button>
    </div>
  );
}
