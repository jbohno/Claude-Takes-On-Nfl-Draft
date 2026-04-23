import type { LucideIcon } from 'lucide-react';

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <nav className="border-b border-edge bg-panel sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={[
                'flex items-center gap-2 px-5 py-4 border-b-2 hdr text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'border-accent text-accent bg-card'
                  : 'border-transparent text-mute hover:text-ink hover:bg-card/50',
              ].join(' ')}
            >
              <Icon size={16} strokeWidth={2.25} />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
