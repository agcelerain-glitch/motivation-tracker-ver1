'use client';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { COLORS } from '@/config/design';

interface Props {
  step: number;
  total: number;
  onBack: () => void;
  onSkip?: () => void;
  onHomeExit?: () => void;
  children: React.ReactNode;
}

export default function StepShell({ step, total, onBack, onSkip, onHomeExit, children }: Props) {
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
      {/* ヘッダー: [← 戻る] [進捗バー] [⌂ ホーム] */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 20px 8px', gap: 8,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer', padding: 4, flexShrink: 0 }}
          aria-label="前のステップへ戻る"
        >
          ←
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 4, background: '#2A2D45', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', background: COLORS.sprout, borderRadius: 2,
                width: `${(step / total) * 100}%`,
                transition: 'width 0.2s',
              }}
            />
          </div>
          <span style={{ color: COLORS.muted, fontSize: 12, textAlign: 'right', fontFamily: 'Roboto Mono, monospace' }}>
            {step} / {total}
          </span>
        </div>

        {onHomeExit && (
          <button
            onClick={onHomeExit}
            style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 16, cursor: 'pointer', padding: '4px 4px 4px 8px', flexShrink: 0, lineHeight: 1 }}
            aria-label="ホームへ戻る"
          >
            <FontAwesomeIcon icon={faHouse} />
          </button>
        )}
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
