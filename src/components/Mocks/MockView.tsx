import { useState } from 'react';
import { RotateCcw, Download, Bot, User } from 'lucide-react';
import type { Pick } from '../../types';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { PickRow } from './PickRow';
import { EditPickModal } from './EditPickModal';

export interface MockViewProps {
  title: string;
  subtitle: string;
  mineKey: string;            // localStorage key for user's picks
  mineDefault: Pick[];        // seed for user's side
  claudesPicks: Pick[];       // static JSON for Claude's side
  showReasoning: boolean;     // whether to render reasoning under each pick
  claudesNote?: string;       // optional note above Claude's list (e.g. "generated ...")
}

export function MockView({
  title,
  subtitle,
  mineKey,
  mineDefault,
  claudesPicks,
  showReasoning,
  claudesNote,
}: MockViewProps) {
  const [side, setSide] = useState<'mine' | 'claudes'>('mine');
  const [minePicks, setMinePicks] = useLocalStorage<Pick[]>(mineKey, mineDefault);
  const [editing, setEditing] = useState<Pick | null>(null);

  const picks = side === 'mine' ? minePicks : claudesPicks;
  const filled = picks.filter((p) => p.player).length;

  const handleSaveEdit = (updated: Pick) => {
    setMinePicks((items) => items.map((it) => (it.pick === updated.pick ? updated : it)));
    setEditing(null);
  };

  const handleReset = () => {
    if (!confirm("Reset your picks to the defaults? You'll lose any edits on this mock.")) return;
    setMinePicks(mineDefault);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(picks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mineKey.replace(/[:]/g, '-')}-${side}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="hdr text-2xl">{title}</h2>
          <p className="text-mute text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {side === 'mine' && (
            <>
              <button onClick={handleExport} className="btn">
                <Download size={14} /> Export
              </button>
              <button onClick={handleReset} className="btn-danger">
                <RotateCcw size={14} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* segmented toggle */}
      <div className="inline-flex border border-edge bg-card">
        <button
          onClick={() => setSide('mine')}
          className={[
            'flex items-center gap-2 px-4 py-2 hdr text-sm tracking-wider transition-colors',
            side === 'mine' ? 'bg-accent text-black' : 'text-mute hover:text-ink',
          ].join(' ')}
        >
          <User size={14} /> Mine
        </button>
        <button
          onClick={() => setSide('claudes')}
          className={[
            'flex items-center gap-2 px-4 py-2 hdr text-sm tracking-wider border-l border-edge transition-colors',
            side === 'claudes' ? 'bg-accent text-black' : 'text-mute hover:text-ink',
          ].join(' ')}
        >
          <Bot size={14} /> Claude's
        </button>
        <div className="flex items-center px-3 mono text-[11px] text-mute border-l border-edge">
          {filled}/{picks.length} picks
        </div>
      </div>

      {side === 'claudes' && claudesNote && (
        <div className="panel bg-card/60 border-dashed px-4 py-3 mono text-xs text-mute">
          {claudesNote}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {picks.map((p) => (
          <PickRow
            key={p.pick}
            pick={p}
            editable={side === 'mine'}
            showReasoning={showReasoning}
            onEdit={setEditing}
          />
        ))}
      </div>

      <EditPickModal
        pick={editing}
        withReasoning={showReasoning}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
