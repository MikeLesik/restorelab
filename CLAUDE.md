# CLAUDE.md — RestoreLab Project Instructions

## Project Overview
RestoreLab (restorelab.io) — mobile surface restoration service in Lisbon, Portugal.
Website built on Astro (SSG/SSR). Multilingual: English (/en), Spanish (/es), Portuguese (/pt).

## Tech Stack
- Framework: Astro
- Styling: TailwindCSS V3- Hosting: Cloudflare Pages
- Domain: restorelab.io
- Languages: EN (default), ES, PT

## Project Structure
- `src/layouts/` — base layouts (here lives the main <head> and <body>)
- `src/pages/en/` — English pages
- `src/pages/es/` — Spanish pages
- `src/pages/pt/` — Portuguese pages
- `src/components/` — reusable components (Navbar, Footer, etc.)
- `public/` — static assets

## Critical Rules

### Never Break
- Existing routing structure (/en, /es, /pt)
- SEO: hreflang tags, meta tags, Open Graph
- WhatsApp links (wa.me/351933817788) — this is the main conversion channel
- Contact form functionality
- Mobile responsiveness
- Existing multilingual content and translations

### Code Style
- Use TypeScript where possible
- Follow existing code conventions in the project
- Comment complex logic in English
- Keep components small and reusable

### Git
- Write clear commit messages in English
- One logical change per commit
- Never commit .env or secrets

### Testing
- After any change, verify the site builds without errors: `npm run build`
- Check all 3 language versions after changes to shared components
- Test mobile view for any UI changes

## Business Context
- Target audience: car owners and yacht owners in Lisbon metropolitan area
- Primary conversion: WhatsApp message (Get Quote button)
- Secondary conversion: contact form submission
- Key USP: mobile service (we come to client), save money vs replacement
- Services: car paint correction, glass scratch removal, yacht gelcoat polishing

## Current Priorities
1. Conversion optimization (more WhatsApp clicks and form submissions)
2. Adding analytics (GTM, GA4, Clarity, Meta Pixel)
3. Auto language detection by IP
4. SEO improvements (blog, city landing pages)
5. Visual content (before/after galleries)

## When Modifying the Site
- Always preserve the existing design language and color scheme
- New features should work across all 3 languages
- Any new user-facing text must be added in all 3 languages (EN/ES/PT)
- Performance matters: keep Lighthouse score above 90
- GDPR compliance required (cookie consent for any tracking)