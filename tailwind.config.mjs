/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark:     'rgb(var(--brand-dark) / <alpha-value>)',
          navy:     'rgb(var(--brand-navy) / <alpha-value>)',
          blue:     'rgb(var(--brand-blue) / <alpha-value>)',
          accent:   'rgb(var(--brand-accent) / <alpha-value>)',
          gold:     'rgb(var(--brand-gold) / <alpha-value>)',
          light:    'rgb(var(--brand-light) / <alpha-value>)',
          white:    'rgb(var(--brand-white) / <alpha-value>)',
          whatsapp: 'rgb(var(--brand-whatsapp) / <alpha-value>)',
        },
        th: {
          heading: 'rgb(var(--th-heading) / <alpha-value>)',
          body:    'rgb(var(--th-body) / <alpha-value>)',
          muted:   'rgb(var(--th-muted) / <alpha-value>)',
          faint:   'rgb(var(--th-faint) / <alpha-value>)',
          surface: 'rgb(var(--th-surface) / <alpha-value>)',
          border:  'rgb(var(--th-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk Variable', 'Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)',
      },
    },
  },
  plugins: [],
};
