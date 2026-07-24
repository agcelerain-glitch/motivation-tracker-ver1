import type { TomorrowPlan } from '@/types/entry';

export const CARRYOVER_NUDGE_THRESHOLD = 3;

export function shouldShowNudge(prev: TomorrowPlan | null | undefined): boolean {
  if (!prev?.text) return false;
  if (prev.carryOverCount < CARRYOVER_NUDGE_THRESHOLD) return false;
  return (prev.carryOverCount - CARRYOVER_NUDGE_THRESHOLD) % 3 === 0;
}
