import { Pencil } from 'lucide-react';
import type { Pick } from '../../types';
import { teamDisplay } from '../../lib/teams';
import { PositionTag } from '../PositionTag';
import { TeamLogo } from './TeamLogo';

interface Props {
  pick: Pick;
  editable: boolean;
  showReasoning: boolean;
  onEdit?: (p: Pick) => void;
}

export function PickRow({ pick, editable, showReasoning, onEdit }: Props) {
  const empty = !pick.player;

  return (
    <div className="group card-sharp p-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="font-display font-bold text-accent text-2xl w-10 text-right leading-none">
          {pick.pick}
        </div>
        <TeamLogo team={pick.team} size={36} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="mono text-[11px] uppercase text-mute leading-none">
            {teamDisplay(pick.team)}
          </div>
          {empty ? (
            <div className="mt-1">
              {editable ? (
                <button
                  onClick={() => onEdit?.(pick)}
                  className="text-mute italic hover:text-accent text-sm"
                >
                  — click to fill —
                </button>
              ) : (
                <span className="text-mute italic text-sm">— TBD —</span>
              )}
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 min-w-0">
              <PositionTag pos={pick.pos} />
              <span className="font-semibold text-ink truncate">{pick.player}</span>
              <span className="text-mute text-sm truncate hidden sm:inline">{pick.school}</span>
            </div>
          )}
        </div>
        {editable && (
          <button
            onClick={() => onEdit?.(pick)}
            aria-label="Edit pick"
            className="text-mute hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
      {showReasoning && pick.reasoning && (
        <p className="pl-[4.25rem] text-sm text-ink/80 leading-snug">
          {pick.reasoning}
        </p>
      )}
    </div>
  );
}
