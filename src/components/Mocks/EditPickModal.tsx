import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Pick, Position } from '../../types';
import { POSITION_OPTIONS } from '../../lib/positions';
import { teamDisplay } from '../../lib/teams';
import { TeamLogo } from './TeamLogo';

interface Props {
  pick: Pick | null;
  withReasoning: boolean;
  onCancel: () => void;
  onSave: (p: Pick) => void;
}

export function EditPickModal({ pick, withReasoning, onCancel, onSave }: Props) {
  const [player, setPlayer] = useState('');
  const [pos, setPos] = useState<Position>('');
  const [school, setSchool] = useState('');
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    if (pick) {
      setPlayer(pick.player);
      setPos(pick.pos);
      setSchool(pick.school);
      setReasoning(pick.reasoning ?? '');
    }
  }, [pick]);

  if (!pick) return null;

  const handleSave = () => {
    const updated: Pick = {
      ...pick,
      player: player.trim(),
      pos,
      school: school.trim(),
    };
    if (withReasoning) updated.reasoning = reasoning.trim();
    onSave(updated);
  };

  const handleClear = () => {
    const cleared: Pick = { ...pick, player: '', pos: '', school: '' };
    if (withReasoning) cleared.reasoning = '';
    onSave(cleared);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="panel w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <div className="flex items-center gap-3">
            <TeamLogo team={pick.team} size={28} />
            <div>
              <h3 className="hdr text-lg leading-none">Pick #{pick.pick}</h3>
              <p className="mono text-xs text-mute mt-1">{teamDisplay(pick.team)}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-mute mb-1">Player</span>
            <input
              autoFocus
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              className="w-full bg-card border border-edge px-3 py-2 text-ink focus:border-accent outline-none"
              placeholder="Player name"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-mute mb-1">Position</span>
              <select
                value={pos}
                onChange={(e) => setPos(e.target.value as Position)}
                className="w-full bg-card border border-edge px-3 py-2 text-ink focus:border-accent outline-none"
              >
                <option value="">—</option>
                {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-mute mb-1">School</span>
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full bg-card border border-edge px-3 py-2 text-ink focus:border-accent outline-none"
                placeholder="School"
              />
            </label>
          </div>

          {withReasoning && (
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-mute mb-1">Reasoning</span>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={4}
                className="w-full bg-card border border-edge px-3 py-2 text-ink focus:border-accent outline-none resize-y"
                placeholder="2–3 sentences on why this pick..."
              />
            </label>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-edge px-4 py-3">
          <button onClick={handleClear} className="btn-danger">Clear Pick</button>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="btn">Cancel</button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-black font-bold text-sm hover:bg-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
