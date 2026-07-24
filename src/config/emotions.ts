import type { Emotion } from '@/types/entry';

export const EMOTION_DEFS: { id: Emotion; label: string; color: string }[] = [
  { id: 'joy',   label: '喜', color: '#E5C04A' },
  { id: 'anger', label: '怒', color: '#D94F5C' },
  { id: 'sorrow',label: '哀', color: '#4A8FD4' },
  { id: 'fun',   label: '楽', color: '#5FB49C' },
  { id: 'calm',  label: '凪', color: '#7A7F9A' },
];
