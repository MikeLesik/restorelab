import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import critters from 'astro-critters';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');

export default defineConfig({
  integrations: [
    tailwind(),
    sitemap(),
    critters(),
  ],
  output: 'static',
  site: PUBLIC_SITE_URL || 'https://restorelab.io',
  trailingSlash: 'never',
});
