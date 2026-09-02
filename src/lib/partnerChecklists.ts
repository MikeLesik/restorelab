// Per-service partner checklists (RL-430) — ES-only by design (partner
// surfaces, see CLAUDE.md). Keyed by pricing package slug; `default` covers
// everything without a specific list. Edit freely — the partner job card
// renders whatever is here at build time.

// Walkaround (Order Flow v2 §1.9): the 5-minute ritual WITH the client before
// touching anything — expectations set out loud + the photo record in the
// client's own WhatsApp chat is the legal shield for both sides.
const WALKAROUND: string[] = [
  'WALKAROUND con el cliente ANTES de empezar: vuelta al coche juntos, 4–6 fotos de TODO defecto previo (también los que no se van a tocar)',
  'Decir en voz alta qué se va y qué NO se va («rayado profundo: mejorará, no desaparece»)',
  'Cualquier cambio de precio o alcance: llamar a Mike — el partner NO renegocia en sitio',
];

export const PARTNER_CHECKLISTS: Record<string, string[]> = {
  default: [
    ...WALKAROUND,
    'Foto ANTES de cada zona a trabajar (mín. 2)',
    'Proteger plásticos y gomas adyacentes',
    'Trabajo según el protocolo del servicio',
    'Foto DESPUÉS desde los mismos ángulos (mín. 2)',
    'Zona de trabajo recogida y limpia',
  ],
  'single-stage': [
    ...WALKAROUND,
    'Fotos ANTES con luz directa (defectos visibles, mín. 2)',
    'Lavado descontaminante + clay bar completo',
    'Medir espesor de laca en capó y aletas (anotar si <80μm)',
    'Corrección 1 fase — pad y compuesto según protocolo',
    'Retirar restos de pulido en juntas y plásticos',
    'Fotos DESPUÉS con la misma luz y ángulos (mín. 2)',
  ],
  'two-stage': [
    ...WALKAROUND,
    'Fotos ANTES con luz directa (defectos visibles, mín. 2)',
    'Lavado descontaminante + clay bar completo',
    'Medir espesor de laca en capó y aletas (anotar si <80μm)',
    'Fase de corte (compuesto) panel a panel',
    'Fase de refinado (acabado espejo) panel a panel',
    'Retirar restos de pulido en juntas y plásticos',
    'Fotos DESPUÉS con la misma luz y ángulos (mín. 2)',
  ],
  'ceramic-1y': [
    'Todo el checklist de corrección 1 fase',
    'Foto del FRASCO del cerámico (marca + lote) en las fotos ANTES — la garantía es de restoreLab y exige el producto aprobado',
    'Wipe-down con panel prep antes del cerámico',
    'Aplicar cerámico panel a panel, revisar high spots con luz',
    'Indicar al cliente: no lavar en 7 días',
    'Fotos DESPUÉS (mín. 2, incluir beading si es posible)',
  ],
  'ceramic-2y': [
    'Todo el checklist de corrección 2 fases',
    'Foto del FRASCO del cerámico (marca + lote) en las fotos ANTES — la garantía es de restoreLab y exige el producto aprobado',
    'Wipe-down con panel prep antes del cerámico',
    'Aplicar cerámico panel a panel, revisar high spots con luz',
    'Indicar al cliente: no lavar en 7 días',
    'Fotos DESPUÉS (mín. 2, incluir beading si es posible)',
  ],
  'headlight-restoration': [
    ...WALKAROUND,
    'Foto ANTES de cada faro (mín. 2)',
    'Enmascarar pintura alrededor del faro',
    'Lijado húmedo progresivo según protocolo',
    'Pulido a máquina hasta claridad',
    'Aplicar sellante UV',
    'Foto DESPUÉS de cada faro (mín. 2)',
  ],
  'express-refresh': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2)',
    'Lavado descontaminante completo',
    'Realce con pulido ligero de un paso',
    'Fotos DESPUÉS (mín. 2)',
  ],
  'pre-sale-pack': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2, ángulos de anuncio)',
    'Corrección 1 fase completa',
    'Restauración de faros incluida',
    'Fotos DESPUÉS tipo anuncio: 3/4 delantero, 3/4 trasero, lateral',
  ],
};

export const HOUSE_RULES: string[] = [
  'Uniforme o ropa de trabajo neutra, sin marcas de otra empresa.',
  'Las fotos antes/después son OBLIGATORIAS — sin fotos no hay QC ni pago.',
  'Nada de contacto directo con el cliente: cualquier tema, a Mike por WhatsApp.',
  'Cualquier daño o imprevisto: parar y avisar a Mike ANTES de continuar.',
  'Nunca cobrar al cliente en mano — todos los pagos pasan por restoreLab.',
  'No usar rotativa en lacas desconocidas sin medir espesor primero.',
];
