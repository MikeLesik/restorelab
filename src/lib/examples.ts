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
  { id: 'windshield-wiper-scratches', cat: 'glass' },
  { id: 'car-headlight-pair', cat: 'headlights' },
  { id: 'moto-tank-polish', cat: 'paint' },
  { id: 'moto-tank-red', cat: 'paint' },
  { id: 'moto-fairing', cat: 'paint' },
  { id: 'moto-headlight-round', cat: 'headlights' },
  { id: 'moto-acrylic-screen', cat: 'acrylic' },
];
