# restoreLab Performance Notes

## Architecture

restoreLab is a fully static site (Astro SSG, `output: 'static'`). There are **zero client hydration islands** — all interactivity is progressive enhancement via vanilla `<script>` tags.

### Build pipeline
- **Astro 4** generates static HTML pages
- **astro-critters** inlines critical CSS per page (typically <20KB)
- **Cloudflare Pages** serves the site with Brotli compression + HTTP/3

## Image Strategy

All images use `<picture>` elements with WebP + JPEG fallback:
```html
<picture>
  <source srcset="/images/example.webp" type="image/webp" />
  <img src="/images/example.jpg" ... />
</picture>
```

### Attributes on all `<img>` tags
- `width` + `height` — prevents CLS
- `loading="lazy"` — below-the-fold images
- `loading="eager"` + `fetchpriority="high"` — above-the-fold hero images
- `decoding="async"` — non-blocking decode

### Cache policy
Images are served with `Cache-Control: public, max-age=31536000, immutable` via `public/_headers`.

If Cloudflare Polish is enabled (Speed > Optimization > Polish = Lossy + WebP), images are automatically converted to WebP/AVIF at the edge.

## Third-party Scripts

All analytics/tracking loads **after CookieConsent v3 grants permission**:

| Script | Load condition | Strategy |
|--------|---------------|----------|
| CookieConsent CSS | Always | `media="print" onload="this.media='all'"` (non-blocking) |
| GTM | `analytics` consent | Script injected after consent |
| Microsoft Clarity | `analytics` consent | Script injected after consent |
| Meta Pixel | `marketing` consent | Script injected after consent |

### Preconnect hints
```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://www.clarity.ms" />
<link rel="dns-prefetch" href="https://connect.facebook.net" />
```

## JS Budget

Total first-party JS shipped: **~0 KB** (all interactivity is inline `<script>` tags bundled into HTML by Astro).

Third-party JS (loaded only after consent):
- CookieConsent v3: ~12 KB
- GTM container: varies
- Clarity: ~35 KB
- Meta Pixel: ~55 KB

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| LCP | < 2.0s | Hero text renders instantly (SSG); OG image preloaded on homepage |
| CLS | < 0.1 | All images have explicit width/height |
| INP | < 200ms | No heavy JS; all interactions are CSS or vanilla JS |
| Lighthouse Perf | ≥ 95 | Mobile, 4G throttle |

## Cloudflare Dashboard Settings

These are configured in the Cloudflare Pages dashboard (not in code):

- **Auto Minify**: HTML + JS + CSS — enabled
- **Brotli**: enabled (default on CF)
- **Early Hints**: enabled
- **Polish**: Lossy + WebP (serves optimized images automatically)
- **Cache Everything**: page rules for static assets

## astro:assets Migration

The site currently uses manual `<picture>` + `<img>` tags. Migration to `astro:assets` `<Image>` component is deferred because:
1. All images already have WebP pairs manually generated
2. Cache headers are set for immutable caching
3. Cloudflare Polish handles format negotiation at the edge
4. Zero benefit for the current image count (24 files)

If the image count grows significantly, consider migrating to `astro:assets` for automatic responsive sizing and format generation.
