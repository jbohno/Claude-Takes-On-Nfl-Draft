import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Activity, AlertCircle } from 'lucide-react';
import type { Position } from '../types';
import prospectsJson from '../../data/prospects2026.json';
import rasScoresJson from '../../data/rasScores.json';
import {
  scoreProspect,
  weightsFor,
  type Prospect,
  type Breakdown,
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

interface Row {
  prospect: Prospect;
  breakdown: Breakdown;
  rasOverride: RASEntry | null;
}

function loadProspects(): Prospect[] {
  const raw = prospectsJson as unknown as Record<string, Omit<Prospect, 'name'> & { _comment?: string }>;
  const out: Prospect[] = [];
  for (const [name, entry] of Object.entries(raw)) {
    if (name.startsWith('_')) continue;
    out.push({ ...(entry as Omit<Prospect, 'name'>), name });
  }
  return out;
}

export function ClaudesTop50() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const realRAS = rasScoresJson as Record<string, RASEntry>;

  const rows: Row[] = useMemo(() => {
    const prospects = loadProspects();
    const scored = prospects.map<Row>((p) => {
      const override = realRAS[p.name];
      const withOverride: Prospect = override?.ras != null ? { ...p, ras: override.ras } : p;
      const breakdown = scoreProspect(withOverride);
      return { prospect: withOverride, breakdown, rasOverride: override ?? null };
    });
    return scored.sort((a, b) => b.breakdown.total - a.breakdown.total).slice(0, 50);
  }, [realRAS]);

  const realRASCount = Object.values(realRAS).filter((r) => r?.ras != null).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="hdr text-2xl">Claude's Top 50</h2>
        <p className="text-mute text-sm mt-1">
          Independent ranking. Four components per prospect: athletic (RAS), production (position-specific advanced stats),
          breakout age, and draft age.
        </p>
      </div>

      {realRASCount === 0 && (
        <div className="panel border-gold/50 bg-gold/5 px-4 py-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="hdr text-sm text-gold">Using estimated RAS values</div>
            <p className="text-mute mt-1">
              Real 2026 combine numbers are not in <span className="mono text-ink">/data/rasScores.json</span>. Run{' '}
              <span className="mono text-ink">npm run fetch-ras</span> locally to scrape ras.football and override the
              estimates embedded in <span className="mono text-ink">/data/prospects2026.json</span>.
            </p>
          </div>
        </div>
      )}

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

      <section className="panel">
        <div className="grid grid-cols-1 divide-y divide-edge">
          {rows.map((row, idx) => (
            <ProspectRow
              key={row.prospect.name}
              rank={idx + 1}
              row={row}
              isOpen={expanded === row.prospect.name}
              onToggle={() => setExpanded(expanded === row.prospect.name ? null : row.prospect.name)}
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
        Each prospect gets four component scores (0–100), blended by position-specific weights to produce a 0–100 composite.
      </p>

      <div>
        <div className="hdr text-xs tracking-widest mb-2 text-accent">Position weights</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mono text-xs">
          {(['QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DT', 'LB', 'CB', 'S'] as Position[]).map((p) => {
            const w = weightsFor(p);
            return (
              <div key={p} className="flex items-center justify-between border-b border-edge/50 py-1 gap-2">
                <PositionTag pos={p} />
                <span className="text-mute whitespace-nowrap">
                  ATH <span className="text-ink">{(w.athletic * 100).toFixed(0)}</span>
                  {' · '}PROD <span className="text-ink">{(w.production * 100).toFixed(0)}</span>
                  {' · '}BRK <span className="text-ink">{(w.breakout * 100).toFixed(0)}</span>
                  {' · '}AGE <span className="text-ink">{(w.draftAge * 100).toFixed(0)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Method label="Athletic (RAS)" text="RAS × 10. Weighted heaviest at EDGE / CB / S where traits map closest to NFL production. Weakest at QB / RB where tape dominates." />
        <Method label="Production" text="Position-specific composite. WR uses YPRR + market share + contested-catch. EDGE uses pressure rate + PFF pass-rush grade. OL uses pass-block grade + pressures allowed. CB uses coverage grade + forced-incompletion %. Each metric is normalised against position benchmarks." />
        <Method label="Breakout Age" text="Age at first dominant college season. ≤ 19 = 100, 20 = 90, 21 = 60 (baseline), 22 = 40, 23+ = 20. Curve is compressed for QB and OL where late breakouts are common." />
        <Method label="Draft Age" text="21 = 95 (prime runway), 22 = 80, 23 = 60, 24+ = 40 or lower. Young prospects get more NFL development curve; older prospects have shorter second contracts." />
      </div>

      <div>
        <div className="hdr text-xs tracking-widest mb-1 text-accent">Missing data</div>
        <p className="text-mute text-xs">
          If a prospect has no RAS value, the athletic weight is redistributed to production — the composite can still rank
          them without penalty. Production metrics that are missing default to a neutral 50.
        </p>
      </div>
    </div>
  );
}

function Method({ label, text }: { label: string; text: string }) {
  return (
    <div className="border border-edge bg-card/50 p-3">
      <div className="hdr text-xs tracking-widest text-accent mb-1">{label}</div>
      <p className="text-xs text-mute leading-snug">{text}</p>
    </div>
  );
}

function ProspectRow({ rank, row, isOpen, onToggle }: { rank: number; row: Row; isOpen: boolean; onToggle: () => void }) {
  const { prospect, breakdown } = row;
  const rasLabel = breakdown.hasRAS
    ? `RAS ${breakdown.athletic.raw!.toFixed(2)}`
    : 'RAS: pending combine';

  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-card/60 transition-colors"
      >
        <div className="font-display font-bold text-accent text-xl w-8 text-right leading-none">{rank}</div>
        <PositionTag pos={prospect.pos} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-semibold text-ink truncate">{prospect.name}</span>
            <span className="text-mute text-sm truncate hidden sm:inline">{prospect.school}</span>
          </div>
          <div className="mono text-[11px] text-mute mt-0.5 flex items-center gap-3 flex-wrap">
            <span className={breakdown.hasRAS ? 'text-ink' : 'text-gold'}>{rasLabel}</span>
            <span>PROD {breakdown.production.raw.toFixed(0)}</span>
            <span>BRK@{breakdown.breakout.age}</span>
            <span>AGE {breakdown.draftAge.age}</span>
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

function RowDetail({ row }: { row: Row }) {
  const { breakdown, prospect, rasOverride } = row;
  return (
    <div className="px-4 pb-4 pt-1 space-y-3 text-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Component
          label="Athletic"
          raw={breakdown.athletic.raw !== null ? breakdown.athletic.raw.toFixed(2) : 'pending'}
          weight={breakdown.weights.athletic}
          contrib={breakdown.athletic.weighted}
        />
        <Component
          label="Production"
          raw={breakdown.production.raw.toFixed(0)}
          weight={breakdown.weights.production}
          contrib={breakdown.production.weighted}
        />
        <Component
          label={`Breakout @${breakdown.breakout.age}`}
          raw={breakdown.breakout.raw.toFixed(0)}
          weight={breakdown.weights.breakout}
          contrib={breakdown.breakout.weighted}
        />
        <Component
          label={`Draft Age ${breakdown.draftAge.age}`}
          raw={breakdown.draftAge.raw.toFixed(0)}
          weight={breakdown.weights.draftAge}
          contrib={breakdown.draftAge.weighted}
        />
      </div>

      {breakdown.production.drivers.length > 0 && (
        <div className="border border-edge bg-card/50 p-2">
          <div className="hdr text-[10px] tracking-widest text-mute mb-1">Production drivers</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mono text-[11px]">
            {breakdown.production.drivers.map((d) => (
              <span key={d.label} className="text-mute">
                {d.label}: <span className="text-ink">{d.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {prospect.traits && prospect.traits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prospect.traits.map((t) => (
            <span key={t} className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-edge bg-card/60 text-mute">
              {t}
            </span>
          ))}
        </div>
      )}

      {rasOverride && (
        <div className="border-t border-edge pt-2 mono text-[11px] text-mute flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-accent">LIVE RAS DATA</span>
          {rasOverride.height && <span>HT: <span className="text-ink">{rasOverride.height}</span></span>}
          {rasOverride.weight && <span>WT: <span className="text-ink">{rasOverride.weight}</span></span>}
          {rasOverride.forty !== undefined && <span>40: <span className="text-ink">{rasOverride.forty}</span></span>}
          {rasOverride.vertical !== undefined && <span>VERT: <span className="text-ink">{rasOverride.vertical}</span></span>}
          {rasOverride.bench !== undefined && <span>BENCH: <span className="text-ink">{rasOverride.bench}</span></span>}
          {rasOverride.source && (
            <a href={rasOverride.source} target="_blank" rel="noopener" className="text-accent hover:underline">ras.football →</a>
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
