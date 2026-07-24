import type { Timestamp } from 'firebase/firestore';

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Band = 1 | 2 | 3 | 4 | 5 | 6;
export type Emotion = 'joy' | 'anger' | 'sorrow' | 'fun' | 'calm';

export type AxisId =
  | 'expectation_crisis'
  | 'tension_relax'
  | 'carrot_stick'
  | 'motivation'
  | 'eating'
  | 'busyness'
  | 'proactive_passive'
  | 'spending';

export interface TagNote {
  tags: string[];
  note: string | null;
  skipped: boolean;
}

export interface Reflection {
  insight: string | null;
  challenge: string | null;
  skipped: boolean;
}

export interface TomorrowPlan {
  text: string | null;
  carriedOver: boolean;
  carryOverCount: number;
  nudgeShown: boolean;
  nudgeChoice: 'continue' | 'breakdown' | 'switch' | null;
  skipped: boolean;
}

export interface Entry {
  logicalDate: string;
  mode: 'quick' | 'deep';
  backfilled: boolean;

  achievement: Level | null;
  satisfaction: Level | null;
  emotions: Emotion[];
  did: TagNote;
  didnt: TagNote;

  axes: Partial<Record<AxisId, Band | null>>;

  reflection: Reflection;
  tomorrow: TomorrowPlan;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt: Timestamp;
}
