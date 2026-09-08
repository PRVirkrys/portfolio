import test from 'node:test';
import assert from 'node:assert/strict';
const module = await import('../src/components/home-scroll/home-progress.ts');
const { scenes, desktopBounds, snapshotAt, progressFor, parseSnapshot } = module;

test('the scene list and its bounds stay in step', () => {
  assert.ok(scenes.length >= 2);
  assert.equal(desktopBounds.length, scenes.length + 1);
  assert.equal(desktopBounds[0], 0);
  assert.equal(desktopBounds.at(-1), 1);
  for (let i = 1; i < desktopBounds.length; i += 1) assert.ok(desktopBounds[i] > desktopBounds[i - 1], 'bounds must rise');
});

test('the first bound resolves to the first scene at local progress 0', () => {
  const state = snapshotAt(0, desktopBounds);
  assert.equal(state.scene, scenes[0]);
  assert.equal(state.progress, 0);
});

test('the last bound resolves to the last scene at local progress 1', () => {
  const state = snapshotAt(1, desktopBounds);
  assert.equal(state.scene, scenes.at(-1));
  assert.equal(state.progress, 1);
});

test('every intermediate band maps its midpoint to the matching scene', () => {
  for (let i = 0; i < scenes.length; i += 1) {
    const mid = (desktopBounds[i] + desktopBounds[i + 1]) / 2;
    const state = snapshotAt(mid, desktopBounds);
    assert.equal(state.scene, scenes[i], `midpoint of band ${i}`);
    assert.ok(Math.abs(state.progress - 0.5) < 1e-9);
  }
});

test('backward scrolling produces the same scene state as forward scrolling', () => {
  const samples = [0, .12, .3, .5, .7, .9, 1];
  const forward = samples.map(p => snapshotAt(p, desktopBounds));
  const backward = [...samples].reverse().map(p => snapshotAt(p, desktopBounds)).reverse();
  assert.deepEqual(forward, backward);
});

test('restoring a scene preserves its local progress after the layout changes', () => {
  const wide = [0, .22, .4, .55, 1];
  const narrow = [0, .3, .5, .7, 1];
  const state = snapshotAt(.475, wide); // middle of the 3rd band
  assert.equal(state.scene, scenes[2]);
  assert.ok(Math.abs(state.progress - .5) < 1e-9);
  assert.ok(Math.abs(progressFor(state, narrow) - .6) < 1e-9);
});

test('legacy greeting / premise / board snapshots still restore', () => {
  for (const scene of ['greeting', 'premise', 'board']) {
    const restored = parseSnapshot(JSON.stringify({ scene, progress: .3 }));
    assert.deepEqual(restored, { scene, progress: .3 });
    assert.ok(Number.isFinite(progressFor(restored, desktopBounds)));
  }
});

test('invalid saved navigation data cannot move the page to NaN or outside its scroll range', () => {
  for (const value of ['oops', '{}', '{"scene":"board","progress":2}', '{"scene":"other","progress":0.5}', '{"scene":"board","progress":null}', 'null'])
    assert.equal(parseSnapshot(value), null);
  assert.deepEqual(parseSnapshot('{"scene":"purpose","progress":0.3}'), { scene: 'purpose', progress: .3 });
  assert.equal(snapshotAt(NaN, desktopBounds).scene, scenes[0]);
  assert.equal(snapshotAt(NaN, desktopBounds).progress, 0);
});
