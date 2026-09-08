import test from 'node:test';
import assert from 'node:assert/strict';
const module = await import('../src/components/home-scroll/home-progress.ts');
test('restoring a chapter preserves its local progress after the layout changes', () => {
  assert.equal(typeof module.snapshotAt, 'function', 'chapter progress is not implemented');
  const desktop = [0, .22, .48, 1];
  const mobile = [0, .3, .6, 1];
  const state = module.snapshotAt(.74, desktop);
  assert.equal(state.scene, 'board');
  assert.ok(Math.abs(state.progress - .5) < 1e-9);
  assert.ok(Math.abs(module.progressFor(state, mobile) - .8) < 1e-9);
});
test('backward scrolling produces the same chapter state as forward scrolling', () => {
  assert.equal(typeof module.snapshotAt, 'function');
  const bounds = [0, .22, .48, 1];
  const forward = [0, .15, .3, .65, 1].map(p => module.snapshotAt(p, bounds));
  const backward = [1, .65, .3, .15, 0].map(p => module.snapshotAt(p, bounds)).reverse();
  assert.deepEqual(forward, backward);
});
test('invalid saved navigation data cannot move the page to NaN or outside its scroll range', () => {
  assert.equal(typeof module.parseSnapshot, 'function');
  for (const value of ['oops', '{}', '{"scene":"board","progress":2}', '{"scene":"other","progress":0.5}', 'null']) assert.equal(module.parseSnapshot(value), null);
  assert.deepEqual(module.parseSnapshot('{"scene":"board","progress":0.3}'), {scene:'board', progress:.3});
});
