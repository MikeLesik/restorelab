// ── restoreLab Attribution — first-touch model + WhatsApp ref-codes ──────────
// Conversion happens in WhatsApp, so the click's origin (campaign / keyword /
// gclid) would be lost the moment the visitor leaves the site. Every visitor
// gets a short first-party ref code (`RL-XXXX`) that is appended to every
// wa.me prefill; the code maps back to the stored attribution via the
// /api/ref endpoint (see functions/api/ref.ts).
//
// The runtime lives ONLY in the BaseLayout.astro tracking block, alongside
// __rl_push (same single-pipeline philosophy as analytics.ts) — this module
// must never re-implement it. It exists so typed callers in Astro frontmatter
// have a stable import and the storage schema has one documented home.
//
// Storage: localStorage['rl_attr'] =
//   { first: RlTouch, last?: RlTouch, ref: string }
// - `first` is written once (first touch wins), `last` updates on any visit
//   carrying a tracked param.
// - `ref` = 'RL-' + 4 chars from [A-HJ-NP-Z2-9] (no ambiguous chars),
//   generated once per visitor. It is a first-party functional identifier
//   (no third-party id inside), so it may be created pre-consent.
// - gclid / fbclid / msclkid are persisted ONLY after marketing consent
//   (mirroring how the pipeline gates Pixel/CAPI); UTM params are kept always.

/** One touch (page load carrying attribution params). */
export interface RlTouch {
  /** Landing pathname of the touch. */
  landing: string;
  /** ISO timestamp of the touch. */
  ts: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  /** Ad click ids — persisted only with marketing consent. */
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}

export interface RlAttribution {
  first?: RlTouch;
  last?: RlTouch;
  /** Short visitor ref code, e.g. 'RL-K7F3'. */
  ref?: string;
}

export const RL_ATTR_KEY = 'rl_attr';

/** Matches a well-formed ref code (also enforced server-side in /api/ref). */
export const RL_REF_PATTERN = /^RL-[A-HJ-NP-Z2-9]{4}$/;

/**
 * Read the stored attribution (client-side only). Returns {} before the
 * BaseLayout runtime has initialised or when storage is unavailable.
 */
export function getAttribution(): RlAttribution {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(RL_ATTR_KEY) || '{}') as RlAttribution;
  } catch {
    return {};
  }
}
