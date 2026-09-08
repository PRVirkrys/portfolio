export const scenes = ['greeting', 'premise', 'board'] as const;
export type Scene = typeof scenes[number];
export type Snapshot = { scene: Scene; progress: number };
export type Bounds = readonly [number, number, number, number];
export const desktopBounds: Bounds = [0, .22, .48, 1];
export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

export function snapshotAt(value: number, bounds: Bounds): Snapshot {
  const progress = clamp(Number.isFinite(value) ? value : 0);
  const index = progress < bounds[1] ? 0 : progress < bounds[2] ? 1 : 2;
  return { scene: scenes[index], progress: clamp((progress - bounds[index]) / (bounds[index + 1] - bounds[index])) };
}
export function progressFor(snapshot: Snapshot, bounds: Bounds): number {
  const index = scenes.indexOf(snapshot.scene);
  return bounds[index] + clamp(snapshot.progress) * (bounds[index + 1] - bounds[index]);
}
export function parseSnapshot(raw: string | null): Snapshot | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || !scenes.includes(value.scene) || typeof value.progress !== 'number' || !Number.isFinite(value.progress) || value.progress < 0 || value.progress > 1) return null;
    return { scene: value.scene, progress: value.progress };
  } catch { return null; }
}
