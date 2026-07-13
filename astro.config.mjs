import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
const site = PUBLIC_SITE_URL || 'https://restorelab.io';

export default defineConfig({
  integrations: [
    tailwind(),
    sitemap({
      // Exclude the root redirect page (/) — it is a redirect, not real content.
      filter: (page) => page !== site && page !== `${site}/`,
    }),
  ],
  output: 'static',
  site,
  trailingSlash: 'never',
  build: {
    // Replaces astro-critters (Astro 4 only): inline small stylesheets,
    // keep larger ones as external cached <link>. 'auto' is the Astro 5 default.
    inlineStylesheets: 'auto',
  },
});
