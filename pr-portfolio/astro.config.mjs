// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

import react from '@astrojs/react';

const siteUrl = 'https://prvirkrys.github.io';
const siteHostname = new URL(siteUrl).hostname;

// https://astro.build/config
export default defineConfig({
    site: siteUrl,
    base: '/portfolio',
    devToolbar: { enabled: false },
    integrations: [mdx(), sitemap(), react()],
    vite: {
        plugins: [tailwindcss()],
    },
    markdown: {
        // Navigation rule: links within the site (relative paths, or an
        // absolute URL that happens to point back at this same host) stay
        // in the current tab; anything else opens in a new one so we don't
        // lose the visitor off-site.
        processor: unified({
            rehypePlugins: [
                [
                    rehypeExternalLinks,
                    {
                        target: '_blank',
                        rel: ['noopener', 'noreferrer'],
                        /** @param {import('hast').Element} element */
                        test(element) {
                            const href = element.properties?.href;
                            if (typeof href !== 'string') return true;
                            try {
                                return new URL(href, siteUrl).hostname !== siteHostname;
                            } catch {
                                return true;
                            }
                        },
                        content: {
                            type: 'text',
                            value: ' (se abre en una pestaña nueva)',
                        },
                        contentProperties: {
                            className: ['sr-only'],
                        },
                    },
                ],
            ],
        }),
    },
});
