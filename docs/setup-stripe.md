# Stripe Setup — Payments (RL-440)

Mike's Stripe account with **Bizum already active** — no onboarding here.
Everything below is configuration only. The endpoints are inert until the
env vars exist, so deploying first is safe.

## 1. Create a RESTRICTED API key (not the full secret key)

Stripe Dashboard → Developers → API keys → **Create restricted key**:

| Permission | Access |
|---|---|
| Checkout Sessions | **Write** |
| Payment Links | **Write** |
| Everything else | None |

Name it `restorelab-pages`. Copy the `rk_…` key.

## 2. TEST mode first

Toggle the dashboard to **Test mode** and repeat step 1 there (`rk_test_…`).
Configure the test key first; only after the flow below works end-to-end
swap in the live key.

Cloudflare Pages → Settings → Environment variables (Production):

```
STRIPE_SECRET_KEY = rk_test_…   (later: rk_live_…)
```

## 3. Register the webhook (after the first deploy)

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:

- URL: `https://restorelab.io/api/stripe/webhook`
- Events: **checkout.session.completed** (only this one)

Copy the signing secret (`whsec_…`) into Cloudflare:

```
STRIPE_WEBHOOK_SECRET = whsec_…
```

Test mode has its own separate webhook endpoint + secret — register both
(test now, live when switching).

## 4. Verify the flow (test mode)

1. In `/admin`, open a quoted order → Pagos → **Enlace 100%**.
2. Open the link, pay with the test card `4242 4242 4242 4242` (any future
   date / any CVC).
3. Within seconds the webhook marks the order `paid_eur`/`paid_at` and
   moves it to **Pagado** (when the transition is legal); the event log
   shows `stripe_paid` with the session id.
4. Deposit flow: **Señal 30%** → pay → order accumulates 30%; later
   **Enlace resto** → pay → covered → paid.

## 5. Verify Bizum before announcing it

In **live** mode create one real Checkout link (e.g. 1€ to yourself) and
confirm **Bizum appears as a payment method** on the Checkout page.
Bizum shows only for EUR + Spanish customer context; if it is missing,
check Dashboard → Settings → Payment methods → Bizum is enabled.

## 6. Fees (already in the unit-economics model)

EU cards ≈ **1.5% + €0.25** per transaction; Bizum has its own similar
scheme fee. The RL-460 contribution metric already reserves 1.5%.

## Manual reality path (no Stripe needed)

`/admin` → order → Pagos → **Marcar pagado** with amount + method
(efectivo / Bizum personal) — logged in the event history with the method
note. This keeps cash jobs inside the same metrics.
