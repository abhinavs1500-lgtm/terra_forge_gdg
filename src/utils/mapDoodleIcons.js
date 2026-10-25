/**
 * mapDoodleIcons.js
 * Custom hand-drawn cartographic & terrain doodle SVG icon family for Terra Forge GIS.
 * Styled like an illustrated land-survey & geotechnical field notebook using warm ivory (#f5f0e6),
 * sandstone (#c7bca9), copper/amber (#e09f50 / #c87a48), and muted forest/sage (#84c7a3 / #5d9678).
 *
 * Strictly reflects actual available data in chennai_167_locations.json and gis_layers.json.
 * Never implies soil, groundwater, or flood data exists when those attributes are null.
 */

export const DOODLE_CATEGORIES = {
  soil: [
    {
      key: 'hard-rock',
      label: 'Archaean Charnockite / Crystalline Rock',
      color: '#84c7a3',
      description: 'Shallow crystalline hard-rock basement (CGWB / GSI 1:50k)'
    },
    {
      key: 'alluvial-plain',
      label: 'Quaternary Fluvial Alluvium',
      color: '#5d9678',
      description: 'Interbedded river sand, silt & clay terraces'
    },
    {
      key: 'coastal-sand',
      label: 'Coastal Alluvial & Marine Sand',
      color: '#e09f50',
      description: 'Bay of Bengal dune & barrier-beach sand deposits'
    },
    {
      key: 'estuarine-clay',
      label: 'Lacustrine / Estuarine Soft Clay',
      color: '#cf5c47',
      description: 'High-plasticity backwater & paleo-marsh clay lenses'
    },
    {
      key: 'gondwana',
      label: 'Upper Gondwana Sandstone / Shale',
      color: '#c87a48',
      description: 'Consolidated sedimentary shale & conglomerate beds'
    },
    {
      key: 'survey-unmapped',
      label: 'Geodesic Benchmark Only (Unmapped in 1:50k Soil Sheet)',
      color: '#9e9483',
      description: 'Verified OSM coordinates & SRTM elevation; regional soil unmapped'
    }
  ],
  flood: [
    {
      key: 'estuarine-clay',
      label: 'High Flood Sensitivity / Low-Lying Basin',
      color: '#cf5c47',
      description: 'Documented waterway buffer or paleo-marsh depression (NCCR/GCC)'
    },
    {
      key: 'coastal-sand',
      label: 'Moderate / Localized Drainage Sensitivity',
      color: '#e09f50',
      description: 'Requires plinth offset & storm drain outfall verification'
    },
    {
      key: 'alluvial-plain',
      label: 'Low Flood Sensitivity / Elevated Terrace',
      color: '#84c7a3',
      description: 'Well-drained topographic ridge or elevated plain'
    },
    {
      key: 'survey-unmapped',
      label: 'Geodesic Benchmark Only (Outside Ward Flood Map)',
      color: '#9e9483',
      description: 'Outside GCC 200-ward CFLOWS flood hazard map extent'
    }
  ],
  groundwater: [
    {
      key: 'hydro-shallow',
      label: 'Shallow Water Table (< 3.0 m bgl Pre-Monsoon)',
      color: '#4fa8c2',
      description: 'High seasonal water table requiring dewatering planning'
    },
    {
      key: 'hydro-moderate',
      label: 'Moderate Water Table (3.0 – 4.5 m bgl)',
      color: '#84c7a3',
      description: 'Seasonal CGWB aquifer observation range'
    },
    {
      key: 'hydro-deep',
      label: 'Deeper Water Table (> 4.5 m bgl)',
      color: '#c87a48',
      description: 'Deeper hard-rock or semi-confined aquifer zone'
    },
    {
      key: 'survey-unmapped',
      label: 'Geodesic Benchmark Only (No Local CGWB Well)',
      color: '#9e9483',
      description: 'No local CGWB observation well range assigned'
    }
  ],
  completeness: [
    {
      key: 'verified-complete',
      label: '100% Core Regional Evidence Present',
      color: '#84c7a3',
      description: 'Verified OSM + SRTM + Soil + Groundwater + Flood Basin'
    },
    {
      key: 'survey-unmapped',
      label: 'Partial Regional Coverage (Disclosed Gaps)',
      color: '#e09f50',
      description: 'Verified OSM + SRTM; 1 or more regional layers unmapped'
    }
  ]
};

/**
 * Resolves the exact doodle archetype and accent color for a location
 * based on actual available attributes (never fabricating missing data).
 */
export function resolveLocationDoodle(loc, colorMode = 'soil') {
  if (colorMode === 'flood') {
    const cat = loc.environmental_and_flood?.flood_hazard_category || '';
    if (!cat) {
      return { archetype: 'survey-unmapped', color: '#9e9483', badgeLabel: 'Flood Unmapped' };
    }
    if (cat.includes('High')) {
      return { archetype: 'estuarine-clay', color: '#cf5c47', badgeLabel: 'High Flood Basin' };
    }
    if (cat.includes('Moderate')) {
      return { archetype: 'coastal-sand', color: '#e09f50', badgeLabel: 'Moderate Basin' };
    }
    return { archetype: 'alluvial-plain', color: '#84c7a3', badgeLabel: 'Elevated / Low Sensitivity' };
  }

  if (colorMode === 'groundwater') {
    const gw = loc.ground_and_soil?.groundwater_pre_monsoon_m_bgl;
    if (!gw) {
      return { archetype: 'survey-unmapped', color: '#9e9483', badgeLabel: 'GW Unavailable' };
    }
    if (gw.startsWith('1.') || gw.startsWith('2.')) {
      return { archetype: 'hydro-shallow', color: '#4fa8c2', badgeLabel: `Shallow GW (${gw})` };
    }
    if (gw.startsWith('3.')) {
      return { archetype: 'hydro-moderate', color: '#84c7a3', badgeLabel: `Mod GW (${gw})` };
    }
    return { archetype: 'hydro-deep', color: '#c87a48', badgeLabel: `Deep GW (${gw})` };
  }

  if (colorMode === 'completeness') {
    const hasAll =
      Boolean(loc.ground_and_soil?.soil_classification) &&
      Boolean(loc.ground_and_soil?.groundwater_pre_monsoon_m_bgl) &&
      Boolean(loc.environmental_and_flood?.flood_hazard_category);
    if (hasAll) {
      return { archetype: 'verified-complete', color: '#84c7a3', badgeLabel: '100% Regional Data' };
    }
    return { archetype: 'survey-unmapped', color: '#e09f50', badgeLabel: 'Partial Regional Data' };
  }

  // Default: Soil & Geological Province
  const soil = loc.ground_and_soil?.soil_classification || '';
  if (!soil) {
    return { archetype: 'survey-unmapped', color: '#9e9483', badgeLabel: 'Soil Unmapped (1:50k)' };
  }
  if (soil.includes('Coastal Alluvial')) {
    return { archetype: 'coastal-sand', color: '#e09f50', badgeLabel: 'Coastal Sand' };
  }
  if (soil.includes('Lacustrine') || soil.includes('Marine')) {
    return { archetype: 'estuarine-clay', color: '#cf5c47', badgeLabel: 'Estuarine Clay' };
  }
  if (soil.includes('Charnockite')) {
    return { archetype: 'hard-rock', color: '#84c7a3', badgeLabel: 'Charnockite Rock' };
  }
  if (soil.includes('Gondwana')) {
    return { archetype: 'gondwana', color: '#c87a48', badgeLabel: 'Gondwana Shale' };
  }
  return { archetype: 'alluvial-plain', color: '#5d9678', badgeLabel: 'Fluvial Alluvium' };
}

/**
 * Returns the inner hand-drawn SVG paths for a given doodle archetype (viewBox 0 0 36 36).
 */
export function getDoodleInnerSvg(archetype, accentColor) {
  switch (archetype) {
    case 'hard-rock':
      // Hand-drawn angular crystalline bedrock outcrop + survey flag
      return `
        <path d="M7,25 L12,14 L16,19 L21,11 L28,25 Z" fill="${accentColor}" fill-opacity="0.28" stroke="#f5f0e6" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M12,14 L15,25 M21,11 L19,25" stroke="${accentColor}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M6,25.5 C12,24.8 24,26.2 30,25.2" stroke="#f5f0e6" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="21" cy="8.5" r="1.6" fill="${accentColor}"/>
      `;

    case 'coastal-sand':
      // Hand-drawn coastal sand dune contour + tidal wave curves + survey pin
      return `
        <path d="M6,23 C10,16 16,16 21,21 C24,17 28,18 30,23" fill="${accentColor}" fill-opacity="0.26" stroke="#f5f0e6" stroke-width="1.45" stroke-linecap="round"/>
        <path d="M7,26 C11,24.5 15,27.5 19,26 C23,24.5 26,27.5 29,26" fill="none" stroke="${accentColor}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M14,17 L14,10 L20,12.5 L14,14.5" fill="${accentColor}" stroke="#f5f0e6" stroke-width="1.2" stroke-linejoin="round"/>
      `;

    case 'estuarine-clay':
      // Hand-drawn marsh depression basin + water ripples + clay horizon ticks
      return `
        <path d="M6,16 C9,23 27,23 30,16" fill="${accentColor}" fill-opacity="0.26" stroke="#f5f0e6" stroke-width="1.45" stroke-linecap="round"/>
        <path d="M10,18.5 C14,17.2 22,19.8 26,18.5" fill="none" stroke="${accentColor}" stroke-width="1.35" stroke-linecap="round"/>
        <path d="M8,25.5 L12,25.5 M16,25.5 L20,25.5 M24,25.5 L28,25.5" stroke="#f5f0e6" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M18,15 L18,10 M15.5,12 L18,9.5 L20.5,12" fill="none" stroke="${accentColor}" stroke-width="1.3" stroke-linecap="round"/>
      `;

    case 'gondwana':
      // Hand-drawn stepped sedimentary sandstone terrace + cross-bedding ticks
      return `
        <path d="M6,24 L9,19 L16,19 L19,14 L27,14 L30,24 Z" fill="${accentColor}" fill-opacity="0.28" stroke="#f5f0e6" stroke-width="1.45" stroke-linejoin="round"/>
        <path d="M10,21.5 L28,21.5 M18,16.8 L26,16.8" stroke="${accentColor}" stroke-width="1.25" stroke-linecap="round"/>
        <circle cx="23" cy="11" r="1.6" fill="#f5f0e6"/>
      `;

    case 'hydro-shallow':
    case 'hydro-moderate':
    case 'hydro-deep':
      // Hand-drawn hydrogeological piezometer well + water table droplet contour
      return `
        <path d="M18,9 C18,9 12,16.2 12,20.2 C12,23.5 14.7,26 18,26 C21.3,26 24,23.5 24,20.2 C24,16.2 18,9 18,9 Z" fill="${accentColor}" fill-opacity="0.3" stroke="#f5f0e6" stroke-width="1.45" stroke-linejoin="round"/>
        <path d="M14,20.5 C16,19.2 20,21.8 22,20.5" fill="none" stroke="${accentColor}" stroke-width="1.35" stroke-linecap="round"/>
        <path d="M8,26.5 L28,26.5" stroke="#c7bca9" stroke-width="1.1" stroke-dasharray="2 2"/>
      `;

    case 'verified-complete':
      // Hand-drawn land-survey plot monument with check crest
      return `
        <path d="M9,24 L12,13 L24,13 L27,24 Z" fill="${accentColor}" fill-opacity="0.25" stroke="#f5f0e6" stroke-width="1.45" stroke-linejoin="round"/>
        <path d="M14.5,18.5 L17,21 L22,15.5" fill="none" stroke="${accentColor}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7,24.5 L29,24.5" stroke="#f5f0e6" stroke-width="1.3" stroke-linecap="round"/>
      `;

    case 'survey-unmapped':
      // Hand-drawn trigonometrical survey benchmark (honestly indicates verified coords only, missing regional sheet)
      return `
        <polygon points="18,10 10,24 26,24" fill="none" stroke="#f5f0e6" stroke-width="1.4" stroke-linejoin="round" stroke-dasharray="3 1.5"/>
        <circle cx="18" cy="19.5" r="2" fill="${accentColor}"/>
        <path d="M7,25.5 L29,25.5" stroke="${accentColor}" stroke-width="1.2" stroke-linecap="round"/>
      `;

    case 'alluvial-plain':
    default:
      // Hand-drawn terraced contour hills + architectural plot survey stake
      return `
        <path d="M6,23 C11,15 19,15 24,23" fill="${accentColor}" fill-opacity="0.28" stroke="#f5f0e6" stroke-width="1.45" stroke-linecap="round"/>
        <path d="M15,23 C19,17 26,17 30,23" fill="${accentColor}" fill-opacity="0.2" stroke="#f5f0e6" stroke-width="1.35" stroke-linecap="round"/>
        <path d="M6,25.5 C14,24.2 22,26.8 30,25.5" fill="none" stroke="${accentColor}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M15,16 L15,10.5 L19.5,12.2 L15,14" fill="${accentColor}" stroke="#f5f0e6" stroke-width="1.1" stroke-linejoin="round"/>
      `;
  }
}

/**
 * Generates the complete HTML string for a Leaflet L.divIcon representing a location marker.
 */
export function buildLocationDoodleHtml({
  loc,
  colorMode = 'soil',
  isSelected = false,
  compact = false
}) {
  const { archetype, color, badgeLabel } = resolveLocationDoodle(loc, colorMode);
  const size = isSelected ? 42 : compact ? 28 : 32;
  const innerSvg = getDoodleInnerSvg(archetype, color);

  // Hand-drawn organic octagon/medallion border
  return `
    <div
      class="tf-doodle-marker ${isSelected ? 'is-selected' : ''} ${archetype === 'survey-unmapped' ? 'is-partial' : ''}"
      role="button"
      tabindex="0"
      aria-label="${loc.name} (${loc.id}) — ${badgeLabel}, ${loc.geographic_context?.elevation_m_msl ?? 'N/A'}m MSL"
      style="width:${size}px;height:${size}px;--doodle-accent:${color};"
    >
      <svg viewBox="0 0 36 36" width="${size}" height="${size}" aria-hidden="true">
        ${
          isSelected
            ? `<circle cx="18" cy="18" r="16.5" fill="none" stroke="#e09f50" stroke-width="1.3" stroke-dasharray="4 2.5" class="doodle-selected-ring"/>`
            : ''
        }
        <!-- Organic hand-drawn cartographic medallion background -->
        <path
          d="M18,2.8 C26.8,2.6 33.4,9.2 33.2,18 C33.4,26.8 26.8,33.4 18,33.2 C9.2,33.4 2.6,26.8 2.8,18 C2.6,9.2 9.2,2.6 18,2.8 Z"
          fill="#0c110e"
          fill-opacity="0.94"
          stroke="${isSelected ? '#ffbe55' : color}"
          stroke-width="${isSelected ? '2.2' : '1.65'}"
        />
        <!-- Subtle inner notebook contour ring -->
        <circle
          cx="18"
          cy="18"
          r="12.6"
          fill="none"
          stroke="rgba(245, 240, 230, 0.14)"
          stroke-width="0.8"
          stroke-dasharray="${archetype === 'survey-unmapped' ? '2 2' : 'none'}"
        />
        ${innerSvg}
      </svg>
    </div>
  `;
}

/**
 * Generates a custom hand-drawn cartographic cluster medallion for lower zoom levels
 * to prevent marker overlap while showing actual category colors inside the cluster.
 */
export function buildClusterDoodleHtml({ count, dominantColor = '#e09f50', sampleNames = [] }) {
  const size = count >= 15 ? 46 : count >= 6 ? 40 : 36;
  return `
    <div
      class="tf-doodle-cluster"
      role="button"
      tabindex="0"
      aria-label="Cluster of ${count} Chennai locations (${sampleNames.slice(0, 3).join(', ')}). Click to zoom in."
      style="width:${size}px;height:${size}px;"
    >
      <svg viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="rgba(12, 17, 14, 0.88)" stroke="${dominantColor}" stroke-width="1.6" stroke-dasharray="5 2.5"/>
        <circle cx="22" cy="22" r="15.5" fill="#121915" stroke="#f5f0e6" stroke-width="1.3"/>
        <!-- Hand-drawn topographic contour arcs inside cluster -->
        <path d="M11,26 C15,21 29,21 33,26" fill="none" stroke="${dominantColor}" stroke-width="1.1" stroke-opacity="0.55" stroke-linecap="round"/>
        <path d="M13,29 C18,25 26,25 31,29" fill="none" stroke="#84c7a3" stroke-width="1" stroke-opacity="0.45" stroke-linecap="round"/>
        <text x="22" y="21" text-anchor="middle" fill="#f5f0e6" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11.5">${count}</text>
        <text x="22" y="30" text-anchor="middle" fill="#c7bca9" font-family="JetBrains Mono, monospace" font-size="6.5">SITES</text>
      </svg>
    </div>
  `;
}

/**
 * Generates small hand-drawn overlay doodle icons for Water Bodies, Transit Stations, and Landmarks.
 */
export function buildOverlayDoodleHtml(type) {
  if (type === 'water') {
    return `
      <div class="tf-overlay-doodle" title="Verified Water Body">
        <svg viewBox="0 0 22 22" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="8.5" fill="#0b1518" stroke="#4fa8c2" stroke-width="1.4"/>
          <path d="M6,10 C8,8.2 14,11.8 16,10 M6,13.5 C8,11.8 14,15.2 16,13.5" fill="none" stroke="#4fa8c2" stroke-width="1.35" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }
  if (type === 'metro' || type === 'rail') {
    const color = type === 'metro' ? '#e09f50' : '#c7bca9';
    return `
      <div class="tf-overlay-doodle" title="Verified Transit Node">
        <svg viewBox="0 0 22 22" width="19" height="19" aria-hidden="true">
          <rect x="3" y="3" width="16" height="16" rx="4" fill="#101512" stroke="${color}" stroke-width="1.4"/>
          <path d="M7,15 L9,7 L13,7 L15,15 M6.5,12.5 L15.5,12.5 M8,16.5 L14,16.5" fill="none" stroke="#f5f0e6" stroke-width="1.25" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }
  // Landmark / Public Facility
  return `
    <div class="tf-overlay-doodle" title="Verified Civic Landmark">
      <svg viewBox="0 0 22 22" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="8.5" fill="#121613" stroke="#c87a48" stroke-width="1.3"/>
        <path d="M6.5,15 L15.5,15 M8,15 L8,10 M11,15 L11,10 M14,15 L14,10 M6,10 L11,6.5 L16,10 Z" fill="none" stroke="#f5f0e6" stroke-width="1.15" stroke-linejoin="round"/>
      </svg>
    </div>
  `;
}
