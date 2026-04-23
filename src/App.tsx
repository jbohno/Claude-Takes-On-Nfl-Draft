import { useState } from 'react';
import { ListOrdered, Eye, ClipboardList } from 'lucide-react';
import { Tabs, type TabDef } from './components/Tabs';
import { BigBoards } from './components/BigBoards';
import { PredictedMock } from './components/Mocks/PredictedMock';
import { GMMock } from './components/Mocks/GMMock';

const TABS: TabDef[] = [
  { id: 'big-boards',     label: 'Big Boards',     icon: ListOrdered },
  { id: 'predicted-mock', label: 'Predicted Mock', icon: Eye },
  { id: 'gm-mock',        label: 'GM Mock',        icon: ClipboardList },
];

export default function App() {
  const [active, setActive] = useState(TABS[0].id);

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <header className="border-b border-edge bg-panel">
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-accent" />
            <div>
              <h1 className="hdr text-2xl leading-none">2026 NFL Draft Dashboard</h1>
              <p className="mono text-xs text-mute mt-1">ME vs. CLAUDE · DRAFT WAR-ROOM</p>
            </div>
          </div>
          <div className="mono text-xs text-mute hidden sm:block">LOCAL-ONLY · NO SYNC</div>
        </div>
      </header>

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">
        {active === 'big-boards'     && <BigBoards />}
        {active === 'predicted-mock' && <PredictedMock />}
        {active === 'gm-mock'        && <GMMock />}
      </main>

      <footer className="border-t border-edge bg-panel mt-auto">
        <div className="max-w-7xl mx-auto px-5 py-3 mono text-[11px] text-mute flex justify-between">
          <span>2026 NFL DRAFT · LOCAL BUILD</span>
          <span>DATA PERSISTED IN LOCALSTORAGE</span>
        </div>
      </footer>
    </div>
  );
}
