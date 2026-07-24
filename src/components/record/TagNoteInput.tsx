'use client';
import { useState } from 'react';
import { COLORS } from '@/config/design';

interface TagNoteValue {
  tags: string[];
  note: string | null;
  skipped: boolean;
}

interface Props {
  presets: string[];
  value: TagNoteValue;
  onChange: (v: TagNoteValue) => void;
  yesterdayTomorrow?: string | null;
  label?: string;
}

export default function TagNoteInput({ presets, value, onChange, yesterdayTomorrow, label }: Props) {
  const [customInput, setCustomInput] = useState('');

  const toggleTag = (tag: string) => {
    const next = value.tags.includes(tag)
      ? value.tags.filter(t => t !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags: next, skipped: false });
  };

  const addCustom = () => {
    const t = customInput.trim();
    if (!t) return;
    onChange({ ...value, tags: [...value.tags, t], skipped: false });
    setCustomInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {label && (
        <p style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>
          {label}
        </p>
      )}

      {yesterdayTomorrow && (
        <div style={{ background: '#2A2D45', borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px' }}>昨日のやること</p>
          <button
            onClick={() => toggleTag(yesterdayTomorrow)}
            style={{
              background: value.tags.includes(yesterdayTomorrow) ? COLORS.sprout : 'transparent',
              color: value.tags.includes(yesterdayTomorrow) ? COLORS.ink : COLORS.sprout,
              border: `1px solid ${COLORS.sprout}`, borderRadius: 20,
              padding: '4px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
            }}
          >
            {yesterdayTomorrow}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {presets.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              background: value.tags.includes(tag) ? COLORS.sprout : '#2A2D45',
              color: value.tags.includes(tag) ? COLORS.ink : COLORS.muted,
              border: 'none', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
              transition: 'all 0.15s',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="カスタム追加"
          style={{
            flex: 1, background: '#2A2D45', border: 'none', borderRadius: 8,
            color: COLORS.chalk, padding: '8px 12px', fontSize: 13,
            fontFamily: 'Zen Kaku Gothic New', outline: 'none',
          }}
        />
        <button
          onClick={addCustom}
          style={{
            background: COLORS.sprout, color: COLORS.ink, border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
          }}
        >
          追加
        </button>
      </div>

      <textarea
        value={value.note ?? ''}
        onChange={e => onChange({ ...value, note: e.target.value || null, skipped: false })}
        placeholder="補足（任意）"
        rows={2}
        style={{
          background: '#2A2D45', border: 'none', borderRadius: 8,
          color: COLORS.chalk, padding: '8px 12px', fontSize: 13,
          fontFamily: 'Zen Kaku Gothic New', resize: 'vertical', outline: 'none',
        }}
      />
    </div>
  );
}
