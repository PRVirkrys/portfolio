import { workCompanyIds } from '../data/work-companies.ts';

export const focusCategories = ['Research', 'Strategy', 'UX Design', 'UI Design', 'Engineering', 'Design Systems', 'Branding'] as const;
export type WorkFilters = { company: string; focus: string };
type FocusData = { focus?: string[]; tags?: { category: string }[] };
type FilterableEntry = { data: { type: string; company?: string } & FocusData };

/** Disciplines a case is filterable by: explicit `focus`, else its tag categories. */
export function caseFocus(data: FocusData): string[] {
  return data.focus ?? [...new Set(data.tags?.map(tag => tag.category).filter(category => focusCategories.some(focus => focus === category)))];
}

export function filterCaseStudies<T extends FilterableEntry>(entries: T[], filters: WorkFilters): T[] {
  return entries.filter(({ data }) => data.type === 'case-study'
    && (!filters.company || data.company === filters.company)
    && (!filters.focus || caseFocus(data).includes(filters.focus)));
}

/** Focuses that have at least one case study within the given company ('' = all). */
export function availableFocuses(entries: FilterableEntry[], company: string): Set<string> {
  return new Set(filterCaseStudies(entries, { company, focus: '' }).flatMap(({ data }) => caseFocus(data)));
}

export function readWorkFilters(search: string): WorkFilters {
  const params = new URLSearchParams(search);
  const company = params.get('company') ?? '';
  const focus = params.get('focus') ?? '';
  return {
    company: workCompanyIds.some(id => id === company) ? company : '',
    focus: focusCategories.some(category => category === focus) ? focus : '',
  };
}

export function updateWorkQuery(search: string, filters: WorkFilters): string {
  const params = new URLSearchParams(search);
  for (const key of ['company', 'focus'] as const) {
    if (filters[key]) params.set(key, filters[key]);
    else params.delete(key);
  }
  return params.size ? `?${params.toString()}` : '';
}
