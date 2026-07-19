// Per-area datasheet. Used by:
// - Area pages dense service links (Plan 1)
// - Programmatic area×service pages (Plan 2 — not yet)
// - llms.txt service-areas section
//
// Fields marked `// VERIFY` need owner confirmation before Plan 2 goes live.
// Population figures: INE/Idescat 2023 estimates.
// Climate / parking / car brand patterns: reasoned from neighborhood character.

export interface AreaProfile {
  /** Slug matches the area pages route param */
  slug: string;
  /** Display name (matches content JSON) */
  name: string;
  /** Short label for nav and chips */
  shortName: string;
  /** Population (INE 2023 est.) */
  population: number;
  /** Income tier — affects messaging tone */
  avgIncome: 'high' | 'upper-mid' | 'mid';
  /** EV density — high in tech/affluent districts (Sant Cugat, Pedralbes) */
  evDensity: 'high' | 'medium' | 'low';
  /** Common car brands seen in detailing requests from this area */
  commonCarBrands: string[];
  /** Parking context — informs service logistics in copy */
  parkingContext: string;
  /** Climate micro-zone — coastal, inland, etc. — informs damage type framing */
  climateMicro: string;
  /** Travel fee in EUR (0 = included) */
  travelFee: number;
  /** Approximate case count format ("8+", "20+") — round down from real */
  caseCount: string;
  /** 1–3 landmarks for local color in programmatic pages */
  landmarks: string[];
  /** Whether the area is "primary tier" (top 3) or "secondary" (rest) — affects programmatic scope */
  tier: 'primary' | 'secondary';
}

export const areaProfiles: Record<string, AreaProfile> = {
  'sant-cugat': {
    slug: 'sant-cugat',
    name: 'Sant Cugat del Vallès',
    shortName: 'Sant Cugat',
    population: 91000, // VERIFY
    avgIncome: 'high',
    evDensity: 'high',
    commonCarBrands: ['BMW', 'Audi', 'Mercedes', 'Tesla', 'Volvo'], // VERIFY
    parkingContext: 'mostly underground / private garages',
    climateMicro: 'inland Vallès — hotter summers, more sun damage',
    travelFee: 0,
    caseCount: '20+', // VERIFY
    landmarks: ['Centre Comercial Sant Cugat', 'CAR Sant Cugat', 'Monestir de Sant Cugat'],
    tier: 'primary',
  },
  'barcelona': {
    slug: 'barcelona',
    name: 'Barcelona',
    shortName: 'Barcelona',
    population: 1660000, // VERIFY
    avgIncome: 'mid',
    evDensity: 'medium',
    commonCarBrands: ['SEAT', 'Volkswagen', 'BMW', 'Audi', 'Tesla', 'Renault'], // VERIFY
    parkingContext: 'mixed — street, communal garages, paid lots',
    climateMicro: 'coastal Mediterranean — UV strong, occasional salt air in port-adjacent zones',
    travelFee: 0,
    caseCount: '50+', // VERIFY
    landmarks: ['Sagrada Família', 'Parc de la Ciutadella', 'Diagonal'],
    tier: 'primary',
  },
  'sant-boi': {
    slug: 'sant-boi',
    name: 'Sant Boi de Llobregat',
    shortName: 'Sant Boi',
    population: 84500, // VERIFY
    avgIncome: 'mid',
    evDensity: 'medium',
    commonCarBrands: ['SEAT', 'Volkswagen', 'Renault', 'Peugeot', 'Toyota'], // VERIFY
    parkingContext: 'mixed — street parking and communal garages',
    climateMicro: 'Llobregat delta — humid, strong coastal sun',
    travelFee: 15, // VERIFY
    caseCount: '0',
    landmarks: ['Ermita de Sant Ramon', 'Museu de Sant Boi'],
    tier: 'secondary',
  },
  'terrassa': {
    slug: 'terrassa',
    name: 'Terrassa',
    shortName: 'Terrassa',
    population: 224000, // VERIFY
    avgIncome: 'upper-mid',
    evDensity: 'medium',
    commonCarBrands: ['SEAT', 'Volkswagen', 'BMW', 'Renault', 'Peugeot'], // VERIFY
    parkingContext: 'mixed — many private garages and surface parking',
    climateMicro: 'inland Vallès — hot summers, mild winters',
    travelFee: 15, // VERIFY
    caseCount: '15+', // VERIFY
    landmarks: ['MNACTEC', 'Catedral del Sant Esperit'],
    tier: 'primary',
  },
  'matadepera': {
    slug: 'matadepera',
    name: 'Matadepera',
    shortName: 'Matadepera',
    population: 9000, // VERIFY
    avgIncome: 'high',
    evDensity: 'medium',
    commonCarBrands: ['BMW', 'Audi', 'Mercedes', 'Range Rover'], // VERIFY
    parkingContext: 'private villas with garages',
    climateMicro: 'foothills of Sant Llorenç — cooler, more pollen and tree sap',
    travelFee: 20, // VERIFY
    caseCount: '5+', // VERIFY
    landmarks: ['Parc Natural de Sant Llorenç del Munt'],
    tier: 'secondary',
  },
  'sant-just-desvern': {
    slug: 'sant-just-desvern',
    name: 'Sant Just Desvern',
    shortName: 'Sant Just',
    population: 18000, // VERIFY
    avgIncome: 'high',
    evDensity: 'medium',
    commonCarBrands: ['BMW', 'Audi', 'Mercedes', 'Tesla'], // VERIFY
    parkingContext: 'mostly private',
    climateMicro: 'foothills — milder than coastal Barcelona',
    travelFee: 15, // VERIFY
    caseCount: '8+', // VERIFY
    landmarks: ['Walden 7'],
    tier: 'secondary',
  },
  'sant-quirze-del-valles': {
    slug: 'sant-quirze-del-valles',
    name: 'Sant Quirze del Vallès',
    shortName: 'Sant Quirze',
    population: 20000, // VERIFY
    avgIncome: 'upper-mid',
    evDensity: 'medium',
    commonCarBrands: ['SEAT', 'BMW', 'Audi', 'Volkswagen'], // VERIFY
    parkingContext: 'mostly private garages',
    climateMicro: 'inland Vallès',
    travelFee: 10, // VERIFY
    caseCount: '8+', // VERIFY
    landmarks: ['Castellet de Sant Quirze'],
    tier: 'secondary',
  },
  'bellaterra': {
    slug: 'bellaterra',
    name: 'Bellaterra',
    shortName: 'Bellaterra',
    population: 2500, // VERIFY
    avgIncome: 'high',
    evDensity: 'high',
    commonCarBrands: ['BMW', 'Audi', 'Mercedes', 'Tesla', 'Volvo'], // VERIFY
    parkingContext: 'private villas with garages or driveways',
    climateMicro: 'inland Vallès — pollen and tree sap concerns',
    travelFee: 10, // VERIFY
    caseCount: '6+', // VERIFY
    landmarks: ['UAB campus', 'Parc Natural de Collserola'],
    tier: 'secondary',
  },
  'pedralbes': {
    slug: 'pedralbes',
    name: 'Pedralbes',
    shortName: 'Pedralbes',
    population: 12000, // VERIFY (district population)
    avgIncome: 'high',
    evDensity: 'high',
    commonCarBrands: ['BMW', 'Mercedes', 'Audi', 'Porsche', 'Tesla', 'Range Rover'], // VERIFY
    parkingContext: 'private garages, gated communities',
    climateMicro: 'upper Barcelona — slightly cooler than central',
    travelFee: 0,
    caseCount: '12+', // VERIFY
    landmarks: ['Monestir de Pedralbes', 'Palau Reial'],
    tier: 'secondary',
  },
  'sant-gervasi': {
    slug: 'sant-gervasi',
    name: 'Sant Gervasi – Tres Torres',
    shortName: 'Sant Gervasi',
    population: 50000, // VERIFY (combined district)
    avgIncome: 'high',
    evDensity: 'high',
    commonCarBrands: ['BMW', 'Mercedes', 'Audi', 'Tesla', 'Mini'], // VERIFY
    parkingContext: 'mixed — mostly underground garages in apartment buildings',
    climateMicro: 'upper Barcelona — UV strong, less salt than waterfront',
    travelFee: 0,
    caseCount: '15+', // VERIFY
    landmarks: ['Tibidabo', 'Parc del Putxet'],
    tier: 'secondary',
  },
  'castelldefels': {
    slug: 'castelldefels',
    name: 'Castelldefels',
    shortName: 'Castelldefels',
    population: 67000, // VERIFY
    avgIncome: 'upper-mid',
    evDensity: 'medium',
    commonCarBrands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'], // VERIFY
    parkingContext: 'mixed — many beachside flats with surface parking',
    climateMicro: 'coastal — salt air, more clear-coat oxidation, common acrylic damage on boats',
    travelFee: 25, // VERIFY
    caseCount: '8+', // VERIFY
    landmarks: ['Castelldefels Beach', 'Castell de Castelldefels'],
    tier: 'secondary',
  },
  'alella-tiana-teia': {
    slug: 'alella-tiana-teia',
    name: 'Alella · Tiana · Teià',
    shortName: 'Alella',
    population: 25000, // VERIFY (combined)
    avgIncome: 'upper-mid',
    commonCarBrands: ['BMW', 'Mercedes', 'Audi', 'Volkswagen'], // VERIFY
    evDensity: 'medium',
    parkingContext: 'private villas, surface parking',
    climateMicro: 'Maresme coastal — salt air, vineyard pollen, sun-heavy',
    travelFee: 30, // VERIFY
    caseCount: '5+', // VERIFY
    landmarks: ['DO Alella vineyards'],
    tier: 'secondary',
  },
};

export function getAreaProfile(slug: string): AreaProfile | undefined {
  return areaProfiles[slug];
}

export function getPrimaryAreas(): AreaProfile[] {
  return Object.values(areaProfiles).filter((a) => a.tier === 'primary');
}
