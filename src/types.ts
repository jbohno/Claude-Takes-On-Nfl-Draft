export type Position =
  | 'QB' | 'RB' | 'WR' | 'TE'
  | 'OT' | 'OL' | 'IOL' | 'C' | 'G'
  | 'EDGE' | 'DE' | 'DT' | 'DL'
  | 'LB' | 'CB' | 'S' | 'ATH' | '';

export type Tier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Tier 5' | 'Tier 6' | '';

export interface Player {
  id: number;
  name: string;
  pos: Position;
  school: string;
  tier: Tier;
}

export interface ConsensusPick {
  pick: number;
  team: string;
  teamAbbr: string;
  need: string;
  player: string;
  pos: Position;
  school: string;
  adp: number;
}

export interface ClaudesPick {
  pick: number;
  team: string;
  teamAbbr: string;
  player: string;
  pos: Position;
  school: string;
  reasoning: string;
}

export interface RASEntry {
  ras: number | null;
  height?: string;
  weight?: number;
  forty?: number;
  vertical?: number;
  broad?: string;
  bench?: number;
  shuttle?: number;
  threeCone?: number;
  position?: string;
  school?: string;
}

export type RASScores = Record<string, RASEntry>;
