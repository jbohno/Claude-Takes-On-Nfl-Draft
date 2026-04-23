import type { Position } from '../types';

export const POSITION_OPTIONS: Position[] = [
  'QB', 'RB', 'WR', 'TE',
  'OT', 'OL', 'IOL', 'C', 'G',
  'EDGE', 'DE', 'DT', 'DL',
  'LB', 'CB', 'S', 'ATH',
];

export const TIER_OPTIONS = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6'] as const;

// Tailwind classes per position (background + text)
const POSITION_CLASS: Record<string, string> = {
  QB:   'bg-pos-qb text-black',
  RB:   'bg-pos-rb text-white',
  WR:   'bg-pos-wr text-white',
  TE:   'bg-pos-te text-black',
  OT:   'bg-pos-ot text-black',
  OL:   'bg-pos-ol text-black',
  IOL:  'bg-pos-iol text-black',
  C:    'bg-pos-iol text-black',
  G:    'bg-pos-iol text-black',
  EDGE: 'bg-pos-edge text-white',
  DE:   'bg-pos-de text-white',
  DT:   'bg-pos-dt text-white',
  DL:   'bg-pos-dt text-white',
  LB:   'bg-pos-lb text-black',
  CB:   'bg-pos-cb text-black',
  S:    'bg-pos-s text-white',
  ATH:  'bg-pos-ath text-black',
};

export function positionClass(pos: string): string {
  return POSITION_CLASS[pos] ?? 'bg-edge text-mute';
}
