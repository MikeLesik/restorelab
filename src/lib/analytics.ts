// ── restoreLab Analytics — Event Taxonomy ───────────────────────────────────
// Single source of truth for all conversion events.
// Events push to GTM dataLayer, Microsoft Clarity, and Meta Pixel.
// Events respect CookieConsent: analytics → GA/Clarity, marketing → Pixel/CAPI.

export type RestoreLabEvent =
  | { event: 'estimator_started'; service?: string }
  | { event: 'estimator_completed'; tier: string; priceBand: string }
  | { event: 'lead_submitted'; channel: 'whatsapp' | 'email' | 'phone' | 'calendar'; service?: string }
  | { event: 'pricing_tier_clicked'; tier: string; locale: string }
  | { event: 'case_viewed'; caseId: string }
  | { event: 'service_viewed'; service: string }
  | { event: 'cta_clicked'; ctaId: string; location: string }
  | { event: 'language_switched'; from: string; to: string }
  | { event: 'wa_click'; click_url: string; click_text: string }
  | { event: 'phone_click'; click_url: string; click_text: string }
  | { event: 'estimate_submit' }
  | { event: 'b2b_inquiry'; source: string }
  | { event: 'ev_inquiry'; package?: string }
  | { event: 'commercial_glass_inquiry'; source: string }
  | { event: 'estimator_result'; source?: string; need?: string; slug?: string | null; price?: string }
  | { event: 'ai_referral'; ai_source: string; ai_referrer_url: string; landing_path: string; page_lang: string };

/**
 * Push an analytics event to all configured platforms.
 * Respects CookieConsent — only fires when analytics consent is granted.
 *
 * Usage (in inline <script>):
 *   window.__rl_push({ event: 'estimator_completed', tier: 'ceramic_2y', priceBand: '€649–710' });
 *
 * Usage (in Astro component frontmatter — for build-time reference only):
 *   import type { RestoreLabEvent } from '@/lib/analytics';
 */
export function pushEvent(payload: RestoreLabEvent): void {
  if (typeof window === 'undefined') return;
  // Delegate to the single runtime pipeline in BaseLayout.astro (__rl_push):
  // the consent split, shared event_id, GA/Clarity/Pixel fan-out and the CAPI
  // mirror all live there. This wrapper exists only so typed callers in Astro
  // frontmatter have a stable import — it must never re-implement that logic.
  const push = (window as any).__rl_push;
  if (typeof push === 'function') push(payload);
}
