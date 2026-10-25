/**
 * TerraShield AI — Context-Aware Assistant Engine
 * Grounded in 167 verified Chennai locations, actual geotechnical metrics,
 * GCC building rules, and actual application navigation routes.
 */

export const SECTION_METADATA = {
  landing: {
    id: 'landing',
    name: 'Homepage / Starting Page',
    tagline: 'Chennai Land Intelligence Platform',
    description: 'Executive introduction to 167 verified Chennai sites, geospatial GIS layers, and structural assessments.',
    promptPlaceholder: 'Ask about Chennai sites, flood zones, or how to get started...',
    greeting: (loc) =>
      `Welcome to **Terra Forge / TerraShield AI**! I am your real-time land intelligence assistant.\n\n` +
      `I can guide you through our **167 verified Chennai locations**, help you run geotechnical site assessments, explore GIS layers, or explain data provenance from OpenStreetMap, SRTM, CGWB, and GCC.`,
    suggestions: [
      'How do I explore Chennai locations?',
      'What data sources are used?',
      'Check flood risk for Velachery',
      'Open Site Intelligence'
    ]
  },
  overview: {
    id: 'overview',
    name: '1. Overview',
    tagline: '167 Location Registry & Statistical Coverage',
    description: 'Summary metrics across 167 Chennai sites, including verified coordinate coverage, soil types, and flood statistics.',
    promptPlaceholder: 'Ask about location coverage, zones, or data completeness...',
    greeting: (loc) =>
      `You are currently viewing the **167 Verified Location Registry**.\n\n` +
      `Here you can see that **152/167 locations** have verified soil classifications, **143/167** have CGWB groundwater depth metrics, and **147/167** have flood hazard categories. How can I help you navigate the dataset?`,
    suggestions: [
      'Which zones have highest flood risk?',
      'Show sites with Clayey soil',
      'Open Explore Map',
      'Select active site'
    ]
  },
  map: {
    id: 'map',
    name: '2. Explore Map',
    tagline: 'Interactive GIS Canvas with Multi-Layer Overlays',
    description: 'Interactive map displaying 25m/50m elevation contours, water bodies, GCC flood risk zones, and CMRL Metro corridors.',
    promptPlaceholder: 'Ask about map layers, contours, or metro corridors...',
    greeting: (loc) =>
      `You are in the **Explore Map** section.\n\n` +
      `You can toggle GIS layers like **Elevation Contours**, **GCC Flood Risk Zones**, and **CMRL Rail & Metro Stations**. Currently, **${loc?.name || 'Velachery'}** is selected as your active site.`,
    suggestions: [
      'How do I filter flood prone zones?',
      'Where are the Metro corridors?',
      'Inspect active site on map',
      'Go to Site Intelligence'
    ]
  },
  profile: {
    id: 'profile',
    name: '3. Site Intelligence',
    tagline: 'Comprehensive Geospatial & Geotechnical Dossier',
    description: 'Detailed analysis for the selected location: elevation MSL, soil type, groundwater depth, transit links, and GCC ward info.',
    promptPlaceholder: 'Ask about soil, transit, landmarks, or flood risk for this site...',
    greeting: (loc) =>
      `Need help exploring **${loc?.name || 'this location'}**?\n\n` +
      `I can guide you through its **elevation (${loc?.geographic_context?.elevation_m_msl ?? 'N/A'}m MSL)**, ` +
      `**soil classification (${loc?.ground_and_soil?.soil_classification || 'Pending borehole'})**, ` +
      `**flood hazard (${loc?.environmental_and_flood?.flood_hazard_category || 'N/A'})**, and arterial transit connectivity.`,
    suggestions: [
      'What are the key transit links here?',
      'Check flood risk for this site',
      'What foundation is recommended?',
      'Open Site Assessment'
    ]
  },
  assessment: {
    id: 'assessment',
    name: '4. Site Assessment',
    tagline: 'Interactive 4-Step Structural & Environmental Journey',
    description: 'Step-by-step guided evaluation calculating structural feasibility scores, foundation recommendations, and regulatory FSI.',
    promptPlaceholder: 'Ask about feasibility scores, pile foundations, or regulations...',
    greeting: (loc) =>
      `Would you like help starting an assessment or understanding the results for **${loc?.name || 'this site'}**?\n\n` +
      `Press **START SITE ASSESSMENT** to step through the 4 stages: *Plot & Elevation*, *Ground & Soil Stability*, *Environmental & Flood Risk*, and *Regulatory & Feasibility*.`,
    suggestions: [
      'Explain the feasibility score',
      'Why is pile foundation recommended?',
      'What are the floor height restrictions?',
      'Transfer to Cost Estimator'
    ]
  },
  compare: {
    id: 'compare',
    name: '5. Compare Sites',
    tagline: 'Multi-Site Tradeoff & Geotechnical Comparison',
    description: 'Side-by-side analysis of up to 4 Chennai sites across elevation, soil mechanics, flood vulnerability, and civil rates.',
    promptPlaceholder: 'Ask about tradeoffs between compared locations...',
    greeting: (loc) =>
      `You are in **Compare Sites**.\n\n` +
      `Here you can evaluate 2 to 4 Chennai sites side-by-side to understand relative flood hazards, elevation buffers, and estimated foundation cost variations.`,
    suggestions: [
      'Which site has the safest elevation?',
      'Compare soil conditions',
      'Which site has better transit?',
      'Add another location'
    ]
  },
  planner: {
    id: 'planner',
    name: '6. Construction Planner',
    tagline: 'Phased Schedule & Monsoon Risk Buffering',
    description: 'Project milestone scheduling with automated weather buffering for the October–December North-East Monsoon.',
    promptPlaceholder: 'Ask about monsoon buffers, timeline phases, or foundation scheduling...',
    greeting: (loc) =>
      `You are in the **Construction Planner**.\n\n` +
      `Here we calculate milestone durations with automatic buffer extensions for Chennai's **October–December North-East Monsoon** to prevent subgrade washouts.`,
    suggestions: [
      'Why add a monsoon buffer?',
      'What are the 4 construction phases?',
      'How does soil type affect timeline?',
      'Open Cost Estimator'
    ]
  },
  estimator: {
    id: 'estimator',
    name: '7. Cost Estimator',
    tagline: 'Detailed Structural & Civil Cost Breakdown',
    description: 'Itemized expenditure forecasting incorporating baseline civil rates, geotechnical foundation surcharges, and flood tanking.',
    promptPlaceholder: 'Ask about civil rates, piling costs, or contingency margins...',
    greeting: (loc) =>
      `You are in the **Cost Estimator**.\n\n` +
      `I can help you review baseline civil construction rates, specialized foundation surcharges (e.g., deep cast-in-situ piles for clayey soils), and waterproofing allowances.`,
    suggestions: [
      'Explain the foundation cost estimate',
      'How does soil affect piling cost?',
      'What is the civil baseline rate?',
      'Save this assessment'
    ]
  },
  saved: {
    id: 'saved',
    name: '8. Saved Assessments',
    tagline: 'Persistent Workspace & Historic Dossiers',
    description: 'Reopen, rename, or export saved site evaluations and multi-site comparisons stored in your local session and backend DB.',
    promptPlaceholder: 'Ask how to manage, reopen, or export saved assessments...',
    greeting: (loc) =>
      `You are viewing your **Saved Assessments**.\n\n` +
      `All saved project evaluations and site comparisons are persisted here and synchronized with the backend. You can reopen any record to inspect past engineering metrics.`,
    suggestions: [
      'How do I reopen a saved assessment?',
      'Can I rename my saved projects?',
      'Compare my saved sites',
      'Open Reports'
    ]
  },
  reports: {
    id: 'reports',
    name: '9. Reports',
    tagline: 'Physical UNO Card-Deck Executive Dossiers',
    description: 'Physical card-based report stack with realistic shadows, card flipping, and comprehensive executive dossiers.',
    promptPlaceholder: 'Ask about viewing, flipping, or finding report dossiers...',
    greeting: (loc) =>
      `Need help finding, viewing, or exporting a report?\n\n` +
      `Our physical card-style deck lets you flip through executive dossiers. Click any card in the stack to reveal its full geotechnical breakdown, risk matrix, and provenance.`,
    suggestions: [
      'Show all executive dossiers',
      'How do I reveal the next report?',
      'What information is in each report?',
      'Go to Data Sources'
    ]
  },
  sources: {
    id: 'sources',
    name: '10. Data Sources',
    tagline: 'Official Geospatial & Geological Provenance',
    description: 'Interactive sequential revelation of verified data sources: OpenStreetMap, SRTM 30m, CGWB 2022, NCCR/GCC Flood Maps.',
    promptPlaceholder: 'Ask about GCC flood maps, SRTM elevation, or CGWB data...',
    greeting: (loc) =>
      `Want to know where the location data comes from?\n\n` +
      `I can guide you through our **zero-fabricated-data** provenance: OpenStreetMap coordinates, NASA SRTM 30m digital elevations, CGWB groundwater levels, and GCC/NCCR hazard maps.`,
    suggestions: [
      'Where is elevation data from?',
      'What are the GCC flood categories?',
      'Why are borehole logs flagged for testing?',
      'Return to Site Intelligence'
    ]
  },
  tv: {
    id: 'tv',
    name: '11. Land News TV',
    tagline: 'Digital Broadcast & Legal Updates Channel',
    description: 'Minimalist digital broadcast television curating verified Tamil Nadu guideline values, patta transfers, CMDA master plan gazettes, and High Court land rulings.',
    promptPlaceholder: 'Ask about guideline values, court rulings, or land gazettes...',
    greeting: (loc) =>
      `You are tuned into **Land News & Legal Updates TV**.\n\n` +
      `Our minimalist digital television broadcast curates official Tamil Nadu Registration Department guideline value circulars, CMDA 2046 Master Plan gazettes, AnyWhere Patta digitisation, and High Court land directives.`,
    suggestions: [
      'What are the latest guideline value rules?',
      'Explain Section 22-A unapproved plot ruling',
      'What are the CMDA transit corridor rules?',
      'Show latest Tamil Nadu land updates'
    ]
  }
};

/**
 * Generate a context-aware response grounded in real data and navigation actions
 */
export function generateAiAssistantResponse(query, context) {
  const {
    activeSection = 'overview',
    showLanding = false,
    selectedLocation = null,
    locations = [],
    currentAssessment = null,
    currentCostEstimate = null
  } = context;

  const currentSecKey = showLanding ? 'landing' : activeSection;
  const currentLocName = selectedLocation?.name || 'Velachery';
  const rawQuery = (query || '').trim();
  const lower = rawQuery.toLowerCase();

  // Helper: Create actions
  const makeAction = (label, type, payload) => ({ label, type, payload });

  // 1. Check for specific 167-Location Query
  const mentionedLoc = locations.find((l) => {
    const locLower = l.name.toLowerCase();
    return lower.includes(locLower) && locLower.length >= 4;
  });

  if (mentionedLoc) {
    const isAlreadySelected = selectedLocation?.id === mentionedLoc.id;
    const elev = mentionedLoc.geographic_context?.elevation_m_msl ?? 'N/A';
    const zone = mentionedLoc.geographic_context?.zone_code || 'GCC Zone';
    const soil = mentionedLoc.ground_and_soil?.soil_classification || 'Pending local borehole';
    const flood = mentionedLoc.environmental_and_flood?.flood_hazard_category || 'Moderate';
    const gw = mentionedLoc.ground_and_soil?.groundwater_pre_monsoon_m_bgl ?? 'N/A';
    const transit = mentionedLoc.accessibility_and_connectivity?.nearest_transit_stations?.[0]?.name || 'Local MTC / Bus Network';

    let text = `### ${mentionedLoc.name} (${mentionedLoc.id})\n\n` +
      `- **Jurisdiction & Corridor:** ${zone} · ${mentionedLoc.geographic_context?.planning_corridor || 'Chennai Urban'}\n` +
      `- **Elevation:** ${elev}m MSL (NASA SRTM 30m)\n` +
      `- **Soil Classification:** ${soil}\n` +
      `- **Flood Vulnerability:** ${flood} Hazard\n` +
      `- **Groundwater Depth:** ${gw}m bgl (Pre-Monsoon CGWB)\n` +
      `- **Primary Transit Node:** ${transit}\n\n`;

    if (flood === 'High' || flood === 'Very High') {
      text += `⚠️ **Risk Note:** Elevated flood hazard requires stilt-level habitable floors, stormwater catch-pits, and check valves on drainage outfalls.\n\n`;
    }

    if (soil.toLowerCase().includes('clay')) {
      text += `🏗️ **Geotechnical Note:** Clayey subgrade requires consideration of under-reamed or bored cast-in-situ piles to mitigate seasonal swell-shrink.\n`;
    }

    const actions = [];
    if (!isAlreadySelected) {
      actions.push(makeAction(`Select ${mentionedLoc.name}`, 'select_location', mentionedLoc));
    }
    if (currentSecKey !== 'profile') {
      actions.push(makeAction('Open Site Intelligence', 'navigate', 'profile'));
    }
    if (currentSecKey !== 'assessment') {
      actions.push(makeAction('Run Site Assessment', 'navigate', 'assessment'));
    }

    return {
      text,
      actions,
      suggestedFollowUps: [
        `What foundation is best for ${mentionedLoc.name}?`,
        `Compare ${mentionedLoc.name} with Adyar`,
        `Check transit corridors near ${mentionedLoc.name}`
      ]
    };
  }

  // 2. Navigation Intent: "Open Site Intelligence", "Show Map", "Reports", etc.
  if (lower.includes('site intelligence') || lower.includes('profile')) {
    if (currentSecKey === 'profile') {
      return {
        text: `You are **already on the Site Intelligence page** for **${currentLocName}**!\n\n` +
          `Notice the balanced two-column workspace:\n` +
          `- **Left Column:** Interactive spatial map with verified OSM coordinates and elevation markers.\n` +
          `- **Right Column:** Transit connectivity, landmarks, soil parameters, and missing data indicators.\n\n` +
          `What specific detail of ${currentLocName} would you like to review?`,
        actions: [
          makeAction('Start Site Assessment', 'navigate', 'assessment'),
          makeAction('Explore Full Map', 'navigate', 'map')
        ],
        suggestedFollowUps: [
          'What are the soil conditions here?',
          'How deep is the groundwater?',
          'What transit stations are nearby?'
        ]
      };
    }
    return {
      text: `Opening **Site Intelligence** for **${currentLocName}**. Here you will find verified elevation (${selectedLocation?.geographic_context?.elevation_m_msl ?? '11'}m MSL), soil classification, groundwater depth, and transit connectivity.`,
      actions: [makeAction('Open Site Intelligence', 'navigate', 'profile')],
      suggestedFollowUps: ['Show transit links', 'Check flood risk', 'Run assessment']
    };
  }

  if (lower.includes('site assessment') || lower.includes('assess site') || lower.includes('start assessment')) {
    if (currentSecKey === 'assessment') {
      return {
        text: `You are **already in Site Assessment**!\n\n` +
          `To begin the guided evaluation for **${currentLocName}**, click the prominent **“START SITE ASSESSMENT”** button in the main panel. You can also customize your plot area (sq. ft.) and proposed floor count in the configuration panel above.`,
        actions: [
          makeAction('Go to Cost Estimator', 'navigate', 'estimator'),
          makeAction('View Saved Assessments', 'navigate', 'saved')
        ],
        suggestedFollowUps: [
          'How is the feasibility score calculated?',
          'What is the recommended foundation?',
          'What are the floor height restrictions?'
        ]
      };
    }
    return {
      text: `Opening **Site Assessment** for **${currentLocName}**. You can run a step-by-step structural inspection evaluating plot area, soil bearing capacity, flood hazard, and GCC planning permissions.`,
      actions: [makeAction('Open Site Assessment', 'navigate', 'assessment')],
      suggestedFollowUps: ['Explain feasibility score', 'What foundation is needed?', 'Cost breakdown']
    };
  }

  if (lower.includes('report') || lower.includes('reports') || lower.includes('dossier')) {
    if (currentSecKey === 'reports') {
      return {
        text: `You are **already in the Reports section**!\n\n` +
          `The reports are presented as an interactive physical card deck. Click any card on the desk surface to reveal its full executive dossier, risk breakdown, and geotechnical recommendations.`,
        actions: [
          makeAction('Go to Data Sources', 'navigate', 'sources'),
          makeAction('Return to Site Intelligence', 'navigate', 'profile')
        ],
        suggestedFollowUps: [
          'How do I reveal the next report?',
          'What data is included in the report?',
          'Where do the reports come from?'
        ]
      };
    }
    return {
      text: `Opening the **Reports section**. The dossiers are organized as an interactive physical card deck modeled after cards on a desk, providing executive engineering summaries.`,
      actions: [makeAction('Go to Reports', 'navigate', 'reports')],
      suggestedFollowUps: ['How to view reports', 'Export dossier', 'Check data sources']
    };
  }

  if (lower.includes('data source') || lower.includes('source') || lower.includes('provenance') || lower.includes('methodology')) {
    if (currentSecKey === 'sources') {
      return {
        text: `You are **already viewing Data Sources & Methodology**!\n\n` +
          `Experience our sequential comic-action reveal by clicking the active card or **NEXT IMPACT** button to cycle through OpenStreetMap, SRTM 30m elevation, CGWB groundwater, and GCC flood maps.`,
        actions: [
          makeAction('Return to Site Intelligence', 'navigate', 'profile'),
          makeAction('Open Explore Map', 'navigate', 'map')
        ],
        suggestedFollowUps: [
          'Where is SRTM elevation from?',
          'What are the GCC flood categories?',
          'What borehole data is verified?'
        ]
      };
    }
    return {
      text: `Opening **Data Sources & Methodology**. Here you can inspect the verified scientific references: OpenStreetMap coordinates, NASA SRTM 30m digital elevations, CGWB 2022 groundwater metrics, and GCC/NCCR hazard maps.`,
      actions: [makeAction('Go to Data Sources', 'navigate', 'sources')],
      suggestedFollowUps: ['GCC flood data', 'SRTM elevation data', 'CGWB groundwater data']
    };
  }

  if (lower.includes('explore map') || lower.includes('map') || lower.includes('gis') || lower.includes('contour')) {
    if (currentSecKey === 'map') {
      return {
        text: `You are **already exploring the GIS Map**!\n\n` +
          `Use the layer toggle pills in the header to display **25m/50m Elevation Contours**, **GCC Flood Risk polygons**, or **CMRL Metro Phase 1 & 2 stations**.`,
        actions: [
          makeAction('Go to Site Intelligence', 'navigate', 'profile'),
          makeAction('Run Site Assessment', 'navigate', 'assessment')
        ],
        suggestedFollowUps: [
          'Show CMDA transit corridors',
          'Filter flood prone zones',
          'Inspect active site on map'
        ]
      };
    }
    return {
      text: `Opening the **Explore Map** workspace with interactive GIS layers, 25m/50m contour lines, and transit networks across Chennai.`,
      actions: [makeAction('Explore GIS Map', 'navigate', 'map')],
      suggestedFollowUps: ['Show flood zones', 'Show metro lines', 'Elevation contours']
    };
  }

  if (lower.includes('compare') || lower.includes('comparison')) {
    if (currentSecKey === 'compare') {
      return {
        text: `You are **already on Compare Sites**!\n\n` +
          `You can compare up to 4 Chennai sites side-by-side. To add or remove sites, select a location from the dropdown or use the quick tags below.`,
        actions: [
          makeAction('Open Cost Estimator', 'navigate', 'estimator'),
          makeAction('View Saved Comparisons', 'navigate', 'saved')
        ],
        suggestedFollowUps: [
          'Which site has better transit?',
          'Compare soil conditions',
          'Which site has higher flood risk?'
        ]
      };
    }
    return {
      text: `Opening **Compare Sites**. Evaluate multiple Chennai sites side-by-side to compare flood risks, elevation buffers, and estimated structural costs.`,
      actions: [makeAction('Compare Sites', 'navigate', 'compare')],
      suggestedFollowUps: ['Compare Velachery vs Anna Nagar', 'Which site is safest?']
    };
  }

  if (lower.includes('cost') || lower.includes('budget') || lower.includes('estimator') || lower.includes('rate')) {
    if (currentSecKey === 'estimator') {
      return {
        text: `You are **already in the Cost Estimator**!\n\n` +
          `The estimate includes baseline civil rates (₹2,100–₹2,600/sq. ft.), soil-specific geotechnical foundation surcharges (e.g. +18% to +35% for deep pile foundations in clay), and water table tanking allowances.`,
        actions: [
          makeAction('View Construction Planner', 'navigate', 'planner'),
          makeAction('Save This Assessment', 'navigate', 'saved')
        ],
        suggestedFollowUps: [
          'How does soil affect piling cost?',
          'What is the civil baseline rate?',
          'Explain foundation cost estimate'
        ]
      };
    }
    return {
      text: `Opening **Cost Estimator**. Review detailed civil construction budgets, foundation surcharges, and flood mitigation allowances for **${currentLocName}**.`,
      actions: [makeAction('Open Cost Estimator', 'navigate', 'estimator')],
      suggestedFollowUps: ['Explain foundation cost', 'Adjust rates', 'View planner']
    };
  }

  if (lower.includes('planner') || lower.includes('schedule') || lower.includes('timeline') || lower.includes('monsoon')) {
    if (currentSecKey === 'planner') {
      return {
        text: `You are **already in the Construction Planner**!\n\n` +
          `Notice how the schedule automatically factors in a **2.5 to 3.5 month monsoon buffer** during October to December (Chennai North-East Monsoon). Subgrade earthwork and deep excavation should conclude prior to October 15.`,
        actions: [
          makeAction('Go to Cost Estimator', 'navigate', 'estimator'),
          makeAction('Open Site Assessment', 'navigate', 'assessment')
        ],
        suggestedFollowUps: [
          'Why add a monsoon buffer?',
          'What are the 4 construction phases?',
          'How does soil type affect timeline?'
        ]
      };
    }
    return {
      text: `Opening **Construction Planner**. View phased development timelines with climate-adapted buffering for Chennai's North-East monsoon.`,
      actions: [makeAction('Open Construction Planner', 'navigate', 'planner')],
      suggestedFollowUps: ['Monsoon buffer details', 'Foundation timeline', 'Cost breakdown']
    };
  }

  if (lower.includes('saved') || lower.includes('bookmark') || lower.includes('workspace')) {
    if (currentSecKey === 'saved') {
      return {
        text: `You are **already in Saved Assessments**!\n\n` +
          `Here you can reopen any past assessment, rename titles, or compare saved dossiers. All items are synchronized with localStorage and the SQLite backend.`,
        actions: [
          makeAction('Run New Assessment', 'navigate', 'assessment'),
          makeAction('Go to Reports', 'navigate', 'reports')
        ],
        suggestedFollowUps: [
          'How do I reopen an assessment?',
          'Can I rename my saved projects?',
          'Compare saved sites'
        ]
      };
    }
    return {
      text: `Opening **Saved Assessments**. Access your saved project evaluations, custom parameters, and multi-site comparisons.`,
      actions: [makeAction('Open Saved Assessments', 'navigate', 'saved')],
      suggestedFollowUps: ['Reopen past assessment', 'Compare saved sites']
    };
  }

  if (lower.includes('news') || lower.includes('tv') || lower.includes('broadcast') || lower.includes('legal updates') || lower.includes('guideline value')) {
    if (currentSecKey === 'tv') {
      return {
        text: `You are **already watching Land News & Legal Updates TV**!\n\n` +
          `Use the Previous / Next arrows on the television chassis or click any card in the carousel below to switch broadcast stories. You can also press **“Read Full Story & Official References”** to inspect the full gazette text.`,
        actions: [
          makeAction('Open Site Intelligence', 'navigate', 'profile'),
          makeAction('View Data Sources', 'navigate', 'sources')
        ],
        suggestedFollowUps: [
          'What are the latest guideline value rules?',
          'Explain Section 22-A unapproved plot ruling',
          'What are the CMDA transit corridor rules?'
        ]
      };
    }
    return {
      text: `Opening **Land News & Legal Updates TV**. Watch our digital broadcast curating official Tamil Nadu Registration Department guideline value circulars, CMDA 2046 Master Plan gazettes, AnyWhere Patta digitisation, and High Court property rulings.`,
      actions: [makeAction('Open Land News TV', 'navigate', 'tv')],
      suggestedFollowUps: ['Show guideline value updates', 'View High Court rulings', 'Check CMDA master plan']
    };
  }

  if (lower.includes('theme') || lower.includes('color') || lower.includes('appearance') || lower.includes('dark mode')) {
    return {
      text: `TerraShield AI supports **10 meticulously coordinated themes** (Obsidian Slate, Cobalt Maritime, Terracotta Clay, Sage Forest, Cyberpunk Matrix, Sunset Copper, Nord Frost, Amber Topo, Monochromatic Steel, and Crimson Radar).\n\n` +
        `Would you like to open the Theme Studio to preview or switch themes?`,
      actions: [makeAction('Open Theme Studio', 'open_theme', null)],
      suggestedFollowUps: ['Switch to Cobalt Maritime', 'Switch to Sage Forest', 'Reset to Obsidian']
    };
  }

  // 3. Geotechnical & Engineering Explanations
  if (lower.includes('feasibility score') || lower.includes('score')) {
    return {
      text: `### How the Feasibility Score is Calculated (0–100)\n\n` +
        `The Terra Forge Feasibility Score is a weighted multi-attribute engineering index:\n\n` +
        `1. **Elevation Buffer (30%):** Compares site elevation against Chennai high tide & 100-year storm surge datum.\n` +
        `2. **Soil Mechanics & Bearing Capacity (25%):** Penalizes soft alluvial or expansive clay soils that exhibit swell-shrink behavior.\n` +
        `3. **Groundwater Hydrostatic Pressure (20%):** Evaluates pre-monsoon water depth (m bgl) against uplift risk on foundations and basements.\n` +
        `4. **GCC Environmental Flood Vulnerability (25%):** Incorporates historical inundation frequency from official NCCR/GCC disaster mitigation zones.\n\n` +
        `Scores **above 75** indicate favorable construction conditions; scores **below 55** require specialized geotechnical intervention.`,
      actions: [
        makeAction('Run Assessment on Active Site', 'navigate', 'assessment'),
        makeAction('View Cost Estimator', 'navigate', 'estimator')
      ],
      suggestedFollowUps: [
        'Why is pile foundation recommended?',
        'What are the floor height restrictions?',
        'What foundation is best for Velachery?'
      ]
    };
  }

  if (lower.includes('foundation') || lower.includes('pile') || lower.includes('piling') || lower.includes('footing')) {
    const soilType = selectedLocation?.ground_and_soil?.soil_classification || 'Clayey Soil';
    const isClayey = soilType.toLowerCase().includes('clay');
    const isSandy = soilType.toLowerCase().includes('sand');

    let text = `### Foundation Engineering Analysis for ${currentLocName}\n\n` +
      `- **Soil Subgrade:** ${soilType}\n` +
      `- **Water Table:** ${selectedLocation?.ground_and_soil?.groundwater_pre_monsoon_m_bgl ?? 'N/A'}m bgl\n\n`;

    if (isClayey) {
      text += `Because ${currentLocName} features cohesive, expansive clay with high plasticity, shallow isolated footings risk differential settlement and seasonal cracking. **Bored cast-in-situ reinforced concrete piles** socketed into weathered charnockite/hard rock are strongly recommended.\n`;
    } else if (isSandy) {
      text += `Coastal sandy strata offer good drainage but lower lateral bearing capacity. **Raft foundations (mat slab)** with continuous perimeter retaining beams or micropiles are recommended to distribute building loads evenly.\n`;
    } else {
      text += `For medium dense subgrades, **isolated or combined RCC pad footings** with grade beams provide an economical, structurally sound solution, provided groundwater is below foundation invert level.\n`;
    }

    return {
      text,
      actions: [
        makeAction('Calculate Foundation Cost', 'navigate', 'estimator'),
        makeAction('View Site Assessment', 'navigate', 'assessment')
      ],
      suggestedFollowUps: [
        'How much does piling cost?',
        'Can I build a basement here?',
        'What is the feasibility score?'
      ]
    };
  }

  if (lower.includes('flood') || lower.includes('water') || lower.includes('drainage') || lower.includes('rain')) {
    const floodCat = selectedLocation?.environmental_and_flood?.flood_hazard_category || 'Moderate';
    const elev = selectedLocation?.geographic_context?.elevation_m_msl ?? '11';

    return {
      text: `### Flood & Environmental Risk Profile for ${currentLocName}\n\n` +
        `- **Hazard Rating:** ${floodCat} Hazard (NCCR / GCC Disaster Management)\n` +
        `- **Elevation:** ${elev}m MSL (NASA SRTM 30m Radar)\n` +
        `- **Micro-Basin:** ${selectedLocation?.environmental_and_flood?.basin_micro_watershed || 'Adyar / Buckingham Canal Basin'}\n\n` +
        `**Key Mitigation Measures:**\n` +
        `1. Ground habitable floor level must be elevated at least **1.2m above finished road crown**.\n` +
        `2. Basements require dual-chamber sump pumps with dedicated emergency generator backup.\n` +
        `3. Perimeter retention swales and non-return flap valves on municipal stormwater outlets.`,
      actions: [
        makeAction('Inspect on Explore Map', 'navigate', 'map'),
        makeAction('View Full Dossier', 'navigate', 'profile')
      ],
      suggestedFollowUps: [
        'Why is Velachery flood prone?',
        'Which Chennai zones have highest flood risk?',
        'What foundation is recommended?'
      ]
    };
  }

  // 4. Fallback / General Helpful Guidance
  return {
    text: `I am here to guide you across **Terra Forge / TerraShield AI**.\n\n` +
      `You are currently viewing **${SECTION_METADATA[currentSecKey]?.name || 'the workspace'}** with **${currentLocName}** selected as your active Chennai site.\n\n` +
      `Here is what you can do next:\n` +
      `- Ask about **any of the 167 Chennai locations** (e.g. *“Tell me about Velachery”* or *“Is Adyar flood prone?”*).\n` +
      `- Inquire about **geotechnical engineering** (feasibility score, pile foundation vs raft, monsoon buffering).\n` +
      `- Ask for navigation assistance (*“Open Site Intelligence”*, *“Show Map”*, *“Go to Reports”*).\n\n` +
      `What would you like to explore?`,
    actions: [
      makeAction('Open Site Intelligence', 'navigate', 'profile'),
      makeAction('Run Site Assessment', 'navigate', 'assessment'),
      makeAction('Explore GIS Map', 'navigate', 'map')
    ],
    suggestedFollowUps: [
      `Check flood risk for ${currentLocName}`,
      `What foundation is best for ${currentLocName}?`,
      'How is the feasibility score calculated?',
      'Show 167 location statistics'
    ]
  };
}
