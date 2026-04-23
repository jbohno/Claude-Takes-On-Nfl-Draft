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

export interface Pick {
  pick: number;
  team: string;            // team key (e.g. "LV", "NYJ")
  player: string;
  pos: Position;
  school: string;
  reasoning?: string;      // optional, used by GM mocks
}

export type MockSlot = 'my-predicted' | 'claudes-predicted' | 'my-gm' | 'claudes-gm';

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
