'use client';
import { useState } from 'react';
import RadialBandPicker from '@/components/record/RadialBandPicker';
import type { Band } from '@/types/entry';
import { COLORS, BAND_COLORS } from '@/config/design';

export default function DevPage() {
  const [value, setValue] = useState<Band | null>(null);

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>
        RadialBandPicker 検証
      </h1>

      <RadialBandPicker
        poleA="期待・ワクワク"
        poleB="危機感・義務感"
        question="今日を動かしていたのは？"
        value={value}
        onChange={setValue}
        onConfirm={() => alert(`決定: バンド ${value} (${value !== null ? BAND_COLORS[value - 1].name : 'なし'})`)}
      />

      <div style={{ background: COLORS.inkRaised, borderRadius: 10, padding: 14 }}>
        <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 6px', fontFamily: 'Roboto Mono' }}>選択値</p>
        <p style={{ color: COLORS.chalk, fontSize: 20, margin: 0, fontFamily: 'Roboto Mono' }}>
          {value !== null ? `${value} (${BAND_COLORS[value - 1].name})` : 'null (わからない)'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([1,2,3,4,5,6] as Band[]).map(b => (
          <button key={b} onClick={() => setValue(b)} style={{ background: value === b ? BAND_COLORS[b-1].hex : '#2A2D45', color: COLORS.chalk, border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Roboto Mono' }}>
            バンド {b}
          </button>
        ))}
        <button onClick={() => setValue(null)} style={{ background: value === null ? '#3A3D55' : '#2A2D45', color: COLORS.muted, border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
          null
        </button>
      </div>
    </div>
  );
}
