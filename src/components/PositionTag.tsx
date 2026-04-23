import { positionClass } from '../lib/positions';

export function PositionTag({ pos, className = '' }: { pos: string; className?: string }) {
  if (!pos) return <span className={`pill bg-edge text-mute ${className}`}>—</span>;
  return <span className={`pill ${positionClass(pos)} ${className}`}>{pos}</span>;
}
