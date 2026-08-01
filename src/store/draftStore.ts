'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Level, Band, Emotion, AxisId, SleepQuality } from '@/types/entry';
import { getLogicalDate } from '@/lib/date';

interface DraftState {
  logicalDate: string;
  mode: 'quick' | 'deep';
  currentStep: number;
  achievement: Level | null;
  satisfaction: Level | null;
  emotions: Emotion[];
  did: { tags: string[]; note: string | null; skipped: boolean };
  didnt: { tags: string[]; note: string | null; skipped: boolean };
  axes: Partial<Record<AxisId, Band | null>>;
  reflection: { sleep: SleepQuality | null; insight: string | null; challenge: string | null; skipped: boolean };
  tomorrow: {
    text: string | null;
    carriedOver: boolean;
    carryOverCount: number;
    nudgeShown: boolean;
    nudgeChoice: 'continue' | 'breakdown' | 'switch' | null;
    skipped: boolean;
  };
  setMode: (mode: 'quick' | 'deep') => void;
  setStep: (step: number) => void;
  setAchievement: (v: Level | null) => void;
  setSatisfaction: (v: Level | null) => void;
  setEmotions: (v: Emotion[]) => void;
  setDid: (v: DraftState['did']) => void;
  setDidnt: (v: DraftState['didnt']) => void;
  setAxis: (id: AxisId, v: Band | null) => void;
  setReflection: (v: DraftState['reflection']) => void;
  setTomorrow: (v: DraftState['tomorrow']) => void;
  reset: () => void;
}

const defaultDraft = (): Omit<DraftState, keyof Pick<DraftState,
  'setMode'|'setStep'|'setAchievement'|'setSatisfaction'|'setEmotions'|
  'setDid'|'setDidnt'|'setAxis'|'setReflection'|'setTomorrow'|'reset'
>> => ({
  logicalDate: getLogicalDate(),
  mode: 'quick',
  currentStep: 0,
  achievement: null,
  satisfaction: null,
  emotions: [],
  did:   { tags: [], note: null, skipped: false },
  didnt: { tags: [], note: null, skipped: false },
  axes: {},
  reflection: { sleep: null, insight: null, challenge: null, skipped: false },
  tomorrow: { text: null, carriedOver: false, carryOverCount: 0, nudgeShown: false, nudgeChoice: null, skipped: false },
});

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      ...defaultDraft(),
      setMode: (mode) => set({ mode }),
      setStep: (currentStep) => set({ currentStep }),
      setAchievement: (achievement) => set({ achievement }),
      setSatisfaction: (satisfaction) => set({ satisfaction }),
      setEmotions: (emotions) => set({ emotions }),
      setDid: (did) => set({ did }),
      setDidnt: (didnt) => set({ didnt }),
      setAxis: (id, v) => set(s => ({ axes: { ...s.axes, [id]: v } })),
      setReflection: (reflection) => set({ reflection }),
      setTomorrow: (tomorrow) => set({ tomorrow }),
      reset: () => set(defaultDraft()),
    }),
    {
      name: `motitora:draft:${getLogicalDate()}`,
    },
  ),
);
