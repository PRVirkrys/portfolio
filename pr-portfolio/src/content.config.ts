import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tagCategory = z.enum(['Research', 'Strategy', 'UX Design', 'UI Design', 'Engineering', 'Design Systems', 'Neutral']);

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
			nextCase: z.object({ title: z.string(), slug: z.string() }).optional(),
		}),
});

export const collections = { blog };
