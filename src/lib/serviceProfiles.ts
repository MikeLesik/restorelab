// Per-service metadata. Used by:
// - llms.txt generator (descriptions, pricing for AI agents)
// - future programmatic area×service pages (Plan 2)
// - HubSpokeList, ServiceCTA components (display labels, fallback descriptions)

export interface ServiceProfile {
  /** Service ID — matches clusterMap key */
  id: string;
  /** Active means hub page exists and we link to it */
  active: boolean;
  /** Short English label for fallbacks (each lang's display text lives in content JSON) */
  englishLabel: string;
  /** Starting price in EUR — used in llms.txt; matches pricing page */
  startingPriceEur: number | null;
  /** Brief English description (one sentence) for llms.txt fallback */
  englishBrief: string;
}

export const serviceProfiles: Record<string, ServiceProfile> = {
  'car-paint-correction': {
    id: 'car-paint-correction',
    active: true,
    englishLabel: 'Car Paint Correction',
    startingPriceEur: 149,
    englishBrief: 'Multi-stage machine polishing for swirl marks, scratches, and oxidation removal.',
  },
  'glass-polishing': {
    id: 'glass-polishing',
    active: true,
    englishLabel: 'Glass Polishing',
    startingPriceEur: 89,
    englishBrief: 'Windshield scratch removal, water stain removal, and clarity restoration.',
  },
  'acrylic-restoration': {
    id: 'acrylic-restoration',
    active: true,
    englishLabel: 'Acrylic Restoration',
    startingPriceEur: 99,
    englishBrief: 'UV-damaged plexiglass restoration for motorcycle visors, boat windows, and acrylic surfaces.',
  },
  'headlight-restoration': {
    id: 'headlight-restoration',
    active: true,
    englishLabel: 'Headlight Restoration',
    startingPriceEur: 79,
    englishBrief: 'UV-yellowed lens restoration with sealant for clarity and durability.',
  },
  'interior-leather': {
    id: 'interior-leather',
    active: true,
    englishLabel: 'Interior Leather Restoration',
    startingPriceEur: 199,
    englishBrief: 'Leather seat conditioning, color repair, and sun damage restoration.',
  },
  'pre-sale-pack': {
    id: 'pre-sale-pack',
    active: true,
    englishLabel: 'Pre-Sale Detailing Pack',
    startingPriceEur: 249,
    englishBrief: 'Comprehensive detailing to maximize used-car listing photos and sale price.',
  },
  // Hidden services — present for cluster registry but not surfaced in llms.txt
  'trim-restoration': {
    id: 'trim-restoration',
    active: false,
    englishLabel: 'Plastic Trim Restoration',
    startingPriceEur: null,
    englishBrief: 'Faded plastic trim restoration for window surrounds, bumpers, and door cladding.',
  },
};

export function getActiveServices(): ServiceProfile[] {
  return Object.values(serviceProfiles).filter((s) => s.active);
}
