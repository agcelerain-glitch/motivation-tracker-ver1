'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useDraftStore } from '@/store/draftStore';
import { getLogicalDate, previousLogicalDate } from '@/lib/date';
import { getEntry, upsertEntry } from '@/lib/firestore/entries';
import { AXES } from '@/config/axes';
import { DID_PRESETS, DIDNT_PRESETS } from '@/config/tagPresets';
import { COLORS } from '@/config/design';
import StepShell from '@/components/record/StepShell';
import LevelPicker from '@/components/record/LevelPicker';
import EmotionPicker from '@/components/record/EmotionPicker';
import TagNoteInput from '@/components/record/TagNoteInput';
import RadialBandPicker from '@/components/record/RadialBandPicker';
import ReflectionStep from '@/components/record/ReflectionStep';
import TomorrowStep from '@/components/record/TomorrowStep';
import ReviewSubmit from '@/components/record/ReviewSubmit';
import type { AxisId, Band, Level, Emotion, TomorrowPlan } from '@/types/entry';

export default function RecordPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const draft = useDraftStore();
  const [prevTomorrow, setPrevTomorrow] = useState<TomorrowPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTaskTitle] = useState<string | null>(
    () => typeof window !== 'undefined' ? sessionStorage.getItem('selectedTaskTitle') : null
  );

  const quickAxes = AXES.filter(a => a.mode === 'quick');
  const deepAxes  = AXES.filter(a => a.mode === 'deep');
  const currentAxes = draft.mode === 'quick' ? quickAxes : [...quickAxes, ...deepAxes];

  // TOTAL = 入力ステップ数（0〜TOTAL-1 が入力ステップ、TOTAL が確認画面）
  const TOTAL = draft.mode === 'quick' ? 10 : 15;

  useEffect(() => {
    if (!user) return;
    const prev = previousLogicalDate(getLogicalDate());
    getEntry(user.uid, prev).then(e => setPrevTomorrow(e?.tomorrow ?? null));
  }, [user]);

  const goNext = () => draft.setStep(draft.currentStep + 1);
  const goBack = () => {
    if (draft.currentStep === 0) { router.push('/'); return; }
    draft.setStep(draft.currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await upsertEntry(user.uid, {
        logicalDate: getLogicalDate(),
        mode: draft.mode,
        backfilled: false,
        achievement: draft.achievement,
        satisfaction: draft.satisfaction,
        emotions: draft.emotions,
        did: draft.did,
        didnt: draft.didnt,
        axes: draft.axes,
        reflection: draft.reflection,
        tomorrow: draft.tomorrow,
      });
      draft.reset();
      router.push('/review');
    } catch (e) {
      console.error('[upsertEntry error]', e);
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(`記録の保存に失敗しました。\n${msg}\n\nネットワーク接続を確認してもう一度お試しください。`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted }}>読み込み中…</span>
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const step = draft.currentStep;

  // TOTAL 以上のステップ = 確認・送信画面（進捗バー外）
  if (step >= TOTAL) {
    return (
      <ReviewSubmit
        submitting={submitting}
        error={submitError}
        onBack={() => draft.setStep(TOTAL - 1)}
        onConfirm={handleSubmit}
      />
    );
  }

  const renderStep = () => {
    if (step === 0) {
      return (
        <StepShell step={1} total={TOTAL} onBack={goBack}>
          {selectedTaskTitle && (
            <div style={{ background: '#1A2A28', border: `1px solid ${COLORS.sprout}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🎯</span>
              <p style={{ color: COLORS.sprout, fontSize: 12, fontFamily: 'Zen Kaku Gothic New', margin: 0 }}>{selectedTaskTitle}</p>
            </div>
          )}
          <LevelPicker
            label="今日の達成度"
            value={draft.achievement}
            onChange={(v: Level) => { draft.setAchievement(v); goNext(); }}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {(['quick', 'deep'] as const).map(m => (
              <button
                key={m}
                onClick={() => draft.setMode(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8,
                  border: `1px solid ${draft.mode === m ? COLORS.sprout : '#3A3D55'}`,
                  background: draft.mode === m ? '#2A3A35' : 'transparent',
                  color: draft.mode === m ? COLORS.sprout : COLORS.muted,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New',
                }}
              >
                {m === 'quick' ? 'クイック (10問)' : 'じっくり (15問)'}
              </button>
            ))}
          </div>
        </StepShell>
      );
    }

    if (step === 1) {
      return (
        <StepShell step={2} total={TOTAL} onBack={goBack}>
          <LevelPicker
            label="今日の満足度"
            value={draft.satisfaction}
            onChange={(v: Level) => { draft.setSatisfaction(v); goNext(); }}
          />
        </StepShell>
      );
    }

    if (step === 2) {
      return (
        <StepShell step={3} total={TOTAL} onBack={goBack}>
          <p style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', marginBottom: 20 }}>喜怒哀楽</p>
          <EmotionPicker value={draft.emotions} onChange={(v: Emotion[]) => draft.setEmotions(v)} />
          <button
            onClick={goNext}
            style={{ marginTop: 24, background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '14px', fontSize: 16, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}
          >
            次へ
          </button>
        </StepShell>
      );
    }

    if (step === 3) {
      return (
        <StepShell step={4} total={TOTAL} onBack={goBack} onSkip={() => { draft.setDid({ tags: [], note: null, skipped: true }); goNext(); }}>
          <TagNoteInput
            label="やったこと"
            presets={DID_PRESETS}
            value={draft.did}
            onChange={v => draft.setDid(v)}
            yesterdayTomorrow={prevTomorrow?.text ?? null}
          />
          <button
            onClick={goNext}
            style={{ marginTop: 16, background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '14px', fontSize: 16, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}
          >
            次へ
          </button>
        </StepShell>
      );
    }

    if (step === 4) {
      return (
        <StepShell step={5} total={TOTAL} onBack={goBack} onSkip={() => { draft.setDidnt({ tags: [], note: null, skipped: true }); goNext(); }}>
          <TagNoteInput
            label="できなかったこと"
            presets={DIDNT_PRESETS}
            value={draft.didnt}
            onChange={v => draft.setDidnt(v)}
          />
          <button
            onClick={goNext}
            style={{ marginTop: 16, background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '14px', fontSize: 16, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700 }}
          >
            次へ
          </button>
        </StepShell>
      );
    }

    const axisStartStep = 5;
    const axisEndStep   = axisStartStep + currentAxes.length;
    if (step >= axisStartStep && step < axisEndStep) {
      const axis = currentAxes[step - axisStartStep];
      return (
        <StepShell key={axis.id} step={step + 1} total={TOTAL} onBack={goBack}>
          <RadialBandPicker
            poleA={axis.poleA}
            poleB={axis.poleB}
            question={axis.question}
            value={(draft.axes[axis.id] as Band | null | undefined) ?? null}
            onChange={(v: Band | null) => draft.setAxis(axis.id as AxisId, v)}
            onConfirm={goNext}
          />
          <button
            onClick={() => { draft.setAxis(axis.id as AxisId, null); goNext(); }}
            style={{ marginTop: 8, background: 'transparent', color: COLORS.muted, border: `1px solid ${COLORS.muted}`, borderRadius: 20, padding: '6px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
          >
            わからない → スキップ
          </button>
        </StepShell>
      );
    }

    const reflectionStep = axisEndStep;
    if (step === reflectionStep) {
      return (
        <StepShell step={step + 1} total={TOTAL} onBack={goBack}>
          <ReflectionStep
            value={draft.reflection}
            onChange={v => draft.setReflection(v)}
            onNext={goNext}
            onSkip={() => { draft.setReflection({ insight: null, challenge: null, skipped: true }); goNext(); }}
          />
        </StepShell>
      );
    }

    const tomorrowStep = reflectionStep + 1;
    if (step === tomorrowStep) {
      return (
        <StepShell step={step + 1} total={TOTAL} onBack={goBack}>
          <TomorrowStep
            value={draft.tomorrow}
            prevTomorrow={prevTomorrow}
            onChange={v => draft.setTomorrow(v)}
            onNext={goNext}
            onSkip={() => { draft.setTomorrow({ ...draft.tomorrow, skipped: true }); goNext(); }}
          />
        </StepShell>
      );
    }

    return null;
  };

  return (
    <AnimatePresence mode="wait">
      <div key={step}>
        {renderStep()}
      </div>
    </AnimatePresence>
  );
}
