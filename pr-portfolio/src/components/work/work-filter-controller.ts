import { filterCaseStudies, readWorkFilters, updateWorkQuery, type WorkFilters } from '../../lib/work-filters';
import { getWorkCompany } from '../../data/work-companies';

const root = document.querySelector<HTMLElement>('[data-work-page]');
if (root) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-case-card]')];
  const entries = cards.map(card => ({ card, data: {
    type: 'case-study', company: card.dataset.company,
    tags: (JSON.parse(card.dataset.focus ?? '[]') as string[]).map(category => ({ category })),
  } }));
  const controls = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const count = root.querySelector<HTMLElement>('[data-work-count]');
  const empty = root.querySelector<HTMLElement>('[data-work-empty]');
  const grid = root.querySelector<HTMLElement>('[data-work-grid]');
  const clear = root.querySelector<HTMLButtonElement>('.work-page__clear');
  let filters: WorkFilters = readWorkFilters(location.search);

  const render = () => {
    const matches = new Set(filterCaseStudies(entries, filters).map(entry => entry.card));
    const visible = matches.size;
    for (const card of cards) card.hidden = !matches.has(card);
    for (const button of controls) {
      const key = button.dataset.filter as keyof WorkFilters;
      button.setAttribute('aria-pressed', String(filters[key] === button.dataset.value));
    }
    if (count) count.textContent = `${visible} ${visible === 1 ? 'case study' : 'case studies'}${filters.company ? ` · ${getWorkCompany(filters.company)?.name}` : ''}${filters.focus ? ` · ${filters.focus}` : ''}`;
    if (empty) empty.hidden = visible !== 0;
    if (grid) grid.hidden = visible === 0;
    if (clear) clear.hidden = !filters.company && !filters.focus;
    // Carry the list query only into the case being opened, not other cases.
    for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-case-link]')) {
      const url = new URL(link.href);
      const query = updateWorkQuery('', filters);
      if (query) url.searchParams.set('from', query);
      else url.searchParams.delete('from');
      link.href = `${url.pathname}${url.search}`;
    }
  };
  const select = (next: WorkFilters) => {
    filters = next;
    const query = updateWorkQuery(location.search, filters);
    if (location.search !== query) history.pushState(null, '', `${location.pathname}${query}${location.hash}`);
    render();
  };
  for (const button of controls) button.addEventListener('click', () => select({ ...filters, [button.dataset.filter!]: button.dataset.value ?? '' }));
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-clear-filters]')) button.addEventListener('click', () => select({ company: '', focus: '' }));
  addEventListener('popstate', () => { filters = readWorkFilters(location.search); render(); });
  addEventListener('pageshow', () => { filters = readWorkFilters(location.search); render(); });
  render();
  const panel = root.querySelector<HTMLElement>('[data-work-filters]');
  if (panel) panel.hidden = false;
}
