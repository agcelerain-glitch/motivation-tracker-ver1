export const BAND_COUNT = 6;
export const LEVEL_COUNT = 7;

export const COLORS = {
  ink:       '#16182B',
  inkRaised: '#1F2238',
  chalk:     '#E9E6DD',
  muted:     '#7A7F9A',
  sprout:    '#5FB49C',
  alert:     '#D94F5C',
} as const;

export const BAND_COLORS = [
  { name: '紅',   hex: '#D94F5C' },
  { name: '橙',   hex: '#E8893D' },
  { name: '山吹', hex: '#E5C04A' },
  { name: '若竹', hex: '#5FB49C' },
  { name: '露草', hex: '#4A8FD4' },
  { name: '藤',   hex: '#8A7BC8' },
] as const;
