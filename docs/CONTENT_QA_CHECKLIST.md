# Content QA Checklist — restoreLab

**Mandatory 8-point gate** for every academy article (especially AI-drafted content). No publish without all 8 boxes ticked.

This is the anti-HCU defense from Section 7 Layer 5 of `docs/superpowers/specs/2026-05-06-seo-cluster-architecture-design.md`.

---

## Per-article checklist

Article: ____________________________
Hub cluster: ________________________
Languages drafted: [ ] EN  [ ] ES  [ ] CA

- [ ] **1. Unique angle** — In one sentence, which reader pain does this article solve that other articles in the cluster don't?
  - Pain solved: _________________________

- [ ] **2. Two or more real photos** from our own cases (no stock images, no AI-generated images).
  - Photo 1 source: ________ (case folder / date)
  - Photo 2 source: ________

- [ ] **3. One or more local fact** — Barcelona, Sant Cugat, specific neighborhood, Mediterranean climate, Catalan-specific car culture, etc.
  - Local fact used: _________________________

- [ ] **4. One or more concrete number** — price (€), time (mins/hours), % defect removal, % UV exposure, kilometres, etc.
  - Concrete number(s): _________________________

- [ ] **5. Owner expert edit** — minimum 15–20 minutes inserting an insight AI doesn't know:
  - typical client mistake observed in real work
  - frequent question received via WhatsApp
  - unexpected case or surprising result
  - Owner edit applied (describe briefly): _________________________

- [ ] **6. Author byline** — currently anonymous "By restoreLab Team · Sant Cugat del Vallès" linking to /about. (Switch to named author at 3-month milestone.)

- [ ] **7. Updated date** — set `dateModified` to the real publish/update date in JSON.
  - Date: _________

- [ ] **8. FAQ block** — 3+ Q&A items at end of article, populated for FAQPage schema.
  - Number of Q&A: ___

---

## Reviewer sign-off

- Owner reviewed: ☐
- Date approved: _________
- Languages published: [ ] EN  [ ] ES  [ ] CA

---

## Draft → Published Promotion Workflow

AI-drafted articles are committed with `status: "draft"` to `src/content/en.json` (and later `es.json` / `ca.json` after translation). They render NOWHERE on the live site — `getStaticPaths` filters them out, so no public URL exists.

To promote a single article from draft to published:

1. **Review the draft** — open `src/content/en.json`, find the article entry by slug under `academy.articles[]`, read the full content under `academy_articles[content_key]` (slug with hyphens → underscores).

2. **Run the 8-pt QA checklist above** — fill in your responses inline in `docs/CONTENT_QA_LOG.md` (the per-article tracking table).

3. **Insert your expert insight** — minimum 15-20 minutes editing the prose. Add at least one of:
   - A typical client mistake you've observed in real Sant Cugat / Barcelona work
   - A frequent question received via WhatsApp
   - An unexpected case or counterintuitive finding from your case database

4. **Verify or replace the photos** — the AI draft has no embedded images. Article entries don't currently surface images in the rendering template (only sections, paragraphs, FAQ). If you want hero photos, that's a separate template extension. For Wave 1 we're text-only — but you can edit the JSON to add image references in section objects if you choose.

5. **Verify pricing/factual claims** — the AI draft has placeholder numbers based on serviceProfiles.ts. Replace any pricing or duration figure that doesn't match your actual practice.

6. **Flip the status flag**:
   ```json
   "status": "published"
   ```

7. **Set the `dateModified`** in the corresponding `card.date` field to today's date.

8. **Build and verify**:
   ```bash
   npm run build
   ```
   The article should now render at `/en/academy/{slug}`.

9. **Commit**:
   ```bash
   git add src/content/en.json docs/CONTENT_QA_LOG.md
   git commit -m "Promote academy article {slug} to published after owner QA review"
   ```

10. **(Optional)** Translate to ES and CA following the same workflow — add entries to `es.json` and `ca.json`, mark each `status: "draft"` until quality-checked.

### When NOT to promote

- Don't promote without all 8 QA items checked
- Don't promote with unverified pricing
- Don't promote with stock or AI-generated images
- Don't promote with anonymous "restoreLab Team" byline if a 3-month milestone (per spec) has been reached and named author is now possible

### Bulk promotion warning

Tempting as it is to promote multiple drafts in one commit: **don't**. Promoting > 2 articles per week creates the "scaled content" pattern Google's HCU is tuned to detect. Spread promotions over time (target: 1-2 per week per language).
