import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Run after npm run build: verify the actual Astro-rendered markup.
test('each rendered card has one design-system link with its complete title as accessible name', () => {
  const html = readFileSync(new URL('../dist/work/index.html', import.meta.url), 'utf8');
  const cards = [...html.matchAll(/<article\b[^>]*data-case-card[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 3);
  for (const [, card] of cards) {
    const anchors = [...card.matchAll(/<a\b([^>]*)>/g)];
    assert.equal(anchors.length, 1, 'one keyboard stop, no nested anchors');
    assert.match(anchors[0][1], /class="[^"]*\btext-link\b/, 'use the real design-system link');
    assert.match(anchors[0][1], /data-case-link/, 'filtered return navigation targets this link');
    const titleId = card.match(/<h2\b[^>]*id="([^"]+)"/)?.[1];
    assert.ok(titleId);
    assert.ok(anchors[0][1].includes(`aria-labelledby="${titleId}"`));
    assert.match(card, /text-link__icon/, 'use the icon supplied by TextLink');
    assert.match(card, /text-link__label[^>]*>Ver case study/);
  }
});
