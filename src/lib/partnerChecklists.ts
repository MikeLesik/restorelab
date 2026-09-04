// Per-service partner checklists (RL-430) — ES-only by design (partner
// surfaces, see CLAUDE.md). Keyed by pricing package slug; `default` covers
// everything without a specific list. The partner job card (/p/) renders
// CHECKLISTS[service_slug] || CHECKLISTS.default at build time — so every key
// here MUST match a real pricing/addon slug in src/content/*.json to take
// effect.
//
// Content is a condensed, field-tested SOP distilled from the in-house
// training series (see docs/partner-sop.es.md for the full protocol with the
// technique rationale). Numbers are technique parameters, not prices:
//   - lija P3000 en húmedo (nunca P2000/2500 salvo necesidad)
//   - rotativa ~1200 rpm (rango 1000-1400) SIEMPRE con pasta, sin apoyar peso
//   - acabado con excéntrica (DA) a velocidad 4 (~4000) para matar hologramas
//   - restaurador 2K: mezcla 8:1 (un pelín menos de catalizador), ventana 5-10 min
//   - cerámico: no tocar 24 h, no lavar 7 días
// Grouped by service block: PULIDO / RESTAURACIÓN / CERÁMICO / GENÉRICO.

// Walkaround (Order Flow v2 §1.9): the 5-minute ritual WITH the client before
// touching anything — expectations set out loud + the photo record in the
// client's own WhatsApp chat is the legal shield for both sides.
const WALKAROUND: string[] = [
  'WALKAROUND con el cliente ANTES de empezar: vuelta al coche juntos, 4–6 fotos de TODO defecto previo (también los que no se van a tocar)',
  'Decir en voz alta qué se va y qué NO se va («rayado profundo: mejora, no desaparece»; el 100% de rayas y piedrazos no se quita sin repintar)',
  'Coche debe llegar lavado; si llega sucio, fotografíalo y avísanos — no se pule sobre suciedad',
  'Cualquier cambio de precio o alcance: avísanos antes de seguir; el partner NO renegocia en sitio con el cliente',
];

// Common quality-control tail for machine work.
const QC_PULIDO: string[] = [
  'Tras la rotativa, SIEMPRE pasar la excéntrica (DA) antes de retirar la pasta — la rotativa deja hologramas que solo se ven al sol',
  'Retirar restos de pasta en juntas, molduras y plástico (en blanco casi no se ve: revisa panel por panel)',
  'Control a sol y a contraluz, de cerca y a ~1 m, comparando la zona tratada con una sin tratar',
  'Fotos DESPUÉS con la misma luz y ángulos que las de ANTES (mín. 2)',
];

export const PARTNER_CHECKLISTS: Record<string, string[]> = {
  default: [
    ...WALKAROUND,
    'Foto ANTES de cada zona a trabajar (mín. 2)',
    'Proteger plásticos, gomas y molduras adyacentes',
    'Trabajo según el protocolo del servicio',
    'Foto DESPUÉS desde los mismos ángulos (mín. 2)',
    'Zona de trabajo recogida y limpia',
  ],

  // ── PULIDO / corrección de pintura ────────────────────────────────
  'single-stage': [
    ...WALKAROUND,
    'Fotos ANTES con luz rasante/directa (defectos visibles, mín. 2)',
    'Lavado descontaminante + clay bar; la carrocería debe estar limpia antes de pulir',
    'Enmascarar gomas, molduras y plásticos junto a la zona de la rotativa',
    'Medir espesor de laca en capó y aletas (anotar si <80μm; sin medidor, valóralo por la piel de naranja: si hay, queda laca)',
    'Corte con rotativa ~1200 rpm (1000–1400): pad + compuesto, SIEMPRE con pasta, sin apoyar el peso, sin pararse en un punto',
    'Acabado con excéntrica (DA) a velocidad 4 (~4000) — misma pasta, sin vitrear la laca',
    ...QC_PULIDO,
  ],
  'two-stage': [
    ...WALKAROUND,
    'Fotos ANTES con luz rasante/directa (defectos visibles, mín. 2)',
    'Lavado descontaminante + clay bar; la carrocería debe estar limpia antes de pulir',
    'Enmascarar gomas, molduras y plásticos junto a la zona de la rotativa',
    'Medir espesor de laca en capó y aletas (anotar si <80μm)',
    'Fase de corte (compuesto) con rotativa ~1200 rpm, panel a panel',
    'Fase de refinado (acabado espejo) con excéntrica a ~4000, panel a panel',
    ...QC_PULIDO,
  ],
  'correccion-localizada': [
    ...WALKAROUND,
    'Diagnóstico: prueba de uña en rayas profundas — si engancha, pasó la laca y NO sale puliendo (avísalo)',
    'Descartar que sea transferencia de pintura ajena o roce: muchas veces sale con lacquer cleaner en ~10 min, sin lijar',
    'Fotos ANTES de cada zona (mín. 2)',
    'Enmascarar gomas, plástico, cantos y molduras de la zona',
    'Solo si hace falta: lija P3000 EN HÚMEDO, puntual sobre la raya (nunca P2000/2500), mojando la lija y sin insistir en un punto',
    'Corte con rotativa ~1200 rpm con pasta: pasadas suaves, moviéndote por toda la zona; ~98% de rayas se van',
    'Rayas hondas: fundir la laca solo en chapa (nunca plástico/parachoques/espejos), rotativa plana sin apretar, calentando no cortando',
    'Retoque de piedrazos si aplica: pintura por código (foto de la etiqueta del pilar), rellenar el cráter, retirar sobrante con paño y lacquer cleaner mientras está fresca',
    'Acabado con excéntrica (DA) a ~4000 en la zona',
    ...QC_PULIDO,
  ],
  'express-refresh': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2)',
    'Lavado descontaminante completo',
    'Realce con pulido ligero de un paso (excéntrica), sin corte agresivo',
    'Retirar restos de pasta en juntas y plástico',
    'Fotos DESPUÉS (mín. 2)',
  ],
  'pre-sale-pack': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2, ángulos de anuncio)',
    'Lavado descontaminante + clay bar',
    'Corrección 1 fase completa (rotativa ~1200 + acabado DA ~4000)',
    'Restauración de faros incluida (lijado húmedo → pulido → sellante UV)',
    'Retoque de piedrazos visibles por código de pintura',
    'Fotos DESPUÉS tipo anuncio: 3/4 delantero, 3/4 trasero, lateral',
  ],

  // ── RESTAURACIÓN ──────────────────────────────────────────────────
  'restauracion-faros': [
    ...WALKAROUND,
    'Foto ANTES de cada faro (mín. 2)',
    'Enmascarar la pintura alrededor del faro (la lija/rotativa la come al instante)',
    'Lijado húmedo progresivo según protocolo (grano a grano, siempre mojado)',
    'Pulido a máquina hasta recuperar transparencia (excéntrica; en plástico NO calentar de más)',
    'Aplicar sellante UV — sin él, el faro vuelve a amarillear en semanas',
    'Foto DESPUÉS de cada faro (mín. 2)',
  ],
  // Legacy alias (service page slug); real order slug is restauracion-faros.
  'headlight-restoration': [
    ...WALKAROUND,
    'Foto ANTES de cada faro (mín. 2)',
    'Enmascarar la pintura alrededor del faro',
    'Lijado húmedo progresivo según protocolo',
    'Pulido a máquina hasta claridad',
    'Aplicar sellante UV',
    'Foto DESPUÉS de cada faro (mín. 2)',
  ],
  'acrylic-restoration': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2)',
    'Plástico/acrílico (faros, pantallas, cúpulas moto): NUNCA rotativa — solo excéntrica, sin calentar',
    'Enmascarar el borde pintado/de goma alrededor de la pieza',
    'Lijado húmedo progresivo del grano más grueso al más fino',
    'Pulido a máquina (DA) hasta transparencia; controlar el calor con la mano (el plástico se quema en segundos)',
    'Aplicar sellante/protector UV',
    'Fotos DESPUÉS (mín. 2)',
  ],
  'restauracion-plasticos': [
    ...WALKAROUND,
    'Fotos ANTES (mín. 2)',
    'Limpiar y desengrasar el plástico; enmascarar la pintura/goma colindante',
    'Restaurador 2K (si aplica): mezcla 8:1 con un pelín menos de catalizador, consistencia líquida; cerrar los botes al momento',
    'Ventana de trabajo 5–10 min: reparte el producto por todo el aplicador y aplica de arriba abajo en una pasada, aplicador plano',
    'Aplica rápido, un vistazo a chorretones/zonas sin cubrir y sigue; producto seco = no se quita',
    'En plástico NO uses rotativa; calor suave y con mucho cuidado solo donde el protocolo lo permita',
    'Fotos DESPUÉS (mín. 2)',
  ],
  'abrillantado-escape': [
    ...WALKAROUND,
    'Foto ANTES del embellecedor/colas de escape (mín. 2)',
    'Producto/pasta metal-polish adecuado; trabajo a mano o mini-máquina',
    'Retirar restos y sellar/proteger la superficie',
    'Foto DESPUÉS (mín. 2)',
  ],

  // ── CERÁMICO / sellado ────────────────────────────────────────────
  'ceramic-1y': [
    'Todo el checklist de corrección 1 fase ANTES del cerámico',
    'Foto del FRASCO del cerámico (marca + lote) en las fotos ANTES — la garantía es de restoreLab y exige el producto aprobado',
    'Wipe-down con panel prep antes del cerámico (desengrase total)',
    'Aplicar en cruz, medio panel cada vez, bajo luz dirigida; retirar con paño limpio antes de que cristalice',
    'Revisar high spots con luz rasante panel por panel',
    'Indicar al cliente: no tocar 24 h, no lavar 7 días',
    'Fotos DESPUÉS (mín. 2, incluir beading/agua si es posible)',
  ],
  'ceramic-2y': [
    'Todo el checklist de corrección 2 fases ANTES del cerámico',
    'Foto del FRASCO del cerámico (marca + lote) en las fotos ANTES — la garantía es de restoreLab y exige el producto aprobado',
    'Wipe-down con panel prep antes del cerámico (desengrase total)',
    'Aplicar en cruz, medio panel cada vez, bajo luz dirigida; retirar antes de que cristalice',
    'Revisar high spots con luz rasante panel por panel',
    'Indicar al cliente: no tocar 24 h, no lavar 7 días',
    'Fotos DESPUÉS (mín. 2, incluir beading/agua si es posible)',
  ],
  // On-site upsell seals (addon catalog) sold/applied by the partner.
  'sellado-ceramico-1y': [
    'Foto del FRASCO del cerámico (marca + lote) — producto aprobado por restoreLab',
    'La pintura debe estar corregida/limpia; wipe-down con panel prep antes de aplicar',
    'Aplicar en cruz, medio panel cada vez, bajo luz dirigida; retirar antes de que cristalice',
    'Revisar high spots con luz rasante panel por panel',
    'Indicar al cliente: no tocar 24 h, no lavar 7 días',
    'Fotos DESPUÉS (mín. 2, beading si es posible)',
  ],
  'sellado-ceramico-2y': [
    'Foto del FRASCO del cerámico (marca + lote) — producto aprobado por restoreLab',
    'La pintura debe estar corregida/limpia; wipe-down con panel prep antes de aplicar',
    'Aplicar en cruz, medio panel cada vez, bajo luz dirigida; retirar antes de que cristalice',
    'Revisar high spots con luz rasante panel por panel',
    'Indicar al cliente: no tocar 24 h, no lavar 7 días',
    'Fotos DESPUÉS (mín. 2, beading si es posible)',
  ],
  'booster-ceramico': [
    'Foto ANTES (mín. 2)',
    'Wipe-down/lavado previo: la superficie debe estar limpia y seca',
    'Aplicar el booster/topper en cruz, retirar con paño limpio; revisar high spots',
    'Indicar al cliente: no lavar 24 h',
    'Fotos DESPUÉS (mín. 2, beading si es posible)',
  ],
};

export const HOUSE_RULES: string[] = [
  'Uniforme o ropa de trabajo neutra, sin marcas de otra empresa.',
  'Las fotos antes/después son OBLIGATORIAS — sin fotos no hay QC ni pago.',
  'Nada de contacto directo con el cliente: cualquier tema, escríbenos por WhatsApp.',
  'Cualquier daño o imprevisto: parar y avisar a restoreLab ANTES de continuar.',
  'Nunca cobrar al cliente en mano — todos los pagos pasan por restoreLab.',
  'Nunca rotativa a seco ni sin medir espesor en lacas desconocidas — se quema la laca.',
  'Fundir laca solo en chapa (nunca plástico/parachoques/espejos) y con el visto bueno del cliente.',
  'No prometas quitar el 100% de rayas ni piedrazos — eso es repintado.',
];
