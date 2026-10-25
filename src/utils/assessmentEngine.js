/**
 * Terra Forge — Explainable Rule-Based Site Assessment, Recommendation & Cost Engine
 * Strictly separates verified location facts, regional dataset observations, user assumptions,
 * deterministic calculations, and inspectable engineering rules (IS 456, IS 1893, IS 1904, TNCDBR 2019).
 * Does NOT invent scientific risk scores, suitability percentages, or machine-learning predictions.
 */

export const DEFAULT_PROJECT_INPUTS = {
  projectCategory: 'Residential Multi-Family (Stilt + 4 Floors)',
  plotAreaSqFt: 3600,
  fsiRatio: 2.0,
  proposedFloors: 4,
  includeBasement: false,
  budgetLakhs: 280,
  materialPreference: 'PPC / GGBS Blended Concrete + Fe 500D CRS Rebar',
  siteConstraintNotes: 'Standard urban plot access; verify adjacent building setback and GCC storm drain invert.'
};

export const DEFAULT_COST_RATES = {
  baseStructuralShellPerSqFt: 1650,
  architecturalFinishingPerSqFt: 920,
  mepAndServicesPerSqFt: 380,
  geotechInvestigationPerBorehole: 28000,
  contingencyPct: 8
};

export function runSiteAssessment(location, userInputs = DEFAULT_PROJECT_INPUTS) {
  if (!location) return null;

  const plotSqFt = Math.max(300, Number(userInputs.plotAreaSqFt) || 2400);
  const plotSqM = Number((plotSqFt / 10.7639).toFixed(1));
  const fsi = Math.max(0.5, Math.min(4.5, Number(userInputs.fsiRatio) || 2.0));
  const estimatedBuiltUpSqFt = Math.round(plotSqFt * fsi);
  const estimatedBuiltUpSqM = Number((estimatedBuiltUpSqFt / 10.7639).toFixed(1));
  const floors = Math.max(1, Math.min(30, Number(userInputs.proposedFloors) || 4));
  const includeBasement = Boolean(userInputs.includeBasement);
  const budgetLakhs = Math.max(10, Number(userInputs.budgetLakhs) || 200);

  const coastKm = location.geographic_context?.coastal_distance_km ?? 9.9;
  const elevM = location.geographic_context?.elevation_m_msl;
  const soilClass = location.ground_and_soil?.soil_classification;
  const lithology = location.ground_and_soil?.geological_formation;
  const preGw = location.ground_and_soil?.groundwater_pre_monsoon_m_bgl;
  const postGw = location.ground_and_soil?.groundwater_post_monsoon_m_bgl;
  const floodCat = location.environmental_and_flood?.flood_hazard_category;
  const nearestWater = location.environmental_and_flood?.nearest_water_body;

  // Deterministic Rule 1: IS 456:2000 Coastal Exposure & Durability
  let exposureTier = 'Moderate (IS 456 Table 3 — Inland Urban > 5.0 km from coast)';
  let minConcreteGrade = 'M25 (M30 for sub-structure)';
  let nominalCoverMm = 40;
  let corrosionAllowancePct = 0;

  if (coastKm <= 1.5) {
    exposureTier = 'Very Severe / Severe Direct Marine Spray (IS 456 Table 3 — <= 1.5 km from Bay of Bengal)';
    minConcreteGrade = 'M35 structural concrete (IS 456 Table 5)';
    nominalCoverMm = 50;
    corrosionAllowancePct = 6.5;
  } else if (coastKm <= 5.0) {
    exposureTier = 'Severe Near-Coastal Zone (IS 456 Table 3 — 1.5 to 5.0 km from Bay of Bengal)';
    minConcreteGrade = 'M30 structural concrete (IS 456 Table 5)';
    nominalCoverMm = 45;
    corrosionAllowancePct = 3.5;
  }

  // Deterministic Rule 2: Plinth Elevation & Flood/Drainage Protection
  const isHighFlood =
    (floodCat && floodCat.includes('High')) ||
    (elevM !== null && elevM <= 6.0) ||
    (nearestWater && nearestWater.distance_km <= 0.65);

  const recommendedPlinthMeters = isHighFlood ? 1.35 : elevM !== null && elevM <= 9.0 ? 0.95 : 0.75;
  const floodMitigationAllowancePct = isHighFlood ? 5.5 : elevM !== null && elevM <= 9.0 ? 2.5 : 1.0;

  // Deterministic Rule 3: Preliminary Borehole Exploration Scope per IS 1892
  const recommendedBoreholes = plotSqM <= 400 ? 2 : plotSqM <= 1200 ? 3 : 4;
  const isSoftClayOrAlluvial =
    (soilClass && (soilClass.includes('Clay') || soilClass.includes('Alluvial'))) ||
    (lithology && lithology.includes('Clay'));
  const targetBoreholeDepthM = floors >= 6 || isSoftClayOrAlluvial ? 20 : 12;
  const subStructureAllowancePct =
    (isSoftClayOrAlluvial ? 7.0 : 3.0) + (includeBasement ? 8.5 : 0);

  // Build Explainable Recommendations (Section 13 + Premium Structured Evidence)
  const recommendations = [];

  // Rec 1: Coastal & Concrete Durability
  const isSevereCoast = coastKm <= 1.5;
  const isNearCoast = coastKm <= 5.0;
  recommendations.push({
    id: 'REC-DURABILITY-IS456',
    category: 'Materials & Corrosion Durability',
    iconType: 'durability',
    title: `Specify ${minConcreteGrade} with ${nominalCoverMm} mm Cover for ${coastKm} km Coastal Exposure`,
    conciseSummary: `Site is ${coastKm} km from the Bay of Bengal (${exposureTier.split('(')[0].trim()}), requiring ${minConcreteGrade} and ${nominalCoverMm} mm reinforcement cover.`,
    locationLabel: `${location.name} (${location.id})`,
    evidenceIndicator: 'Verified OSM Geodesic + IS 456 Table 3',
    priorityIndicator: isSevereCoast
      ? { label: 'Critical Marine Exposure (<= 1.5 km)', tone: 'critical' }
      : isNearCoast
        ? { label: 'Elevated Coastal Exposure (<= 5.0 km)', tone: 'warning' }
        : { label: 'Standard IS 456 Durability Rule', tone: 'standard' },
    recommendationText:
      coastKm <= 5.0
        ? `Adopt ${minConcreteGrade} using Portland Pozzolana Cement (PPC) or 40–50% GGBS replacement, Fe 500D CRS (Corrosion Resistant Steel) reinforcement, and ${nominalCoverMm} mm nominal cover.`
        : `Adopt ${minConcreteGrade} with Fe 500D ductile TMT reinforcement and ${nominalCoverMm} mm sub-structure cover (${userInputs.materialPreference}).`,
    supportingSourceData: `Verified centroid is ${coastKm} km from the Bay of Bengal shoreline (Coordinates: ${location.coordinates.lat}°N, ${location.coordinates.lon}°E; OSM Node #${location.coordinates.osm_id}).`,
    evidenceMetrics: [
      { label: 'Shoreline Distance', value: `${coastKm} km`, unit: 'Geodesic WGS84', source: 'OpenStreetMap Coastline' },
      { label: 'IS 456 Exposure Class', value: exposureTier.split('(')[0].trim(), unit: 'IS 456 Table 3', source: 'BIS IS 456:2000' },
      { label: 'Minimum Concrete & Cover', value: `${minConcreteGrade.split('(')[0].trim()} · ${nominalCoverMm} mm`, unit: 'IS 456 Table 5', source: 'Rule-Computed' },
      { label: 'Location Centroid', value: `${location.coordinates.lat}°N, ${location.coordinates.lon}°E`, unit: `OSM #${location.coordinates.osm_id}`, source: 'Directly Sourced' }
    ],
    ruleId: 'RULE-COAST-EXP-01',
    triggerCondition: `coastal_distance_km (${coastKm} km) ${coastKm <= 1.5 ? '<= 1.5 km (Very Severe/Severe)' : coastKm <= 5.0 ? 'between 1.5 km and 5.0 km (Severe)' : '> 5.0 km (Moderate Inland)'}`,
    reasoningExplanation: `RULE-COAST-EXP-01 evaluates geodesic distance to the Chennai coastline against IS 456:2000 Table 3. Because ${location.name} lies ${coastKm} km from the coast, it falls under ${exposureTier}. Airborne marine chlorides and humid coastal groundwater accelerate reinforcement depassivation unless water-cement ratio is restricted (<= 0.45) and blended pozzolanic/slag binders are used.`,
    sourceReference: 'Bureau of Indian Standards IS 456:2000 (Table 3 & Table 5) & OpenStreetMap Coastline Geometry',
    traceableReferences: [
      { name: 'BIS IS 456:2000 — Plain and Reinforced Concrete (Table 3 & Table 5)', date: '2000 (Reaffirmed 2021)', url: 'https://www.bis.gov.in/' },
      { name: `OpenStreetMap Verified Node #${location.coordinates.osm_id} & Bay of Bengal Shoreline`, date: '2025-02', url: `https://www.openstreetmap.org/node/${location.coordinates.osm_id}` }
    ],
    limitations: 'Does not replace chemical testing of site groundwater for exact chloride (Cl⁻) and sulfate (SO₃) concentration in mg/L per IS 3025.',
    suggestedNextSteps: [
      'Collect a water sample from an existing borewell on or adjacent to the plot and test pH, chlorides, and sulfates per IS 456 Clause 8.2.',
      'Specify minimum cementitious content >= 340 kg/m³ in structural tender documents.'
    ],
    linkedMapLayer: 'coastline'
  });

  // Rec 2: Hydrological Basin, Plinth & Basement Dewatering
  recommendations.push({
    id: 'REC-HYDRO-PLINTH',
    category: 'Hydrology, Plinth & Storm Drainage',
    iconType: 'hydrology',
    title: `Set Finished Plinth at +${recommendedPlinthMeters.toFixed(2)} m Above Road Crown${includeBasement ? ' & Re-Evaluate Basement Flood Risk' : ''}`,
    conciseSummary: `Terrain elevation (${elevM ?? 'N/A'} m MSL) and ${location.environmental_and_flood.watershed_basin} drainage context require a +${recommendedPlinthMeters.toFixed(2)} m plinth offset${includeBasement ? ' and urgent basement buoyancy review' : ''}.`,
    locationLabel: `${location.name} (${location.id})`,
    evidenceIndicator: floodCat ? 'SRTM 90m + NCCR/GCC Basin Record' : 'SRTM 90m + OSM Hydrography (Outer CMA)',
    priorityIndicator:
      isHighFlood && includeBasement
        ? { label: 'Critical: Basement in High Flood Zone', tone: 'critical' }
        : isHighFlood
          ? { label: 'High Flood / Low-Lying Basin Sensitivity', tone: 'warning' }
          : { label: 'Standard Plinth & Drainage Rule', tone: 'standard' },
    recommendationText: isHighFlood
      ? `Elevate finished ground/stilt plinth to at least +${recommendedPlinthMeters.toFixed(2)} m above adjacent road crown, utilize stilt parking instead of habitable ground-floor rooms, and install non-return backflow valves on storm drains.${includeBasement ? ' CAUTION: You enabled a basement in a high flood/shallow water-table zone — strongly recommend replacing basement with stilt podium.' : ''}`
      : `Maintain finished plinth level at +${recommendedPlinthMeters.toFixed(2)} m above road crown with dual rainwater harvesting percolation pits per TNCDBR 2019.${includeBasement ? ' Provide crystalline waterproofing and perimeter sump dewatering for the proposed basement.' : ''}`,
    supportingSourceData: `Copernicus/SRTM Elevation: ${elevM !== null ? `${elevM} m MSL` : 'Unavailable'}; Watershed Basin: ${location.environmental_and_flood.watershed_basin}; Nearest OSM Water Body: ${nearestWater ? `${nearestWater.name} (${nearestWater.distance_km} km)` : 'None within immediate buffer'}; Flood Status: ${floodCat || 'Unavailable (Outside GCC 200-Ward CFLOWS boundary)'}; Post-Monsoon Water Level: ${postGw || 'Unavailable'}.`,
    evidenceMetrics: [
      { label: 'Terrain Elevation', value: elevM !== null ? `${elevM} m MSL` : 'Unavailable', unit: '90m Grid Vertical', source: 'Copernicus DEM / SRTM' },
      { label: 'Watershed Basin', value: location.environmental_and_flood.watershed_basin, unit: 'Regional Sub-Basin', source: 'NCCR / WRD Chennai' },
      { label: 'Nearest Water Body', value: nearestWater ? `${nearestWater.name} (${nearestWater.distance_km} km)` : 'None in buffer', unit: 'Geodesic Distance', source: 'OpenStreetMap Hydrography' },
      { label: 'Post-Monsoon Water Table', value: postGw || 'Unavailable locally', unit: 'Meters bgl (Jan)', source: 'CGWB Chennai Brochure' }
    ],
    ruleId: 'RULE-HYDRO-PLINTH-02',
    triggerCondition: `elevation_m_msl (${elevM ?? 'N/A'} m) + flood_hazard (${floodCat || 'Unmapped'}) + includeBasement (${includeBasement ? 'True' : 'False'})`,
    reasoningExplanation: `RULE-HYDRO-PLINTH-02 combines SRTM terrain elevation (${elevM ?? 'N/A'} m MSL), geodesic proximity to ${nearestWater ? nearestWater.name : 'primary drainage channels'}, and regional post-monsoon groundwater depth (${postGw || 'unverified at locality scale'}). ${includeBasement ? 'Because a basement excavation extends 3.0–4.5 m below ground level, it will intersect the seasonal post-monsoon groundwater zone (' + (postGw || 'shallow coastal/alluvial table') + '), creating hydrostatic uplift (buoyancy) and seepage risks.' : 'Elevating the plinth protects ground-floor electrical panels and finishes from extreme northeast monsoon street surcharging.'}`,
    sourceReference: 'NCCR CFLOWS-Chennai Basin Framework, Copernicus DEM GLO-90 (Open-Meteo), CGWB Chennai Brochure & TNCDBR 2019',
    traceableReferences: [
      { name: 'Copernicus DEM GLO-90 / NASA SRTM v3 via Open-Meteo Elevation API', date: '2025-02', url: 'https://open-meteo.com/en/docs/elevation-api' },
      { name: 'NCCR CFLOWS-Chennai Flood Warning System & GCC Disaster Management Plan', date: '2024', url: 'https://www.nccr.gov.in/' },
      { name: 'Tamil Nadu Combined Development and Building Rules (TNCDBR) — RWH & Plinth Norms', date: '2019', url: 'https://www.cmdachennai.gov.in/' }
    ],
    limitations: 'SRTM 90m grid elevation reflects macro-topography, not localized road re-surfacing or plot earth-filling.',
    suggestedNextSteps: [
      'Conduct a dumpy-level / Total Station spot-level survey tying plot corners to the nearest GCC Storm Water Drain (SWD) invert and road crown.',
      'Verify Highest Flood Level (HFL) marks from December 2015 and December 2023 (Cyclone Michaung) on the immediate street.'
    ],
    linkedMapLayer: 'water'
  });

  // Rec 3: Geotechnical Investigation & Foundation Planning
  recommendations.push({
    id: 'REC-GEOTECH-IS1892',
    category: 'Ground Intelligence & Sub-Structure Investigation',
    iconType: 'geotech',
    title: `Execute ${recommendedBoreholes} Geotechnical Boreholes to ${targetBoreholeDepthM} m Depth (IS 1892)`,
    conciseSummary: `Plot footprint (${plotSqM} sq.m) and ${floors}-storey loading across ${lithology.split('(')[0].trim()} require ${recommendedBoreholes} boreholes to ${targetBoreholeDepthM} m depth before foundation selection.`,
    locationLabel: `${location.name} (${location.id})`,
    evidenceIndicator: soilClass ? 'CGWB/GSI 1:50k Regional + IS 1892' : 'Regional Soil Gap Disclosed + IS 1892',
    priorityIndicator: !soilClass
      ? { label: 'Mandatory Borehole Gate (Regional Soil Unmapped)', tone: 'warning' }
      : { label: 'Mandatory Pre-Foundation Investigation', tone: 'standard' },
    recommendationText: soilClass
      ? `Commission ${recommendedBoreholes} rotary core boreholes down to ${targetBoreholeDepthM} m (or 3 m into weathered/hard bedrock) with Standard Penetration Tests (SPT) every 1.5 m to verify transition through regional ${soilClass}.`
      : `Locality-scale soil series is unavailable in the Chennai District 1:50,000 sheet; commission ${recommendedBoreholes} mandatory boreholes to ${targetBoreholeDepthM} m depth with full grain-size, Atterberg limits, and triaxial shear testing prior to any foundation design.`,
    supportingSourceData: `Geological Formation: ${lithology}; Regional Soil Class: ${soilClass || 'Unavailable at locality scale'}; Proposed Building Height: ${floors} Floors (${estimatedBuiltUpSqFt.toLocaleString()} sq.ft built-up area on ${plotSqFt.toLocaleString()} sq.ft plot).`,
    evidenceMetrics: [
      { label: 'Regional Soil Class', value: soilClass || 'Unavailable in 1:50k Sheet', unit: '1:50,000 Regional', source: 'CGWB / GSI Chennai' },
      { label: 'Geological Province', value: lithology, unit: 'Sub-Basin Lithology', source: 'GSI District Resource Map' },
      { label: 'Plot & Structural Load', value: `${plotSqM} sq.m · ${floors} Storeys`, unit: `${estimatedBuiltUpSqFt.toLocaleString()} sq.ft BUA`, source: 'User Assumption' },
      { label: 'Plot-Level SPT / SBC', value: 'Unavailable (Requires Drilling)', unit: 'IS 1892 / IS 2131', source: 'Disclosed Data Limitation' }
    ],
    ruleId: 'RULE-GEOTECH-SOIL-03',
    triggerCondition: `plot_area_sqm (${plotSqM} sq.m) -> ${recommendedBoreholes} BHs; floors (${floors}) & soft_clay_alluvial (${isSoftClayOrAlluvial ? 'True' : 'False'}) -> ${targetBoreholeDepthM} m depth`,
    reasoningExplanation: `RULE-GEOTECH-SOIL-03 scales exploration density by plot footprint (${plotSqM} sq.m) and structural load (${floors} floors, ${userInputs.projectCategory}). ${location.ground_and_soil.geotechnical_note} Because regional 1:50,000 maps cannot provide plot-level Safe Bearing Capacity (SBC) or differential settlement moduli, physical borehole logging is non-negotiable.`,
    sourceReference: 'BIS IS 1892:1979 (Subsurface Investigation for Foundations), IS 6403 & CGWB / GSI Lithological Atlas',
    traceableReferences: [
      { name: 'BIS IS 1892:1979 — Code of Practice for Subsurface Investigation for Foundations', date: '1979 (Reaffirmed 2021)', url: 'https://www.bis.gov.in/' },
      { name: 'Central Ground Water Board (CGWB) — Chennai District Hydrogeological Brochure', date: '2022–2023', url: 'https://cgwb.gov.in/' }
    ],
    limitations: 'Terra Forge does NOT prescribe isolated footings, rafts, or pile diameters because site-specific SPT N-values are not available without physical drilling.',
    suggestedNextSteps: [
      `Engage an NABL-accredited geotechnical laboratory to drill ${recommendedBoreholes} boreholes to ${targetBoreholeDepthM} m depth.`,
      'Perform Free Differential Swell (FDS) and consolidation tests if clay layers are encountered, or liquefaction evaluation if saturated loose sand (N < 15) occurs in the top 10 m.'
    ],
    linkedMapLayer: 'soilHalos'
  });

  // Rec 4: Seismic Zone III, Cyclonic Wind & Transit/Logistics Access
  const nearestTransit = location.accessibility_and_connectivity?.nearest_transit_stations?.[0];
  const primaryRoad = location.accessibility_and_connectivity?.arterial_roads?.[0];
  recommendations.push({
    id: 'REC-SEISMIC-LOGISTICS',
    category: 'Structural Resilience & Site Logistics',
    iconType: 'logistics',
    title: `Apply IS 13920 Ductile Detailing (Zone III) & Plan Concrete/Material Transit via ${primaryRoad ? primaryRoad.name : 'Local Access Roads'}`,
    conciseSummary: `Design lateral frames for Seismic Zone III (Z = 0.16) and 50 m/s cyclonic wind while routing RMC deliveries via ${primaryRoad ? `${primaryRoad.name} (${primaryRoad.distance_km} km)` : 'municipal collector roads'}.`,
    locationLabel: `${location.name} (${location.id})`,
    evidenceIndicator: 'Verified OSM Network + IS 1893 / TNCDBR',
    priorityIndicator:
      fsi >= 2.5 || floors >= 6
        ? { label: 'Verify Abutting Road Width for High FSI / Height', tone: 'warning' }
        : { label: 'Statutory Structural & Access Rule', tone: 'standard' },
    recommendationText: `Design lateral load-resisting frames for Seismic Zone III (Z = 0.16 per IS 1893:2016) and Cyclonic Basic Wind Speed Vb = 50 m/s (IS 875 Part 3). Route ready-mix concrete (RMC) and heavy material deliveries via ${primaryRoad ? `${primaryRoad.name} (${primaryRoad.distance_km} km)` : 'verified municipal collector roads'} while verifying plot frontage road width for TNCDBR 2019 FSI eligibility.`,
    supportingSourceData: `Jurisdiction: ${location.geographic_context.jurisdiction}; Nearest Arterial Road: ${primaryRoad ? `${primaryRoad.name} (${primaryRoad.distance_km} km)` : 'Local Street Network'}; Nearest Rail/Metro Node: ${nearestTransit ? `${nearestTransit.name} (${nearestTransit.distance_km} km)` : 'None within 8.5 km'}.`,
    evidenceMetrics: [
      { label: 'Nearest Arterial Road', value: primaryRoad ? `${primaryRoad.name} (${primaryRoad.distance_km} km)` : 'Local Municipal Network', unit: primaryRoad?.classification || 'Street', source: 'OpenStreetMap Highways' },
      { label: 'Nearest Rail / Metro Node', value: nearestTransit ? `${nearestTransit.name} (${nearestTransit.distance_km} km)` : 'None within 8.5 km', unit: nearestTransit?.type || 'MTC Bus Only', source: 'OpenStreetMap Transit' },
      { label: 'Seismic & Wind Parameters', value: 'Zone III (Z=0.16) · Vb = 50 m/s', unit: 'IS 1893 / IS 875', source: 'BIS Structural Codes' },
      { label: 'Assumed FSI & Height', value: `FSI ${fsi.toFixed(1)} · ${floors} Storeys`, unit: 'TNCDBR 2019', source: 'User Assumption' }
    ],
    ruleId: 'RULE-SEISMIC-WIND-04',
    triggerCondition: `Chennai CMA Statutory Zone III + Cyclonic Coast (50 m/s) + Assumed FSI (${fsi.toFixed(1)})`,
    reasoningExplanation: `RULE-SEISMIC-WIND-04 applies statutory Chennai structural load parameters and evaluates construction logistics and FSI constraints. Under TNCDBR 2019, permissible FSI (${fsi.toFixed(1)} assumed) and building height (${floors} floors) depend strictly on the abutting street width (e.g., >= 9.0 m / 12.0 m road width for higher FSI).`,
    sourceReference: 'IS 1893:2016 Part 1, IS 13920:2016, IS 875:2015 Part 3, TNCDBR 2019 & OpenStreetMap Road Network',
    traceableReferences: [
      { name: 'BIS IS 1893:2016 (Part 1) & IS 13920:2016 — Seismic Ductile Detailing', date: '2016', url: 'https://www.bis.gov.in/' },
      { name: 'OpenStreetMap Highway & Public Transit Network (CMRL / Southern Railway)', date: '2025-02', url: 'https://www.openstreetmap.org/' },
      { name: 'CMDA / TNCDBR 2019 — Road Width vs. Permissible FSI Regulations', date: '2019', url: 'https://www.cmdachennai.gov.in/' }
    ],
    limitations: 'Abutting street width must be physically measured on-site and cross-checked with the official CMDA / GCC Road Width Register.',
    suggestedNextSteps: [
      'Measure exact abutting street width between plot boundary walls to confirm TNCDBR 2019 permissible FSI and setbacks.',
      'Ensure structural consultant incorporates IS 13920 ductile confining stirrups at all beam-column joints.'
    ],
    linkedMapLayer: 'transit'
  });

  return {
    generatedAt: new Date().toISOString(),
    locationId: location.id,
    locationName: location.name,
    userInputs: {
      ...userInputs,
      plotAreaSqFt: plotSqFt,
      plotAreaSqM: plotSqM,
      fsiRatio: fsi,
      proposedFloors: floors,
      includeBasement,
      budgetLakhs
    },
    calculatedMetrics: {
      estimatedBuiltUpSqFt,
      estimatedBuiltUpSqM,
      exposureTier,
      minConcreteGrade,
      nominalCoverMm,
      recommendedPlinthMeters,
      recommendedBoreholes,
      targetBoreholeDepthM,
      corrosionAllowancePct,
      floodMitigationAllowancePct,
      subStructureAllowancePct
    },
    sourcedFacts: {
      coordinates: `${location.coordinates.lat}°N, ${location.coordinates.lon}°E (OSM Node #${location.coordinates.osm_id})`,
      jurisdiction: location.geographic_context.jurisdiction,
      elevationMsl: elevM !== null ? `${elevM} m MSL (Copernicus DEM / NASA SRTM 90m)` : 'Unavailable',
      coastalDistanceKm: `${coastKm} km from Bay of Bengal`,
      nearestWaterBody: nearestWater
        ? `${nearestWater.name} (${nearestWater.type}, ${nearestWater.distance_km} km)`
        : 'No named river/lake within buffer',
      nearestTransit: nearestTransit
        ? `${nearestTransit.name} (${nearestTransit.type}, ${nearestTransit.distance_km} km)`
        : 'No station within 8.5 km',
      primaryArterialRoad: primaryRoad
        ? `${primaryRoad.name} (${primaryRoad.classification}, ${primaryRoad.distance_km} km)`
        : 'Local municipal road network'
    },
    regionalObservations: {
      geologicalFormation: lithology,
      soilClassification: soilClass || 'Unavailable — Outside Chennai District 1:50,000 Soil Series Sheet',
      soilResolution: location.ground_and_soil.soil_resolution,
      groundwaterPreMonsoon: preGw || 'Unavailable — Outside CGWB City Observation Well Network',
      groundwaterPostMonsoon: postGw || 'Unavailable — Outside CGWB City Observation Well Network',
      watershedBasin: location.environmental_and_flood.watershed_basin,
      floodHazardContext: floodCat || 'Unavailable — Outside GCC 200-Ward CFLOWS-Chennai boundary'
    },
    recommendations,
    missingDataDisclosures: [
      ...location.data_quality.missing_regional_attributes,
      ...location.data_quality.unverified_plot_parameters
    ]
  };
}

export function calculateCostEstimate(assessment, customRates = DEFAULT_COST_RATES) {
  if (!assessment) return null;
  const builtUpSqFt = assessment.calculatedMetrics.estimatedBuiltUpSqFt;
  const boreholes = assessment.calculatedMetrics.recommendedBoreholes;

  const baseShellRate = Math.max(500, Number(customRates.baseStructuralShellPerSqFt) || 1650);
  const finishRate = Math.max(200, Number(customRates.architecturalFinishingPerSqFt) || 920);
  const mepRate = Math.max(100, Number(customRates.mepAndServicesPerSqFt) || 380);
  const boreholeRate = Math.max(5000, Number(customRates.geotechInvestigationPerBorehole) || 28000);
  const contingencyPct = Math.max(0, Math.min(35, Number(customRates.contingencyPct) || 8));

  const structuralShellCost = builtUpSqFt * baseShellRate;
  const finishingCost = builtUpSqFt * finishRate;
  const mepCost = builtUpSqFt * mepRate;
  const baseDirectCost = structuralShellCost + finishingCost + mepCost;

  const coastalCorrosionCost = Math.round(
    structuralShellCost * (assessment.calculatedMetrics.corrosionAllowancePct / 100)
  );
  const subStructureAdjustmentCost = Math.round(
    structuralShellCost * (assessment.calculatedMetrics.subStructureAllowancePct / 100)
  );
  const floodPlinthDrainageCost = Math.round(
    structuralShellCost * (assessment.calculatedMetrics.floodMitigationAllowancePct / 100)
  );
  const geotechSurveyCost = boreholes * boreholeRate + 35000; // Includes Total Station topo survey

  const subtotalBeforeContingency =
    baseDirectCost +
    coastalCorrosionCost +
    subStructureAdjustmentCost +
    floodPlinthDrainageCost +
    geotechSurveyCost;

  const contingencyCost = Math.round(subtotalBeforeContingency * (contingencyPct / 100));
  const totalEstimatedInr = subtotalBeforeContingency + contingencyCost;
  const totalEstimatedLakhs = Number((totalEstimatedInr / 100000).toFixed(2));
  const budgetDeltaLakhs = Number((assessment.userInputs.budgetLakhs - totalEstimatedLakhs).toFixed(2));

  return {
    builtUpSqFt,
    builtUpSqM: assessment.calculatedMetrics.estimatedBuiltUpSqM,
    ratesUsed: {
      baseShellRate,
      finishRate,
      mepRate,
      boreholeRate,
      contingencyPct
    },
    lineItems: [
      {
        id: 'ITEM-SHELL',
        label: 'Base Structural RCC Frame & Masonry Shell',
        origin: 'User-Editable Assumption Rate × Calculated Built-Up Area',
        quantity: `${builtUpSqFt.toLocaleString()} sq.ft`,
        unitRate: `₹${baseShellRate.toLocaleString()}/sq.ft`,
        amountInr: structuralShellCost
      },
      {
        id: 'ITEM-FINISH',
        label: 'Architectural Finishes, Flooring, Joinery & Facade',
        origin: 'User-Editable Assumption Rate × Calculated Built-Up Area',
        quantity: `${builtUpSqFt.toLocaleString()} sq.ft`,
        unitRate: `₹${finishRate.toLocaleString()}/sq.ft`,
        amountInr: finishingCost
      },
      {
        id: 'ITEM-MEP',
        label: 'MEP Services (Electrical, Plumbing, Fire & Dual RWH)',
        origin: 'User-Editable Assumption Rate × Calculated Built-Up Area',
        quantity: `${builtUpSqFt.toLocaleString()} sq.ft`,
        unitRate: `₹${mepRate.toLocaleString()}/sq.ft`,
        amountInr: mepCost
      },
      {
        id: 'ITEM-COAST',
        label: `Coastal Durability Upgrade (${assessment.calculatedMetrics.minConcreteGrade}, CRS Rebar — ${assessment.sourcedFacts.coastalDistanceKm})`,
        origin: `Rule-Derived Site Allowance (+${assessment.calculatedMetrics.corrosionAllowancePct}% on Structural Shell)`,
        quantity: `${assessment.calculatedMetrics.corrosionAllowancePct}% of Shell`,
        unitRate: 'IS 456 Table 3 Rule',
        amountInr: coastalCorrosionCost
      },
      {
        id: 'ITEM-SUB',
        label: `Sub-Structure & Ground Condition Provision (${assessment.userInputs.includeBasement ? 'Includes Basement Dewatering/Waterproofing' : 'Regional Soil/Water Table Allowance'})`,
        origin: `Rule-Derived Site Allowance (+${assessment.calculatedMetrics.subStructureAllowancePct}% on Structural Shell)`,
        quantity: `${assessment.calculatedMetrics.subStructureAllowancePct}% of Shell`,
        unitRate: 'IS 1904 Provision',
        amountInr: subStructureAdjustmentCost
      },
      {
        id: 'ITEM-FLOOD',
        label: `Plinth Elevation (+${assessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m) & Storm Drainage Backflow Protection`,
        origin: `Rule-Derived Site Allowance (+${assessment.calculatedMetrics.floodMitigationAllowancePct}% on Structural Shell)`,
        quantity: `${assessment.calculatedMetrics.floodMitigationAllowancePct}% of Shell`,
        unitRate: 'Basin/SRTM Rule',
        amountInr: floodPlinthDrainageCost
      },
      {
        id: 'ITEM-GEOTECH',
        label: `Mandatory IS 1892 Geotechnical Drilling (${boreholes} Boreholes to ${assessment.calculatedMetrics.targetBoreholeDepthM}m) + Topo Survey`,
        origin: 'User-Editable Borehole Rate + ₹35,000 Topographic Level Survey',
        quantity: `${boreholes} Boreholes + 1 Survey`,
        unitRate: `₹${boreholeRate.toLocaleString()}/BH`,
        amountInr: geotechSurveyCost
      }
    ],
    subtotalBeforeContingency,
    contingencyCost,
    totalEstimatedInr,
    totalEstimatedLakhs,
    EffectiveRatePerSqFt: Math.round(totalEstimatedInr / builtUpSqFt),
    userBudgetLakhs: assessment.userInputs.budgetLakhs,
    budgetDeltaLakhs,
    withinBudget: budgetDeltaLakhs >= 0,
    exclusions: [
      'Land acquisition cost, stamp duty, and registration charges',
      'CMDA / GCC building plan sanction, infrastructure & amenities charges, and TNEB/CMWSSB connection deposits',
      'Deep piling or ground improvement costs if site-specific SPT boreholes reveal liquefiable sand or deep soft marine clay',
      'Interior loose furniture, solar PV arrays, elevators, and GST'
    ]
  };
}
