# restoreLab Analytics Event Taxonomy

## Overview

All analytics events flow through a single `window.__rl_push(payload)` function defined in `BaseLayout.astro`. This function:

1. Checks CookieConsent — never fires without analytics consent
2. Pushes to GTM `dataLayer` (picked up by GA4 + custom tags)
3. Fires Microsoft Clarity custom events
4. Maps to Meta Pixel standard/custom events

TypeScript types are in `src/lib/analytics.ts`.

## Event Reference

| Event | When Fired | GTM | Clarity | Meta Pixel |
|---|---|---|---|---|
| `estimator_started` | User selects vehicle size (step 1) | dataLayer | custom event | trackCustom |
| `estimator_completed` | Results displayed | dataLayer + `tier`, `priceBand` | custom event | ViewContent |
| `estimate_submit` | Lead form submitted | dataLayer | custom event | Lead |
| `lead_submitted` | Any lead submission | dataLayer + `channel`, `service` | custom event | Lead |
| `wa_click` | WhatsApp link clicked | dataLayer + `click_url` | custom event | Contact |
| `phone_click` | Phone link clicked | dataLayer + `click_url` | custom event | Contact |
| `pricing_tier_clicked` | Pricing card CTA clicked | dataLayer + `tier` | custom event | ViewContent |
| `cta_clicked` | Any CTA with `data-event` | dataLayer + `ctaId`, `location` | custom event | trackCustom |
| `language_switched` | Language switcher used | dataLayer + `from`, `to` | custom event | trackCustom |
| `b2b_inquiry` | B2B page CTA clicked | dataLayer + `source` | custom event | Lead |
| `ev_inquiry` | EV page CTA clicked | dataLayer + `package` | custom event | Lead |
| `commercial_glass_inquiry` | Commercial glass CTA clicked | dataLayer + `source` | custom event | Lead |

## Implementation

### Auto-tagged elements

Any element with `data-event="..."` attribute fires automatically via click delegation in `BaseLayout.astro`:

```html
<a href="..." data-event="wa_click">WhatsApp</a>
```

WhatsApp (`wa.me`) and phone (`tel:`) links without `data-event` are auto-tagged on page load.

### Manual events

For programmatic events (e.g., estimator completion):

```js
if (typeof window.__rl_push === 'function') {
  window.__rl_push({
    event: 'estimator_completed',
    tier: 'ceramic_2y',
    priceBand: '€649–710'
  });
}
```

### Consent check

`__rl_push` checks `CookieConsent.acceptedCategory('analytics')` before firing. Events silently drop if consent not granted.

## GTM Configuration

In GTM, create a **Custom Event** trigger for each event name. Recommended GA4 event mapping:

| GTM Trigger | GA4 Event | GA4 Parameters |
|---|---|---|
| `estimator_started` | `generate_lead` | — |
| `estimator_completed` | `view_item` | `item_name`, `price` |
| `wa_click` | `contact` | `method: whatsapp` |
| `phone_click` | `contact` | `method: phone` |
| `estimate_submit` | `generate_lead` | `method: form` |
| `b2b_inquiry` | `generate_lead` | `lead_type: b2b` |

## Conversion Funnel

```
Home/Service → Estimator → Results → WhatsApp/Email → Booking
  ↓              ↓           ↓            ↓
service_viewed  estimator_  estimator_   lead_submitted
                started     completed
```

## Files

- `src/lib/analytics.ts` — TypeScript types (build-time reference)
- `src/layouts/BaseLayout.astro` — Runtime `__rl_push` function + click delegation
- `src/components/Estimator.astro` — Estimator-specific events
