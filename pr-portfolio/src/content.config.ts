import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { workCompanyIds } from './data/work-companies';

const tagCategory = z.enum(['Research', 'Strategy', 'UX Design', 'UI Design', 'Engineering', 'Design Systems', 'Branding', 'Neutral']);
const focusCategory = tagCategory.exclude(['Neutral']);

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Case study fields
			type: z.enum(['post', 'case-study']).default('post'),
			company: z.enum(workCompanyIds).optional(),
			customer: z.string().optional(),
			cardSummary: z.string().optional(),
			// Overrides the card's "Company · Customer" eyebrow, e.g. academic work
			// filed under `pr` that should still read "ELISAVA · Proyecto académico".
			cardContext: z.string().optional(),
			confidentialityNote: z.boolean().optional(),
			// Announced but not written yet: shows a disabled card on /work/ and
			// gets no page, RSS item or journey link. The MDX body stays empty.
			upcoming: z.boolean().optional(),
			// Work filters. Optional: defaults to the tag categories, so only set it
			// when the case covers a discipline its (max 3–4) visible tags don't show.
			focus: z.array(focusCategory).optional(),
			tags: z.array(z.object({
				label: z.string(),
				category: tagCategory,
			})).optional(),
			breadcrumbs: z.array(z.object({
				label: z.string(),
				href: z.string().optional(),
			})).optional(),
			client: z.string().optional(),
			industry: z.string().optional(),
			role: z.string().optional(),
			location: z.string().optional(),
			date: z.string().optional(),
			liveUrl: z.object({ label: z.string(), href: z.string() }).optional(),
			collaboration: z.string().optional(),
			tools: z.string().optional(),
			platform: z.string().optional(),
			executiveSummary: z.array(z.object({
				label: z.string(),
				text: z.string(),
			})).min(2).max(5).optional(),
			nextCase: z.object({ title: z.string(), slug: z.string() }).optional(),
		}),
});

export const collections = { blog };
