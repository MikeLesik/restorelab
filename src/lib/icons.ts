/**
 * Icon set — single source for the inline SVG glyphs used across the site.
 *
 * Every glyph is authored on a 24×24 grid for `stroke-width: 1.5`, round caps
 * and joins, `fill: none`. They carry NO colour: the consuming component sets
 * `stroke="currentColor"`, so an icon inherits the theme and, in ServicesGrid,
 * the per-service accent. That is why these stay inline SVG rather than raster
 * assets — a bitmap could not follow either.
 *
 * Depth comes from `stroke-opacity` on secondary strokes, never from a second
 * colour, so the two-tone reading survives any colour the caller applies.
 *
 * The set replaces stock outline icons (a generic car, a lightbulb, a camera).
 * Each glyph now names the actual craft — a rotary polisher lifting swirl marks,
 * a windscreen carrying wiper scratches, a hazed acrylic dome half-restored —
 * because at this size specificity is what reads as considered rather than the
 * stroke style.
 *
 * Keep to ≤6 strokes per glyph: they render as small as 18px inside a card.
 */

/** Rotary polisher over swirl marks — paint correction. */
export const iconPaintCorrection = `
  <circle cx="11" cy="13" r="5.2"/>
  <circle cx="11" cy="13" r="1.7"/>
  <path d="M15 9.2 18.6 5.6"/>
  <path d="M17.4 4.4 20.6 7.6"/>
  <path d="M4.6 6.1c1.5.9 2.7 2.1 3.5 3.5" stroke-opacity=".4"/>
  <path d="M8.2 3.9c1.1.7 2 1.6 2.7 2.7" stroke-opacity=".4"/>`;

/** Windscreen with wiper scratches — glass polishing. */
export const iconGlassPolishing = `
  <path d="M3.6 17.4 6 8.2a2.2 2.2 0 0 1 2.1-1.7h7.8a2.2 2.2 0 0 1 2.1 1.7l2.4 9.2"/>
  <path d="M3.6 17.4h16.8"/>
  <path d="M9.4 14.6 12.8 9.5" stroke-opacity=".45"/>
  <path d="M12.6 14.6 14.9 11.2" stroke-opacity=".45"/>`;

/** Domed panel, hazed on one half and clear on the other — acrylic restoration. */
export const iconAcrylic = `
  <path d="M3.8 19.2v-7.6a8.2 8.2 0 0 1 16.4 0v7.6Z"/>
  <path d="M12 3.5v15.7" stroke-opacity=".5"/>
  <path d="M6.1 16.2 9.4 12.9M6.4 11.6 9.1 8.9" stroke-opacity=".38"/>
  <path d="M15.3 9.4a4.3 4.3 0 0 1 2.7 2.7"/>`;

/** Housing, lens and beam — headlight restoration. */
export const iconHeadlight = `
  <path d="M4 5.6h5.6a6.4 6.4 0 0 1 0 12.8H4A1.5 1.5 0 0 1 2.5 16.9V7.1A1.5 1.5 0 0 1 4 5.6Z"/>
  <circle cx="7.9" cy="12" r="2.3"/>
  <path d="M17.4 8.2h3.4M17.4 12h4.1M17.4 15.8h3.4" stroke-opacity=".45"/>`;

/** Swept moulding strip — trim restoration. */
export const iconTrim = `
  <path d="M2.6 15.4 8.5 9.5a3 3 0 0 1 2.1-.9h10.8"/>
  <path d="M2.6 19 8.5 13.1a3 3 0 0 1 2.1-.9h10.8" stroke-opacity=".45"/>
  <path d="M13.4 5.4h3.4M17.8 5.4h3.2" stroke-opacity=".4"/>`;

/** Tag carrying a tick — pre-sale pack. */
export const iconPreSale = `
  <path d="M12.4 2.9 20.8 11.3a1.7 1.7 0 0 1 0 2.4l-7.1 7.1a1.7 1.7 0 0 1-2.4 0L2.9 12.4a1.7 1.7 0 0 1-.5-1.2V4.6a1.7 1.7 0 0 1 1.7-1.7h7c.45 0 .89.18 1.2.5Z"/>
  <circle cx="7.2" cy="7.2" r="1.4"/>
  <path d="M10.6 14.2 12.8 16.4 17 12.2" stroke-opacity=".55"/>`;

/** Phone holding a photo — send us two pictures. */
export const iconSendPhotos = `
  <rect x="6.4" y="2.5" width="11.2" height="19" rx="2.6"/>
  <path d="M8.7 16.1l2.3-2.7a.95.95 0 0 1 1.45 0l2.85 3.3"/>
  <circle cx="14.6" cy="9.9" r="1.05"/>
  <path d="M10.6 5.2h2.8" stroke-opacity=".5"/>`;

/** Message bubble carrying a written quote. */
export const iconQuote = `
  <path d="M20.4 11.5c0 4.1-3.8 7.5-8.4 7.5a9.6 9.6 0 0 1-2.6-.35L3.9 20.4l1.5-3.6A7.1 7.1 0 0 1 3.6 11.5C3.6 7.4 7.4 4 12 4s8.4 3.4 8.4 7.5Z"/>
  <path d="M8.6 10.4h6.8M9.8 13.4h4.4" stroke-opacity=".5"/>`;

/** Pin with an approach path — we drive to your garage. */
export const iconWeComeToYou = `
  <path d="M12 21.4s6.4-5.9 6.4-10.3a6.4 6.4 0 1 0-12.8 0C5.6 15.5 12 21.4 12 21.4Z"/>
  <circle cx="12" cy="10.9" r="2.4"/>
  <path d="M2.6 20.6h2.8M7.6 20.6h1.4" stroke-opacity=".4"/>`;

/** Shield and tick — the guarantee. */
export const iconGuarantee = `
  <path d="M12 2.7 4.6 5.9v5.3c0 4.5 3.1 8.8 7.4 10 4.3-1.2 7.4-5.5 7.4-10V5.9L12 2.7Z"/>
  <path d="M8.8 11.9 11.2 14.3 15.4 10"/>`;

/* ── FAQ glyphs ─────────────────────────────────────────────────────────────
   One per answer, keyed by `faq.items[].icon`. Same grid and weights as above. */

/** Express turnaround. */
export const iconBolt = `
  <path d="M13.3 2.9 5.6 13.3h5l-.9 7.8 7.9-10.6h-5.1l.8-7.6Z"/>`;

/** Water beading on a coated surface. */
export const iconRain = `
  <path d="M12 3.4c3.1 3.7 5.2 6.6 5.2 9a5.2 5.2 0 0 1-10.4 0c0-2.4 2.1-5.3 5.2-9Z"/>
  <path d="M9.7 12.9a2.4 2.4 0 0 0 1.5 2.3" stroke-opacity=".5"/>
  <path d="M19.6 6.4a1.3 1.3 0 1 0 .02 0M4.6 8.4a1 1 0 1 0 .02 0" stroke-opacity=".4"/>`;

/** The technician. */
export const iconUser = `
  <circle cx="12" cy="8.2" r="3.6"/>
  <path d="M4.9 20.3a7.1 7.1 0 0 1 14.2 0"/>`;

/** Published price. */
export const iconMoney = `
  <rect x="2.8" y="6.6" width="18.4" height="10.8" rx="2"/>
  <circle cx="12" cy="12" r="2.6"/>
  <path d="M6.3 12h.4M17.3 12h.4" stroke-opacity=".5"/>`;

/** Inspection under magnification. */
export const iconInspect = `
  <circle cx="10.6" cy="10.6" r="6.1"/>
  <path d="M15.1 15.1 20.7 20.7"/>
  <path d="M8.5 8.7a3 3 0 0 1 2.1-.9" stroke-opacity=".5"/>`;

/** Correct rather than repaint. */
export const iconSwap = `
  <path d="M4 8.6h13.4l-3.5-3.5"/>
  <path d="M20 15.4H6.6l3.5 3.5" stroke-opacity=".55"/>`;

/** How long it takes. */
export const iconClock = `
  <circle cx="12" cy="12" r="8.6"/>
  <path d="M12 7.1V12l3.3 2.1"/>`;

/** The vehicle itself. */
export const iconCar = `
  <path d="M3.2 15.4v-2.2a2 2 0 0 1 .5-1.3l2.4-2.8A3 3 0 0 1 8.4 8h7.2a3 3 0 0 1 2.3 1.1l2.4 2.8a2 2 0 0 1 .5 1.3v2.2"/>
  <path d="M3.2 15.4h17.6" stroke-opacity=".45"/>
  <circle cx="7.5" cy="17.1" r="1.6"/>
  <circle cx="16.5" cy="17.1" r="1.6"/>`;

/** Keyed by `faq.items[].icon`. */
export const faqIcons: Record<string, string> = {
  bolt: iconBolt,
  rain: iconRain,
  user: iconUser,
  shield: iconGuarantee,
  money: iconMoney,
  glass: iconInspect,
  swap: iconSwap,
  map: iconWeComeToYou,
  clock: iconClock,
  car: iconCar,
};

/** Keyed by the service ids in `services.items`. */
export const serviceIcons: Record<string, string> = {
  'car-paint-correction': iconPaintCorrection,
  'glass-polishing': iconGlassPolishing,
  'acrylic-restoration': iconAcrylic,
  'headlight-restoration': iconHeadlight,
  'trim-restoration': iconTrim,
  'pre-sale-pack': iconPreSale,
};

/** The four "how it works" steps, in order. */
export const stepIcons: string[] = [
  iconSendPhotos,
  iconQuote,
  iconWeComeToYou,
  iconGuarantee,
];
