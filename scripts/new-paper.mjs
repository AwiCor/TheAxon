#!/usr/bin/env node
/**
 * Scaffold a new paper. This replaces the old Base44 admin: publishing is now
 * "add a Markdown file and commit."
 *
 *   npm run new -- "Title of the Paper" neurology
 *   npm run new -- "A PDF Paper" endocrinology --pdf
 *
 * Section must be one of the ids in src/lib/sections.ts (neurology | endocrinology).
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAPERS_DIR = join(ROOT, 'src/content/papers');

const SECTIONS = ['neurology', 'endocrinology'];

const args = process.argv.slice(2);
const wantsPdf = args.includes('--pdf');
const positional = args.filter((a) => !a.startsWith('--'));
const [title, section = 'neurology'] = positional;

if (!title) {
  console.error('Usage: npm run new -- "Paper Title" <section> [--pdf]');
  console.error(`Sections: ${SECTIONS.join(' | ')}`);
  process.exit(1);
}
if (!SECTIONS.includes(section)) {
  console.error(`Unknown section "${section}". Use one of: ${SECTIONS.join(' | ')}`);
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/['’"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const today = new Date().toISOString().slice(0, 10);
const file = join(PAPERS_DIR, `${slug}.md`);

try {
  await access(file);
  console.error(`A paper already exists at ${file}. Choose a different title.`);
  process.exit(1);
} catch {
  /* good — file does not exist */
}

const needsQuotes = /[:"']/.test(title);
const titleField = needsQuotes ? JSON.stringify(title) : title;

const frontmatter = [
  '---',
  `title: ${titleField}`,
  `section: ${section}`,
  'abstract: >-',
  '  One or two sentences describing the paper. This shows on the index cards',
  '  and section pages, and is used for search-engine and social previews.',
  'author: The Axon',
  `date: ${today}`,
  'featured: false',
  'draft: true',
  ...(wantsPdf ? [`pdf: /papers/${slug}.pdf`] : []),
  '---',
  '',
  wantsPdf
    ? 'A short introduction to the paper. The full text is the PDF below.\n\nDrop the PDF at `public/papers/' + slug + '.pdf`.'
    : 'Write the paper here in Markdown. Use `## Section headings`, **bold**,\n*italics*, > blockquotes, lists, and `code` — they are all styled.',
  '',
].join('\n');

await mkdir(PAPERS_DIR, { recursive: true });
await writeFile(file, frontmatter, 'utf8');

console.log(`\n  Created  src/content/papers/${slug}.md`);
if (wantsPdf) console.log(`  Add PDF  public/papers/${slug}.pdf`);
console.log('\n  It is marked draft: true — visible in `npm run dev`, hidden from the build.');
console.log('  Set draft: false (and featured / date as needed), then commit to publish.\n');
