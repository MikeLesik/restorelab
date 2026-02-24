/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:     '#0A0A0A',
          navy:     '#0D1B2A',
          blue:     '#1B3A5C',
          accent:   '#2A7FFF',
          gold:     '#D4A537',
          light:    '#F5F5F5',
          white:    '#FFFFFF',
          whatsapp: '#25D366',
        },
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk Variable', 'Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #0A0A0A 0%, #0D1B2A 50%, #1B3A5C 100%)',
      },
    },
  },
  plugins: [],
};
