// Cluster registry — source of truth for hub-and-spoke topology.
// Maps each hub to its spokes (academy articles), related hubs (cross-cluster),
// and related areas. Components <HubSpokeList>, <RelatedGuides>, <ServiceCTA>
// read from this registry to generate internal links.
//
// Slug convention: hub IDs match service page filenames and content JSON keys.
// Spoke slugs match academy article slugs (hyphen form, e.g. "remove-swirl-marks").

export interface ClusterDef {
  /** Hub URL path relative to lang prefix, e.g. "/services/car-paint-correction" */
  hub: string;
  /** Hub display label key in content JSON (under cluster_ui.hubs) */
  hubLabelKey: string;
  /** Whether the hub has a dedicated page rendered (false for hidden services) */
  hubActive: boolean;
  /** Academy article slugs in this cluster (primary spokes — show on hub) */
  primarySpokes: string[];
  /** Academy article slugs in optional sub-cluster (e.g. "process" for paint correction) */
  subClusterSpokes?: string[];
  /** Sub-cluster display label key (under cluster_ui.subClusters) */
  subClusterLabelKey?: string;
  /** IDs of other clusters contextually related (cross-cluster inline links) */
  relatedHubs: string[];
  /** Area slugs where this service is most relevant (used by area pages dense links) */
  relatedAreas: string[];
}

export const clusterMap: Record<string, ClusterDef> = {
  // ── Service Hubs ────────────────────────────────────────────

  'car-paint-correction': {
    hub: '/services/car-paint-correction',
    hubLabelKey: 'car_paint_correction',
    hubActive: true,
    primarySpokes: [
      'paint-correction-cost-barcelona',
      'polish-vs-repaint-barcelona',
      'mechanical-correction',
      'remove-swirl-marks',
      // floating articles reclassified into car-paint-correction:
      'mediterranean-climate-car-paint-protection',
      'protection-preservation',
      'motorcycle-detailing',
    ],
    subClusterSpokes: [
      'equipment-selection',
      'masking-protocols',
      'refining-stabilization',
    ],
    subClusterLabelKey: 'process_technique',
    relatedHubs: ['ev', 'business'],
    relatedAreas: ['sant-cugat', 'barcelona', 'pedralbes'],
  },

  'glass-polishing': {
    hub: '/services/glass-polishing',
    hubLabelKey: 'glass_polishing',
    hubActive: true,
    primarySpokes: ['windshield-scratch-repair', 'water-stain-removal-car-windows'],
    relatedHubs: ['commercial-glass'],
    relatedAreas: ['sant-cugat', 'barcelona', 'terrassa'],
  },

  'acrylic-restoration': {
    hub: '/services/acrylic-restoration',
    hubLabelKey: 'acrylic_restoration',
    hubActive: true,
    primarySpokes: ['uv-damage-acrylic-restoration', 'uv-damage-motorcycle-yacht-acrylic'],
    relatedHubs: [],
    relatedAreas: ['castelldefels', 'alella-tiana-teia', 'barcelona'],
  },

  'headlight-restoration': {
    hub: '/services/headlight-restoration',
    hubLabelKey: 'headlight_restoration',
    hubActive: true,
    primarySpokes: ['headlight-restoration-guide-barcelona', 'yellow-vs-cloudy-headlights-causes-lifespan'],
    relatedHubs: [],
    relatedAreas: ['sant-cugat', 'barcelona', 'terrassa'],
  },

  'interior-leather': {
    hub: '/services/interior-leather',
    hubLabelKey: 'interior_leather',
    hubActive: true,
    primarySpokes: ['leather-seats-mediterranean-restoration'],
    relatedHubs: ['business'],
    relatedAreas: ['pedralbes', 'sant-gervasi', 'sant-cugat'],
  },

  'pre-sale-pack': {
    hub: '/services/pre-sale-pack',
    hubLabelKey: 'pre_sale_pack',
    hubActive: true,
    primarySpokes: ['pre-sale-detailing-checklist-catalonia', 'detailing-used-car-sale-price-catalonia'],
    relatedHubs: ['business'],
    relatedAreas: ['barcelona', 'sant-cugat', 'terrassa'],
  },

  // Hidden services — registered for forward compatibility.
  // hubActive: false means components skip them.
  'trim-restoration': {
    hub: '/services/trim-restoration',
    hubLabelKey: 'trim_restoration',
    hubActive: false,
    primarySpokes: [],
    relatedHubs: ['car-paint-correction'],
    relatedAreas: [],
  },

  // ── Vertical Hubs ───────────────────────────────────────────

  'ev': {
    hub: '/ev',
    hubLabelKey: 'ev',
    hubActive: true,
    primarySpokes: ['tesla-ev-paint-care-mediterranean'],
    relatedHubs: ['car-paint-correction', 'glass-polishing'],
    relatedAreas: ['pedralbes', 'sant-gervasi', 'sant-cugat'],
  },

  'business': {
    hub: '/business',
    hubLabelKey: 'business',
    hubActive: true,
    primarySpokes: [],
    relatedHubs: ['plans', 'car-paint-correction', 'pre-sale-pack'],
    relatedAreas: ['barcelona', 'sant-cugat', 'terrassa'],
  },

  'plans': {
    hub: '/plans',
    hubLabelKey: 'plans',
    hubActive: true,
    primarySpokes: [],
    relatedHubs: ['car-paint-correction', 'glass-polishing', 'headlight-restoration', 'interior-leather'],
    relatedAreas: ['sant-cugat', 'barcelona'],
  },

  'commercial-glass': {
    hub: '/commercial-glass',
    hubLabelKey: 'commercial_glass',
    hubActive: true,
    primarySpokes: [],
    relatedHubs: ['glass-polishing'], // weak cross-link per spec section 5
    relatedAreas: ['barcelona', 'sant-cugat'],
  },
};

// ── Reverse index helpers ──────────────────────────────────────

/**
 * Given an academy article slug, return the cluster it belongs to.
 * Returns null if the slug isn't in any primary or sub-cluster spoke list.
 */
export function findClusterForSpoke(spokeSlug: string): { clusterId: string; cluster: ClusterDef; isSubCluster: boolean } | null {
  for (const [clusterId, cluster] of Object.entries(clusterMap)) {
    if (cluster.primarySpokes.includes(spokeSlug)) {
      return { clusterId, cluster, isSubCluster: false };
    }
    if (cluster.subClusterSpokes?.includes(spokeSlug)) {
      return { clusterId, cluster, isSubCluster: true };
    }
  }
  return null;
}

/**
 * Given a hub ID, return up to N sibling spokes for a given spoke slug.
 * Excludes the spoke itself. Returns spokes from the same cluster (primary first, then sub).
 */
export function getSiblingSpokes(spokeSlug: string, limit = 3): string[] {
  const found = findClusterForSpoke(spokeSlug);
  if (!found) return [];
  const all = [...found.cluster.primarySpokes, ...(found.cluster.subClusterSpokes ?? [])];
  return all.filter((s) => s !== spokeSlug).slice(0, limit);
}

/**
 * Return only the ACTIVE hubs (hubActive: true).
 * Used by HubSpokeList and area page dense links — we don't link to dead hubs.
 */
export function getActiveClusterIds(): string[] {
  return Object.entries(clusterMap)
    .filter(([_, c]) => c.hubActive)
    .map(([id]) => id);
}
