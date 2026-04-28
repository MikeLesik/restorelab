# Content Publishing Guide

This guide covers how to add new **cases** (before/after gallery entries) and **Academy articles** to restoreLab.

---

## Adding a Case (Before & After)

Cases are hardcoded in `src/components/CasesGallery.astro`. Each case is an object in the `cases` array.

### Steps

1. **Prepare images** — 2 photos per case (before + after):
   - Resize to **1200×800 px** (landscape) or **800×1200 px** (portrait).
   - Save as JPEG, quality 80–85%.
   - Name: `{slug}-before.jpg` and `{slug}-after.jpg`.
   - Place in `public/images/cases/`.

2. **Run the scaffold script** (or add manually):
   ```bash
   npm run new:case
   ```
   This prompts you for title, category, before/after paths, result text, metric, and location — then appends the entry to `CasesGallery.astro`.

3. **Manual alternative** — open `src/components/CasesGallery.astro` and add an entry to the `cases` array:
   ```js
   {
     id: 6, // increment from last
     title: 'Mercedes C-Class — Full Correction',
     category: 'car', // 'car' | 'glass' | 'acrylic'
     before: '/images/cases/merc-before.jpg',
     after: '/images/cases/merc-after.jpg',
     result: 'Deep swirls removed, ceramic applied',
     metric: 'Saved €600',
     location: 'Sant Cugat',
   },
   ```

4. **Build & verify:**
   ```bash
   npm run build
   ```

### Image specs

| Property | Value |
|----------|-------|
| Format | JPEG (`.jpg`) |
| Quality | 80–85% |
| Max width | 1200 px |
| Naming | `{slug}-before.jpg` / `{slug}-after.jpg` |
| Directory | `public/images/cases/` |

---

## Adding an Academy Article

Academy articles live in JSON content files and are rendered by `src/pages/[lang]/academy/[slug].astro`.

Each article needs **two things** in each language file (`src/content/{en,es,ca}.json`):

1. A **listing entry** in `academy.articles[]` (card shown on the Academy index page).
2. A **content entry** in `academy_articles.{content_key}` (the full article body).

The `content_key` is the slug with hyphens replaced by underscores: `my-article-slug` → `my_article_slug`.

### Steps

1. **Run the scaffold script:**
   ```bash
   npm run new:post
   ```
   This prompts you for slug, title, excerpt, and number — then adds the listing entry to all 3 language files. You still need to write the full content manually.

2. **Add the listing entry** to `academy.articles[]` in each JSON file:
   ```json
   {
     "number": "16",
     "title": "Your Article Title",
     "excerpt": "One-sentence description for the card.",
     "slug": "your-article-slug",
     "date": "2026-04-28",
     "status": "published"
   }
   ```

3. **Add the content entry** to `academy_articles` in each JSON file:
   ```json
   "your_article_slug": {
     "seo_title": "Your Article Title | restoreLab Academy",
     "seo_description": "Meta description under 160 chars.",
     "title": "Display Title",
     "description": "Subtitle / tagline",
     "intro": "Opening paragraph.",
     "sections": [
       {
         "number": "1",
         "title": "Section Title",
         "paragraphs": [
           "Paragraph one.",
           "Paragraph two."
         ]
       }
     ]
   }
   ```

   Sections can also include optional fields:
   - `key_params: string[]` — bullet list of key parameters
   - `analogy: { title, text }` — a callout analogy box
   - `table: { caption, headers: string[], rows: string[][] }` — data table
   - `tools_title: string` + `tools: { label, text }[]` — tool/equipment list

4. **Repeat for all 3 languages** (EN, ES, CA).

5. **Build & verify:**
   ```bash
   npm run build
   ```

### Article SEO checklist

- [ ] `seo_title` < 60 characters
- [ ] `seo_description` < 160 characters
- [ ] Slug is lowercase, hyphen-separated, no special chars
- [ ] `date` format: `YYYY-MM-DD`
- [ ] `status` set to `"published"` (use `"coming_soon"` for drafts)
- [ ] Content added to all 3 language files (en.json, es.json, ca.json)

---

## Localization Workflow

Every piece of user-facing content must exist in all 3 files:
- `src/content/en.json` (English)
- `src/content/es.json` (Spanish)
- `src/content/ca.json` (Catalan)

**Process:**
1. Write the English version first.
2. Translate to Spanish (Spain, informal "tú" form).
3. Translate to Catalan (standard, informal "tu" form, proper `l·l`, `ç`).
4. Keep all JSON keys identical across files.
5. Keep numbers, prices, and brand names unchanged.

---

## Image Processing

For any new image:

1. **Resize** to the target dimensions (see table above).
2. **Compress** as JPEG quality 80–85%.
3. **Naming convention:** lowercase, hyphen-separated, descriptive.
4. **Place** in `public/images/` (or a subfolder like `cases/`).

If Cloudflare Polish is enabled (Speed → Optimization → Polish = Lossy + WebP), images are automatically served as WebP to supported browsers. No manual WebP conversion needed.

### Manual WebP conversion (optional)

```bash
# Using cwebp (install via: brew install webp)
cwebp -q 82 input.jpg -o output.webp
```

---

## Quick Reference

| Task | Command | Files to edit |
|------|---------|---------------|
| Add a case | `npm run new:case` | `CasesGallery.astro` + images |
| Add an article | `npm run new:post` | `en.json`, `es.json`, `ca.json` |
| Dev server | `npm run dev` | — |
| Type check | `npm run check` | — |
| Full build | `npm run build` | — |
