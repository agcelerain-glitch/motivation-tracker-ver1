'use client';
import type { Emotion } from '@/types/entry';
import { EMOTION_DEFS } from '@/config/emotions';
import { COLORS } from '@/config/design';

interface Props {
  value: Emotion[];
  onChange: (v: Emotion[]) => void;
}

export default function EmotionPicker({ value, onChange }: Props) {
  const toggle = (id: Emotion) => {
    if (id === 'calm') {
      onChange(value.includes('calm') ? [] : ['calm']);
      return;
    }
    const next = value.includes(id)
      ? value.filter(e => e !== id)
      : [...value.filter(e => e !== 'calm'), id];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {EMOTION_DEFS.map(e => {
        const active = value.includes(e.id);
        return (
          <button
            key={e.id}
            onClick={() => toggle(e.id)}
            style={{
              width: 60, height: 60,
              borderRadius: '50%',
              background: active ? e.color : '#2A2D45',
              color: active ? COLORS.ink : COLORS.muted,
              fontSize: 22, fontFamily: 'Zen Kaku Gothic New',
              border: active ? `2px solid ${e.color}` : '2px solid #3A3D55',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-pressed={active}
          >
            {e.label}
          </button>
        );
      })}
    </div>
  );
}
