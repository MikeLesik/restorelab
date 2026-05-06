# Canary Verification Checklist

> **Status:** Active canary. 12 programmatic pages live (ES only).
> **Deploy date:** YYYY-MM-DD (fill in after first push)
> **Verification due:** Deploy date + 7 days.
> **Decision deadline:** Deploy date + 10 days (block Plan 2.5 full rollout if not run).

This checklist is run **once**, 7 days after the Plan 2 canary commits land in production. It determines whether to proceed with Plan 2.5 (full rollout to 153 pages) or refine and retry.

## The 12 canary URLs

1. https://restorelab.io/es/areas/sant-cugat/car-paint-correction
2. https://restorelab.io/es/areas/sant-cugat/glass-polishing
3. https://restorelab.io/es/areas/sant-cugat/headlight-restoration
4. https://restorelab.io/es/areas/barcelona/car-paint-correction
5. https://restorelab.io/es/areas/barcelona/glass-polishing
6. https://restorelab.io/es/areas/barcelona/headlight-restoration
7. https://restorelab.io/es/areas/terrassa/car-paint-correction
8. https://restorelab.io/es/areas/terrassa/glass-polishing
9. https://restorelab.io/es/areas/terrassa/headlight-restoration
10. https://restorelab.io/es/areas/pedralbes/car-paint-correction
11. https://restorelab.io/es/areas/pedralbes/glass-polishing
12. https://restorelab.io/es/areas/pedralbes/headlight-restoration

## Step-by-step verification (~20 min)

### 1. Indexation status (~10 min)

Open Google Search Console → Pages → All known pages.

For each of the 12 URLs above, paste into URL Inspection:

- ☐ #1 sant-cugat/car-paint-correction — Status: ☐ Indexed ☐ Discovered, not indexed ☐ Excluded ☐ Other: _______
- ☐ #2 sant-cugat/glass-polishing — Status: ___
- ☐ #3 sant-cugat/headlight-restoration — Status: ___
- ☐ #4 barcelona/car-paint-correction — Status: ___
- ☐ #5 barcelona/glass-polishing — Status: ___
- ☐ #6 barcelona/headlight-restoration — Status: ___
- ☐ #7 terrassa/car-paint-correction — Status: ___
- ☐ #8 terrassa/glass-polishing — Status: ___
- ☐ #9 terrassa/headlight-restoration — Status: ___
- ☐ #10 pedralbes/car-paint-correction — Status: ___
- ☐ #11 pedralbes/glass-polishing — Status: ___
- ☐ #12 pedralbes/headlight-restoration — Status: ___

**Indexed count:** ___ / 12

### 2. GSC manual actions check (~2 min)

Open GSC → Security and Manual Actions → Manual Actions.

- ☐ No manual actions reported.
- ☐ Manual action found: _______ (describe)

### 3. Coverage report check (~3 min)

Open GSC → Coverage → Excluded.

- ☐ No new "Excluded by 'noindex' tag" entries from /es/areas/ paths.
- ☐ No new "Discovered — currently not indexed" entries from /es/areas/ paths older than 5 days (Google sometimes takes a few days; we want pages actively being processed).
- ☐ No "Soft 404" warnings on programmatic URLs.
- ☐ Issues found: _______

### 4. Rich Results validation (~5 min)

For 1 random canary URL (or do all 12 if time permits):

Run https://search.google.com/test/rich-results

- ☐ Service schema validates.
- ☐ BreadcrumbList validates.
- ☐ FAQPage validates.
- ☐ Errors: _______

## Decision tree

After completing the verification:

**Indexed ≥ 10 of 12 (≥ 80%) AND no manual actions AND no soft 404s:**
- ✅ **Proceed to Plan 2.5: Full rollout to 153 pages.**
- Run the existing template, expand `CANARY_PAIRS` (or rename to `ALL_PAIRS`) to cover 51 pairs × 3 langs.

**Indexed 7–9 of 12 (60–80%):**
- 🟠 **Hold and refine before full rollout.**
- Investigate which pages aren't indexing and why. Common causes:
  - Thin content perception → strengthen unique slots
  - Internal link discovery weak → add programmatic page links to area pages or sitemap
  - Crawl budget → ensure GSC sitemap submitted

**Indexed < 7 of 12 (< 60%) OR any manual action OR soft 404s:**
- 🔴 **Halt and revert.**
- Run: `git revert <canary commits>` and push.
- Root-cause: typically thin content. Refine unique slot strategy (add slot 2 case studies, increase area-specific facts in slot 1, add localized review quotes in slot 5).
- Consider verifying `// VERIFY` markers in `src/lib/areaProfiles.ts` first — owner-confirmed data is more uniquely defensible.

## Verification log

| Date | Indexed | Manual Actions | Decision | Notes |
|---|---|---|---|---|
|  |  |  |  |  |
