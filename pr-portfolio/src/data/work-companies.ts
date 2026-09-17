export const workCompanies = [
  { id: 'lpa', name: 'LPA' },
  { id: 'failfast', name: 'FailFast' },
  { id: 'pelt8', name: 'Pelt8' },
  { id: 'pr', name: 'Proyectos propios' },
] as const;

export type WorkCompanyId = (typeof workCompanies)[number]['id'];
export const workCompanyIds = workCompanies.map(company => company.id) as [WorkCompanyId, ...WorkCompanyId[]];
export const getWorkCompany = (id?: string) => workCompanies.find(company => company.id === id);

// Root-relative; consumers apply withBase once at the rendering boundary.
export const companyWorkPath = (id: WorkCompanyId) => `/work/?company=${id}`;
