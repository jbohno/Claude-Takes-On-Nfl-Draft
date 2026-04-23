import { useState } from 'react';
import { logoUrl } from '../../lib/teams';

interface Props {
  team: string;
  size?: number;
  className?: string;
}

export function TeamLogo({ team, size = 32, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-edge text-mute mono text-[10px] flex items-center justify-center ${className}`}
      >
        {team}
      </div>
    );
  }
  return (
    <img
      src={logoUrl(team)}
      alt={`${team} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
