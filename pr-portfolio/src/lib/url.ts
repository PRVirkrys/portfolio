// Prefixes an internal, root-relative path with Astro's configured `base`
// so links keep working whether the site is deployed under a subpath
// (e.g. GitHub Pages project pages, '/portfolio/') or at the root of a
// custom domain ('/'). When a custom domain is added, just update `base`
// in astro.config.mjs and every link built with this helper adjusts
// automatically, no other changes needed.
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}` || '/';
}  
