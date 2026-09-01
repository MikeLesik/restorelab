# Ads Measurement — Attribution & Conversion Setup

Everything needed to run the October €2,500 Google Ads test with real CAC
measurement. Covers: how the WhatsApp ref-code attribution works (RL-301),
GTM → GA4 → Google Ads conversion wiring, the weekly CAC ritual, and the
Cloudflare KV setup.

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

## GTM → GA4 → Google Ads conversion setup (RL-302)

The site already pushes everything to the dataLayer — this is pure GTM/GA4/Ads
dashboard work, no code changes.

### Exact dataLayer variable names (from RL-301)

Every contact-intent push carries these keys. Create a GTM **Data Layer
Variable** for each (Variables → New → Data Layer Variable, version 2):

| dataLayer key | Suggested GTM variable name | Example value |
|---|---|---|
| `event` | (built-in) | `wa_click` |
| `ref` | `dlv - ref` | `RL-K7F3` |
| `attr_source` | `dlv - attr_source` | `google` / `(direct)` |
| `attr_campaign` | `dlv - attr_campaign` | `oct-test-headlights` |
| `attr_landing` | `dlv - attr_landing` | `/es/services/headlight-restoration` |
| `click_url` | `dlv - click_url` | `https://wa.me/34680265190?...` |
| `click_text` | `dlv - click_text` | `Pedir Presupuesto` |
| `event_id` | `dlv - event_id` | uuid |

Note: WhatsApp CTAs fire under several event names (`wa_click`,
`estimator_wa`, `b2b_hero_wa`, …), but ALL of them carry `ref` + `attr_*`
whenever `click_url` points at wa.me/tel:. For the conversion tag, trigger on
`wa_click` **plus** the other `*_wa` slugs, or simplest: a Custom Event
trigger with regex matching `.*wa.*` AND `dlv - click_url` contains `wa.me`.

### Step-by-step

1. **GA4 event tag in GTM** (GTM container `GTM-W34GRX86`):
   - Tags → New → *GA4 Event*, Measurement ID = the GA4 property ID.
   - Event name: `wa_click`.
   - Event parameters: `ref` → `{{dlv - ref}}`, `attr_source` →
     `{{dlv - attr_source}}`, `attr_campaign` → `{{dlv - attr_campaign}}`,
     `attr_landing` → `{{dlv - attr_landing}}`.
   - Trigger: Custom Event, event name regex
     `wa_click|estimator_wa|.*_wa$` (check "Use regex matching").
   - Repeat with a second tag for `lead_submitted` (trigger: custom event
     `lead_submitted`).
2. **Mark as key event in GA4**: Admin → Events → wait for `wa_click` to
   appear (or create it) → toggle *Mark as key event*. Same for
   `lead_submitted`.
3. **Import into Google Ads** (account 839-181-0995, linked to the GA4
   property): Goals → Conversions → New conversion action → *Import* →
   GA4 → select `wa_click` → rename the conversion action
   **`contact_whatsapp`** (primary). Import `lead_submitted` as a
   **secondary** conversion.
4. **Verify** with GTM Preview + a visit to
   `/es?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=TEST123`:
   click a WhatsApp button → the GA4 event should show `ref` + `attr_*`
   populated, and Google Ads should register the conversion within ~24 h
   (gclid links the click).

## Weekly CAC ritual (RL-302)

Every Monday, ~15 min:

1. List the week's **booked jobs** and the `#ref` code from each WhatsApp
   conversation (last line of the customer's first message).
2. Look each code up: `https://restorelab.io/api/ref?code=RL-XXXX&token=…`
   → note `attr.first.utm_source` / `utm_campaign`.
3. Tag the source/campaign on the job in the CRM.
4. Compute CAC per campaign: campaign spend (Google Ads UI) ÷ booked jobs
   attributed to it. Compare against gross margin per job.

Tracking table template (copy into the CRM/spreadsheet):

| date | ref | service | gross € | source/campaign | booked (y/n) |
|------|-----|---------|---------|-----------------|--------------|
| 2026-10-06 | RL-K7F3 | headlight | 79 | google / oct-headlights | y |
| | | | | | |

A ref with no `/api/ref` entries = visitor declined cookies; log the job
with source `unknown` rather than guessing.

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
