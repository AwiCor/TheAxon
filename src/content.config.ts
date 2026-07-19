import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SECTION_IDS } from './lib/sections';

// A paper is a Markdown file in src/content/papers/. The filename becomes the
// URL slug (/papers/<filename>/). Frontmatter carries the front-matter of the
// paper; the Markdown body is the full text. A paper may instead (or also)
// ship a PDF placed in public/papers/ and referenced via `pdf`.
const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    title: z.string(),
    section: z.enum(SECTION_IDS),
    abstract: z.string(),
    author: z.string().default('The Axon'),
    date: z.coerce.date(),
    pdf: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { papers };
