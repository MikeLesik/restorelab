// ── restoreLab Analytics — Event Taxonomy ───────────────────────────────────
// Single source of truth for all conversion events.
// Events push to GTM dataLayer, Microsoft Clarity, and Meta Pixel.
// All events respect CookieConsent — never fire without analytics consent.

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
  | { event: 'commercial_glass_inquiry'; source: string };

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

  // Check CookieConsent state — only push if analytics category accepted
  const cc = (window as any).CookieConsent;
  if (cc && typeof cc.acceptedCategory === 'function' && !cc.acceptedCategory('analytics')) {
    return;
  }

  // 1. GTM dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(payload);

  // 2. Microsoft Clarity custom event
  if (typeof (window as any).clarity === 'function') {
    (window as any).clarity('event', payload.event);
  }

  // 3. Meta Pixel — map to standard events where applicable
  if (typeof (window as any).fbq === 'function') {
    const fbq = (window as any).fbq;
    switch (payload.event) {
      case 'wa_click':
      case 'phone_click':
        // A tap-to-chat / tap-to-call is the primary lead action here, so it
        // fires Lead (not Contact). The runtime pipeline (__rl_push in
        // BaseLayout) also attaches an eventID for CAPI de-duplication.
        fbq('track', 'Lead', { content_category: 'contact', currency: 'EUR' });
        break;
      case 'estimate_submit':
      case 'lead_submitted':
        fbq('track', 'Lead');
        break;
      case 'estimator_completed':
        fbq('track', 'ViewContent', {
          content_name: (payload as any).tier,
          value: parseFloat(((payload as any).priceBand || '').replace(/[^0-9.]/g, '')) || 0,
          currency: 'EUR',
        });
        break;
      case 'pricing_tier_clicked':
        fbq('track', 'ViewContent', { content_name: (payload as any).tier });
        break;
      case 'b2b_inquiry':
      case 'ev_inquiry':
      case 'commercial_glass_inquiry':
        fbq('track', 'Lead');
        break;
      default:
        // Custom event — track as trackCustom
        fbq('trackCustom', payload.event, payload);
        break;
    }
  }
}
