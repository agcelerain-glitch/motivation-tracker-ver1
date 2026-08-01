'use client';
import { COLORS } from '@/config/design';
import { REFLECTION_COPY } from '@/config/copy';
import type { SleepQuality } from '@/types/entry';

interface ReflectionValue {
  sleep: SleepQuality | null;
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

const SLEEP_OPTIONS: { value: SleepQuality; label: string; color: string }[] = [
  { value: 'good',   label: '熟睡',  color: '#5FB49C' },
  { value: 'normal', label: 'ふつう', color: '#7A7F9A' },
  { value: 'poor',   label: '寝不足', color: '#8A7BC8' },
];

export default function ReflectionStep({ value, onChange, onNext, onSkip }: Props) {
  const c = REFLECTION_COPY;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 睡眠チップ */}
      <div>
        <p style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Shippori Mincho', margin: '0 0 10px' }}>
          昨夜の睡眠は？
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {SLEEP_OPTIONS.map(opt => {
            const selected = value.sleep === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, sleep: selected ? null : opt.value })}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${selected ? opt.color : '#3A3D55'}`,
                  background: selected ? `${opt.color}22` : 'transparent',
                  color: selected ? opt.color : COLORS.muted,
                  fontSize: 14, fontFamily: 'Zen Kaku Gothic New',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p style={{ color: COLORS.muted, fontSize: 11, margin: '6px 0 0', fontFamily: 'Zen Kaku Gothic New' }}>
          選ばなくても次に進めます
        </p>
      </div>

      {/* 今日の気づき */}
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

      {/* 今日の挑戦 */}
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
