import { getCollection, type CollectionEntry } from 'astro:content';

export type Paper = CollectionEntry<'papers'>;

const isPublished = (p: Paper) => import.meta.env.PROD ? !p.data.draft : true;

/** All non-draft papers, most-recent-first. Drafts show only in `astro dev`. */
export async function getPapers(): Promise<Paper[]> {
  const papers = await getCollection('papers', isPublished);
  return papers.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

/** Papers in one section, most-recent-first. */
export async function getPapersBySection(section: string): Promise<Paper[]> {
  const papers = await getPapers();
  return papers.filter((p) => p.data.section === section);
}

/** Estimate reading time from the Markdown body (~220 wpm). */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
