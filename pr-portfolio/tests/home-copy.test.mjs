import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { homeCopy } = await import('../src/components/home-scroll/home-copy.ts');

const LOCALES = ['es', 'en'];
const INTRO_KEYS = ['greeting', 'prefix', 'name', 'cursorLabel', 'cursorShort'];

test('both locales carry the full intro + purpose contract', () => {
  for (const loc of LOCALES) {
    const c = homeCopy[loc];
    for (const k of INTRO_KEYS) {
      assert.equal(typeof c.intro[k], 'string', `${loc}.intro.${k} is a string`);
      assert.ok(c.intro[k].length > 0, `${loc}.intro.${k} is non-empty`);
    }
    assert.equal(typeof c.purpose.title, 'string');
    assert.ok(Array.isArray(c.purpose.parts) && c.purpose.parts.length > 0);
  }
});

test('es and en expose the same keys', () => {
  assert.deepEqual(
    Object.keys(homeCopy.es.intro).sort(),
    Object.keys(homeCopy.en.intro).sort(),
  );
  assert.deepEqual(
    Object.keys(homeCopy.es.purpose).sort(),
    Object.keys(homeCopy.en.purpose).sort(),
  );
  assert.deepEqual(
    Object.keys(homeCopy.es.narration).sort(),
    Object.keys(homeCopy.en.narration).sort(),
  );
  assert.deepEqual(
    Object.keys(homeCopy.es.idle).sort(),
    Object.keys(homeCopy.en.idle).sort(),
  );
});

test('narration beats carry a first-person phrase in both locales', () => {
  for (const loc of LOCALES) {
    for (const [scene, lines] of Object.entries(homeCopy[loc].narration)) {
      assert.ok(Array.isArray(lines) && lines.length > 0, `${loc}.narration.${scene} is a non-empty array`);
      assert.ok(
        lines.every((l) => typeof l.say === 'string' && l.say.length > 0),
        `${loc}.narration.${scene} entries each have a non-empty say`,
      );
    }
  }
});

test('idle carries the greeting escalation and a soft default in both locales', () => {
  for (const loc of LOCALES) {
    const { greeting, _default } = homeCopy[loc].idle;
    assert.ok(Array.isArray(greeting) && greeting.length === 3, `${loc}.idle.greeting has three lines`);
    assert.ok(Array.isArray(_default) && _default.length > 0, `${loc}.idle._default is non-empty`);
    for (const [scene, lines] of Object.entries(homeCopy[loc].idle)) {
      assert.ok(
        lines.every((s) => typeof s === 'string' && s.length > 0),
        `${loc}.idle.${scene} entries are non-empty strings`,
      );
    }
  }
});

test('the cursor label is the proper noun, never translated', () => {
  assert.equal(homeCopy.es.intro.cursorLabel, 'Paula');
  assert.equal(homeCopy.en.intro.cursorLabel, 'Paula');
});

test('purpose parts concatenate to the plain title, with exactly one emphasis', () => {
  for (const loc of LOCALES) {
    const { title, parts } = homeCopy[loc].purpose;
    assert.ok(parts.every((p) => typeof p.text === 'string'));
    assert.equal(parts.map((p) => p.text).join(''), title, `${loc}: parts join to title`);
    assert.equal(
      parts.filter((p) => p.emphasis === true).length,
      1,
      `${loc}: exactly one emphasis fragment`,
    );
  }
});

test('the content object is plain JSON — serialises and round-trips', () => {
  const round = JSON.parse(JSON.stringify(homeCopy));
  assert.deepEqual(round, homeCopy);
});

test('new narrative strings are not hardcoded in the GSAP logic', () => {
  const src = readFileSync(
    new URL('../src/components/home-scroll/home-scroll.ts', import.meta.url),
    'utf8',
  );
  for (const loc of LOCALES) {
    const c = homeCopy[loc];
    // The full, distinctive narrative strings — short word fragments like the
    // emphasis part legitimately collide with tokens such as "transform".
    for (const s of [
      c.intro.cursorShort, c.purpose.title,
      ...Object.values(c.idle).flat(),
      ...Object.values(c.narration).flat().map((l) => l.say),
    ]) {
      assert.ok(!src.includes(s), `"${s}" must come from copy, not home-scroll.ts`);
    }
  }
});
