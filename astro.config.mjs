import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the production origin — it feeds canonical URLs, Open Graph tags,
// the RSS feed and the sitemap. Point it at the real domain once one is
// connected.
export default defineConfig({
  site: 'https://theaxon.org',
  integrations: [sitemap()],
  build: {
    // Inline all CSS: the whole design system is small enough that shipping it
    // in the document beats an extra render-blocking request.
    inlineStylesheets: 'always',
  },
});
