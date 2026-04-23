import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Player, Position, Tier } from '../../types';
import { POSITION_OPTIONS, TIER_OPTIONS } from '../../lib/positions';

interface Props {
  player: Player | null;
  onCancel: () => void;
  onSave: (p: Player) => void;
}

export function EditSlotModal({ player, onCancel, onSave }: Props) {
  const [name, setName] = useState('');
  const [pos, setPos] = useState<Position>('');
  const [school, setSchool] = useState('');
  const [tier, setTier] = useState<Tier>('');

  useEffect(() => {
    if (player) {
      setName(player.name);
      setPos(player.pos);
      setSchool(player.school);
      setTier(player.tier);
    }
  }, [player]);

  if (!player) return null;

  const handleSave = () => {
    onSave({ ...player, name: name.trim(), pos, school: school.trim(), tier });
  };

  const handleClear = () => {
    onSave({ ...player, name: '', pos: '', school: '', tier: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h3 className="hdr text-lg">
            Edit Slot <span className="mono text-mute text-sm">#{player.id}</span>
          </h3>
          <button onClick={onCancel} className="text-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-mute mb-1">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <span className="block text-xs uppercase tracking-wider text-mute mb-1">Tier</span>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as Tier)}
                className="w-full bg-card border border-edge px-3 py-2 text-ink focus:border-accent outline-none"
              >
                <option value="">—</option>
                {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

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

        <div className="flex items-center justify-between border-t border-edge px-4 py-3">
          <button onClick={handleClear} className="btn-danger">Clear Slot</button>
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
