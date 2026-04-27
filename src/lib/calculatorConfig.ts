// ── restoreLab Price Calculator — Config & Logic ──────────────────────────────
// All pricing tables, coefficients and pure calculation functions.
// NO DOM, NO Astro — importable by any bundler.

export type Service = 'car_paint' | 'glass';

export interface CalcInput {
  service: Service;
  // Car Paint
  vehicleSize?: string;
  // Glass
  glassType?: string;
  areaSize?: string;
  // Common
  condition: string;
  location: string;
}

export interface CalcResult {
  min: number;
  max: number;
  warning?: string;
}

// ── Car Paint ─────────────────────────────────────────────────────────────────
const CAR_BASE: Record<string, number> = {
  s: 180, m: 240, l: 320, not_sure: 240,
};
const CAR_CONDITION: Record<string, number> = {
  light: 1.00, medium: 1.25, heavy: 1.60, not_sure: 1.30,
};
const CAR_LOCATION: Record<string, number> = {
  sant_cugat: 0, barcelona: 0, terrassa_sabadell: 20, rubi: 10, other: 40,
};
const CAR_FLOOR = 120;

// ── Glass Polishing ───────────────────────────────────────────────────────────
const GLASS_BASE: Record<string, number> = {
  car_side: 90, windshield: 140, home_window: 120, shower_glass: 110, other: 120,
};
const GLASS_AREA: Record<string, number> = {
  small: 1.00, medium: 1.35, large: 1.80, not_sure: 1.40,
};
const GLASS_CONDITION: Record<string, number> = {
  light: 1.00, medium: 1.30, heavy: 1.80, not_sure: 1.40,
};
const GLASS_LOCATION: Record<string, number> = {
  sant_cugat: 0, barcelona: 0, terrassa_sabadell: 20, rubi: 10, other: 40,
};
const GLASS_FLOOR = 70;

// ── Helpers ───────────────────────────────────────────────────────────────────
function roundTo10(x: number): number {
  return Math.round(x / 10) * 10;
}

function isUncertain(input: CalcInput): boolean {
  return [
    input.vehicleSize, input.glassType,
    input.areaSize, input.condition, input.location,
  ].some(v => v === 'not_sure' || v === 'other');
}

// ── Main calculation ──────────────────────────────────────────────────────────
export function calculate(input: CalcInput): CalcResult {
  const loc  = input.location  || 'sant_cugat';
  const cond = input.condition || 'not_sure';

  let base = 0;
  let floor = 0;

  if (input.service === 'car_paint') {
    const bp = CAR_BASE[input.vehicleSize ?? 'not_sure'] ?? 240;
    const cf = CAR_CONDITION[cond] ?? 1.30;
    const la = CAR_LOCATION[loc]   ?? 40;
    base  = bp * cf + la;
    floor = CAR_FLOOR;

  } else if (input.service === 'glass') {
    const bp = GLASS_BASE[input.glassType ?? 'other']  ?? 120;
    const af = GLASS_AREA[input.areaSize ?? 'not_sure'] ?? 1.40;
    const cf = GLASS_CONDITION[cond]                    ?? 1.40;
    const la = GLASS_LOCATION[loc]                      ?? 40;
    base  = bp * af * cf + la;
    floor = GLASS_FLOOR;
  }

  const uncertain = isUncertain(input);
  const lowF  = uncertain ? 0.85 : 0.90;
  const highF = uncertain ? 1.25 : 1.20;

  let min = Math.max(roundTo10(base * lowF), floor);
  let max = roundTo10(base * highF);
  if (max < min) max = min + 20;

  // Warning for complex glass cases
  const warning = (
    input.service === 'glass' &&
    cond === 'heavy' &&
    (input.areaSize === 'large' || input.areaSize === 'not_sure')
  )
    ? 'Photo review required before final quote. Deep scratches may need inspection first.'
    : undefined;

  return { min, max, warning };
}

export function getBucket(min: number, max: number): string {
  const mid = (min + max) / 2;
  if (mid < 200) return '0-200';
  if (mid < 500) return '200-500';
  return '500+';
}
