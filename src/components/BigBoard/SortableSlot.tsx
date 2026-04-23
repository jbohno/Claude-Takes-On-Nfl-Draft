import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil } from 'lucide-react';
import type { Player } from '../../types';
import { PositionTag } from '../PositionTag';

interface Props {
  player: Player;
  rank: number;
  isBoard: boolean;
  onEdit: (p: Player) => void;
}

export function SortableSlot({ player, rank, isBoard, onEdit }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const empty = !player.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-stretch border transition-colors',
        isBoard ? 'border-edge bg-card' : 'border-edge/60 bg-card/60',
        isDragging ? 'border-accent' : '',
      ].join(' ')}
    >
      {/* rank column */}
      <div
        className={[
          'flex items-center justify-center w-12 border-r border-edge font-display font-bold',
          isBoard ? 'bg-base text-accent text-xl' : 'bg-base/60 text-mute text-base',
        ].join(' ')}
      >
        {rank}
      </div>

      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="px-2 text-mute hover:text-ink cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={16} />
      </button>

      {/* body */}
      <div className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2">
        <PositionTag pos={player.pos} />
        <div className="flex-1 min-w-0">
          {empty ? (
            <button
              onClick={() => onEdit(player)}
              className="text-left w-full text-mute italic hover:text-accent text-sm"
            >
              — empty slot · click to fill —
            </button>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold text-ink truncate">{player.name}</span>
              <span className="text-mute text-sm truncate hidden sm:inline">{player.school}</span>
            </div>
          )}
        </div>
        {player.tier && (
          <span className="mono text-[11px] text-mute uppercase hidden md:inline">
            {player.tier}
          </span>
        )}
        <button
          onClick={() => onEdit(player)}
          aria-label="Edit slot"
          className="text-mute hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
}
