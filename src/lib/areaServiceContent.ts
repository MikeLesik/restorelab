// Content generator for programmatic area×service pages.
// Composes 4 unique slots per (area, service, lang) triple:
//   Slot 1 — Local hook (intro paragraph using area + service facts)
//   Slot 3 — 3 templated FAQs with area+service substitutions
//   Slot 4 — Pricing snippet with travel fee
//   Slot 5 — Trust signals (case count + generic backup)
//
// Slot 2 (per-area case study references) is intentionally not implemented in v1 canary —
// no case database yet. Re-evaluated in Plan 2.5.

import { areaProfiles, type AreaProfile } from './areaProfiles';
import { serviceProfiles, type ServiceProfile } from './serviceProfiles';

export type Lang = 'en' | 'es' | 'ca';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AreaServiceSlots {
  title: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  introLabel: string;
  introBody: string;          // Slot 1
  pricingLabel: string;
  pricingStartingFrom: string;
  pricingTravelLine: string;  // Slot 4
  trustLabel: string;
  trustCaseLine: string;      // Slot 5
  trustGeneric: string;
  faqLabel: string;
  faqs: FaqItem[];            // Slot 3
  ctaTitle: string;
  ctaSubtitle: string;
  ctaWhatsappText: string;
  backToAreaLabel: string;
  backToServiceLabel: string;
}

/** Substitute {placeholders} in a template string with values from the map. Missing keys leave placeholder intact. */
function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}

/** Get the localized service name for the given lang from cluster_ui.hubs (matches Plan 1 i18n). */
function getServiceName(serviceId: string, t: any): string {
  // Map service ID (hyphenated) to cluster_ui hub key (underscored).
  const hubKey = serviceId.replace(/-/g, '_');
  return t.cluster_ui?.hubs?.[hubKey] || serviceProfiles[serviceId]?.englishLabel || serviceId;
}

/** Slot 1 — Local hook intro paragraph (80–120 words). Template-driven, area-conditional. */
function generateIntroBody(area: AreaProfile, service: ServiceProfile, t: any, lang: Lang): string {
  const asp = t.area_service_pages;
  const serviceName = getServiceName(service.id, t);

  // Pick a sentence per fact bucket. Each language has its own conditional sentences.
  // Total word count target: 80–120 words per intro.
  const sentences: string[] = [];

  // Sentence 1: Service contextualization for the area
  if (lang === 'es') {
    sentences.push(`En ${area.name}, los propietarios de ${area.commonCarBrands.slice(0, 3).join(', ')} solicitan habitualmente ${serviceName.toLowerCase()} para mantener el acabado del vehículo.`);
  } else if (lang === 'ca') {
    sentences.push(`A ${area.name}, els propietaris de ${area.commonCarBrands.slice(0, 3).join(', ')} sol·liciten habitualment ${serviceName.toLowerCase()} per mantenir l'acabat del vehicle.`);
  } else {
    sentences.push(`In ${area.name}, owners of ${area.commonCarBrands.slice(0, 3).join(', ')} regularly request ${serviceName.toLowerCase()} to maintain their vehicle's finish.`);
  }

  // Sentence 2: Climate-driven framing
  if (lang === 'es') {
    sentences.push(`El microclima local — ${area.climateMicro} — afecta directamente el desgaste de la pintura y los faros.`);
  } else if (lang === 'ca') {
    sentences.push(`El microclima local — ${area.climateMicro} — afecta directament el desgast de la pintura i els fars.`);
  } else {
    sentences.push(`The local microclimate — ${area.climateMicro} — directly affects paint and headlight wear.`);
  }

  // Sentence 3: Mobile / parking context
  if (lang === 'es') {
    sentences.push(`Nuestro servicio móvil llega hasta ${area.parkingContext} en ${area.name}, sin necesidad de desplazar tu coche a un taller.`);
  } else if (lang === 'ca') {
    sentences.push(`El nostre servei mòbil arriba fins a ${area.parkingContext} a ${area.name}, sense necessitat de desplaçar el cotxe a un taller.`);
  } else {
    sentences.push(`Our mobile service comes to ${area.parkingContext} in ${area.name} — no need to drop your car at a workshop.`);
  }

  // Sentence 4: Pricing anchor
  const priceText = service.startingPriceEur ? `€${service.startingPriceEur}` : '';
  if (priceText) {
    if (lang === 'es') {
      sentences.push(`${serviceName} desde ${priceText}, con presupuesto previo gratuito.`);
    } else if (lang === 'ca') {
      sentences.push(`${serviceName} des de ${priceText}, amb pressupost previ gratuït.`);
    } else {
      sentences.push(`${serviceName} from ${priceText}, with free upfront quote.`);
    }
  }

  return sentences.join(' ');
}

/** Slot 3 — 3 FAQs filled from templates with area+service substitution. */
function generateFaqs(area: AreaProfile, service: ServiceProfile, t: any): FaqItem[] {
  const asp = t.area_service_pages;
  const serviceName = getServiceName(service.id, t);
  const durationHours = asp.duration_hours_by_service?.[service.id] || '2 to 6';

  // Parking note for FAQ 1 — derived from area.parkingContext
  let parkingNote = '';
  if (area.parkingContext.toLowerCase().includes('underground') || area.parkingContext.toLowerCase().includes('garage')) {
    parkingNote = (
      t.lang === 'es' ? 'Trabajamos sin problema en garajes con techos bajos.' :
      t.lang === 'ca' ? 'Treballem sense problemes en garatges amb sostres baixos.' :
      'We work fine in low-ceiling garages.'
    );
  } else {
    parkingNote = (
      t.lang === 'es' ? 'Si trabajamos al aire libre, llevamos cobertores para proteger del polvo.' :
      t.lang === 'ca' ? 'Si treballem a l\'aire lliure, portem cobertes per protegir de la pols.' :
      'If we work outdoors, we bring covers to protect from dust.'
    );
  }

  // Travel fee clause for FAQ 2
  let feeClause = '';
  if (area.travelFee === 0) {
    feeClause = (
      t.lang === 'es' ? `El desplazamiento a ${area.name} está incluido en el precio del servicio.` :
      t.lang === 'ca' ? `El desplaçament a ${area.name} està inclòs en el preu del servei.` :
      `Travel to ${area.name} is included in the service price.`
    );
  } else {
    feeClause = (
      t.lang === 'es' ? `El suplemento de desplazamiento a ${area.name} es de €${area.travelFee}.` :
      t.lang === 'ca' ? `El suplement de desplaçament a ${area.name} és de €${area.travelFee}.` :
      `Travel fee to ${area.name} is €${area.travelFee}.`
    );
  }

  // Parking context clause for FAQ 3
  const parkingContextClause = (
    t.lang === 'es' ? `Trabajamos en ${area.parkingContext} habitualmente.` :
    t.lang === 'ca' ? `Treballem a ${area.parkingContext} habitualment.` :
    `We routinely work in ${area.parkingContext}.`
  );

  return (asp.faq_templates || []).map((tpl: any) => ({
    question: substitute(tpl.question, { area: area.name, service: serviceName }),
    answer: substitute(tpl.answer_template, {
      area: area.name,
      service: serviceName,
      duration_hours: durationHours,
      parking_note: parkingNote,
      fee_clause: feeClause,
      parking_context_clause: parkingContextClause,
    }),
  }));
}

/** Slot 4 — Pricing snippet with localized travel fee line. */
function generatePricingTravelLine(area: AreaProfile, t: any): string {
  const asp = t.area_service_pages;
  if (area.travelFee === 0) {
    return substitute(asp.pricing_travel_fee_included, { area: area.name });
  }
  return substitute(asp.pricing_travel_fee_charged, { area: area.name, fee: String(area.travelFee) });
}

/** Slot 5 — Trust signal: case count line. Falls back to generic if caseCount is "0". */
function generateTrustCaseLine(area: AreaProfile, t: any): string {
  const asp = t.area_service_pages;
  if (!area.caseCount || area.caseCount === '0') {
    return asp.trust_generic;
  }
  return substitute(asp.trust_case_count_template, { count: area.caseCount, area: area.name });
}

/** Compose all slots into one object. Used by the Astro template. */
export function generateAreaServiceContent(
  citySlug: string,
  serviceId: string,
  t: any,
  lang: Lang
): AreaServiceSlots | null {
  const area = areaProfiles[citySlug];
  const service = serviceProfiles[serviceId];
  if (!area || !service || !service.active) return null;

  // Inject lang into t for branch logic in generators (without mutating original t).
  const tWithLang = { ...t, lang };
  const asp = t.area_service_pages;
  const serviceName = getServiceName(service.id, t);
  const priceStr = service.startingPriceEur ? String(service.startingPriceEur) : '';

  const slots: AreaServiceSlots = {
    title: substitute(asp.title_template, { area: area.name, service: serviceName }),
    metaDescription: substitute(asp.meta_description_template, { area: area.name, service: serviceName, price: priceStr }),
    h1: substitute(asp.h1_template, { area: area.name, service: serviceName }),
    subtitle: substitute(asp.subtitle_template, { area: area.name, service: serviceName.toLowerCase() }),
    introLabel: asp.intro_label,
    introBody: generateIntroBody(area, service, t, lang),
    pricingLabel: asp.pricing_label,
    pricingStartingFrom: substitute(asp.pricing_starting_from, { price: priceStr }),
    pricingTravelLine: generatePricingTravelLine(area, t),
    trustLabel: substitute(asp.trust_label, { area: area.name }),
    trustCaseLine: generateTrustCaseLine(area, t),
    trustGeneric: asp.trust_generic,
    faqLabel: asp.faq_label,
    faqs: generateFaqs(area, service, tWithLang),
    ctaTitle: substitute(asp.cta_title, { area: area.name, service: serviceName }),
    ctaSubtitle: asp.cta_subtitle,
    ctaWhatsappText: substitute(asp.cta_whatsapp_template, { area: area.name, service: serviceName }),
    backToAreaLabel: substitute(asp.back_to_area, { area: area.shortName }),
    backToServiceLabel: substitute(asp.back_to_service, { service: serviceName.toLowerCase() }),
  };

  // Per-pair hand-written overrides (asp.overrides["city/service"]) beat the templates —
  // used to sharpen high-opportunity pages without forking the generator.
  const ov = asp.overrides?.[`${citySlug}/${serviceId}`];
  if (ov) {
    if (ov.title) slots.title = ov.title;
    if (ov.meta_description) slots.metaDescription = ov.meta_description;
    if (ov.h1) slots.h1 = ov.h1;
    if (ov.subtitle) slots.subtitle = ov.subtitle;
    if (ov.intro_body) slots.introBody = ov.intro_body;
    if (ov.extra_faqs?.length) slots.faqs = [...ov.extra_faqs, ...slots.faqs];
  }

  return slots;
}

/** The 12 canary pairs — frozen at the start of Plan 2 canary. */
export const CANARY_PAIRS: Array<{ city: string; service: string }> = [
  { city: 'sant-cugat', service: 'car-paint-correction' },
  { city: 'sant-cugat', service: 'glass-polishing' },
  { city: 'sant-cugat', service: 'headlight-restoration' },
  { city: 'barcelona', service: 'car-paint-correction' },
  { city: 'barcelona', service: 'glass-polishing' },
  { city: 'barcelona', service: 'headlight-restoration' },
  { city: 'terrassa', service: 'car-paint-correction' },
  { city: 'terrassa', service: 'glass-polishing' },
  { city: 'terrassa', service: 'headlight-restoration' },
  { city: 'pedralbes', service: 'car-paint-correction' },
  { city: 'pedralbes', service: 'glass-polishing' },
  { city: 'pedralbes', service: 'headlight-restoration' },
];
