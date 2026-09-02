// Unit-economics constants (RL-460) — single home, per the Sep-2026 verdict
// doc (internal). Change HERE only; the metrics endpoint and the /admin
// Métricas tab both import these.

/** Stripe EU card fee share of the paid amount (~1.5% plus a fixed 25-cent
 *  component that the estimate ignores; see docs/setup-stripe.md fees note). */
export const STRIPE_FEE_PCT = 0.015;

/** Reserve for rework/consumables/warranty, share of the paid amount. */
export const RESERVE_PCT = 0.04;

/** Default partner payout share when a partner row has no payout_pct. */
export const DEFAULT_PAYOUT_PCT = 70;

// Kill criteria (verdict doc): if the October test crosses these, the paid
// channel (or the partner) is killed, not scaled.
export const KILL_CAC_EUR = 90;            // blended CAC ceiling
export const KILL_REWORK_PCT = 8;          // partner rework share ceiling
export const KILL_QUOTE_TO_BOOKED_PCT = 20; // conversion floor
