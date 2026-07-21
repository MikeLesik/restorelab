// Illustrative before/after examples — generated images, NOT real customer jobs.
// They live on /examples behind an explicit disclaimer and are deliberately kept
// out of the real-results gallery (/cases). Each id maps to a webp/jpg pair in
// /images/examples/ and a service category used for the on-card tag.
export interface Example {
  id: string;
  /** Service category — keys into examples_page.cat_* for the label. */
  cat: 'paint' | 'glass' | 'headlights' | 'acrylic' | 'ceramic';
}

export const examples: Example[] = [
  // Paint correction on real, recognisable production models
  { id: 'realcar-sedan-black', cat: 'paint' },
  { id: 'realcar-ev-blue', cat: 'paint' },
  { id: 'realcar-coupe-yellow', cat: 'paint' },
  { id: 'realcar-hothatch-red', cat: 'paint' },
  { id: 'realcar-hatchback-silver', cat: 'paint' },
  { id: 'realcar-estate-blue', cat: 'paint' },
  { id: 'realcar-sedan-white', cat: 'paint' },
  // Paint correction — illustrative set
  { id: 'car-black-correction', cat: 'paint' },
  { id: 'car-red-correction', cat: 'paint' },
  { id: 'car-blue-correction', cat: 'paint' },
  { id: 'car-white-correction', cat: 'paint' },
  { id: 'car-grey-correction', cat: 'paint' },
  { id: 'car-yellow-correction', cat: 'paint' },
  { id: 'car-green-correction', cat: 'paint' },
  { id: 'car-black-suv-correction', cat: 'paint' },
  { id: 'classic-car-correction', cat: 'paint' },
  { id: 'car-silver-ceramic', cat: 'ceramic' },
  // Glass polishing & sanding
  { id: 'windshield-wiper-scratches', cat: 'glass' },
  { id: 'glass-windshield-front', cat: 'glass' },
  { id: 'glass-windshield-angle', cat: 'glass' },
  { id: 'glass-rear-window', cat: 'glass' },
  { id: 'glass-side-mirror', cat: 'glass' },
  { id: 'glass-side-window', cat: 'glass' },
  // Headlights, motorcycles & acrylic
  { id: 'car-headlight-pair', cat: 'headlights' },
  { id: 'moto-tank-polish', cat: 'paint' },
  { id: 'moto-tank-red', cat: 'paint' },
  { id: 'moto-fairing', cat: 'paint' },
  { id: 'moto-headlight-round', cat: 'headlights' },
  { id: 'moto-acrylic-screen', cat: 'acrylic' },
];
