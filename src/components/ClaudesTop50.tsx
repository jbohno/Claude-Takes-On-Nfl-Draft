import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Activity, AlertCircle } from 'lucide-react';
import type { Player, Position, Tier } from '../types';
import playersJson from '../../data/players2026.json';
import rasScoresJson from '../../data/rasScores.json';
import productionJson from '../../data/productionStats.json';
import claudesPredicted from '../../data/claudesPredictedMock.json';
import myPredicted from '../../data/myPredictedMock.json';
import claudesGM from '../../data/claudesGMMock.json';
import myGM from '../../data/myGMMock.json';
import {
  scoreProspect,
  positionWeights,
  type ScoreBreakdown,
  type ProductionEntry,
} from '../lib/prospectScore';
import { PositionTag } from './PositionTag';

interface RASEntry {
  ras: number | null;
  height?: string;
  weight?: number;
  forty?: number;
  vertical?: number;
  bench?: number;
  source?: string;
}

interface ScoredRow {
  player: Player;
  breakdown: ScoreBreakdown;
  ras: RASEntry | null;
  adp: number | null;
}

/**
 * ADP proxy: average pick number across the 4 mocks where a player appears.
 * Players appearing only in the 150-slot big board (no mock) get null ADP.
 */
function buildADPMap(): Record<string, number> {
  const buckets: Record<string, number[]> = {};
  const mocks = [
    claudesPredicted as { pick: number; player: string }[],
    myPredicted       as { pick: number; player: string }[],
    claudesGM         as { pick: number; player: string }[],
    myGM              as { pick: number; player: string }[],
  ];
  for (const mock of mocks) {
    for (const p of mock) {
      if (!p.player) continue;
      (buckets[p.player] ??= []).push(p.pick);
    }
  }
  const out: Record<string, number> = {};
  for (const [name, picks] of Object.entries(buckets)) {
    const avg = picks.reduce((a, b) => a + b, 0) / picks.length;
    out[name] = avg;
  }
  return out;
}

function buildPool(): Player[] {
  // Base pool: seeded players with names, plus any named player from the mocks not already in the pool.
  const base = (playersJson as Player[]).filter((p) => p.name);
  const seen = new Set(base.map((p) => p.name.toLowerCase()));
  let nextId = (playersJson as Player[]).length + 100;

  const allMocks = [claudesPredicted, myPredicted, claudesGM, myGM] as { player: string; pos: string; school: string }[][];
  for (const mock of allMocks) {
    for (const pick of mock) {
      if (!pick.player) continue;
      const key = pick.player.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      base.push({
        id: ++nextId,
        name: pick.player,
        pos: pick.pos as Position,
        school: pick.school,
        tier: '' as Tier,
      });
    }
  }
  return base;
}

export function ClaudesTop50() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const ras = rasScoresJson as Record<string, RASEntry>;
  const production = productionJson as Record<string, ProductionEntry>;
  const adpMap = useMemo(() => buildADPMap(), []);

  const rows: ScoredRow[] = useMemo(() => {
    const pool = buildPool();
    const scored = pool.map<ScoredRow>((player) => {
      const rasEntry = ras[player.name] ?? null;
      const rasScore = rasEntry?.ras ?? null;
      const prod = production[player.name];
      const adp = adpMap[player.name] ?? null;
      const breakdown = scoreProspect({
        player,
        ras: rasScore,
        production: prod,
        adp: adp ?? undefined,
      });
      return { player, breakdown, ras: rasEntry, adp };
    });
    return scored.sort((a, b) => b.breakdown.total - a.breakdown.total).slice(0, 50);
  }, [ras, production, adpMap]);

  const rasAvailable = Object.values(ras).some((r) => r?.ras !== null && r?.ras !== undefined);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="hdr text-2xl">Claude's Top 50</h2>
        <p className="text-mute text-sm mt-1">
          Composite score blends RAS (athleticism, position-weighted), production, and draft-capital proxy.
        </p>
      </div>

      {!rasAvailable && (
        <div className="panel border-gold/50 bg-gold/5 px-4 py-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="hdr text-sm text-gold">RAS data not loaded</div>
            <p className="text-mute mt-1">
              Run <span className="mono text-ink">npm run fetch-ras</span> to populate{' '}
              <span className="mono text-ink">/data/rasScores.json</span>. Until then, scoring falls back to production + ADP only.
            </p>
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="panel">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-edge hover:bg-card transition-colors"
        >
          <span className="hdr text-sm tracking-widest flex items-center gap-2">
            <Activity size={14} /> Methodology
          </span>
          {showMethodology ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showMethodology && <MethodologyBody />}
      </div>

      {/* List */}
      <section className="panel">
        <div className="grid grid-cols-1 divide-y divide-edge">
          {rows.map((row, idx) => (
            <Row
              key={row.player.id}
              rank={idx + 1}
              row={row}
              isOpen={expanded === row.player.id}
              onToggle={() => setExpanded(expanded === row.player.id ? null : row.player.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function MethodologyBody() {
  return (
    <div className="px-4 py-4 space-y-4 text-sm">
      <p className="text-mute">
        Each prospect's score is a weighted blend of three components. Weights shift by position — RAS
        correlates more strongly with NFL success at some positions than others.
      </p>

      <div>
        <div className="hdr text-xs tracking-widest mb-2 text-accent">Position weights</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mono text-xs">
          {(['QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DT', 'LB', 'CB', 'S'] as Position[]).map((p) => {
            const w = positionWeights(p);
            return (
              <div key={p} className="flex items-center justify-between border-b border-edge/50 py-1">
                <PositionTag pos={p} />
                <span className="text-mute">
                  RAS <span className="text-ink">{(w.ras * 100).toFixed(0)}%</span>
                  {' · '}Prod <span className="text-ink">{(w.production * 100).toFixed(0)}%</span>
                  {' · '}Capital <span className="text-ink">{(w.draftCapital * 100).toFixed(0)}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="hdr text-xs tracking-widest mb-1 text-accent">Reasoning</div>
        <ul className="list-disc pl-5 space-y-1 text-mute text-xs">
          <li>
            <span className="text-ink">EDGE / CB / S (35%)</span> — RAS correlates strongest here; these are
            athleticism-driven positions where traits become production.
          </li>
          <li>
            <span className="text-ink">LB / TE / DT (28%)</span> — moderate correlation; athleticism matters but
            instincts and technique shape outcomes.
          </li>
          <li>
            <span className="text-ink">WR / OT / IOL (22%)</span> — athleticism is a threshold filter, not a
            predictor. Route nuance / hand-fighting dominate.
          </li>
          <li>
            <span className="text-ink">QB / RB (12%)</span> — RAS is weakly predictive; production, tape, and
            situation matter far more.
          </li>
        </ul>
      </div>

      <div>
        <div className="hdr text-xs tracking-widest mb-1 text-accent">Missing RAS data</div>
        <p className="text-mute text-xs">
          If a player has no RAS entry (e.g. hasn't combined yet), their RAS weight is redistributed into
          production + draft-capital proportionally. The card shows
          <span className="mono text-ink"> RAS: pending combine</span>.
        </p>
      </div>

      <div>
        <div className="hdr text-xs tracking-widest mb-1 text-accent">Draft-capital proxy</div>
        <p className="text-mute text-xs">
          ADP is computed as the average pick number across all four mocks in this app (mine &amp; yours,
          Predicted &amp; GM). Players not in any mock receive a neutral 50-point baseline.
        </p>
      </div>
    </div>
  );
}

function Row({ rank, row, isOpen, onToggle }: { rank: number; row: ScoredRow; isOpen: boolean; onToggle: () => void }) {
  const { player, breakdown, adp } = row;
  const rasLabel = breakdown.hasRAS ? `RAS ${breakdown.rasRaw!.toFixed(2)}` : 'RAS: pending combine';

  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-card/60 transition-colors"
      >
        <div className="font-display font-bold text-accent text-xl w-8 text-right leading-none">{rank}</div>
        <PositionTag pos={player.pos} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-semibold text-ink truncate">{player.name || <em className="text-mute">empty slot</em>}</span>
            <span className="text-mute text-sm truncate hidden sm:inline">{player.school}</span>
          </div>
          <div className="mono text-[11px] text-mute mt-0.5 flex items-center gap-3 flex-wrap">
            <span className={breakdown.hasRAS ? 'text-ink' : 'text-gold'}>{rasLabel}</span>
            <span>PROD {breakdown.productionRaw.toFixed(0)}</span>
            <span>ADP {adp !== null ? adp.toFixed(1) : '—'}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-ink text-xl leading-none">{breakdown.total.toFixed(1)}</div>
          <div className="mono text-[10px] text-mute uppercase">score</div>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-mute" /> : <ChevronDown size={16} className="text-mute" />}
      </button>
      {isOpen && <RowDetail row={row} />}
    </div>
  );
}

function RowDetail({ row }: { row: ScoredRow }) {
  const { breakdown, ras } = row;
  return (
    <div className="px-4 pb-3 pt-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <Component
        label="RAS"
        raw={breakdown.rasRaw !== null ? breakdown.rasRaw.toFixed(2) : 'pending'}
        weight={breakdown.weights.ras}
        contrib={breakdown.rasWeighted}
      />
      <Component
        label="Production"
        raw={breakdown.productionRaw.toFixed(0)}
        weight={breakdown.weights.production}
        contrib={breakdown.productionWeighted}
      />
      <Component
        label="Draft Capital"
        raw={breakdown.draftCapitalRaw.toFixed(0)}
        weight={breakdown.weights.draftCapital}
        contrib={breakdown.draftCapitalWeighted}
      />
      {ras && (
        <div className="md:col-span-3 border-t border-edge pt-2 mono text-[11px] text-mute flex flex-wrap gap-x-4 gap-y-1">
          {ras.height && <span>HT: <span className="text-ink">{ras.height}</span></span>}
          {ras.weight && <span>WT: <span className="text-ink">{ras.weight}</span></span>}
          {ras.forty !== undefined && <span>40: <span className="text-ink">{ras.forty}</span></span>}
          {ras.vertical !== undefined && <span>VERT: <span className="text-ink">{ras.vertical}</span></span>}
          {ras.bench !== undefined && <span>BENCH: <span className="text-ink">{ras.bench}</span></span>}
          {ras.source && (
            <a href={ras.source} target="_blank" rel="noopener" className="text-accent hover:underline">ras.football →</a>
          )}
        </div>
      )}
    </div>
  );
}

function Component({ label, raw, weight, contrib }: { label: string; raw: string; weight: number; contrib: number | null }) {
  return (
    <div className="border border-edge bg-card/60 p-2">
      <div className="hdr text-[10px] tracking-widest text-mute">{label}</div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="font-display font-bold text-ink text-lg">{raw}</span>
        <span className="mono text-[10px] text-mute">× {(weight * 100).toFixed(0)}%</span>
      </div>
      <div className="mono text-[11px] text-accent mt-1">
        = {contrib !== null ? contrib.toFixed(1) : '—'}
      </div>
    </div>
  );
}
