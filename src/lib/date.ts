export const TZ = 'Asia/Tokyo';
export const DAY_BOUNDARY_HOUR = 4;

export function getLogicalDate(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - DAY_BOUNDARY_HOUR * 3600_000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(shifted);
}

export function previousLogicalDate(date: string): string {
  const d = new Date(`${date}T12:00:00+09:00`);
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(d);
}
