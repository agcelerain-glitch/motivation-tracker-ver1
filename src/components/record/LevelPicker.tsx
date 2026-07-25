'use client';
import type { Level } from '@/types/entry';
import { COLORS } from '@/config/design';

interface Props {
  value: Level | null;
  onChange: (v: Level) => void;
  label?: string;
}

const LEVELS: { value: Level; label: string; align: 'left' | 'center' | 'right' }[] = [
  { value: 1, label: '1', align: 'left' },
  { value: 2, label: '2', align: 'left' },
  { value: 3, label: '3', align: 'left' },
  { value: 4, label: 'ふつう', align: 'center' },
  { value: 5, label: '5', align: 'right' },
  { value: 6, label: '6', align: 'right' },
  { value: 7, label: '7', align: 'right' },
];

function levelColor(v: Level): string {
  const ratio = (v - 1) / 6;
  const lightness = 30 + ratio * 35;
  return `hsl(160, 35%, ${lightness}%)`;
}

export default function LevelPicker({ value, onChange, label }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {label && (
        <p style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho, serif', margin: 0 }}>
          {label}
        </p>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {LEVELS.map(l => (
          <button
            key={l.value}
            onClick={() => onChange(l.value)}
            style={{
              flex: 1,
              minHeight: 52,
              border: 'none',
              borderRadius: 8,
              background: value === l.value ? levelColor(l.value) : '#2A2D45',
              color: value === l.value ? COLORS.chalk : COLORS.muted,
              fontSize: l.value === 4 ? 10 : 16,
              fontFamily: l.value === 4 ? 'Zen Kaku Gothic New' : 'Roboto Mono, monospace',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              outline: value === l.value ? `2px solid ${COLORS.sprout}` : 'none',
              textAlign: l.align,
              paddingLeft: l.align === 'left' ? '6px' : '2px',
              paddingRight: l.align === 'right' ? '6px' : '2px',
              paddingTop: 0,
              paddingBottom: 0,
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New' }}>← 低い</span>
        <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New' }}>高い →</span>
      </div>
    </div>
  );
}
