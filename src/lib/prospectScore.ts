import type { Position } from '../types';

/**
 * Claude's 2026 prospect scoring model.
 *
 * Four components per prospect, weighted by position:
 *   1. ATHLETIC (RAS, 0–10 → 0–100) — traits ceiling
 *   2. PRODUCTION (position-specific composite, 0–100) — on-field resume
 *   3. BREAKOUT AGE (0–100) — age at first dominant season; younger = higher NFL hit rate
 *   4. DRAFT AGE (0–100) — age at draft; younger = more runway
 *
 * No ADP / draft-capital input. The model is independent of any mock.
 *
 * Production is computed per-position using advanced metrics — YPRR and market
 * share for WR, pressure rate and PFF pass-rush grade for EDGE, coverage grade
 * and forced-incompletion rate for CB, etc. Each per-position production
 * composite is normalised to a 0-100 scale so cross-position comparisons stay
 * fair.
 */

export interface QBStats   { anyPerAtt?: number; tdPct?: number; intPct?: number; careerStarts?: number }
export interface RBStats   { ypc?: number; yaco?: number; missedTacklesPer100?: number; receivingYds?: number }
export interface WRStats   { yprr?: number; marketShare?: number; contestedCatchPct?: number; aDOT?: number }
export interface TEStats   { yprr?: number; runBlockGrade?: number; contestedCatchPct?: number }
export interface OLStats   { passBlockGrade?: number; runBlockGrade?: number; pressuresAllowedPer100?: number; careerStarts?: number }
export interface EDGEStats { pressureRate?: number; pffPassRushGrade?: number; sacks?: number; runDefenseGrade?: number }
export interface DTStats   { pressureRate?: number; runStopPct?: number; pffPassRushGrade?: number }
export interface LBStats   { missedTacklePct?: number; coverageGrade?: number; pressureRate?: number }
export interface CBStats   { forcedIncompletionPct?: number; coverageGrade?: number; targetedQBR?: number; passBreakups?: number }
export interface SStats    { coverageGrade?: number; missedTacklePct?: number; boxSnapPct?: number; deepSnapPct?: number }

export interface Prospect {
  name: string;
  pos: Position;
  school: string;
  age: number;
  breakoutAge: number;
  ras: number | null;
  pffGrade: number;
  traits?: string[];
  qbStats?: QBStats;
  rbStats?: RBStats;
  wrStats?: WRStats;
  teStats?: TEStats;
  olStats?: OLStats;
  edgeStats?: EDGEStats;
  dtStats?: DTStats;
  lbStats?: LBStats;
  cbStats?: CBStats;
  sStats?: SStats;
}

export interface Weights {
  athletic: number;
  production: number;
  breakout: number;
  draftAge: number;
}

export interface Breakdown {
  athletic: { raw: number | null; weighted: number | null };
  production: { raw: number; weighted: number; drivers: Array<{ label: string; value: string }> };
  breakout: { raw: number; weighted: number; age: number };
  draftAge: { raw: number; weighted: number; age: number };
  weights: Weights;
  hasRAS: boolean;
  total: number;
}

/**
 * Position weights.
 * - Athletic weight reflects empirical RAS-to-success correlation:
 *     EDGE/CB/S strongest, WR/OT moderate, QB/RB weakest.
 * - Production weight is the counterbalance; positions where RAS is noisy
 *   lean harder on real tape (QB, RB, OL).
 * - Breakout age and draft-age weights are stable across positions because
 *   the age curves are uniformly predictive across the board.
 */
const WEIGHTS: Record<string, Weights> = {
  QB:   { athletic: 0.10, production: 0.60, breakout: 0.10, draftAge: 0.20 },
  RB:   { athletic: 0.15, production: 0.50, breakout: 0.20, draftAge: 0.15 },
  WR:   { athletic: 0.22, production: 0.46, breakout: 0.22, draftAge: 0.10 },
  TE:   { athletic: 0.28, production: 0.42, breakout: 0.18, draftAge: 0.12 },
  OT:   { athletic: 0.22, production: 0.52, breakout: 0.12, draftAge: 0.14 },
  OL:   { athletic: 0.22, production: 0.52, breakout: 0.12, draftAge: 0.14 },
  IOL:  { athletic: 0.22, production: 0.52, breakout: 0.12, draftAge: 0.14 },
  C:    { athletic: 0.22, production: 0.52, breakout: 0.12, draftAge: 0.14 },
  G:    { athletic: 0.22, production: 0.52, breakout: 0.12, draftAge: 0.14 },
  EDGE: { athletic: 0.35, production: 0.35, breakout: 0.16, draftAge: 0.14 },
  DE:   { athletic: 0.33, production: 0.37, breakout: 0.16, draftAge: 0.14 },
  DT:   { athletic: 0.30, production: 0.40, breakout: 0.16, draftAge: 0.14 },
  DL:   { athletic: 0.30, production: 0.40, breakout: 0.16, draftAge: 0.14 },
  LB:   { athletic: 0.28, production: 0.40, breakout: 0.18, draftAge: 0.14 },
  CB:   { athletic: 0.34, production: 0.36, breakout: 0.16, draftAge: 0.14 },
  S:    { athletic: 0.32, production: 0.38, breakout: 0.16, draftAge: 0.14 },
  ATH:  { athletic: 0.30, production: 0.40, breakout: 0.16, draftAge: 0.14 },
};

const DEFAULT_WEIGHTS: Weights = { athletic: 0.25, production: 0.45, breakout: 0.16, draftAge: 0.14 };

export function weightsFor(pos: Position): Weights {
  return WEIGHTS[pos] ?? DEFAULT_WEIGHTS;
}

export function allPositionWeights() { return WEIGHTS; }

/* ────── component scorers ────── */

function athletic(ras: number | null): number | null {
  if (ras === null || ras === undefined || Number.isNaN(ras)) return null;
  return clamp(ras * 10, 0, 100);
}

/**
 * Breakout age curve (skill positions & pass rushers).
 * Empirical: WRs who break out ≤ 20 hit at ~60% vs ~30% for 21+. Curves are
 * similar but softer for RB/TE/EDGE. QB breakout age is less predictive.
 */
function breakoutScore(pos: Position, breakoutAge: number): number {
  // Early breakout bonus curve. Center at 21.
  const delta = 21 - breakoutAge;
  // Linear; each year earlier = +15 points, capped
  let base = 60 + delta * 15;

  // Positions where breakout age is weaker signal — compress towards 60
  if (pos === 'QB') base = 60 + delta * 8;
  if (pos === 'OT' || pos === 'OL' || pos === 'IOL' || pos === 'C' || pos === 'G') base = 60 + delta * 10;

  return clamp(base, 20, 100);
}

/**
 * Age-at-draft curve. 21 = peak runway. Penalty accelerates after 23.
 */
function draftAgeScore(age: number): number {
  if (age <= 20) return 100;
  if (age === 21) return 95;
  if (age === 22) return 80;
  if (age === 23) return 60;
  if (age === 24) return 40;
  return 25;
}

/**
 * Position-specific production composite (0-100).
 * Uses advanced metrics + a PFF grade floor so even thin datasets still yield
 * a defensible score.
 */
function productionScore(p: Prospect): { score: number; drivers: Array<{ label: string; value: string }> } {
  const drivers: Array<{ label: string; value: string }> = [];
  const pff = clamp(p.pffGrade ?? 70, 50, 100);

  switch (p.pos) {
    case 'QB': {
      const s = p.qbStats ?? {};
      const anyP = normRange(s.anyPerAtt, 5.5, 9.0);           // 5.5 = 30, 9.0 = 100
      const tdIntRatio = s.intPct && s.intPct > 0 && s.tdPct ? s.tdPct / s.intPct : 3;
      const tdInt = normRange(tdIntRatio, 1.5, 6.0);            // 1.5 = 30, 6.0 = 100
      const starts = normRange(s.careerStarts, 12, 40);
      if (s.anyPerAtt !== undefined) drivers.push({ label: 'ANY/A', value: s.anyPerAtt.toFixed(1) });
      if (s.tdPct !== undefined && s.intPct !== undefined) drivers.push({ label: 'TD%:INT%', value: `${s.tdPct.toFixed(1)} / ${s.intPct.toFixed(1)}` });
      if (s.careerStarts !== undefined) drivers.push({ label: 'Starts', value: String(s.careerStarts) });
      return { score: blend([[pff, 0.3], [anyP, 0.35], [tdInt, 0.25], [starts, 0.1]]), drivers };
    }
    case 'RB': {
      const s = p.rbStats ?? {};
      const ypc = normRange(s.ypc, 4.5, 7.5);
      const yaco = normRange(s.yaco, 2.5, 4.5);
      const mtf = normRange(s.missedTacklesPer100, 12, 28);
      const recv = normRange(s.receivingYds, 100, 500);
      if (s.ypc !== undefined) drivers.push({ label: 'YPC', value: s.ypc.toFixed(1) });
      if (s.yaco !== undefined) drivers.push({ label: 'YACo', value: s.yaco.toFixed(1) });
      if (s.missedTacklesPer100 !== undefined) drivers.push({ label: 'MT/100', value: String(s.missedTacklesPer100) });
      return { score: blend([[pff, 0.25], [ypc, 0.25], [yaco, 0.2], [mtf, 0.2], [recv, 0.1]]), drivers };
    }
    case 'WR': {
      const s = p.wrStats ?? {};
      const yprr = normRange(s.yprr, 1.8, 3.3);
      const ms = normRange(s.marketShare, 0.18, 0.40);
      const ctd = normRange(s.contestedCatchPct, 35, 65);
      if (s.yprr !== undefined) drivers.push({ label: 'YPRR', value: s.yprr.toFixed(2) });
      if (s.marketShare !== undefined) drivers.push({ label: 'Mkt Share', value: `${(s.marketShare * 100).toFixed(0)}%` });
      if (s.contestedCatchPct !== undefined) drivers.push({ label: 'Contested%', value: `${s.contestedCatchPct}%` });
      return { score: blend([[pff, 0.2], [yprr, 0.4], [ms, 0.25], [ctd, 0.15]]), drivers };
    }
    case 'TE': {
      const s = p.teStats ?? {};
      const yprr = normRange(s.yprr, 1.3, 2.3);
      const rbg = normRange(s.runBlockGrade, 55, 80);
      const ctd = normRange(s.contestedCatchPct, 40, 65);
      if (s.yprr !== undefined) drivers.push({ label: 'YPRR', value: s.yprr.toFixed(2) });
      if (s.runBlockGrade !== undefined) drivers.push({ label: 'RunBlk', value: String(s.runBlockGrade) });
      return { score: blend([[pff, 0.3], [yprr, 0.35], [rbg, 0.2], [ctd, 0.15]]), drivers };
    }
    case 'OT':
    case 'OL':
    case 'IOL':
    case 'C':
    case 'G': {
      const s = p.olStats ?? {};
      const pass = normRange(s.passBlockGrade, 70, 90);
      const run = normRange(s.runBlockGrade, 70, 90);
      const pressAllowed = normRangeInverse(s.pressuresAllowedPer100, 1.5, 5.0);
      const starts = normRange(s.careerStarts, 15, 40);
      if (s.passBlockGrade !== undefined) drivers.push({ label: 'PassBlk', value: String(s.passBlockGrade) });
      if (s.runBlockGrade !== undefined) drivers.push({ label: 'RunBlk', value: String(s.runBlockGrade) });
      if (s.pressuresAllowedPer100 !== undefined) drivers.push({ label: 'Pres/100', value: s.pressuresAllowedPer100.toFixed(1) });
      return { score: blend([[pff, 0.2], [pass, 0.3], [run, 0.2], [pressAllowed, 0.2], [starts, 0.1]]), drivers };
    }
    case 'EDGE':
    case 'DE': {
      const s = p.edgeStats ?? {};
      const pr = normRange(s.pressureRate, 9, 17);
      const prGrade = normRange(s.pffPassRushGrade, 70, 92);
      const rd = normRange(s.runDefenseGrade, 65, 88);
      if (s.pressureRate !== undefined) drivers.push({ label: 'Pres%', value: `${s.pressureRate.toFixed(1)}%` });
      if (s.pffPassRushGrade !== undefined) drivers.push({ label: 'PRW', value: String(s.pffPassRushGrade) });
      if (s.sacks !== undefined) drivers.push({ label: 'Sacks', value: String(s.sacks) });
      return { score: blend([[pff, 0.2], [pr, 0.35], [prGrade, 0.3], [rd, 0.15]]), drivers };
    }
    case 'DT':
    case 'DL': {
      const s = p.dtStats ?? {};
      const pr = normRange(s.pressureRate, 6, 12);
      const rs = normRange(s.runStopPct, 7, 13);
      const prGrade = normRange(s.pffPassRushGrade, 65, 90);
      if (s.pressureRate !== undefined) drivers.push({ label: 'Pres%', value: `${s.pressureRate.toFixed(1)}%` });
      if (s.runStopPct !== undefined) drivers.push({ label: 'RunStop%', value: `${s.runStopPct.toFixed(1)}%` });
      return { score: blend([[pff, 0.25], [pr, 0.3], [rs, 0.25], [prGrade, 0.2]]), drivers };
    }
    case 'LB': {
      const s = p.lbStats ?? {};
      const cov = normRange(s.coverageGrade, 65, 88);
      const pr = normRange(s.pressureRate, 4, 15);
      const mt = normRangeInverse(s.missedTacklePct, 5, 12);
      if (s.coverageGrade !== undefined) drivers.push({ label: 'Cov', value: String(s.coverageGrade) });
      if (s.pressureRate !== undefined) drivers.push({ label: 'Pres%', value: `${s.pressureRate.toFixed(1)}%` });
      if (s.missedTacklePct !== undefined) drivers.push({ label: 'MT%', value: `${s.missedTacklePct.toFixed(1)}%` });
      return { score: blend([[pff, 0.25], [cov, 0.3], [pr, 0.25], [mt, 0.2]]), drivers };
    }
    case 'CB': {
      const s = p.cbStats ?? {};
      const fi = normRange(s.forcedIncompletionPct, 10, 20);
      const cov = normRange(s.coverageGrade, 70, 92);
      const qbr = normRangeInverse(s.targetedQBR, 50, 85);
      if (s.forcedIncompletionPct !== undefined) drivers.push({ label: 'FI%', value: `${s.forcedIncompletionPct.toFixed(1)}%` });
      if (s.coverageGrade !== undefined) drivers.push({ label: 'Cov', value: String(s.coverageGrade) });
      if (s.passBreakups !== undefined) drivers.push({ label: 'PBU', value: String(s.passBreakups) });
      return { score: blend([[pff, 0.2], [fi, 0.3], [cov, 0.3], [qbr, 0.2]]), drivers };
    }
    case 'S': {
      const s = p.sStats ?? {};
      const cov = normRange(s.coverageGrade, 70, 92);
      const mt = normRangeInverse(s.missedTacklePct, 5, 12);
      const vers = Math.min(100, 50 + Math.abs((s.boxSnapPct ?? 50) - (s.deepSnapPct ?? 50)) < 25 ? 30 : 0);
      if (s.coverageGrade !== undefined) drivers.push({ label: 'Cov', value: String(s.coverageGrade) });
      if (s.missedTacklePct !== undefined) drivers.push({ label: 'MT%', value: `${s.missedTacklePct.toFixed(1)}%` });
      if (s.boxSnapPct !== undefined) drivers.push({ label: 'Box/Deep', value: `${s.boxSnapPct}/${s.deepSnapPct ?? 0}%` });
      return { score: blend([[pff, 0.25], [cov, 0.35], [mt, 0.25], [vers, 0.15]]), drivers };
    }
    default:
      return { score: pff, drivers: [{ label: 'PFF', value: String(pff) }] };
  }
}

/* ────── main entry ────── */

export function scoreProspect(p: Prospect): Breakdown {
  const base = weightsFor(p.pos);
  const athRaw = athletic(p.ras);
  const prod = productionScore(p);
  const brkRaw = breakoutScore(p.pos, p.breakoutAge);
  const ageRaw = draftAgeScore(p.age);

  const weights: Weights = athRaw === null ? redistribute(base) : base;

  const athWeighted = athRaw === null ? null : athRaw * weights.athletic;
  const prodWeighted = prod.score * weights.production;
  const brkWeighted = brkRaw * weights.breakout;
  const ageWeighted = ageRaw * weights.draftAge;

  return {
    athletic: { raw: p.ras, weighted: athWeighted },
    production: { raw: prod.score, weighted: prodWeighted, drivers: prod.drivers },
    breakout: { raw: brkRaw, weighted: brkWeighted, age: p.breakoutAge },
    draftAge: { raw: ageRaw, weighted: ageWeighted, age: p.age },
    weights,
    hasRAS: athRaw !== null,
    total: (athWeighted ?? 0) + prodWeighted + brkWeighted + ageWeighted,
  };
}

/* ────── helpers ────── */

function redistribute(base: Weights): Weights {
  // If athletic data is missing, push its weight proportionally into production.
  const lost = base.athletic;
  return {
    athletic: 0,
    production: base.production + lost,
    breakout: base.breakout,
    draftAge: base.draftAge,
  };
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function normRange(v: number | undefined, lo: number, hi: number): number {
  if (v === undefined || v === null || Number.isNaN(v)) return 50;
  if (v <= lo) return 30;
  if (v >= hi) return 100;
  return 30 + ((v - lo) / (hi - lo)) * 70;
}

// For metrics where LOWER is better (missed tackles, pressures allowed, targeted QBR).
function normRangeInverse(v: number | undefined, bestLo: number, worstHi: number): number {
  if (v === undefined || v === null || Number.isNaN(v)) return 50;
  if (v <= bestLo) return 100;
  if (v >= worstHi) return 30;
  return 100 - ((v - bestLo) / (worstHi - bestLo)) * 70;
}

function blend(pairs: Array<[number, number]>) {
  const totalWeight = pairs.reduce((a, [, w]) => a + w, 0);
  const weighted = pairs.reduce((a, [v, w]) => a + v * w, 0);
  return weighted / totalWeight;
}
