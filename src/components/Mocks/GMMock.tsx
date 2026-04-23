import { MockView } from './MockView';
import type { Pick } from '../../types';
import myGM from '../../../data/myGMMock.json';
import claudesGM from '../../../data/claudesGMMock.json';

export function GMMock() {
  const hasClaudes = (claudesGM as Pick[]).some((p) => p.player);
  return (
    <MockView
      title="GM Mock"
      subtitle="What we each WOULD do if we were each team's GM."
      mineKey="draft-dashboard:mock:gm:mine:v1"
      mineDefault={myGM as Pick[]}
      claudesPicks={claudesGM as Pick[]}
      showReasoning={true}
      claudesNote={
        hasClaudes
          ? `Claude's picks + reasoning — edit /data/claudesGMMock.json to override.`
          : `Claude's GM picks pending — see /data/claudesGMMock.json.`
      }
    />
  );
}
