import { workCompanyIds } from '../data/work-companies.ts';

export const focusCategories = ['Research', 'Strategy', 'UX Design', 'UI Design', 'Engineering', 'Design Systems'] as const;
export type WorkFilters = { company: string; focus: string };
type FilterableEntry = { data: { type: string; company?: string; tags?: { category: string }[] } };

export function filterCaseStudies<T extends FilterableEntry>(entries: T[], filters: WorkFilters): T[] {
  return entries.filter(({ data }) => data.type === 'case-study'
    && (!filters.company || data.company === filters.company)
    && (!filters.focus || data.tags?.some(tag => tag.category === filters.focus)));
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
