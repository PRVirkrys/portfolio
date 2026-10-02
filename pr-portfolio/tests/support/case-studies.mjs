import { readdirSync, readFileSync } from 'node:fs';

// Case studies as authored in src/content/blog, so tests follow the content
// instead of hard-coding how many cases exist.
const blogDir = new URL('../../src/content/blog/', import.meta.url);

export const caseStudies = readdirSync(blogDir)
  .filter(file => /\.mdx?$/.test(file))
  .map(file => readFileSync(new URL(file, blogDir), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')
  .filter(frontmatter => /^type:\s*case-study\s*$/m.test(frontmatter))
  .map(frontmatter => ({
    title: JSON.parse(frontmatter.match(/^title:\s*(".*")\s*$/m)?.[1] ?? '""'),
    upcoming: /^upcoming:\s*true\s*$/m.test(frontmatter),
  }));
