import test from 'node:test';
import assert from 'node:assert/strict';
const mod = await import('../src/components/home-scroll/split-flap.ts');
const { FLAP_CHARSET, buildCharacterSequence, columnWindow, splitFlapStateAt, padMessage } = mod;

const norm = (ch) => {
  const u = (ch ?? ' ').toUpperCase();
  return FLAP_CHARSET.includes(u) ? u : ' ';
};

test('progress 0 shows the starting character', () => {
  for (const [from, to] of [['A', 'Z'], [' ', 'R'], ['P', 'P'], ["'", '-']]) {
    const s = splitFlapStateAt(from, to, 0, 0, 1);
    assert.equal(s.current, norm(from));
    assert.equal(s.angle, 0);
  }
});

test('progress 1 lands exactly on the target character, flat', () => {
  for (const [from, to] of [['A', 'Z'], [' ', 'R'], ['P', 'P'], ['E', 'R'], ['-', ' ']]) {
    const s = splitFlapStateAt(from, to, 1, 0, 1);
    assert.equal(s.current, norm(to));
    assert.equal(s.angle, 0);
    assert.equal(s.next, norm(to));
  }
});

test('the state is a deterministic pure function of its inputs', () => {
  const a = splitFlapStateAt('A', 'M', 0.37, 3, 11);
  const b = splitFlapStateAt('A', 'M', 0.37, 3, 11);
  assert.deepEqual(a, b);
});

test('walking progress backwards yields the same states in reverse order', () => {
  const samples = [0, 0.1, 0.25, 0.4, 0.6, 0.8, 1];
  const forward = samples.map((p) => splitFlapStateAt('C', 'X', p, 2, 9));
  const backward = [...samples].reverse().map((p) => splitFlapStateAt('C', 'X', p, 2, 9)).reverse();
  assert.deepEqual(forward, backward);
});

test('the stagger moves the left column before the right one', () => {
  const N = 11;
  const w1 = columnWindow(1, N);
  assert.ok(columnWindow(0, N).start < w1.start, 'column 0 starts before column 1');
  // At a progress inside column 0 but before column 1 has started:
  const p = w1.start * 0.5;
  const left = splitFlapStateAt('A', 'Z', p, 0, N);
  const right = splitFlapStateAt('A', 'Z', p, 1, N);
  assert.notEqual(left.current === 'A' && left.angle === 0, true, 'left column has already moved');
  assert.equal(right.current, 'A');
  assert.equal(right.angle, 0);
});

test('spaces, hyphens and apostrophes are valid plates', () => {
  for (const [from, to] of [[' ', "'"], ['-', ' '], ["'", '-'], ['A', '-']]) {
    const seq = buildCharacterSequence(from, to);
    assert.equal(seq[0], norm(from));
    assert.equal(seq[seq.length - 1], norm(to));
    assert.ok(seq.length > FLAP_CHARSET.length, 'sequence loops at least once');
    assert.doesNotThrow(() => splitFlapStateAt(from, to, 0.5, 0, 3));
  }
});

test('every role transition resolves exactly onto its target copy', () => {
  const messages = [
    'UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER',
    'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER', 'DESIGNER', 'PAULA RODAS',
  ];
  const width = Math.max(...messages.map((m) => m.length));
  const padded = messages.map((m) => padMessage(m, width));
  for (let i = 0; i < padded.length - 1; i += 1) {
    const from = padded[i], to = padded[i + 1];
    let landed = '';
    for (let c = 0; c < width; c += 1) {
      const s = splitFlapStateAt(from[c], to[c], 1, c, width);
      assert.equal(s.current, norm(to[c]), `col ${c} of ${messages[i]}→${messages[i + 1]}`);
      landed += s.current;
    }
    assert.equal(landed.trim(), messages[i + 1]);
  }
});

test('padMessage centres the text and never splits it', () => {
  assert.equal(padMessage('PAULA RODAS', 20).trim(), 'PAULA RODAS');
  assert.equal(padMessage('PAULA RODAS', 20).length, 20);
  assert.equal(padMessage('BUILDER', 11), '  BUILDER  ');
});
