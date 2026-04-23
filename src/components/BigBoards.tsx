import { useState } from 'react';
import { User, Bot } from 'lucide-react';
import { BigBoard } from './BigBoard/BigBoard';
import { ClaudesTop50 } from './ClaudesTop50';

export function BigBoards() {
  const [side, setSide] = useState<'mine' | 'claudes'>('mine');

  return (
    <div className="space-y-5">
      <div className="inline-flex border border-edge bg-card">
        <button
          onClick={() => setSide('mine')}
          className={[
            'flex items-center gap-2 px-4 py-2 hdr text-sm tracking-wider transition-colors',
            side === 'mine' ? 'bg-accent text-black' : 'text-mute hover:text-ink',
          ].join(' ')}
        >
          <User size={14} /> My Board
        </button>
        <button
          onClick={() => setSide('claudes')}
          className={[
            'flex items-center gap-2 px-4 py-2 hdr text-sm tracking-wider border-l border-edge transition-colors',
            side === 'claudes' ? 'bg-accent text-black' : 'text-mute hover:text-ink',
          ].join(' ')}
        >
          <Bot size={14} /> Claude's Top 50
        </button>
      </div>

      {side === 'mine' ? <BigBoard /> : <ClaudesTop50 />}
    </div>
  );
}
