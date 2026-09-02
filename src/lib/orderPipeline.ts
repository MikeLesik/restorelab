// Orders OS pipeline vocabulary (RL-410/420) — the SINGLE source of truth for
// statuses, transitions and enums. Imported by both the Pages Functions
// (functions/_lib/orders.ts) and the /admin UI, so the server and the buttons
// the admin sees can never disagree.

export const STATUSES = [
  'new', 'quoted', 'booked', 'assigned', 'in_progress', 'qc',
  'awaiting_payment', 'paid', 'done', 'cancelled',
] as const;
export type OrderStatus = (typeof STATUSES)[number];

/** Legal transitions. booked→in_progress covers jobs Mike does himself
 *  (no partner assignment); qc→in_progress is the rework path;
 *  paid→cancelled is the refund path (also the only way a paid test
 *  order can ever reach the cancelled-only DELETE). */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['quoted', 'cancelled'],
  quoted: ['booked', 'cancelled'],
  booked: ['assigned', 'in_progress', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['qc', 'cancelled'],
  qc: ['awaiting_payment', 'in_progress'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export const CHANNELS = ['form', 'whatsapp', 'phone', 'b2b'] as const;
export const LANGS = ['es', 'en', 'ca'] as const;
export const SIZES = ['compact', 'sedan', 'suv', 'van', 'sports'] as const;
