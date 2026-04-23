import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { RotateCcw, Download } from 'lucide-react';
import seedPlayers from '../../../data/players2026.json';
import type { Player } from '../../types';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { SortableSlot } from './SortableSlot';
import { EditSlotModal } from './EditSlotModal';

const STORAGE_KEY = 'draft-dashboard:big-board:v1';
const BOARD_SIZE = 50;
const TOTAL = 150;

const DEFAULT_PLAYERS = seedPlayers as Player[];

export function BigBoard() {
  const [players, setPlayers] = useLocalStorage<Player[]>(STORAGE_KEY, DEFAULT_PLAYERS);
  const [editing, setEditing] = useState<Player | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const boardIds = useMemo(() => players.map((p) => p.id), [players]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPlayers((items) => {
      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return items;
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const handleSaveEdit = (updated: Player) => {
    setPlayers((items) => items.map((it) => (it.id === updated.id ? updated : it)));
    setEditing(null);
  };

  const handleReset = () => {
    if (!confirm('Reset the board to the default order? This clears your custom rankings.')) return;
    setPlayers(DEFAULT_PLAYERS);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `big-board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filled = players.filter((p) => p.name).length;

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="hdr text-2xl">My Big Board</h2>
          <p className="text-mute text-sm mt-1">
            Drag to reorder. Top <span className="text-accent font-semibold">{BOARD_SIZE}</span> sit on the board, {BOARD_SIZE + 1}–{TOTAL} live in the pool.
            <span className="ml-2 mono text-xs">{filled}/{TOTAL} filled</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn">
            <Download size={14} /> Export JSON
          </button>
          <button onClick={handleReset} className="btn-danger">
            <RotateCcw size={14} /> Reset to default
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={boardIds} strategy={verticalListSortingStrategy}>
          {/* THE BOARD */}
          <section className="panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
              <h3 className="hdr text-lg tracking-widest">The Board · 1–{BOARD_SIZE}</h3>
              <span className="mono text-xs text-accent">● LIVE</span>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1">
              {players.slice(0, BOARD_SIZE).map((p, idx) => (
                <SortableSlot
                  key={p.id}
                  player={p}
                  rank={idx + 1}
                  isBoard
                  onEdit={setEditing}
                />
              ))}
            </div>
          </section>

          {/* THE POOL */}
          <section className="panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
              <h3 className="hdr text-lg tracking-widest">The Pool · {BOARD_SIZE + 1}–{TOTAL}</h3>
              <span className="mono text-xs text-mute">BENCH</span>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1">
              {players.slice(BOARD_SIZE).map((p, idx) => (
                <SortableSlot
                  key={p.id}
                  player={p}
                  rank={BOARD_SIZE + idx + 1}
                  isBoard={false}
                  onEdit={setEditing}
                />
              ))}
            </div>
          </section>
        </SortableContext>
      </DndContext>

      <EditSlotModal
        player={editing}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
