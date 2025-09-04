export function percentDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : Infinity;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function topContributors(labels: string[], values: number[], topN = 3) {
  if (!labels || !values || labels.length === 0) return [];
  const avg = values.reduce((s, v) => s + (v || 0), 0) / Math.max(1, values.length);
  const diffs = labels.map((lab, i) => ({ label: lab, value: values[i] || 0, diff: (values[i] || 0) - avg }));
  diffs.sort((a, b) => b.diff - a.diff);
  return diffs.slice(0, topN);
}
