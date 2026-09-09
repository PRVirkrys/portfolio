import test from 'node:test';
import assert from 'node:assert/strict';
const mod = await import('../src/components/home-scroll/split-flap.ts');
const { FLAP_CHARSET, buildCharacterSequence, columnWindow, splitFlapStateAt, layoutMessage } = mod;

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
  const COLS = 12;
  const roles = [
    'UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER',
    'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER',
  ];
  const pad = (s) => (s + ' '.repeat(COLS)).slice(0, COLS);
  const lines = [...roles.map((r) => layoutMessage(r, COLS)), [pad('PAULA RODAS'), pad('DESIGNER')]];
  for (let i = 0; i < lines.length - 1; i += 1) {
    const from = lines[i][0] + lines[i][1];        // 24 slots
    const to = lines[i + 1][0] + lines[i + 1][1];
    let landed = '';
    for (let c = 0; c < COLS * 2; c += 1) {
      const s = splitFlapStateAt(from[c], to[c], 1, c, COLS * 2);
      assert.equal(s.current, norm(to[c]), `slot ${c} of transition ${i}`);
      landed += s.current;
    }
    const [r1, r2] = [landed.slice(0, COLS).trim(), landed.slice(COLS).trim()];
    assert.equal([r1, r2].filter(Boolean).join(' '), (i + 1 < roles.length ? roles[i + 1] : 'PAULA RODAS DESIGNER'));
  }
});

test('layoutMessage word-wraps into two padded rows, never splitting a word', () => {
  assert.deepEqual(layoutMessage('UX DESIGNER', 12), ['UX DESIGNER ', '            ']);
  assert.deepEqual(layoutMessage('FULL-STACK DEVELOPER', 12), ['FULL-STACK  ', 'DEVELOPER   ']);
  assert.deepEqual(layoutMessage('PRODUCT DESIGNER', 12), ['PRODUCT     ', 'DESIGNER    ']);
  assert.deepEqual(layoutMessage('BRAND DESIGNER', 12), ['BRAND       ', 'DESIGNER    ']);
  assert.deepEqual(layoutMessage('BUILDER', 12), ['BUILDER     ', '            ']);
  for (const role of ['UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER', 'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER']) {
    const [a, b] = layoutMessage(role, 12);
    assert.equal(a.length, 12);
    assert.equal(b.length, 12);
    // Each row is a whole prefix of the role's words — no mid-word break.
    const words = role.split(' ');
    assert.ok(words.some((_, k) => a.trim() === words.slice(0, k + 1).join(' ')), `row 1 of "${role}" is a word boundary`);
    if (b.trim()) assert.ok(role.trim().endsWith(b.trim()), `row 2 of "${role}" is a word tail`);
  }
});
