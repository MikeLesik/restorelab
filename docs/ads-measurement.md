# Ads Measurement — Attribution & Conversion Setup

> Status: RL-301 sections below (ref-codes, KV setup, ops lookup). The GTM /
> GA4 / Google Ads conversion import steps and the weekly CAC ritual land with
> RL-302.

## How WhatsApp attribution works (RL-301)

Conversion happens in WhatsApp, where the click's origin would normally be
lost. The site fixes this with a first-party ref code:

1. On every page load, `BaseLayout` parses `utm_source`, `utm_medium`,
   `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`, `msclkid`
   and stores them in `localStorage.rl_attr`
   (`{ first, last, ref }` — first touch wins; schema in
   `src/lib/attribution.ts`). Click ids (`gclid`/`fbclid`/`msclkid`) are only
   persisted after **marketing** consent; UTMs are always kept.
2. Each visitor gets a short code `RL-XXXX` (chars `A-HJ-NP-Z2-9`), generated
   once. Every wa.me link's prefilled text gets a final line `#ref RL-XXXX`.
3. `wa_click`, `phone_click`, `lead_submitted`, `b2b_inquiry`,
   `commercial_glass_inquiry` and `estimator_result` events carry `ref`,
   `attr_source`, `attr_campaign`, `attr_landing` in the dataLayer payload —
   these are the GTM variable names to use in tags.
4. On `wa_click` / `phone_click` / `lead_submitted`, the browser also POSTs
   the ref + full attribution snapshot to `/api/ref`, which stores it in
   Cloudflare KV for 180 days.

## Cloudflare setup (manual, dashboard)

Both steps are safe to skip at first — `/api/ref` is an inert no-op until
configured.

1. **KV namespace**: Cloudflare dashboard → Workers & Pages → KV →
   *Create namespace* → name it e.g. `restorelab-ref-log`.
2. **Bind it to Pages**: Workers & Pages → the `restorelab` Pages project →
   Settings → Functions → *KV namespace bindings* → Add binding:
   variable name **`REF_LOG`** (exact), namespace `restorelab-ref-log`.
   Add it for **Production** (and Preview if desired).
3. **Admin token**: Settings → Environment variables → add
   **`REF_ADMIN_TOKEN`** (Production) = a long random secret, e.g. output of
   `openssl rand -hex 32`.
4. Redeploy (next push to `main` picks the binding up).

## Ops: looking up a ref code (Mike's flow)

When a customer writes on WhatsApp, the last line of their first message
shows the code, e.g. `#ref RL-K7F3`. To see where that click came from:

```
https://restorelab.io/api/ref?code=RL-K7F3&token=<REF_ADMIN_TOKEN>
```

The JSON response lists every logged contact moment for that code with
`attr.first` / `attr.last` (source, campaign, landing page, timestamps).
Record the channel in the CRM against the job. That closes the
click → conversation → booked-job attribution loop.

Notes:
- A wrong or missing token returns 404 on purpose.
- A code can legitimately have zero entries (visitor declined all cookies —
  the ref still appears in WhatsApp, but nothing was logged server-side).
- Entries expire after 180 days.
