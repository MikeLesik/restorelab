# WhatsApp AI Sales Agent — Design

**Date:** 2026-07-23 · **Status:** Approved by owner · **Repo home:** `agent/` (new top-level dir, standalone Cloudflare Worker)

## 1. Goal

An AI agent that answers inbound WhatsApp messages to +34 680 265 190 instantly, 24/7, in the customer's language (ES/CA/EN), qualifies the lead, quotes the correct package and price fork from the site's pricing data, agrees a desired visit time, and hands the finished lead to the owner. Primary traffic source: Meta Click-to-WhatsApp ads (launching soon). The agent closes the "#1 gate" from the ads plan: response speed <10 min at any hour.

**Approved product decisions:**

| Decision | Choice |
|---|---|
| Autonomy | **Hybrid** — agent runs the dialog alone; owner gets a Telegram lead card and takes over for final confirmation. Agent never confirms a binding time or final price. |
| "Deal reached" state | **Slot + data** — full qualification (car, service, city/address zone, photos if offered), resolved package + price fork, customer-agreed *desired* time window. |
| Channel integration | **Official WhatsApp Cloud API in coexistence mode** — owner keeps the WhatsApp Business app on his phone; bot and app share the number. |
| Owner notifications | **Telegram bot**, lead cards in Russian, `wa.me/<customer>` deep link to jump into the chat. |
| LLM | **Claude Sonnet 5** (`claude-sonnet-5`), thinking disabled; Haiku 4.5 as cost fallback if quality allows. |

## 2. Load-bearing research facts (verified 2026-07-23)

Full research output: workflow `wf_1cf9552b-5e1` journal. Facts below are confirmed against official Meta/Cloudflare/Anthropic docs unless marked.

**Coexistence (app + API on one number):**
- GA in Spain (EU rollout ~Oct 2025). Requirements: WhatsApp Business app ≥ 2.24.17, number active in the app (7+ days), number not already on Cloud API.
- Onboarding **only via a Solution Partner / Tech Provider Embedded Signup** — no Meta self-serve. Becoming our own Tech Provider requires Meta business verification (not yet offered for portfolio 1664926084588167) → a provider is mandatory. Candidates: Dualhook (~$12/mo, API-first), 360dialog (~$49/mo), WATI (~$39–59/mo). Twilio does NOT support coexistence.
- The API side receives **`smb_message_echoes`** webhooks for messages the owner sends from the phone app → enables "owner replied → bot stands down". (Echoes do NOT fire for unsupported companion clients, e.g. WhatsApp for Windows.)
- Limitations: broadcast lists disabled, groups invisible to API, 20 mps throughput cap, display name locked at onboarding, standard business verification/blue badge unavailable for coexistence WABAs *(likely — 360dialog docs)*, app must be opened at least every ~13 days, never uninstall it.
- The number sits on an old app-type WABA shell (1706929807367980, Glass Restore portfolio). Signup can fail while it's attached → remove the WhatsApp account from the old portfolio first (Business settings → WhatsApp accounts → Remove; blocked if paid messages were sent in the last 30 days). Cooldown risk exists but mainly affects numbers previously on the API — test signup early.
- **Fallback if coexistence fails for this number:** full Cloud API migration — the phone app stops working; owner would live in a provider web inbox. Treated as a separate decision, not part of this design.

**Cost & limits (per-message pricing since 2025-07-01):**
- Free-form replies within the 24h customer-service window (CSW): **free, unlimited**. The 250-contacts/day unverified cap applies only to business-initiated templates outside the CSW → **an inbound-only bot has zero Meta cost and no verification blocker**.
- CTWA ads open a 72h Free Entry Point **starting from the business's first reply** (must reply within 24h) — instant auto-reply secures it.
- The first message from an ad carries a `referral` object with **`ctwa_clid`** — only on the first message; must be captured and persisted immediately. Feeds Meta CAPI (`action_source: "business_messaging"`) on dataset **1556029059322810** so ads optimize on real leads.
- Outside the CSW only pre-approved templates can be sent (utility templates free inside CSW; marketing always paid except during FEP). Approval: usually minutes, up to 24–48h.
- Webhooks: HMAC-SHA256 signed (`X-Hub-Signature-256`) + GET `hub.verify_token` handshake; Meta retries on non-2xx → duplicates arrive, dedupe by message id. Media: `GET /{media-id}` returns a URL valid ~5 min — download immediately. Pair rate limit ~1 msg/6 s per user → send one consolidated bubble, not bursts. Typing indicator + read receipts supported.

**Policy & legal:**
- Meta allows business-scoped AI automation in the CSW but **requires a prompt, clear human escalation path**. General-purpose AI chatbots are banned (Oct 2025 terms) — keep the system prompt tightly scoped to detailing.
- **EU AI Act Art. 50: from 2026-08-02 the bot must disclose it is AI** (no SME exemption; AEPD already fines human-impersonating bots). Disclosure goes in the first message from day one, in all three languages.
- WhatsApp conversation data must never be used to train/improve AI models. Do not submit chat logs as feedback to Anthropic.
- GDPR: lawful basis Art. 6(1)(b) (pre-contractual, customer-initiated). Anthropic = Art. 28 processor (DPA auto-included, SCCs, no training on API data, ~30-day deletion); first-party API processes in the US → the site privacy policy must name Meta + Anthropic as recipients and disclose the US transfer. Data minimization: don't collect DNI/plates; define chat retention; the bot must recognize natural-language GDPR rights requests and route them to the human channel.
- Ban risk is concentrated in outbound templates and user blocks (quality rating is per number, shared bot+app). Inbound-only replying is low-risk.

**Platform (Cloudflare + Claude):**
- Webhook Worker must ACK fast; `ctx.waitUntil` is capped ~30 s → **run Claude calls in a Durable Object alarm handler** (15-min wall clock).
- **One DO per conversation** (id = customer `wa_id`): single-threaded serialization; `setAlarm()` override = debounce for rapid successive messages (~8 s); the same alarm slot drives scheduled follow-ups → keep a small schedule table and always arm the nearest deadline. Cloudflare's MIT `agents` SDK wraps exactly this (DO + SQLite + `this.schedule`) — evaluate in Phase 2, use if it fits.
- State in DO SQLite storage; append-only lead log in **D1**. KV unsuitable (1 write/s/key, eventual consistency).
- Sonnet 5: set `thinking: {type: "disabled"}` (adaptive thinking on by default; non-default temperature rejected); lead card via `strict: true` tool or structured outputs. Prompt caching on the knowledge-pack system prefix with `ttl: "1h"` (WhatsApp reply gaps exceed the 5-min TTL; Haiku needs ≥4096-token prefix to cache at all).
- Cost ≈ **€0.05–0.10 per 20-message dialog** (Sonnet 5, cached); Haiku ≈ €0.02–0.03.
- Reference repos: `cloudflare/agents`, `depombo/whatsapp-api-cf-worker`, `anthropics/claude-quickstarts` (customer-support-agent), `iragazzisrl/whatsapp-api-cloud-coexistence`.

## 3. Architecture

```
Meta Cloud API ──webhook──▶ Webhook Worker ──▶ ConversationDO (per customer wa_id)
   ▲                        (verify sig,        ├─ SQLite: history, state, lead card,
   │                         dedupe, download   │   ctwa_clid, schedule table
   └──── send message ◀───── media, route)      ├─ alarm: debounce → Claude call → reply
                                                ├─ echo handler: owner takeover detection
                                                ├─ Telegram notify (lead card / escalation)
                                                ├─ D1: append-only lead log
                                                └─ CAPI: Lead events with ctwa_clid
```

All bot code lives in `agent/` in this repo — its own `wrangler.toml`, deployed with `wrangler deploy` (never via the Pages auto-deploy; a site content push must not restart the bot). Secrets (`ANTHROPIC_API_KEY`, WA token, app secret, `TELEGRAM_BOT_TOKEN`, owner chat id) as Worker secrets.

**Components:**

1. **Webhook Worker** — GET verification handshake; POST: verify `X-Hub-Signature-256`, return 200 immediately, forward payload to the customer's DO. Downloads inbound media synchronously (5-min URL), stores bytes in the DO (or R2 if size demands — decide in Phase 2).
2. **ConversationDO** — owns everything about one customer: message history, dedupe set, state machine, lead card, schedule. Debounces bursts (~8 s alarm), then runs one Claude call over the buffered messages and sends **one consolidated reply**.
3. **Brain** — Claude Sonnet 5 with a generated **knowledge pack** system prompt (see §5) and a small tool set: `update_lead_card`, `resolve_package` (deterministic OUTCOMES lookup — the model classifies, the lookup prices), `notify_owner` (escalation). Replies mirror the customer's language; tone follows the site's `wa_messages` voice; self-sufficiency rule applies (no blanks, no internal tags).
4. **Handoff & notifications** — Telegram lead cards in Russian via `sendMessage` (`parse_mode: "HTML"`, one retry) with a `wa.me/<phone>` button. Owner takeover detection via `smb_message_echoes`.
5. **Lead log** — one D1 row per lead: wa_id, name, language, car, service, package slug, price fork, city, travel fee, desired window, state, ctwa_clid, timestamps.
6. **Analytics** — CAPI Lead/QualifiedLead events (dataset 1556029059322810) with `ctwa_clid`; internal counters: time-to-first-reply, dialogs→lead-card rate, takeover rate, template usage.

## 4. Conversation state machine

```
new ──▶ bot_active ──(lead card complete)──▶ lead_ready ──▶ human_takeover ──▶ closed
            │                                    ▲  (TG card sent; bot tells customer
            ├─(customer asks for human /          │   the owner will confirm time)
            │  out-of-scope / GDPR request /      │
            │  low confidence) ──▶ escalated ─────┤  (TG push, bot stands down)
            └─(smb_message_echo from owner) ──▶ human_takeover
human_takeover: bot silent; auto-return to bot_active only if owner sends the
                explicit resume command (Telegram /resume or app keyword), not by timeout.
```

- **Dedupe:** message ids kept in DO storage; duplicates dropped before history append.
- **24h window guard:** DO tracks last inbound timestamp; free-form sends blocked after 24 h — follow-ups inside the window only (v1). Post-window re-engagement templates deferred until Meta verification + explicit opt-in design (Phase 3+, flagged as LSSI-CE Art. 21 territory).
- **Follow-up policy (v1):** at most one gentle nudge per dialog, ~2–4 h after the customer goes silent mid-qualification, within the CSW. No nagging — user blocks damage the shared quality rating.

## 5. Knowledge pack (single source of truth)

Generated by `agent/scripts/build-knowledge.mjs` at deploy time from the site's data — never hand-written, so prices cannot drift (same principle as the Estimator's Critical Rule):

- `src/content/es.json` + `en.json` + `ca.json` → pricing matrix (slug, name, price, duration per language), FAQ, service descriptions, `wa_messages` tone reference.
- `src/lib/areaProfiles.ts` → 12 cities, travel fees (fees carry a "confirm with owner" marker while `// VERIFY` remains), service-area boundary ("outside listed areas → escalate, don't refuse").
- `src/components/Estimator.astro` OUTCOMES table → exported to `agent/src/outcomes.ts` (shared shape): need[:detail][:dark] → package + alt + addon + rationale key.

The system prompt (stable prefix, prompt-cached 1h TTL): identity ("asistente de IA de RestoreLab" — AI disclosure baked in), scope fence (detailing only; out-of-scope → owner), qualification checklist, pricing rules (quote forks from lookup only; never invent, never discount), escalation rules, language mirroring, one-bubble style, data-minimization rules (don't ask for DNI/plates; address only at zone level until owner confirms).

## 6. Phases

**Phase 0 — Unblock (owner-gated, do first, small code spike):**
1. Provider selection: verify Dualhook vs 360dialog current coexistence support, `smb_message_echoes` passthrough, API shape (direct Graph API token vs provider proxy), price. Decision criterion: cheapest provider that passes echoes and gives raw webhook access.
2. Free the number from the old Glass Restore WABA (owner + me in Business Manager; check 30-day paid-message lock).
3. Coexistence Embedded Signup from the owner's phone into portfolio 1664926084588167 (choose "share 6-month history" = yes — gives the bot context on returning customers). **This is the risk gate — do before writing the full bot.**
4. Create the Telegram bot (BotFather) + capture owner chat id; create Anthropic API key; Cloudflare Workers Paid plan.

**Phase 1 — Notifications without AI (ship in a day):** webhook Worker + signature verify + TG push for every inbound WA message ("новый лид: <name/phone>, текст"). Validates the whole pipe in production before any AI. Capture + persist `ctwa_clid` from day one.

**Phase 2 — The agent:** ConversationDO, debounce, knowledge pack, Claude replies with AI disclosure, state machine incl. echo-takeover, media/photo understanding, escalation to TG.

**Phase 3 — Deal flow:** `update_lead_card` tool, lead_ready handoff (TG card + customer message), D1 lead log, CAPI Lead events with `ctwa_clid`, single in-window follow-up alarm, metrics counters.

**Phase 4 — Compliance & polish:** privacy policy update (3 languages: recipients Meta + Anthropic, US transfer, retention period, rights channels), chat retention auto-purge (default: 6 months, confirm with owner), GDPR rights-request recognition test set, prompt tuning on real dialogs, weekly quality-rating check routine.

Ads can launch after Phase 2; Phase 3 should land before serious ad spend so CAPI learns from real leads.

## 7. Costs (monthly, low volume)

| Item | Cost |
|---|---|
| Coexistence provider | €12–49 (pick in Phase 0) |
| Cloudflare Workers Paid | ~$5 |
| Claude API | ~€0.05–0.10/dialog → €5–15 at 100–150 dialogs |
| Meta messaging | €0 (inbound-only within CSW; CTWA replies free 72h) |
| **Total** | **~€20–70/mo** |

## 8. Risks

| Risk | Mitigation |
|---|---|
| Coexistence signup fails on this number (old WABA shell / cooldown) | Phase 0 step 3 is the gate; nothing else is built until it passes. Fallback = full migration (separate owner decision). |
| Bot talks over the owner | `smb_message_echoes` → hard `human_takeover`; explicit resume only. Echo blind spot: owner must reply from phone app, not WhatsApp for Windows. |
| Wrong price quoted | Prices only via deterministic lookup from generated knowledge pack; LLM cannot emit numbers not in the pack (tool-enforced + prompt rule + eval test). |
| AI Act deadline 2026-08-02 | Disclosure in first message from the first deployed AI reply. |
| Quality-rating damage (blocks) | One consolidated bubble per turn, max one follow-up, no post-window templates in v1. |
| 13-day app-open requirement | Owner uses the app daily; note in runbook anyway. |
| Provider lock-in / API proxy shape | WA send/receive isolated behind a small `WaTransport` interface so a provider swap is one file. |

## 9. KPIs

- Time to first reply: <60 s, 24/7 (vs "#1 gate" <10 min).
- ≥50% of ad-sourced dialogs reach a complete lead card.
- Owner takeover on every `lead_ready` within owner's waking hours; zero double-reply incidents.
- CAPI Lead events flowing with `ctwa_clid` before ad-spend scale-up.

## 10. Open questions (carried into planning)

1. Provider choice (Phase 0.1 research decides; Dualhook's echo support unverified).
2. Whether coexistence WABAs show the app profile name to ad-sourced strangers or the bare phone number (trust issue; likely app profile shows — verify empirically in Phase 0).
3. R2 vs DO storage for photo bytes (decide by size in Phase 2).
4. `agents` SDK vs hand-rolled DO (evaluate at Phase 2 start; hand-rolled is the fallback, scope is small).
5. Retention period for chat logs — owner to confirm (default 6 months).
6. Exact EUR rate-card for Spain utility templates (only matters in Phase 3+ for post-window follow-ups).
