'use client';
import { AnimatePresence } from 'framer-motion';
import { COLORS } from '@/config/design';
import { shouldShowNudge } from '@/lib/carryOver';
import CarryOverNudge from './CarryOverNudge';
import type { TomorrowPlan } from '@/types/entry';

interface Props {
  value: TomorrowPlan;
  prevTomorrow: TomorrowPlan | null;
  onChange: (v: TomorrowPlan) => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function TomorrowStep({ value, prevTomorrow, onChange, onNext, onSkip }: Props) {
  const showNudge = !value.nudgeShown && shouldShowNudge(prevTomorrow);

  const handleContinue = () => {
    onChange({
      ...value,
      text: prevTomorrow?.text ?? value.text,
      carriedOver: true,
      carryOverCount: (prevTomorrow?.carryOverCount ?? 0) + 1,
      nudgeShown: true,
      nudgeChoice: 'continue',
    });
  };

  const handleBreakdown = () => {
    onChange({
      ...value,
      text: prevTomorrow?.text ?? '',
      carriedOver: false,
      carryOverCount: 0,
      nudgeShown: true,
      nudgeChoice: 'breakdown',
    });
  };

  const handleSwitch = () => {
    onChange({
      ...value,
      text: null,
      carriedOver: false,
      carryOverCount: 0,
      nudgeShown: true,
      nudgeChoice: 'switch',
    });
  };

  const handleCarryOver = () => {
    onChange({
      ...value,
      text: prevTomorrow?.text ?? '',
      carriedOver: true,
      carryOverCount: (prevTomorrow?.carryOverCount ?? 0) + 1,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>
        明日のやること
      </p>

      {/* 昨日の予定を常に参照として表示 */}
      {prevTomorrow?.text && !prevTomorrow.skipped && (
        <div style={{
          background: '#1F2238', border: `1px solid #3A3D55`,
          borderRadius: 10, padding: '10px 14px',
        }}>
          <p style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'Zen Kaku Gothic New', margin: '0 0 4px' }}>
            昨日の予定
          </p>
          <p style={{ color: COLORS.chalk, fontSize: 14, fontFamily: 'Zen Kaku Gothic New', margin: 0, lineHeight: 1.6 }}>
            {prevTomorrow.text}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showNudge && (
          <CarryOverNudge
            count={prevTomorrow!.carryOverCount}
            onContinue={handleContinue}
            onBreakdown={handleBreakdown}
            onSwitch={handleSwitch}
            onClose={() => onChange({ ...value, nudgeShown: true })}
          />
        )}
      </AnimatePresence>

      {prevTomorrow?.text && !prevTomorrow.skipped && !value.carriedOver && !value.nudgeShown && (
        <button
          onClick={handleCarryOver}
          style={{
            background: '#2A3A35', border: `1px solid ${COLORS.sprout}`,
            color: COLORS.sprout, borderRadius: 8, padding: '10px 14px',
            fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
            textAlign: 'left',
          }}
        >
          昨日の予定をそのまま引き継ぐ
        </button>
      )}

      <textarea
        value={value.text ?? ''}
        onChange={e => onChange({ ...value, text: e.target.value || null })}
        placeholder="明日やること"
        rows={4}
        style={{
          background: '#2A2D45', border: 'none', borderRadius: 8,
          color: COLORS.chalk, padding: '10px 12px', fontSize: 14,
          fontFamily: 'Zen Kaku Gothic New', resize: 'vertical', outline: 'none',
          lineHeight: 1.6,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
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
          確認する
        </button>
      </div>
    </div>
  );
}
