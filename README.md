# The Axon

*The Taxonomy of Intellect.*

A personal research archive in **neurology** and **endocrinology** — long-form
papers, set for unhurried reading. A static site: fast, self-contained, and free
of any hosted backend.

## Stack

- **Astro 5** — static site generation; the only client JavaScript is a few
  small inline scripts for the signature motifs (see below)
- **Content collections** — every paper is a Markdown file, type-checked at build
- **Self-hosted variable fonts** — Fraunces (display), Newsreader (reading),
  Inter (UI), JetBrains Mono (labels)
- Hand-built design system in `src/styles/global.css` — no CSS framework

### Design — the "ink" system

Dark by default (the publication's voice), with a warm "paper" light mode via
the header toggle; the choice persists in `localStorage`. Signature elements,
each a self-contained inline script that respects `prefers-reduced-motion`:

- **`AxonField`** — the slow neural field behind the masthead (canvas; pauses
  off-screen and in hidden tabs, re-inks on theme change).
- **`TestTubeProgress`** — the test-tube reading indicator on paper pages.
- **`ThemeToggle`** + a pre-paint boot script in `BaseLayout` that resolves the
  theme before first paint (no flash).

Section hues: neurology = `--synapse-blue`, endocrinology = `--hormonal-amber`.

> **History:** this site was previously built on [Base44](https://base44.com)
> (a React SPA backed by a hosted database). It has been rebuilt as a standalone
> static site with **no Base44 dependency** — no SDK, no auth service, no remote
> database. Content now lives in the repository as files. The original Base44
> baseline is preserved in git history (first commit).

## Local development

```bash
npm install
npm run dev      # dev server at http://localhost:4323 (drafts visible)
npm run build    # static build to ./dist
npm run preview  # serve the production build at http://localhost:4173
```

## Writing a paper — the Composer (recommended)

```bash
npm run compose
```

This opens a **local rich-text editor** in your browser (running only on your
machine). Type your paper, select text and click **Bold / Italic / H2 / H3 /
list / quote / link** in the toolbar (or use ⌘B, ⌘I, ⌘K) — real formatting,
real paragraphs, the things the old Base44 editor wouldn't let you do. Fill in
the title, section, abstract, and date, then click **Save to site** and the
paper is written straight into `src/content/papers/`. Refresh your dev server
(`npm run dev`) to see it live.

The Composer lists your existing papers in the sidebar — click one to edit it,
or start a new one. New papers are created as **drafts** (hidden from the built
site until you untick *Draft* and save). Stop the Composer with Ctrl-C. It is a
local tool only — it never runs on the deployed site.

> You no longer need PDF uploads to publish an article. (PDF papers are still
> supported — see below — but writing directly is the intended path now.)

### Editing on the live site (`/admin`)

Once deployed, the site has a login-protected editor at **`yourdomain.com/admin/`**
(the pencil icon, top-right). Sign in with the GitHub account that owns the repo,
and add/edit papers from the browser on your own domain — each save commits to
the repo and the site rebuilds. It's [Sveltia CMS](https://github.com/sveltia/sveltia-cms),
self-hosted (no third-party service holds your content). Setup is a one-time job
— see **[ADMIN.md](ADMIN.md)**.

## Publishing a paper by hand

Prefer files? Publishing is just *"add a file and commit"* — no admin panel.

### 1. Scaffold the file

```bash
npm run new -- "The Title of Your Paper" neurology
# or, for a PDF-based paper:
npm run new -- "A PDF Paper" endocrinology --pdf
```

`section` must be `neurology` or `endocrinology`. This creates
`src/content/papers/<slug>.md` with the frontmatter filled in and
`draft: true`.

### 2. Write it

Edit the new Markdown file. Frontmatter fields:

| Field      | Required | Notes                                                        |
| ---------- | -------- | ------------------------------------------------------------ |
| `title`    | yes      | Paper title.                                                 |
| `section`  | yes      | `neurology` or `endocrinology`.                              |
| `abstract` | yes      | 1–3 sentences. Shown on cards and used for SEO/social.       |
| `author`   | no       | Defaults to *The Axon*.                                      |
| `date`     | yes      | `YYYY-MM-DD`. Papers sort most-recent-first.                 |
| `pdf`      | no       | Path to a PDF in `public/papers/`, e.g. `/papers/foo.pdf`.   |
| `featured` | no       | `true` puts it in the home-page lead slot.                   |
| `draft`    | no       | `true` hides it from the build (still visible in `npm run dev`). |

Write the body in Markdown — headings, **bold**, *italics*, `> blockquotes`,
lists, tables, and `code` are all styled. The first paragraph gets a drop cap.

### 3. For a PDF paper

Drop the PDF at `public/papers/<slug>.pdf` and point `pdf:` at it. The page
shows the title/abstract/metadata, a **Download PDF** button, and an embedded
viewer. You can still write a short Markdown introduction above the embed.

### 4. Publish

Set `draft: false`, then commit. `npm run build` regenerates the index, section
pages, RSS feed, and sitemap automatically.

## Sections

Defined in [`src/lib/sections.ts`](src/lib/sections.ts). To rename a section or
change its description, edit that file — the navigation, section pages, and paper
schema all derive from it.

## Structure

```
src/
  content/papers/     ← the papers (Markdown)
  layouts/            ← BaseLayout (head, header, footer)
  components/         ← Header, Footer, PaperCard, AxonField, TestTubeProgress,
                         ThemeToggle, AxonRule, EndMark, FormattedDate
  pages/              ← index, [section], papers/[...slug], about, 404, rss.xml
  lib/                ← sections, papers helpers, site metadata
  styles/global.css   ← the design system (tokens, type, colour, components)
public/
  fonts/              ← self-hosted woff2
  papers/             ← paper PDFs
```

## Note on the sample papers

The five papers currently in `src/content/papers/` are **placeholder samples**
added during the rebuild (the original Base44 content was not recoverable — see
the rebuild notes). Replace them with your own and delete the samples.
