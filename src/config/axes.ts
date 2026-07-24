import type { AxisId } from '@/types/entry';

export interface AxisDef {
  id: AxisId;
  poleA: string;
  poleB: string;
  mode: 'quick' | 'deep';
  question: string;
  centerIsIdeal?: boolean;
}

export const AXES: AxisDef[] = [
  { id: 'expectation_crisis', poleA: '期待・ワクワク',   poleB: '危機感・義務感',   mode: 'quick', question: '今日を動かしていたのは？' },
  { id: 'tension_relax',      poleA: '緊張',             poleB: 'リラックス',       mode: 'quick', question: '今日の心の張りは？' },
  { id: 'carrot_stick',       poleA: 'ご褒美・アメ',     poleB: 'ストイック・ムチ', mode: 'quick', question: '自分への接し方は？' },
  { id: 'motivation',         poleA: 'やる気があった',   poleB: 'やる気がなかった', mode: 'deep',  question: '今日のやる気は？' },
  { id: 'eating',             poleA: '食べ過ぎた',       poleB: '食べなさすぎた',   mode: 'deep',  question: '今日の食事は？', centerIsIdeal: true },
  { id: 'busyness',           poleA: '暇だった',         poleB: '忙しかった',       mode: 'deep',  question: '今日の忙しさは？' },
  { id: 'proactive_passive',  poleA: '積極的だった',     poleB: '消極的だった',     mode: 'deep',  question: '今日の動き方は？' },
  { id: 'spending',           poleA: '支出が多め',       poleB: '支出が少なめ',     mode: 'deep',  question: '今日のお金の使い方は？' },
];
