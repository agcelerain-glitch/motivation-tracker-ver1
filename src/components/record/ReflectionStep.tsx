'use client';
import { COLORS } from '@/config/design';
import { REFLECTION_COPY } from '@/config/copy';

interface ReflectionValue {
  insight: string | null;
  challenge: string | null;
  skipped: boolean;
}

interface Props {
  value: ReflectionValue;
  onChange: (v: ReflectionValue) => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function ReflectionStep({ value, onChange, onNext, onSkip }: Props) {
  const c = REFLECTION_COPY;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho' }}>
          {c.insight.label}
        </label>
        <textarea
          value={value.insight ?? ''}
          onChange={e => onChange({ ...value, insight: e.target.value || null, skipped: false })}
          placeholder={c.insight.placeholder}
          rows={3}
          style={{
            background: '#2A2D45', border: 'none', borderRadius: 8,
            color: COLORS.chalk, padding: '10px 12px', fontSize: 14,
            fontFamily: 'Zen Kaku Gothic New', resize: 'vertical', outline: 'none',
            lineHeight: 1.6,
          }}
        />
        <p style={{ color: COLORS.muted, fontSize: 12, margin: 0, lineHeight: 1.5, fontFamily: 'Zen Kaku Gothic New' }}>
          {c.insight.hint}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ color: COLORS.chalk, fontSize: 16, fontFamily: 'Shippori Mincho' }}>
          {c.challenge.label}
        </label>
        <textarea
          value={value.challenge ?? ''}
          onChange={e => onChange({ ...value, challenge: e.target.value || null, skipped: false })}
          placeholder={c.challenge.placeholder}
          rows={3}
          style={{
            background: '#2A2D45', border: 'none', borderRadius: 8,
            color: COLORS.chalk, padding: '10px 12px', fontSize: 14,
            fontFamily: 'Zen Kaku Gothic New', resize: 'vertical', outline: 'none',
            lineHeight: 1.6,
          }}
        />
        <p style={{ color: COLORS.muted, fontSize: 12, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>
          {c.challenge.hint}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <button
          onClick={onSkip}
          style={{
            background: 'none', border: `1px solid #3A3D55`, color: COLORS.muted,
            borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer',
            fontFamily: 'Zen Kaku Gothic New',
          }}
        >
          今日はスキップ
        </button>
        <button
          onClick={onNext}
          style={{
            background: COLORS.sprout, border: 'none', color: COLORS.ink,
            borderRadius: 8, padding: '14px', fontSize: 16, cursor: 'pointer',
            fontFamily: 'Zen Kaku Gothic New', fontWeight: 700,
          }}
        >
          次へ
        </button>
      </div>
    </div>
  );
}
