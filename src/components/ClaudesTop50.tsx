export function ClaudesTop50() {
  return (
    <div className="panel p-6">
      <h2 className="hdr text-xl mb-2">Claude's Top 50 · RAS Integration</h2>
      <p className="text-mute text-sm">
        Run <span className="mono text-ink">npm run fetch-ras</span> to populate <span className="mono text-ink">/data/rasScores.json</span>, then reload.
      </p>
    </div>
  );
}
