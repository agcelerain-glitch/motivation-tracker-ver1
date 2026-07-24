'use client';
import { motion } from 'framer-motion';
import { COLORS } from '@/config/design';

interface Props {
  step: number;
  total: number;
  onBack: () => void;
  onSkip?: () => void;
  children: React.ReactNode;
}

export default function StepShell({ step, total, onBack, onSkip, children }: Props) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0,  opacity: 1 }}
      exit={{    x: -40, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        minHeight: '100dvh', background: COLORS.ink,
        display: 'flex', flexDirection: 'column', padding: '0 0 32px',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 8px', gap: 8,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer', padding: 4 }}
          aria-label="戻る"
        >
          ←
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 4, background: '#2A2D45', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', background: COLORS.sprout, borderRadius: 2,
                width: `${((step) / total) * 100}%`,
                transition: 'width 0.2s',
              }}
            />
          </div>
          <span style={{ color: COLORS.muted, fontSize: 12, textAlign: 'right', fontFamily: 'Roboto Mono, monospace' }}>
            {step} / {total}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 20px' }}>
        {children}
      </div>

      {onSkip && (
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
          >
            今日はスキップ
          </button>
        </div>
      )}
    </motion.div>
  );
}
