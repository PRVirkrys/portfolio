import test from 'node:test';
import assert from 'node:assert/strict';

test('reading time counts prose and readable props, ignores imports and markup', async () => {
  const { readingMinutes } = await import('../src/lib/reading-time.ts');
  const words = n => Array(n).fill('palabra').join(' ');
  const mdx = [
    'import CaseSection from "../../components/case/CaseSection.astro";',
    `<CaseSection layout="stacked" tagCategory="Research" heading="${words(100)}">`,
    words(300),
    '[link](https://example.com/one/two/three)',
    '</CaseSection>',
  ].join('\n');
  assert.equal(readingMinutes(mdx), 2); // 401 words / 200 wpm
  assert.equal(readingMinutes(`${words(200)}\n${'<Image src={a} alt="x" />\n'.repeat(6)}`), 2); // 1 min + 6 × 10 s
  assert.equal(readingMinutes(''), 1);
});
