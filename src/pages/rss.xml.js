import rss from '@astrojs/rss';
import { getPapers } from '../lib/papers';
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/site';
import { SECTIONS } from '../lib/sections';

export async function GET(context) {
  const papers = await getPapers();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: papers.map((p) => ({
      title: p.data.title,
      description: p.data.abstract,
      pubDate: p.data.date,
      author: p.data.author,
      categories: [SECTIONS[p.data.section].title],
      link: `/papers/${p.id}/`,
    })),
    customData: `<language>en</language>`,
  });
}
