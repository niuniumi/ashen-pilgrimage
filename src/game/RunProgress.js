export function formatRunProgress(run = {}) {
  const highest = Number(run.highestFloor ?? 0);
  if (highest >= 100) {
    const act = Math.max(1, Math.floor(highest / 100));
    const floor = Math.max(1, highest % 100);
    return `第 ${act} 章 · 第 ${floor} 层`;
  }
  return `第 ${Math.max(1, Number(run.act ?? 1))} 章 · 第 ${Math.max(1, Number(run.floor ?? highest ?? 1))} 层`;
}
