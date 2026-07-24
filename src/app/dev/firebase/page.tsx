'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signInWithPopup, type AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { checkFirebaseConfig, authErrorMessage } from '@/lib/firebaseConfig';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { COLORS } from '@/config/design';
import { useRouter } from 'next/navigation';

function DiagSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '14px 16px' }}>
      <p style={{ color: COLORS.sprout, fontSize: 12, fontFamily: 'Roboto Mono', margin: '0 0 10px', fontWeight: 700 }}>{title}</p>
      {children}
    </section>
  );
}

export default function FirebaseDiagPage() {
  const router = useRouter();
  const { user, authError } = useAuthState();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const configChecks = checkFirebaseConfig();

  const runLoginTest = async () => {
    setTestResult('テスト中…');
    setTestOk(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setTestResult('ログイン成功');
      setTestOk(true);
    } catch (e) {
      const err = e as AuthError;
      const msg = authErrorMessage(err.code ?? 'unknown');
      console.error('[Diag] Auth error:', err.code, err.message);
      setTestResult(`エラー (${err.code})\n${msg}`);
      setTestOk(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: COLORS.chalk, fontSize: 18, fontFamily: 'Shippori Mincho', margin: 0 }}>Firebase 診断</h1>
      </header>

      <DiagSection title="環境変数チェック">
        {configChecks.map(c => (
          <div key={c.envVar} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
            <span style={{ color: c.ok ? COLORS.sprout : COLORS.alert, fontFamily: 'Roboto Mono', fontSize: 13, flexShrink: 0 }}>
              {c.ok ? '✓' : '✗'}
            </span>
            <div>
              <p style={{ color: c.ok ? COLORS.chalk : COLORS.alert, fontSize: 11, fontFamily: 'Roboto Mono', margin: 0 }}>
                {c.envVar}
              </p>
              <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono', margin: '2px 0 0' }}>
                {c.ok ? `${c.value?.slice(0, 12)}…（設定済み）` : '未設定'}
              </p>
            </div>
          </div>
        ))}
      </DiagSection>

      <DiagSection title="Auth 初期化状態">
        <p style={{ color: authError ? COLORS.alert : COLORS.sprout, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0 }}>
          {authError ?? '正常に初期化されています'}
        </p>
      </DiagSection>

      <DiagSection title="ログインユーザー">
        {user ? (
          <>
            <p style={{ color: COLORS.sprout, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 4px' }}>ログイン済み</p>
            <p style={{ color: COLORS.chalk, fontSize: 11, fontFamily: 'Roboto Mono', margin: 0 }}>{user.email}</p>
            <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono', margin: '4px 0 0' }}>uid: {user.uid}</p>
          </>
        ) : (
          <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0 }}>未ログイン</p>
        )}
      </DiagSection>

      <DiagSection title="Google ログインテスト">
        <button
          onClick={runLoginTest}
          style={{ background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}
        >
          テスト実行
        </button>
        {testResult && (
          <div style={{ marginTop: 12, background: testOk ? '#1A2A25' : '#2A1A1F', border: `1px solid ${testOk ? COLORS.sprout : COLORS.alert}`, borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ color: testOk ? COLORS.sprout : COLORS.alert, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
              {testResult}
            </p>
          </div>
        )}
      </DiagSection>

      <DiagSection title="チェックリスト（よくある原因）">
        {[
          { check: 'Firebase Console → Authentication → Sign-in method → Google が有効', help: 'プロバイダ一覧でGoogleが「有効」になっているか確認' },
          { check: 'Firebase Console → Authentication → Settings → 承認済みドメインにVercelのURLを追加', help: '例: motivation-tracker-ver1.vercel.app（https:// なし）' },
          { check: 'Vercel → Settings → Environment Variables に NEXT_PUBLIC_FIREBASE_API_KEY を設定', help: 'Firebase Console → Project Settings → Web App から取得' },
          { check: 'Vercel → Settings → Environment Variables に NEXT_PUBLIC_FIREBASE_APP_ID を設定', help: 'Firebase Console → Project Settings → Web App から取得' },
          { check: '環境変数変更後にVercelで再デプロイを実行', help: '変数変更後はRedeploy（またはgit push）が必要' },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <p style={{ color: COLORS.chalk, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 2px', lineHeight: 1.5 }}>
              {i + 1}. {item.check}
            </p>
            <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: 0, paddingLeft: 12, lineHeight: 1.5 }}>
              → {item.help}
            </p>
          </div>
        ))}
      </DiagSection>
    </div>
  );
}
