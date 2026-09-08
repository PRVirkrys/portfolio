// The narrative is an ordered list of scenes. `Bounds` holds scenes.length + 1
// rising cut points in global-progress space; scene i owns [bounds[i], bounds[i+1]).
// Restored snapshots keep a scene name + its local 0..1 progress, so a saved
// position survives a layout change that moves the cut points.
export const scenes = ['greeting', 'purpose', 'premise', 'board', 'figma'] as const;
export type Scene = typeof scenes[number];
export type Snapshot = { scene: Scene; progress: number };
export type Bounds = readonly number[];
export const desktopBounds: Bounds = [0, .14, .3, .46, .72, 1];
export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

export function snapshotAt(value: number, bounds: Bounds): Snapshot {
  const progress = clamp(Number.isFinite(value) ? value : 0);
  let index = 0;
  while (index < scenes.length - 1 && progress >= bounds[index + 1]) index += 1;
  const span = bounds[index + 1] - bounds[index] || 1;
  return { scene: scenes[index], progress: clamp((progress - bounds[index]) / span) };
}
export function progressFor(snapshot: Snapshot, bounds: Bounds): number {
  const index = Math.max(0, scenes.indexOf(snapshot.scene));
  return bounds[index] + clamp(snapshot.progress) * (bounds[index + 1] - bounds[index]);
}
export function parseSnapshot(raw: string | null): Snapshot | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || !scenes.includes(value.scene) || typeof value.progress !== 'number' || !Number.isFinite(value.progress) || value.progress < 0 || value.progress > 1) return null;
    return { scene: value.scene, progress: value.progress };
  } catch { return null; }
}
