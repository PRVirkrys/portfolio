// Resolves an asset file name to its built URL. Assets live split by purpose:
//   src/assets/work/     brand logos for the work bubbles
//   src/assets/clients/  client logos shown in the work panels
//   src/assets/icons/    generic UI icons (sidebar, header, button)
// Going through the bundler (instead of a literal /icons/... path in public/)
// gives us content-hashed, cache-busted URLs and turns a missing/renamed file
// into a build error instead of a silent 404 at runtime. Lookup is by bare
// file name; names stay unique across the three folders.
const urls = import.meta.glob(
	['../assets/icons/*.{svg,png}', '../assets/work/*.{svg,png}', '../assets/clients/*.{svg,png}'],
	{ eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const byName = new Map(
	Object.entries(urls).map(([path, url]) => [path.split('/').pop() as string, url]),
);

export function iconUrl(name: string): string {
	const url = byName.get(name);
	if (!url) throw new Error(`iconUrl("${name}"): no such file under src/assets/{icons,work,clients}/`);
	return url;
}
