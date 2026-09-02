# WhatsApp Cloud API Setup (RL-450)

> **Gate:** activate only at ≥30 orders/month or with an active partner doing
> weekly jobs. Until then the admin copy-buttons are genuinely enough — the
> code below is deployed but inert.

## ⚠️ Why the main number must NEVER be migrated

Registering **+34 680 265 190** on the Cloud API **disconnects it from the
consumer WhatsApp app permanently** — Mike would lose his sales inbox, chat
history access on the phone, and the personal touch that closes deals. The
automation runs on a **dedicated second number**; the personal number stays
exactly as it is today. This is a hard rule (sprint constraint 1).

⚠️ Extra caution for THIS account: the Meta ad account was restricted in
Jul-2026 for automation signals. Do every step below **manually, by hand, as
the owner** — no browser automation, no scripts against Meta UIs. Business
verification may receive extra scrutiny; have the NIF/autónomo papers ready.

## 1. Get a second number

Any of: a prepaid SIM (~€5, keep it topped up), or a virtual mobile number
that can receive one verification SMS/call. It must NOT have an existing
WhatsApp account (or you must be willing to delete it).

## 2. Meta side (all manual, in Meta Business Suite)

1. business.facebook.com → the restoreLab portfolio → **WhatsApp accounts**
   → Create a WhatsApp Business Account (WABA).
2. Complete **Business verification** if prompted (legal name Mikhail Lesik,
   NIF, address — must match the site's aviso legal).
3. **Add phone number** → the second number → verify via SMS/call.
4. Developers → create (or reuse) an app → add the **WhatsApp product** →
   note the **Phone number ID** (this is `WA_CLOUD_PHONE_ID`).
5. Generate a **permanent System User token** with `whatsapp_business_messaging`
   permission (this is `WA_CLOUD_TOKEN`). Never the 24h test token.

## 3. Register the message templates (HSM)

WhatsApp Manager → Message templates → create each, category **Utility**,
with these exact names. Meta approval usually takes minutes-to-hours.

### `job_assigned` — ES only (partners are ES)
```
Hola {{1}}, nuevo trabajo {{2}}: {{3}}. Cuándo: {{4}}.
Ficha completa, checklist y subida de fotos: {{5}}
```

### `payment_link` — ES / EN / CA
ES: `Tu trabajo restoreLab {{1}} está listo ✅ Enlace de pago seguro (tarjeta o Bizum): {{2}}`
EN: `Your restoreLab job {{1}} is done ✅ Secure payment link (card or Bizum): {{2}}`
CA: `La teva feina restoreLab {{1}} està llesta ✅ Enllaç de pagament segur (targeta o Bizum): {{2}}`

### `review_request` — ES / EN / CA
ES: `¡Gracias por confiar en restoreLab! Si el resultado te ha gustado, nos ayuda muchísimo una reseña: {{1}}`
EN: `Thanks for choosing restoreLab! If you liked the result, a review helps us a lot: {{1}}`
CA: `Gràcies per confiar en restoreLab! Si el resultat t'ha agradat, ens ajuda moltíssim una ressenya: {{1}}`

### `reminder_24h` — ES / EN / CA
ES: `Recordatorio restoreLab: mañana {{1}} tenemos tu cita ({{2}}). Si necesitas cambiarla, responde a este mensaje.`
EN: `restoreLab reminder: your appointment is tomorrow {{1}} ({{2}}). Reply here if you need to reschedule.`
CA: `Recordatori restoreLab: demà {{1}} tenim la teva cita ({{2}}). Si necessites canviar-la, respon a aquest missatge.`

## 4. Cloudflare env (Pages → Settings → Environment variables)

```
WA_CLOUD_TOKEN    = <permanent system-user token>
WA_CLOUD_PHONE_ID = <phone number id>
```

Until both are set, every hook and `/api/wa/send` is a silent no-op.

## 5. What fires automatically (no cron)

| Transition | Template | To |
|---|---|---|
| → `assigned` | `job_assigned` (a fresh `/p/<token>` link is auto-issued) | partner |
| → `awaiting_payment` **with a payment link** | `payment_link` | client |

`paid + 4h → review_request` is **deliberately deferred** — it needs a delay
timer; revisit with a Workers cron when volume justifies it. Until then send
it manually (admin → `/api/wa/send` or the personal number).

Every attempt is logged on the order (`wa_sent` / `wa_send_failed`); a
failure shows **"envío manual necesario"** in the admin order detail, and
the copy-buttons always keep working — a Meta outage never blocks an order.

## 6. Sandbox test before going live

With the test number Meta provides in the app dashboard: set the env vars to
the TEST phone id + token, run one order through assigned and
awaiting_payment, confirm both templates arrive, then swap in the permanent
values.
