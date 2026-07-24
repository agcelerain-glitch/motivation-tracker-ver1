'use client';

import { useDraftStore } from '@/store/draftStore';
import { AXES } from '@/config/axes';
import { BAND_COLORS, COLORS } from '@/config/design';
import type { Band, Emotion } from '@/types/entry';

const EMOTION_LABEL: Record<Emotion, string> = {
  joy: '喜', anger: '怒', sorrow: '哀', fun: '楽', calm: '凪',
};

interface Props {
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

export default function ReviewSubmit({ submitting, error, onBack, onConfirm }: Props) {
  const draft = useDraftStore();

  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  const currentAxes = draft.mode === 'quick' ? AXES.filter(a => a.mode === 'quick') : AXES;

  const bandLabel = (v: Band | null | undefined): string => {
    if (v === undefined) return '';
    if (v === null) return 'わからない';
    return `${BAND_COLORS[v - 1].name}（${v}）`;
  };

  const bandColor = (v: Band | null | undefined): string => {
    if (!v) return COLORS.muted;
    return BAND_COLORS[v - 1].hex;
  };

  const levelDots = (v: number | null, max = 7): React.ReactNode => {
    if (v === null) return <span style={{ color: COLORS.muted }}>—</span>;
    return (
      <span style={{ fontFamily: 'Roboto Mono', fontSize: 13, color: COLORS.sprout }}>
        {'●'.repeat(v)}
        <span style={{ color: '#3A3D55' }}>{'○'.repeat(max - v)}</span>
        {' '}{v}/{max}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #2A2D45', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <p style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho', margin: 0 }}>記録の確認</p>
          <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Roboto Mono', margin: '2px 0 0' }}>
            {dateStr} {timeStr} · {draft.mode === 'quick' ? 'クイック' : 'じっくり'}
          </p>
        </div>
      </header>

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingBottom: 100 }}>

        {/* 達成度・満足度 */}
        <Card title="達成度 / 満足度">
          <Row label="達成度">{levelDots(draft.achievement)}</Row>
          <Row label="満足度">{levelDots(draft.satisfaction)}</Row>
        </Card>

        {/* 喜怒哀楽 */}
        <Card title="喜怒哀楽">
          {draft.emotions.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {draft.emotions.map(e => (
                <span
                  key={e}
                  style={{ background: '#2A2D45', color: COLORS.chalk, borderRadius: 20, padding: '4px 14px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New' }}
                >
                  {EMOTION_LABEL[e]}
                </span>
              ))}
            </div>
          ) : (
            <Muted>（未選択）</Muted>
          )}
        </Card>

        {/* やったこと */}
        <Card title="やったこと">
          {draft.did.skipped ? (
            <Muted>スキップ</Muted>
          ) : (draft.did.tags.length > 0 || draft.did.note) ? (
            <>
              {draft.did.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: draft.did.note ? 8 : 0 }}>
                  {draft.did.tags.map(t => (
                    <span key={t} style={{ background: '#1A3028', color: COLORS.sprout, border: `1px solid #2A5040`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontFamily: 'Zen Kaku Gothic New' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {draft.did.note && <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, lineHeight: 1.6, fontFamily: 'Zen Kaku Gothic New' }}>{draft.did.note}</p>}
            </>
          ) : (
            <Muted>（なし）</Muted>
          )}
        </Card>

        {/* できなかったこと */}
        <Card title="できなかったこと">
          {draft.didnt.skipped ? (
            <Muted>スキップ</Muted>
          ) : (draft.didnt.tags.length > 0 || draft.didnt.note) ? (
            <>
              {draft.didnt.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: draft.didnt.note ? 8 : 0 }}>
                  {draft.didnt.tags.map(t => (
                    <span key={t} style={{ background: '#2A1A1F', color: '#D4807A', border: `1px solid #6A3035`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontFamily: 'Zen Kaku Gothic New' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {draft.didnt.note && <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, lineHeight: 1.6, fontFamily: 'Zen Kaku Gothic New' }}>{draft.didnt.note}</p>}
            </>
          ) : (
            <Muted>（なし）</Muted>
          )}
        </Card>

        {/* 軸スコア */}
        <Card title={`軸スコア（${draft.mode === 'quick' ? '3軸' : '8軸'}）`}>
          {currentAxes.map(axis => {
            const val = draft.axes[axis.id as keyof typeof draft.axes];
            return (
              <Row key={axis.id} label={axis.question}>
                <span style={{ fontFamily: 'Zen Kaku Gothic New', fontSize: 12, color: bandColor(val as Band | null | undefined), fontWeight: 700 }}>
                  {bandLabel(val as Band | null | undefined)}
                </span>
              </Row>
            );
          })}
        </Card>

        {/* 今日の気づき・挑戦 */}
        <Card title="今日の気づき / 挑戦">
          {draft.reflection.skipped ? (
            <Muted>スキップ</Muted>
          ) : (draft.reflection.insight || draft.reflection.challenge) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draft.reflection.insight && (
                <div>
                  <p style={{ color: COLORS.muted, fontSize: 10, margin: '0 0 2px', fontFamily: 'Roboto Mono' }}>気づき</p>
                  <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, lineHeight: 1.7, fontFamily: 'Zen Kaku Gothic New' }}>{draft.reflection.insight}</p>
                </div>
              )}
              {draft.reflection.challenge && (
                <div>
                  <p style={{ color: COLORS.muted, fontSize: 10, margin: '0 0 2px', fontFamily: 'Roboto Mono' }}>挑戦</p>
                  <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, lineHeight: 1.7, fontFamily: 'Zen Kaku Gothic New' }}>{draft.reflection.challenge}</p>
                </div>
              )}
            </div>
          ) : (
            <Muted>（なし）</Muted>
          )}
        </Card>

        {/* 明日のやること */}
        <Card title="明日のやること">
          {draft.tomorrow.skipped ? (
            <Muted>スキップ</Muted>
          ) : draft.tomorrow.text ? (
            <div>
              <p style={{ color: COLORS.chalk, fontSize: 13, margin: 0, lineHeight: 1.7, fontFamily: 'Zen Kaku Gothic New' }}>{draft.tomorrow.text}</p>
              {draft.tomorrow.carriedOver && (
                <p style={{ color: COLORS.muted, fontSize: 10, margin: '4px 0 0', fontFamily: 'Roboto Mono' }}>
                  繰り越し {draft.tomorrow.carryOverCount} 回目
                </p>
              )}
            </div>
          ) : (
            <Muted>（なし）</Muted>
          )}
        </Card>

        {/* エラー表示 */}
        {error && (
          <div style={{ background: '#2A1A1F', border: `1px solid ${COLORS.alert}`, borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ color: COLORS.alert, fontSize: 13, margin: 0, lineHeight: 1.7, fontFamily: 'Zen Kaku Gothic New' }}>{error}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom buttons */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px 28px',
        background: COLORS.ink,
        borderTop: '1px solid #2A2D45',
        display: 'flex', gap: 12,
      }}>
        <button
          onClick={onBack}
          disabled={submitting}
          style={{
            flex: 1, background: 'transparent', border: '1px solid #3A3D55',
            color: COLORS.muted, borderRadius: 10, padding: '14px',
            fontSize: 15, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          修正する
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          style={{
            flex: 2, background: COLORS.sprout, color: COLORS.ink, border: 'none',
            borderRadius: 10, padding: '14px',
            fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
            fontFamily: 'Zen Kaku Gothic New',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? '記録中…' : '記録する'}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'Roboto Mono', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', marginRight: 8 }}>{label}</span>
      <div style={{ flexShrink: 0, maxWidth: '60%', textAlign: 'right' }}>{children}</div>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'Zen Kaku Gothic New' }}>{children}</span>;
}
