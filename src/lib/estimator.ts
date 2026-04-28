// ── restoreLab Instant Estimator — Logic ──────────────────────────────────────
// Pure pricing logic. NO DOM, NO Astro — importable by any bundler.

export type VehicleSize = 'small' | 'medium' | 'large';
export type PaintCondition = 'light' | 'medium' | 'heavy';
export type ColorSensitivity = 'standard' | 'metallic' | 'black' | 'white';
export type ServiceGoal =
  | 'restore_gloss'
  | 'add_ceramic'
  | 'pre_sale'
  | 'long_term_protection'
  | 'glass_clarity';

export interface EstimatorInput {
  vehicleSize: VehicleSize;
  paintCondition: PaintCondition;
  colorSensitivity: ColorSensitivity;
  goals: ServiceGoal[];
}

export interface RecommendedTier {
  id: string;
  name: string;
  priceMin: number;
  priceMax: number;
  description: string;
  isRecommended: boolean;
  eta: string;
}

export interface EstimatorResult {
  tiers: RecommendedTier[];
  recommendedTierId: string;
  addOns: AddOn[];
  notes: string[];
}

export interface AddOn {
  id: string;
  name: string;
  price: string;
}

// ── Size multipliers (aligned with pricing.ui.size_categories in JSON) ────────
const SIZE_MULTIPLIER: Record<VehicleSize, number> = {
  small: 1.0,
  medium: 1.2,
  large: 1.5,
};

// ── Color sensitivity surcharge ───────────────────────────────────────────────
const COLOR_SURCHARGE: Record<ColorSensitivity, number> = {
  standard: 0,
  metallic: 0,
  black: 50,
  white: 0,
};

// ── Base tier definitions (small car prices) ──────────────────────────────────
const TIERS = [
  {
    id: 'express',
    name: 'Express Refresh',
    basePrice: 149,
    eta: '2–3h',
    forConditions: ['light'] as PaintCondition[],
    forGoals: ['restore_gloss', 'pre_sale'] as ServiceGoal[],
    description: 'Single-stage machine polish. Removes light swirls and water spots.',
  },
  {
    id: 'single_stage',
    name: 'Single-Stage Correction',
    basePrice: 289,
    eta: '4–5h',
    forConditions: ['light', 'medium'] as PaintCondition[],
    forGoals: ['restore_gloss', 'pre_sale'] as ServiceGoal[],
    description: 'One-step correction with medium-cut compound. Removes ~70% of defects.',
  },
  {
    id: 'two_stage',
    name: 'Two-Stage Correction',
    basePrice: 549,
    eta: '6–8h',
    forConditions: ['medium', 'heavy'] as PaintCondition[],
    forGoals: ['restore_gloss'] as ServiceGoal[],
    description: 'Full cut + refine. Removes 85–95% of defects including deep swirls.',
  },
  {
    id: 'ceramic_2y',
    name: 'Ceramic Coating 2 Years',
    basePrice: 649,
    eta: '1 day',
    forConditions: ['light', 'medium'] as PaintCondition[],
    forGoals: ['add_ceramic', 'long_term_protection'] as ServiceGoal[],
    description: 'Single-stage correction + Gyeon MOHS 2-year ceramic coating.',
  },
  {
    id: 'ceramic_5y',
    name: 'Ceramic Premium 5 Years',
    basePrice: 1049,
    eta: '1–2 days',
    forConditions: ['medium', 'heavy'] as PaintCondition[],
    forGoals: ['add_ceramic', 'long_term_protection'] as ServiceGoal[],
    description: 'Two-stage correction + Gtechniq Crystal Serum Ultra 5-year ceramic.',
  },
  {
    id: 'flagship',
    name: 'Flagship PPF + Ceramic',
    basePrice: 2290,
    eta: '2–3 days',
    forConditions: ['light', 'medium', 'heavy'] as PaintCondition[],
    forGoals: ['add_ceramic', 'long_term_protection'] as ServiceGoal[],
    description: 'Full correction + XPEL PPF on high-impact zones + ceramic topcoat.',
  },
];

// ── Add-on definitions ────────────────────────────────────────────────────────
const ADD_ONS: AddOn[] = [
  { id: 'headlight', name: 'Headlight Restoration', price: 'from €79/pair' },
  { id: 'wheel_ceramic', name: 'Wheel Ceramic Coating', price: 'from €189' },
  { id: 'engine_bay', name: 'Engine Bay Detailing', price: 'from €119' },
  { id: 'windshield', name: 'Windshield Polish + Hydrophobic', price: 'from €179' },
];

// ── Tier recommendation logic ─────────────────────────────────────────────────
function scoreTier(
  tier: typeof TIERS[0],
  input: EstimatorInput
): number {
  let score = 0;

  // Condition match
  if (tier.forConditions.includes(input.paintCondition)) {
    score += 3;
  }

  // Goal match
  const goalMatches = input.goals.filter(g => tier.forGoals.includes(g)).length;
  score += goalMatches * 2;

  // Ceramic bonus if ceramic goal selected
  if (input.goals.includes('add_ceramic') && tier.id.startsWith('ceramic')) {
    score += 3;
  }
  if (input.goals.includes('long_term_protection') && tier.id === 'flagship') {
    score += 2;
  }

  // Pre-sale optimization: recommend cost-effective option
  if (input.goals.includes('pre_sale') && (tier.id === 'express' || tier.id === 'single_stage')) {
    score += 2;
  }

  // Heavy condition penalty for light tiers
  if (input.paintCondition === 'heavy' && tier.id === 'express') {
    score -= 5;
  }

  return score;
}

function calculatePrice(basePrice: number, input: EstimatorInput): { min: number; max: number } {
  const sizeMultiplied = basePrice * SIZE_MULTIPLIER[input.vehicleSize];
  const withColor = sizeMultiplied + COLOR_SURCHARGE[input.colorSensitivity];

  const min = Math.round(withColor * 0.95 / 10) * 10;
  const max = Math.round(withColor * 1.10 / 10) * 10;

  return { min, max };
}

// ── Main estimate function ────────────────────────────────────────────────────
export function estimate(input: EstimatorInput): EstimatorResult {
  // Score all tiers
  const scored = TIERS.map(tier => ({
    tier,
    score: scoreTier(tier, input),
    price: calculatePrice(tier.basePrice, input),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const recommendedId = scored[0].tier.id;

  // Build result tiers (show top 3 relevant + always include the recommended)
  const topTiers = scored
    .filter(s => s.score > 0)
    .slice(0, 3);

  const tiers: RecommendedTier[] = topTiers.map(s => ({
    id: s.tier.id,
    name: s.tier.name,
    priceMin: s.price.min,
    priceMax: s.price.max,
    description: s.tier.description,
    isRecommended: s.tier.id === recommendedId,
    eta: s.tier.eta,
  }));

  // Notes
  const notes: string[] = [];
  if (input.colorSensitivity === 'black') {
    notes.push('Black paint shows every imperfection. We recommend a two-stage correction minimum for best results.');
  }
  if (input.paintCondition === 'heavy') {
    notes.push('Heavy defects may require paint depth measurement before confirming the approach. We offer free on-site assessment.');
  }
  if (input.vehicleSize === 'large') {
    notes.push('Large vehicles (SUV/van) require additional time. ETAs shown are approximate.');
  }

  // Suggest add-ons based on goals
  const addOns: AddOn[] = [];
  if (input.goals.includes('pre_sale')) {
    addOns.push(ADD_ONS.find(a => a.id === 'headlight')!);
  }
  if (input.goals.includes('long_term_protection')) {
    addOns.push(ADD_ONS.find(a => a.id === 'wheel_ceramic')!);
  }
  if (input.goals.includes('glass_clarity')) {
    addOns.push(ADD_ONS.find(a => a.id === 'windshield')!);
  }

  return { tiers, recommendedTierId: recommendedId, addOns, notes };
}
