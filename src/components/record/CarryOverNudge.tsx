'use client';
import { motion } from 'framer-motion';
import { COLORS } from '@/config/design';
import { CARRYOVER_NUDGE } from '@/config/copy';

interface Props {
  count: number;
  onContinue: () => void;
  onBreakdown: () => void;
  onSwitch: () => void;
  onClose: () => void;
}

export default function CarryOverNudge({ count, onContinue, onBreakdown, onSwitch, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      style={{
        background: COLORS.inkRaised,
        border: `1px solid ${COLORS.sprout}`,
        borderRadius: 12,
        padding: '16px 16px 12px',
        marginBottom: 12,
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none', color: COLORS.muted,
          fontSize: 18, cursor: 'pointer', padding: 0,
        }}
        aria-label="閉じる"
      >
        ×
      </button>

      <p style={{ color: COLORS.chalk, fontSize: 14, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6 }}>
        {CARRYOVER_NUDGE.title(count)}
      </p>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 14px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {CARRYOVER_NUDGE.body}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {([
          { label: CARRYOVER_NUDGE.actions.continue,  onClick: onContinue,  primary: true },
          { label: CARRYOVER_NUDGE.actions.breakdown, onClick: onBreakdown, primary: false },
          { label: CARRYOVER_NUDGE.actions.switch,    onClick: onSwitch,    primary: false },
        ] as const).map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            style={{
              background: btn.primary ? COLORS.sprout : 'transparent',
              color: btn.primary ? COLORS.ink : COLORS.muted,
              border: btn.primary ? 'none' : `1px solid #3A3D55`,
              borderRadius: 20, padding: '6px 14px',
              fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
