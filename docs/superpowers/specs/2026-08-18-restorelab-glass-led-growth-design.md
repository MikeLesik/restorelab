# RestoreLab — Glass-Led Growth Design

**Date:** 2026-08-18 · **Status:** Draft for owner review · **Scope:** business model + site changes for the launch window (Aug–Nov 2026)

Supersedes nothing. Companion to `2026-07-23-whatsapp-ai-agent-design.md` (that agent stays parked; see §8).

## 1. Situation

RestoreLab is pre-operational. The owner is solo, has tools but **no work vehicle until ~29 Aug 2026 and no workshop**, so all work is mobile. The website is the only mature asset: 169 static pages, ES/EN/CA, decent SEO, WhatsApp as the conversion channel.

**Owner constraints, as stated 2026-08-18:**

| Input | Value |
|---|---|
| Target | EUR 8,000/month **take-home** |
| Days available for RestoreLab | **4 days/week** (~17 field days/month) |
| Personal burn | EUR 5,000/month, **not reducible** |
| Runway | ~2 months of savings |
| Capital for hiring | none |
| External income | yes, **out-of-trade**, invoiced as **autónomo** |

**Measured demand today:** Search Console 98 impressions / 0 clicks / avg position 12.5. GA4 13 users in 28 days, 0 `wa_click` events. Meta dataset: 0 events ever. Google Ads: 0 campaigns. A sample of 8 organic WhatsApp leads showed **6 of 7 real leads never answered**, and ~43% of demand was **non-car glass** (home windows, patio doors, shower screens).

**Blockers:** Google Business Profile unverified (invisible in the local pack). Meta ad account restricted for automation (treat as unavailable). Google Ads account exists, identity-verified, GA4-linked, EUR 400/400 promo armed — only campaigns missing.

## 2. The arithmetic that shapes everything

**EUR 8,000/month is a revenue number, not an income number.** At Catalonia 2026 rates, EUR 8,000 collected from B2C customers yields roughly **EUR 3,350/month in pocket** (41.8%): IVA is 21/121 = 17.36% of every displayed euro, plus RETA, IRPF and consumables. To actually net EUR 8,000 the business would have to collect **~EUR 19,500/month**.

**The solo ceiling is lower than that target.** A mobile operator bills 5–6.5 hours of a 9–10 hour day; the rest is travel, setup and teardown. Full-time (21 field days) that is ~189 door-to-door hours and a **EUR 7,260–9,240/month ceiling** at 100% utilisation. At **4 days/week (~153 hours)** the sustainable ceiling is **EUR 6,000–7,000/month invoiced** with the repricing in §4.

**External income stacks the tax.** EUR 5,000/month net from the other autónomo activity is ~EUR 60,000/year of base. Both activities aggregate for IRPF, so **RestoreLab's marginal rate is 37.5–44%**, not the ~26% effective rate a from-zero business would see. Plan RestoreLab's contribution at **EUR 2,000–2,300/month net**, not EUR 2,700.

**Restated goal:**

| Source | Invoiced | Net |
|---|---|---|
| External activity | — | EUR 5,000 |
| RestoreLab at 4-day ceiling | EUR 6,000–7,000 | EUR 2,000–2,300 |
| **Combined** | | **≈ EUR 7,000–7,300** |

EUR 8,000 net is reachable as the **sum of two income sources**, not from detailing alone. Detailing alone cannot produce it at any service mix while solo.

**The binding constraint for the next two quarters is lead flow, not hours.** EUR 6,500/month is ~26 jobs; at a 30% close rate that needs ~87 qualified enquiries/month against a current flow of roughly zero.

## 3. Strategy: glass-led, not detailing-led

The site currently sells paint correction — the most competitive, most weather-dependent and longest-duration product in the catalogue. At 4 days/week that is the wrong front door.

**Net EUR per door-to-door hour, after consumables and travel:**

| Service | EUR/h | Duration |
|---|---|---|
| Home glass, 3 panes | **33** | 2–4.5 h |
| Full car glass set | **32** | short |
| Trim, full car | 30 | short |
| Two-Stage correction | 26 | 9 h |
| Single-Stage | 24 | — |
| Ceramic 5Y | 20 | 14–20 h |
| Headlights + UV | 18 | — |
| **Ceramic 2Y** | **17** | 14–20 h |
| Pre-Sale Pack | 15 | 7.5 h |
| Headlights alone | 12 | 1.5 h |

Glass wins because consumables are EUR 8–25 versus EUR 165–270 for ceramic, and jobs are 2–4.5 h instead of 14–20 h. Ceramic and correction **cannot be fitted around a part-time field schedule**; glass can.

Four more reasons glass leads:
1. **43% of observed demand already points there**, unserved.
2. **Indoors and weather-proof.** Sep–Nov is Barcelona's rainiest window and Dec–Feb is the weakest season for outdoor mobile work; glass is the seasonal hedge, not a side note.
3. **No Spanish competitor publishes a price** for flat-glass polishing. The pitch is pure cost-avoidance against replacement (documented EUR 6,000 → EUR 600).
4. It needs no water, no wash, no garage permission — removing the access filter that silently kills Barcelona bookings.

Positioning: **glass is the front door, detailing is the upsell.**

## 4. Operating model

### 4.1 Repricing (zero cost, do before first job)

**Shipped 2026-08-19 (commit `a09b397`).** Final ladder:

| Item | Was | Now | Reason |
|---|---|---|---|
| Single-Stage | 289 | **349** | |
| **Ceramic 1Y** (new) | — | **499** | Single-stage correction + 1-year coating. Makes the coating uplift consistent: +150 for one year, +250 for two |
| Two-Stage | 549 | **599** | |
| Ceramic 2Y | 649 | **849** | Netted ~EUR 17/h vs Two-Stage at ~26 — the upsell was a *margin downgrade*. Barcelona charges 640–1,040 for comparable coatings |
| Pre-Sale Pack | 289 | **449** | EUR 15/h on 7.5 h — was the worst item in the list |
| Express Refresh | 149 (car) | 149 (**extras**) | Moved out of the correction ladder: at EUR 22/h it collided with the EUR 110–160 mobile-wash tier and invited commodity comparison. It is maintenance, not correction — and the move leaves four car packages and three extras, so neither row orphans a card |
| Full glass set | 289 | unchanged | already EUR 32/h |
| Trim, full car | 189 | unchanged | already EUR 30/h |

Ceramic 5Y was withdrawn entirely — see §4.6 and §10. Expected effect of the repricing: **+EUR 800–1,200/month at the same job count.**

**Mandatory alongside:** display **"IVA incluido"** on every price. Under art. 60 RDL 1/2007 a B2C price must be the final price including taxes; the site states nothing today, so EUR 149 is legally the total. Against competitors who advertise "+IVA" the site currently reads 21% more expensive than it is. Budget from net: EUR 123 / 239 / 454.

### 4.2 Minimum ticket and travel

Shipped in the same commit:

- **Minimum visit EUR 149, published on the pricing block**, with "IVA incluido" stated. This is the mechanism that stops a EUR 79 call-out from consuming a full ~1.7 h travel block at a loss.
- **Headlight (EUR 79) and hydrophobic-only (EUR 89) prices were deliberately left unchanged.** The earlier draft cut them to 69/49 as add-ons, but the floor already prevents the loss-making solo trip, and cutting them would have meant rewriting ~18 SEO titles, H1s and meta descriptions per language across the area×service pages. The economics are fixed by the rule, not by the price.
- **Barcelona zone fee EUR 39** in `areaProfiles.ts` — Barcelona, Pedralbes and Sant Gervasi were EUR 0 while Terrassa was EUR 15, exactly backwards. A Barcelona visit costs ~42 extra minutes plus fuel and the Vallvidrera toll.
- Still open: the remaining `// VERIFY` travel fees, which the owner has never confirmed.

### 4.3 Home glass offer (new)

| Item | Price |
|---|---|
| 1 pane | EUR 149 |
| 3 panes | EUR 249 |
| Shower screen / mampara | EUR 139 |
| 5+ panes at one address | batch rate per pane |

Mirrors are **excluded** by owner decision (silvering and optical-distortion risk).

Two owner prerequisites: **IAE epígrafe 922.2** added via modelo 036 (the existing alta covers the unrelated activity; 751.5 is needed for vehicles and 922.2 for home glass), and a **consulta vinculante to AEAT** on applying **10% IVA instead of 21%** under art. 91.Uno.2.10º LIVA (repair in a dwelling over 2 years old, materials under 40% of the base) — worth EUR 1,500–3,000/year on the segment that is 43% of demand.

### 4.4 Demand channels, ranked for an operator with no GBP and no reviews

1. **Cristalerías that currently REPLACE scratched flat glass.** They quote clients EUR 100–300 per pane for replacement and cannot polish. Needs no GBP, no reviews, no ads. Highest-fit channel for the glass line.
2. **B2B compraventas and talleres on the C-58/N-150 corridor** (Sabadell, Terrassa, Barberà, Cerdanyola, Rubí). Batched work at EUR 700–1,300/day with **no inter-job travel** — the single best fit for a 4-day schedule. Requires a B2B rate card at EUR 90–180/unit; the EUR 289 pre-sale pack is ~2x too expensive for dealer volume. One dealer at 8 units × EUR 150 = **EUR 1,200/month at zero CAC**.
3. **Cronoshare, category `pulido de cristales`** — leads at ~EUR 8.50, the only way to buy the non-car glass demand directly.
4. **Google Ads Search.** Does **not** require a verified GBP (only Local Services Ads do). Bid `pulido de faros barcelona`, `faros opacos itv`, `pulido cristales rayados barcelona`, `quitar rayas mampara`. Do **not** bid `detailing barcelona`.
5. **GBP once verified** — the local pack takes 44% of local-search clicks and 42% of GBP conversions never touch the website.
6. **Administradores de fincas, window and mampara installers** — slow, compounding, glass-specific.
7. **Meta — do not touch.**

### 4.5 The cheapest lever in the plan

**Answer WhatsApp in under 5 minutes, 08:00–21:00: 32% close rate versus 12%.** Costs nothing. The 8-lead sample showed 6 of 7 unanswered, so this is currently the largest single loss in the funnel.

### 4.6 Site changes (implementable work)

1. Repricing + "IVA incluido" + minimum visit + zone fees across `src/content/{es,en,ca}.json`.
2. Fix `areaProfiles.ts` travel fees.
3. New ES landing page for home glass (`pulido de cristales, ventanas y mamparas a domicilio`) — glass is currently framed as automotive-only.
4. Rewrite the headlight page around **`faros opacos = defecto grave = ITV desfavorable`** — a legal urgency trigger competitors do not use, and the cheapest high-intent keyword in the set.
5. **Unpublish `/plans`** until rebuilt (see §7).
6. Keep the availability banner (`t.availability`) current; retire it when the calendar opens.

**Shipped 2026-08-18 (commit `37932d4`):** unauthorised accreditation claims removed in all three languages, the Ceramic 5Y package (Gtechniq Crystal Serum Ultra — accredited-installer-only) withdrawn from pricing, Estimator, ceramic landing and academy tables, the brand warranty replaced with a bounded own guarantee, the brand row retitled "Products & equipment", and the four remaining car packages laid out in one row. See §10 for the reasoning.

## 5. Ninety days

Field days split 4/week: **1 day B2B batch · 2 days glass · 1 day big-ticket.** Quoting and WhatsApp sit outside the field window (~1–1.5 h/day, evenings).

### Phase 0 — now → 28 Aug (no van yet)
**Goal: be able to invoice on day 1 with work pre-booked.**

Owner:
1. **Vehicle: N1 furgón cerrado, no rear seats** — 100% IVA deduction. IRPF requires exclusive business use; AEAT rejects the deduction *entirely*, not partially, where private use is evident. Decided at purchase, not afterwards.
2. Gestor: add **IAE 751.5 + 922.2** to the existing alta via modelo 036 (no second cuota). Tarifa plana is unavailable — already in RETA.
3. **RC profesional** EUR 250–450/yr, explicitly extended to **third-party goods in custody**; standard autónomo policies exclude exactly the risk of machine-polishing a stranger's car.
4. **Pre-book 5–8 jobs** for the week of 31 Aug from the 8 existing leads plus Sant Cugat neighbours. Portfolio jobs: photos and a review agreed up front.
5. Check Marek's TIE for "autoriza a trabajar" (see §6).

Claude: all of §4.6.

### Phase 1 — 29 Aug → 11 Sep
**Goal: first revenue and GBP verification.**

6. **Van livery, days 1–3** (EUR 150–300). This is the missing evidence element in the GBP video, plus rolling advertising in the catchment.
7. **GBP video, days 3–5, after livery.** One unedited 60–120 s take, filmed and uploaded from the phone inside the Business Profile flow: street sign → liveried van → open it with your own key → equipment → an invoice showing restoreLab + NIF → street. No cuts, no other people. Answer within 5 business days. **Do not edit the profile while review is pending** — it invalidates the submission.
8. Fixed photo protocol on every job: before-wide, before-macro, after-macro same angle, after-wide, beauty. Feeds cases, GBP posts and ads for 12 months.
9. **Ask for the Google review on-site at the reveal, phone in hand** — 83% comply. Never offer anything in exchange: undisclosed incentivised reviews breach RDL 24/2021, penalties to EUR 1M.
10. **Enter the Google Ads payment method in the first week of September** — the EUR 400/400 promo expires **21 September** regardless of GBP status.

### Phase 2 — 12 Sep → 12 Oct
**Goal: fill the calendar without depending on ads.**

11. On verification: complete GBP to 100% (services mirroring the site, service areas = the 12 existing city pages, 20+ photos, seeded Q&A), post twice weekly, replace the dead `g.page` links on the site.
12. **Drive 3–5 reviews/week.** The threshold is **20** (47% of consumers reject a business below it); ~24 completed jobs with a disciplined ask reaches it around day 60–75. Then never stop — 74% of consumers weigh only the last 3 months.
13. **Walk 15–20 B2B targets** (independent of GBP): VO dealers, renting-return handlers, talleres that do not polish, and **5 cristalerías**. Sell a per-unit rate card with a 4-unit minimum and NET-30 — not a monthly retainer. The first week of September is the "vuelta" when the whole B2B layer reopens at once.
14. Google Ads at EUR 10–15/day, exact match, ES/CA only, keywords per §4.4.
15. Register on Cronoshare `pulido de cristales`.

### Phase 3 — 13 Oct → 27 Nov
**Goal: raise average ticket, install recurrence.**

16. Push average ticket to EUR 400+: bias the Estimator's default recommendation upward, attach glass and headlights to every paint job (both short, both already on the van), add a EUR 49–69 "while I'm here" list.
17. Rebuild `/plans` (see §7) before promoting it.
18. Renting returns and VO dealers — the densest recurring work available to a solo operator (1.06M renting vehicles in Spain, +8% YoY; returns need cosmetic prep before resale).
19. Open the capacity conversation only if turning work away weekly.

### Expected trajectory (4 days/week)

| Month | Invoiced | Net (marginal 37.5–44%) |
|---|---|---|
| Sep | 1,500–3,000 | 500–1,000 |
| Oct | 2,500–4,000 | 800–1,400 |
| Nov | 3,500–5,000 | 1,200–1,700 |
| Dec–Feb | glass carries the winter | — |
| Mar–May 2027 | 6,000–7,000 (ceiling) | 2,000–2,300 |

## 6. Scaling thresholds

- **Workshop before hire.** A 120–150 m² nave in Vallès Occidental at EUR 830–1,035/month breaks even on EUR 1,800–2,300 of extra revenue, cuts per-job overhead from 1.70 h to 0.35 h (+49% on-site hours), legalises washing, and lifts the correction-led ceiling from EUR 7,206 to EUR 8,868. **Trigger: sustained EUR 7,000/month.**
- **Hire only at sustained EUR 12,000–13,500/month.** A Barcelona Oficial 3ª costs ~EUR 37,000/year fully loaded and must bill 2.5–3× that. The first-employee bonificación requires indefinido + full-time + 3-year retention — a lock, not free money.
- **Subcontracting** is for overflow only, and only with genuinely independent autónomos (own tools, other clients, own pricing). Falso autónomo costs EUR 3,750–12,000 per worker plus 4 years of back contributions; cesión ilegal reaches EUR 225,018.
- **Never sell customer contact data.** The AEPD has fined EUR 6,000 and EUR 4,000 for transferring a *single* phone number. The compliant equivalent is a **client-initiated referral** — give the customer the partner's number, let the customer call, collect a 10–15% commission under a contrato de colaboración. No personal data moves, so no cesión.
- **Marek (UK glass technician who asked for work):** do not hire. Post-Brexit he is a third-country national requiring prior work authorisation; autónomo colaborador is family-only; a first-year autónomo cannot sponsor anyone. Check whether his TIE already says "autoriza a trabajar" — if yes, an autónomo-to-autónomo subcontract becomes possible once overflow exists. Otherwise use him as a **paid-per-referral technical advisor on flat-glass technique**, which is exactly the competence gap in the 43% segment.

## 7. `/plans` rebuild

As priced (EUR 39/month for a monthly on-site exterior wash) the plans are EUR 16–30/hour work that consumes the hours needed for EUR 400+ jobs, and there is no payment rail behind them, so nothing renews. Before any promotion:

- **Route-cluster:** plan visits happen only on fixed days by postcode (e.g. 1st Tuesday Sant Cugat, 2nd Terrassa/Sabadell), 4–6 cars per day. Travel amortises across the cluster, lifting the effective rate from ~EUR 20/h to EUR 55–70/h. Write it into the plan terms.
- **Monthly recurring, not annual prepay** (see Appendix A for why).
- What actually makes detailing subscriptions stick: a scheduled visit the customer never has to remember, a condition report after each visit, real priority access, and a coating warranty void if maintenance lapses — the last is the only true lock-in in this trade.

## 8. Out of scope

- **Payment integration** — parked by owner decision 2026-08-18. Findings preserved in Appendix A.
- **A customer-facing app or marketplace.** The identical idea died in Barcelona: Washme (2015, ex-Tuenti engineers, Google Launchpad España winner) is gone, its domain now a Málaga laundry whose homepage reads "no app, no account — one WhatsApp message"; Cherry raised $4.5M and closed within a year. A 15–20% take rate on EUR 289 jobs means EUR 43–58/job, so EUR 8,000 of platform revenue needs 140–185 monthly jobs from 10–15 recruited competitors. Detailing is a 0.2–0.5 purchases/year product against 4% median D30 app retention. Spanish customers already have the app: WhatsApp, 94% monthly reach. **Buy, don't build** if an ops tool is ever needed (Jobber ~EUR 49/mo, Urable $45, Mobile Tech RX from $30) — writing own invoicing software carries EUR 50,000–150,000 exposure under art. 201 bis LGT.
- **The WhatsApp AI sales agent** (`2026-07-23-whatsapp-ai-agent-design.md`) stays parked until there is volume worth automating. The <5-minute manual reply discipline in §4.5 delivers most of its value at zero cost and zero risk.

## 9. Open questions

1. The owner already holds an alta for his unrelated activity. Does it carry **IAE 751.5 and 922.2**, or must they be added via modelo 036? Until 922.2 is on it, home-glass work cannot be invoiced — which blocks the whole §3 strategy.
2. Outcome of the AEAT consulta vinculante on 10% IVA for home-glass repair.
3. Marek's TIE work authorisation status.
4. Whether the external activity's hours genuinely leave 4 full field days — the entire capacity model in §2 depends on it.

## 10. Conduct and compliance

Researched 2026-08-18 across seven angles with adversarial verification. Three of the four load-bearing assumptions were **refuted** — those corrections are in §10.9.

### 10.1 Language

Sant Cugat has the **highest Catalan comprehension of any large Catalan municipality** (98.3% understand it, 93.5% read it), but Catalan is the habitual language of only 32.6% of Catalonia. Two facts decide the policy:

- **Convergence is the norm.** Only 17.4% of people who open in Catalan stay in Catalan when answered in Spanish; 70.4% switch. Answering in Spanish is statistically normal, not an insult.
- **Migrant-facing asymmetry.** When the interlocutor is perceived as of migrant origin, only 19.7% are addressed in Catalan; 71.1% get Spanish. A Russian accent means he will almost never be forced into spoken Catalan.

**Policy: write in Catalan, speak in Spanish.** This is simultaneously the legal minimum and a differentiator ~80% of migrant-origin providers don't offer.

**Legally binding:** Llei 22/2010 art. 128-1 plus Llei 18/2017 require *at least in Catalan* — pressupostos, factures, contractual documentation, price lists and fixed commercial information, which includes **van livery and any public price list**. The Agència Catalana del Consum opened **486 sanctioning files in 2025** (206 in 2024) totalling €715,284, average ~€2,240; ~30% were for missing Catalan in fixed information. He may answer orally in Spanish, but must never say "no entiendo el catalán".

Say the honesty line **once**, in Catalan, then stop apologising — repeated apologising reads as insecurity and damages more than the accent. Use the Catalan article before names ("en Jordi", "la Marta").

### 10.2 Formality and timing

Open every first contact in **usted / vostè** and let the customer downgrade ("¿Nos tuteamos?" / "Ens podem tutejar?"). **Never "vós"** — archaic and bizarre from a tradesperson. B2B: **tú** with talleres, compraventas and cristalerías; **usted** with administradores de fincas, hotel management and older gerentes.

- **No commercial calls** before 09:00, 14:00–16:30, after 21:00, on Sundays or public holidays (Ley 11/2022 restricts them Mon–Fri 09:00–21:00).
- **No commercial messages on 11 September (Diada)**; don't use Spanish-flag framing on 12 October; remember Catalonia-only holidays (Dilluns de Pasqua, 26 Dec Sant Esteve).
- **Sant Cugat noise ordinance (2018) art. 30.3: machinery only 08:00–20:00 Mon–Fri and 09:00–20:00 weekends/holidays.** Sanctions to €300,000. A polisher in a communal garage at 20:30 is citable.
- **August is genuinely dead** (invoices −16%, new RETA registrations −38.3%). Build the list in late August; knock in the first week of September.

### 10.3 First contact (B2C)

Speed is the largest measurable lever and it dwarfs everything else: **65% of Spanish consumers expect a reply in under 5 minutes**, sub-1-minute replies convert ~8× better than 5-minute ones, and the Spanish sector average is ~47 hours. **74.6% rank professionalism above price (39.8%)**, and professionalism is judged almost entirely by the speed and completeness of the first answer.

- Set a WhatsApp Business greeting that fires instantly and asks for the three photos; a hard SLA of under 10 minutes, 09:00–20:00.
- **Give a number in the first human reply** — a bounded range with "IVA incluido" — plus at most two qualifying questions. Never "depende", never "pásame tu email".
- **Name the defect correctly in the first ten words** ("remolinos", "cal incrustada", "deformación óptica"). This positions harder than the whole website.
- Ask for exactly 3 photos with a technique ("primer plano con la linterna del móvil en diagonal").
- **Never discount when pushed** — services are not a haggling category in Spain and a rebate signals the first price was inflated. Move scope, slot or included extras, never the rate. Don't criticise the cheaper competitor; ask what their quote includes and how many phases.
- **Don't lead with the limitation.** "Esa raya no se va" as an opener kills the sale; the same sentence after "esto sí se va entero" builds trust.
- Quote validity: state **15 días naturales**.

### 10.4 B2B outreach

- Cold **visits and calls to businesses are legal and normal** (the puerta fría ban covers private homes). But **cold WhatsApp or email to a business he has never met is prohibited** — art. 21 LSSI, and the AEPD sanctions it in B2B (fines to ~€5,000). Order: visit or call → explicit permission → then WhatsApp.
- Walk in **Tue–Thu, 09:30–11:00 or 16:00–17:30**. Never Monday morning, Friday after 13:00, 13:30–15:30, or a compraventa on Saturday morning (their peak selling window). Target 6–8 quality doors per half-day.
- Visit #1 is a **name-capture mission**, not a close: leave with the decision-maker's name, their quiet hour, and permission to message.
- Carry: tarjetas, a one-page tarifa with PVP vs TARIFA PROFESIONAL columns, a sample factura with NIF and the Ley 3/2004 footer, the RC certificate, before/after on the phone. Have the CAE / alta-de-proveedor pack as one PDF sendable within the hour — being the supplier who answers same-day beats being cheapest.
- **Test panel only** — half a bonnet, one pane, one headlight. Never a full free car; operators trained on free work never start paying.
- Say the non-poaching promise unprompted to talleres and cristalerías: **"yo no le doy mi tarjeta a tu cliente; el cliente es tuyo"** — the loudest unspoken objection in Spanish subcontracted trade.
- **Don't accept 60–90 day terms on job #1.** Spanish PMP is ~80.5 days, autónomos wait 85+, only 1 invoice in 3 is paid on time, and automoción is among the worst-exposed sectors. Since 3 Apr 2025 a monitorio filed without a documented prior negotiation attempt is inadmissible — burofax with a dated proposal first.

### 10.5 On site

- Confirmation the evening before, "voy de camino" on the day, a **30-minute arrival window honoured**. The worst review found in the Barcelona set was not about finish quality — it was about being made to wait.
- **Arrive with the pressupost already written** and signed before touching anything: name, NIF, full address, service description, itemised price with IVA, validity, start date and duration, the 6-month legal guarantee, the 14-day withdrawal notice, and two equal-sized ACEPTO / NO ACEPTO boxes. In Catalonia a written prior estimate is a legal obligation for services the consumer cannot price themselves, and **desplazamiento may only be charged once**.
- **Never** put "no me hago responsable de daños" in the estimate — abusive under art. 86 TRLGDCU, null under art. 83, and it signals to a sophisticated customer that you expect to break something.
- Joint filmed walkaround, narrated, **sent to the customer's WhatsApp immediately** — their holding a copy is what kills a false claim.
- **Read paint thickness aloud per panel** and record it before and after. Art. 147 TRLGDCU reverses the burden of proof, so process evidence (µm readings, an approved test spot, products and pads used) protects better than damage photos alone.
- Ask permission out loud for each new intrusion: parking spot, socket, tap, moving objects, photos.
- Mid-job price changes go in writing as an "ampliación de presupuesto" with the exact figure and an explicit "conforme" before continuing — always offering the option to continue as agreed at no extra cost. Urgency and immediate-availability surcharges are **prohibited** for home services in Catalonia; night surcharges only 22:00–06:00.
- **Cash over €1,000 is illegal** (Ley 11/2021) with a 25% penalty on **both** parties, splitting expressly caught. Say so before the visit, not at the door.

### 10.6 Technical red lines

Each of these can end a business line on its own:

1. **Never polish the wiper-swept zone or the driver's direct field of view.** Optical distortion there is a **grave ITV defect** — the car cannot legally circulate until the glass is replaced, turning a €119 job into a €400–800 windscreen replacement.
2. **Never touch coated glass** (bajo emisivo, control solar, antirreflectante) **or mirrors.** The coating cannot survive polishing; one ruined window in a Sant Cugat flat ends the residential glass line before it starts.
3. **Never spot-polish a pane.** Polish an area materially wider than the scratch, or you create exactly the lens effect customers fear. Lead flat-glass sales with a free 10×10 cm test patch the customer chooses, inspected in reflection and backlight.
4. **Never use running water on the public road or in a communal garage.** Barcelona treats soapy discharge as a serious infraction (€30–3,000), and washing in communal garages is broadly an actividad molesta under LPH art. 7.2 — one neighbour complaint reaches the administrador de fincas, who talks to dozens of buildings. Get written comunidad permission before booking communal-parking work.

### 10.7 Reviews

The threshold is **20 reviews** (47% of consumers refuse a business below it) and **83% of customers comply when asked on site**, so ~24 completed jobs with a disciplined ask reaches it around day 60–75. After that, recency is the whole game — 74% weigh only the last 3 months.

- **Never offer anything in exchange.** Google's policy bans incentives, bans review-gating and bans pressuring customers on site; in May 2026 Google announced it will actively penalise businesses that pressure for positive reviews. RDL 24/2021 separately makes undisclosed incentivised reviews an unfair commercial practice with sanctions to 4% of turnover or €2M.
- **GDPR trap in replies:** never confirm the reviewer was a client, and never mention their name, vehicle, plate, address, date, price or service detail — not even to rebut. The AEPD has fined €7,000, €4,000 and €1,500 for exactly this. Plates are personal data; blur by default, and get written photo-publication consent in the estimate.
- If testimonials appear on the site, TRLGDCU art. 20.4 requires disclosing whether and how they are verified.

### 10.8 Complaints

- **Fulls oficials de queixa/reclamació/denúncia (Decret 121/2013) are obligatory for mobile businesses too** — art. 7.2 requires *carrying* them. They are free from an OGE, an OCIC or the ACC. Not having them is an infracció lleu of up to €10,000; look-alike branded forms are expressly prohibited (art. 4).
- Print the availability notice on every pressupost, factura and the site footer — for a business with no premises this documentary notice substitutes for the wall sign.
- Hand the form over instantly and cheerfully, even to someone who bought nothing. Signing is only proof of receipt (art. 9.1), and you may write your resolution offer on it on the spot — the cheapest de-escalation tool available.
- **Answer in writing within 15 days** (TRLGDCU art. 21.3); the Catalan ceiling is one month, and silence is the failure mode already measured in this funnel.
- **Insurance reality:** standard RC de explotación **excludes damage to the item being worked on**. Burning through a customer's clearcoat is not an insurable event — it is P&L. Buy the custody/depósito extension and still price the risk.

### 10.9 What the evidence overturned

| Assumption | Verdict |
|---|---|
| Replying in Spanish to a Catalan message costs trust | **Refuted** — 70.4% converge to Spanish; only 19.7% address a perceived migrant in Catalan. Catalan is differentiation, not survival. Written documents are the real obligation. |
| Damage photos are the most important defence | **Refuted** — art. 147 TRLGDCU reverses the burden of proof, so *process* evidence (µm readings per panel, approved test spot, products used) matters more. Photos remain necessary but insufficient. |
| A written guarantee + portfolio substitutes for reviews | **Refuted** — warranties raise perceived quality only for already-credible firms (Boulding & Kirmani 1993) and do not substitute for reputation in price or probability of sale (Roberts 2011, AEJ:Micro). 47% won't consider a business under 20 reviews. In the 2025 Castrol/OnePoll survey of 1,000 Spanish vehicle owners a guarantee **did not register as a decision factor at all**; the top driver was explaining the work and asking authorisation before proceeding (43%). |
| Mobile businesses are exempt from complaint forms | **Confirmed obligatory** — Decret 121/2013 art. 7.2 names home-service providers explicitly. |

The strongest available substitute for reviews is **third-party verifiable certification**, not self-attestation — which is why arbitration adhesion (§11) outranks any badge he could print himself. This matters more than usual in Catalonia, where an active fake-home-technician fraud wave (Barcelona arrests Feb 2026, 31 offences, ~€200,000) means a stranger's own printed credentials carry near-zero, possibly negative, trust weight.

## 11. Owner checklist

Things only the owner can do. Ordered by deadline.

**Before the van (now → 28 Aug)**
1. **Vehicle: N1 furgón cerrado, no rear seats.** 100% IVA deduction; IRPF requires exclusive business use and AEAT rejects the deduction entirely where private use is evident. Decided at purchase.
2. **Gestor:** add **IAE 751.5** (vehicles) **and 922.2** (home glass) to the existing alta via modelo 036 — one cuota covers both. Tarifa plana is unavailable (already in RETA). Without 922.2 he cannot invoice home-glass work.
3. **RC profesional** (~€250–450/yr) with the **third-party-goods-in-custody extension** — standard policies exclude exactly this risk.
4. **Order the fulls oficials** from an OGE / OCIC / ACC office and keep a sealed pad in the van. Free.
5. **Apply for adhesion to the Sistema Arbitral de Consumo** (Junta Arbitral de Consum de Catalunya, Rda. Sant Pau 43-45, 08015 Barcelona). Free, gives an official distintivo and a public-registry entry — the only third-party-verifiable trust mark available from day one. Specify **"en derecho"**, not the default equidad.
6. **Pre-book 5–8 jobs** for the week of 31 Aug from the existing leads and neighbours, with photos and a review agreed up front.
7. **Check Marek's TIE** for "autoriza a trabajar".

**Week 1 of September**
8. **Van livery** (€150–300) days 1–3 — also the missing evidence element in the GBP video. Livery must be at least in Catalan (fixed commercial information).
9. **GBP video verification** days 3–5, as a service-area business with the address hidden. One unedited 60–120 s take: street identifiers → liveried van → open it with your own key → equipment → invoice showing restoreLab + NIF. Don't edit the profile while review is pending.
10. **Enter the Google Ads payment method before 21 September** — the €400/€400 promo expires regardless of GBP status.

**Standing rules**
11. Answer every WhatsApp inside 10 minutes, 09:00–20:00. This is the single highest-ROI behaviour available at zero cost.
12. Ask for the Google review on site, at the reveal, never with an incentive.
13. Do not touch Meta.

---

## Appendix A — Prepayment (researched, parked)

Kept because the legal findings are non-obvious and will apply whenever payment is revisited.

**A deposit cannot be retained during the withdrawal window.** Art. 102.2 TRLGDCU voids any clause penalising withdrawal; art. 107.1 obliges full refund within 14 days by the original method. The window is **14 calendar days from conclusion of the contract** (art. 104.a) — not from the appointment — and **30 days** where the contract was concluded during an unsolicited visit to the customer's home, which is the mobile sales model. Detailing fits no art. 103 exception: 103(a) requires the service **completely** performed, and 103(l) is a closed list (accommodation, goods transport, vehicle *rental*, food, leisure). A deposit is therefore a behavioural anchor against no-shows, enforceable only on bookings made more than 14 days ahead. A late-cancellation fee after the window is lawful only if **symmetric** (art. 87.2) and no higher than provable loss — STS 791/2026 struck down a 50% retention.

**B2B is the clean zone.** Businesses have no withdrawal right (art. 3), so a genuinely non-refundable deposit rail is legitimate only on `/business`.

**Catalonia caps large advances.** Art. 221-3 Codi de consum de Catalunya (Llei 22/2010) requires the trader to **guarantee the return** of advances that are both >25% of the transaction and >EUR 100 (cumulative), via fiança, aval or seguro de caución, with written notice to the consumer. A EUR 50 deposit is exempt; **annual prepay of EUR 390–690 is not**, which removes it from the launch set. AECOSAN SGADC/2444/2016/F further holds prepayment abusive unless justified — the two safe harbours being materials purchased for the specific job, or guaranteed amounts. Art. 62.3 forbids treating prepaid amounts as forfeited on cancellation of a continuing-service contract.

**Tax.** IVA accrues on receipt of the advance (art. 75.Dos LIVA), i.e. 17.3554% of every displayed euro (21/121), declared that quarter but paid 1–20 of the following month — 20–120 days of float, and only *net* IVA is remitted, which in a launch quarter heavy with input VAT may be zero. **IRPF follows accrual**, so prepay is not taxable income until the service is delivered — provided the criterio de cobros y pagos (art. 7.2 RIRPF) is **not** elected. Every advance requires a **factura de anticipo** (RD 1619/2012); a Stripe receipt is not an invoice. VeriFactu applies to autónomos from **1 Jul 2027** (RDL 15/2025).

**Technical.** Stripe **Payment Links support recurring prices natively**, plus a Stripe-hosted customer portal for cancellation and card updates — so even subscriptions need **no backend**, and the static Astro/Cloudflare Pages setup stands. A plain `<a href="buy.stripe.com/…">` redirect needs **no CSP change**; only the embeddable buy button would. Stripe Tax must be configured `tax_behavior=inclusive`. Spain 2026 fees: EEA cards 1.5% + EUR 0.25, international 3.15% + EUR 0.25, Billing +0.7%, SEPA Direct Debit EUR 0.35. Bizum (1.5% + EUR 0.25) suits WhatsApp-collected deposits but supports neither recurring nor manual capture. A Pages Function is only required for runtime-computed amounts, authorisation holds, programmatic link creation or first-party webhooks.

**Launch set when revisited:** refundable EUR 50 deposit credited against the invoice (never described as non-refundable); plans as **monthly** recurring on SEPA with a portal cancel link (art. 62.3-compliant by construction, exposure capped at one month); non-refundable deposits and NET-30 on B2B only. Full prepay with a discount after ~20–30 completed jobs and a refund reserve. Annual prepay only with an aval. **Never** vouchers with expiry dates — illegal, with a EUR 20,000 fine on precedent.

**Site prerequisites before taking any money:** términos y condiciones de contratación and cancellation policy in ES/EN/CA; art. 97.1 pre-contractual information (omitting point j extends the withdrawal window by 12 months); the pay button labelled **"Pedido con obligación de pago"** (art. 98.2 — otherwise the contract does not bind the consumer); a **separate, unticked** checkbox requesting an early start (art. 98.8, enabling pro-rata billing under art. 108.3); a visible **"Desistir del contrato"** flow (Directive (EU) 2023/2673 art. 11 bis, applicable since 19 Jun 2026); and 15-day pre-renewal notice for plans (art. 97.1.p).
