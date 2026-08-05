'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/config/design';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faToggleOn, faToggleOff, faLink, faLinkSlash,
  faCopy, faCheck, faRotateRight, faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';

interface Profile {
  aiFeedbackEnabled: boolean;
  aiIncludeNotes: boolean;
  carryOverNudgeEnabled: boolean;
  lineUserId?: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [profile, setProfile] = useState<Profile>({
    aiFeedbackEnabled: false,
    aiIncludeNotes: false,
    carryOverNudgeEnabled: true,
  });
  const [lineCode, setLineCode] = useState<string | null>(null);
  const [lineCodeExpiry, setLineCodeExpiry] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(p => ({ ...p, ...snap.data() } as Profile));
    });
  }, [user]);

  const save = async (updates: Partial<Profile>) => {
    if (!user) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
  };

  const handleGenerateCode = async () => {
    if (!user) return;
    const code = generateCode();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // connectionCodes/{code} にuidと有効期限を保存（Firestore rules で認証済みユーザーのみ書き込み可）
    await setDoc(doc(db, 'connectionCodes', code), {
      uid: user.uid,
      expiresAt: Timestamp.fromDate(expiry),
    });
    setLineCode(code);
    setLineCodeExpiry(expiry);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!lineCode) return;
    await navigator.clipboard.writeText(lineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlink = async () => {
    if (!user) return;
    setUnlinking(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { lineUserId: null }, { merge: true });
      setProfile(p => ({ ...p, lineUserId: undefined }));
      setLineCode(null);
    } finally {
      setUnlinking(false);
    }
  };

  const isExpired = lineCodeExpiry ? lineCodeExpiry < new Date() : false;

  const handlePageReload = async () => {
    if (!user || reloading) return;
    setReloading(true);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setProfile(p => ({ ...p, ...snap.data() } as Profile));
    } catch (err) {
      console.error('ページの更新エラー:', err);
    } finally {
      setReloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted }}>読み込み中…</span>
      </div>
    );
  }
  if (!user) { router.replace('/'); return null; }

  const toggleRow = (label: string, key: keyof Pick<Profile, 'aiFeedbackEnabled' | 'aiIncludeNotes' | 'carryOverNudgeEnabled'>, desc: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #2A2D45' }}>
      <div style={{ flex: 1, paddingRight: 12 }}>
        <p style={{ color: COLORS.chalk, fontSize: 14, margin: '0 0 2px', fontFamily: 'Zen Kaku Gothic New' }}>{label}</p>
        <p style={{ color: COLORS.muted, fontSize: 11, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <button
        onClick={() => save({ [key]: !profile[key] })}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: profile[key] ? COLORS.sprout : '#3A3D55', fontSize: 32 }}
        aria-checked={profile[key]}
        role="switch"
      >
        <FontAwesomeIcon icon={profile[key] ? faToggleOn : faToggleOff} />
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 18, cursor: 'pointer', padding: 4 }}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0, flex: 1 }}>⚙️ 設定</h1>
        <button
          onClick={handlePageReload}
          disabled={reloading}
          aria-label="ページを更新"
          style={{ background: 'none', border: 'none', color: reloading ? '#A06020' : '#E8893D', fontSize: 18, cursor: reloading ? 'default' : 'pointer', padding: '4px 8px', borderRadius: 6 }}
        >
          <FontAwesomeIcon icon={faRotate} style={{ display: 'inline-block', animation: reloading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </header>

      {/* アカウント */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: '0 16px' }}>
        <div style={{ padding: '14px 0', borderBottom: '1px solid #2A2D45' }}>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>ログイン中</p>
          <p style={{ color: COLORS.chalk, fontSize: 14, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>{user.email}</p>
        </div>
        {toggleRow('AIフィードバック（スコアのみ）', 'aiFeedbackEnabled', '週次フィードバックをLINEで受け取る（LINE連携が必要）')}
        {toggleRow('メモ本文もAIに送る', 'aiIncludeNotes', '気づき・挑戦の文章も含めてフィードバックを生成する')}
        {toggleRow('繰り越しナッジ', 'carryOverNudgeEnabled', '同じやることが続いたときにアドバイスを表示する')}
      </section>

      {/* LINE連携 */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: '16px' }}>
        <h2 style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faLine} style={{ color: '#06C755', fontSize: 18 }} />
          LINE連携
        </h2>

        {profile.lineUserId ? (
          /* 連携済み */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faLink} style={{ color: COLORS.sprout }} />
              <p style={{ color: COLORS.sprout, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>
                LINE連携済みです
              </p>
            </div>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
              毎週日曜日にフィードバックが届きます。<br />
              上の「AIフィードバック」がオンになっているか確認してください。
            </p>
            <button
              onClick={handleUnlink}
              disabled={unlinking}
              style={{
                background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted,
                borderRadius: 8, padding: '9px 16px', fontSize: 12, cursor: 'pointer',
                fontFamily: 'Zen Kaku Gothic New', display: 'flex', alignItems: 'center', gap: 6,
                alignSelf: 'flex-start', opacity: unlinking ? 0.5 : 1,
              }}
            >
              <FontAwesomeIcon icon={faLinkSlash} />
              連携を解除する
            </button>
          </div>
        ) : (
          /* 未連携 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: COLORS.muted, fontSize: 12, margin: 0, fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.7 }}>
              ① 公式LINEアカウントを友だち追加する<br />
              ② 下のボタンで6桁のコードを発行する<br />
              ③ LINEのトークにコードを送信する
            </p>

            {lineCode && !isExpired ? (
              /* コード表示 */
              <div style={{ background: '#1A2A20', border: `1px solid ${COLORS.sprout}40`, borderRadius: 10, padding: '16px' }}>
                <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 8px', fontFamily: 'Zen Kaku Gothic New' }}>
                  連携コード（有効期限: 24時間）
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: COLORS.chalk, fontSize: 32, fontFamily: 'Roboto Mono', letterSpacing: 6, fontWeight: 700 }}>
                    {lineCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.sprout}60`, color: copied ? COLORS.sprout : COLORS.muted, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  </button>
                </div>
                <p style={{ color: COLORS.muted, fontSize: 11, margin: '10px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
                  このコードをLINEのトークに送ってください
                </p>
                <button
                  onClick={handleGenerateCode}
                  style={{ marginTop: 10, background: 'transparent', border: 'none', color: COLORS.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 10 }} />
                  コードを再発行する
                </button>
              </div>
            ) : (
              /* コード未発行 or 期限切れ */
              <button
                onClick={handleGenerateCode}
                style={{
                  background: '#06C755', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '13px 20px', fontSize: 14, cursor: 'pointer',
                  fontFamily: 'Zen Kaku Gothic New', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                }}
              >
                <FontAwesomeIcon icon={faLine} />
                {isExpired ? 'コードを再発行する' : 'コードを発行する'}
              </button>
            )}
          </div>
        )}
      </section>

      <button
        onClick={() => signOut(auth).then(() => router.replace('/'))}
        style={{ background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted, borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
      >
        ログアウト
      </button>
    </div>
  );
}
