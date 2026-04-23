import type { Player, Position } from '../types';

/**
 * Blend three inputs into one composite score for each 2026 prospect:
 *
 *   1. RAS (athleticism)     — weighted by position
 *   2. Production (proxy)    — PFF grade / college stats from productionStats.json
 *   3. Draft capital (ADP)   — higher when consensus has the player going early
 *
 * Position-specific RAS weights reflect empirical correlation to NFL success:
 *   EDGE/CB/S          — high (.35)
 *   LB/TE/DT/DL        — moderate (.28)
 *   WR/OT/OL/IOL       — moderate (.22)
 *   QB/RB              — weak (.12)
 *
 * The remaining weight splits between production (stronger for QB/WR/RB/TE)
 * and draft capital (stronger for premium defenders where production is noisy).
 *
 * Players with no RAS data have their RAS-weighted portion redistributed to
 * the other two components so they're still ranked — they just carry a note.
 */

export interface ProductionEntry {
  pffGrade?: number;      // 0-100
  stats?: string;         // human readable one-liner, e.g. "1,450 yds / 14 TDs"
  tier?: number;          // 1-6 analyst tier
}

export interface ScoreBreakdown {
  rasRaw: number | null;
  rasWeighted: number | null;
  productionRaw: number;
  productionWeighted: number;
  draftCapitalRaw: number;
  draftCapitalWeighted: number;
  weights: { ras: number; production: number; draftCapital: number };
  hasRAS: boolean;
  total: number;
}

interface PositionWeights {
  ras: number;
  production: number;
  draftCapital: number;
}

const WEIGHTS: Record<string, PositionWeights> = {
  QB:   { ras: 0.12, production: 0.58, draftCapital: 0.30 },
  RB:   { ras: 0.12, production: 0.55, draftCapital: 0.33 },
  WR:   { ras: 0.22, production: 0.48, draftCapital: 0.30 },
  TE:   { ras: 0.28, production: 0.42, draftCapital: 0.30 },
  OT:   { ras: 0.22, production: 0.45, draftCapital: 0.33 },
  OL:   { ras: 0.22, production: 0.45, draftCapital: 0.33 },
  IOL:  { ras: 0.22, production: 0.45, draftCapital: 0.33 },
  C:    { ras: 0.22, production: 0.45, draftCapital: 0.33 },
  G:    { ras: 0.22, production: 0.45, draftCapital: 0.33 },
  EDGE: { ras: 0.35, production: 0.30, draftCapital: 0.35 },
  DE:   { ras: 0.33, production: 0.32, draftCapital: 0.35 },
  DT:   { ras: 0.28, production: 0.37, draftCapital: 0.35 },
  DL:   { ras: 0.28, production: 0.37, draftCapital: 0.35 },
  LB:   { ras: 0.28, production: 0.37, draftCapital: 0.35 },
  CB:   { ras: 0.35, production: 0.30, draftCapital: 0.35 },
  S:    { ras: 0.35, production: 0.30, draftCapital: 0.35 },
  ATH:  { ras: 0.30, production: 0.35, draftCapital: 0.35 },
};

const DEFAULT_WEIGHTS: PositionWeights = { ras: 0.25, production: 0.40, draftCapital: 0.35 };

function weightsFor(pos: Position): PositionWeights {
  return WEIGHTS[pos] ?? DEFAULT_WEIGHTS;
}

export function positionWeights(pos: Position) {
  return weightsFor(pos);
}

export function allPositionWeights() {
  return WEIGHTS;
}

// RAS is a 0-10 scale; normalize to 0-100
function normRAS(ras: number | null): number | null {
  if (ras === null || ras === undefined || Number.isNaN(ras)) return null;
  return Math.max(0, Math.min(100, ras * 10));
}

// Production: use PFF grade (already 0-100) if available, else tier (1-6 -> 90..40)
function normProduction(entry: ProductionEntry | undefined): number {
  if (!entry) return 50;
  if (typeof entry.pffGrade === 'number') return Math.max(0, Math.min(100, entry.pffGrade));
  if (typeof entry.tier === 'number') return Math.max(0, 100 - (entry.tier - 1) * 10);
  return 50;
}

// Draft capital proxy: lower ADP = higher value. If adp missing, use a neutral 50.
function normDraftCapital(adp: number | null | undefined): number {
  if (adp === null || adp === undefined || Number.isNaN(adp)) return 50;
  // adp 1 -> 100; adp 50 -> 50; adp 100 -> 10. Linear floor.
  return Math.max(10, Math.min(100, 100 - (adp - 1) * 0.9));
}

export interface ScoreInputs {
  player: Player;
  ras: number | null;
  production?: ProductionEntry;
  adp?: number;
}

export function scoreProspect(inputs: ScoreInputs): ScoreBreakdown {
  const base = weightsFor(inputs.player.pos);
  const rasN = normRAS(inputs.ras);
  const productionN = normProduction(inputs.production);
  const capitalN = normDraftCapital(inputs.adp);

  const weights: PositionWeights = rasN === null
    ? redistribute(base)
    : base;

  const rasPart = rasN === null ? 0 : rasN * weights.ras;
  const productionPart = productionN * weights.production;
  const capitalPart = capitalN * weights.draftCapital;

  return {
    rasRaw: inputs.ras ?? null,
    rasWeighted: rasN === null ? null : rasPart,
    productionRaw: productionN,
    productionWeighted: productionPart,
    draftCapitalRaw: capitalN,
    draftCapitalWeighted: capitalPart,
    weights,
    hasRAS: rasN !== null,
    total: rasPart + productionPart + capitalPart,
  };
}

function redistribute(base: PositionWeights): PositionWeights {
  // Push the RAS weight proportionally into production + capital so the total stays 1.
  const lost = base.ras;
  const remaining = base.production + base.draftCapital;
  return {
    ras: 0,
    production: base.production + (lost * base.production) / remaining,
    draftCapital: base.draftCapital + (lost * base.draftCapital) / remaining,
  };
}

export function rankAndLimit(scores: Array<{ player: Player; breakdown: ScoreBreakdown }>, limit: number) {
  return [...scores]
    .sort((a, b) => b.breakdown.total - a.breakdown.total)
    .slice(0, limit);
}
