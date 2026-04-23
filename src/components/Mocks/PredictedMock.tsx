import { MockView } from './MockView';
import type { Pick } from '../../types';
import myPredicted from '../../../data/myPredictedMock.json';
import claudesPredicted from '../../../data/claudesPredictedMock.json';

export function PredictedMock() {
  const hasClaudes = (claudesPredicted as Pick[]).some((p) => p.player);
  return (
    <MockView
      title="Predicted Mock"
      subtitle="What we each think the teams WILL do."
      mineKey="draft-dashboard:mock:predicted:mine:v1"
      mineDefault={myPredicted as Pick[]}
      claudesPicks={claudesPredicted as Pick[]}
      showReasoning={false}
      claudesNote={
        hasClaudes
          ? `Claude's prediction snapshot — edit /data/claudesPredictedMock.json to override.`
          : `Claude's predicted picks pending — see /data/claudesPredictedMock.json.`
      }
    />
  );
}
