import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import critters from 'astro-critters';
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
    critters(),
  ],
  output: 'static',
  site,
  trailingSlash: 'never',
});
