import test from 'node:test';
import assert from 'node:assert/strict';

test('company and focus filters intersect and ignore ordinary posts', async () => {
  const { filterCaseStudies } = await import('../src/lib/work-filters.ts');
  const entries = [
    { id: 'base', data: { type: 'case-study', company: 'failfast', tags: [{ category: 'UX Design' }] } },
    { id: 'uoc', data: { type: 'case-study', company: 'failfast', tags: [{ category: 'Research' }] } },
    { id: 'other', data: { type: 'case-study', company: 'lpa', tags: [{ category: 'UX Design' }] } },
    { id: 'post', data: { type: 'post', company: 'failfast', tags: [{ category: 'UX Design' }] } },
    { id: 'untagged', data: { type: 'case-study' } },
  ];
  assert.deepEqual(filterCaseStudies(entries, { company: 'failfast', focus: 'UX Design' }).map(x => x.id), ['base']);
  assert.deepEqual(filterCaseStudies(entries, { company: '', focus: '' }).map(x => x.id), ['base', 'uoc', 'other', 'untagged']);
  assert.deepEqual(filterCaseStudies(entries, { company: 'lpa', focus: 'Research' }), []);
});

test('explicit focus overrides tag categories for filtering', async () => {
  const { filterCaseStudies, caseFocus } = await import('../src/lib/work-filters.ts');
  const entries = [
    { id: 'lpa', data: { type: 'case-study', focus: ['UI Design'], tags: [{ category: 'Engineering' }] } },
    { id: 'base', data: { type: 'case-study', tags: [{ category: 'UX Design' }, { category: 'Neutral' }, { category: 'UX Design' }] } },
  ];
  assert.deepEqual(filterCaseStudies(entries, { company: '', focus: 'UI Design' }).map(x => x.id), ['lpa']);
  assert.deepEqual(filterCaseStudies(entries, { company: '', focus: 'Engineering' }), []);
  assert.deepEqual(caseFocus(entries[1].data), ['UX Design']);
});

test('queries preserve valid unavailable combinations and normalize invalid filters', async () => {
  const { readWorkFilters, updateWorkQuery } = await import('../src/lib/work-filters.ts');
  assert.deepEqual(readWorkFilters('?company=failfast&focus=UX+Design'), { company: 'failfast', focus: 'UX Design' });
  assert.deepEqual(readWorkFilters('?company=lpa&focus=Research'), { company: 'lpa', focus: 'Research' });
  assert.deepEqual(readWorkFilters('?company=unknown&focus=not-a-focus'), { company: '', focus: '' });
  assert.equal(updateWorkQuery('?utm_source=ref&company=lpa', { company: 'failfast', focus: 'UX Design' }), '?utm_source=ref&company=failfast&focus=UX+Design');
  assert.equal(updateWorkQuery('?company=failfast&focus=Research', { company: '', focus: '' }), '');
});
