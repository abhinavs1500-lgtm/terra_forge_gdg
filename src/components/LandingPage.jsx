import React, { useMemo, useState } from 'react';
import {
  Compass,
  Layers,
  MapPin,
  ShieldAlert,
  ArrowRight,
  ArrowDown,
  Database,
  Scale,
  GitCompare,
  Hammer,
  Calculator,
  FileText,
  CheckCircle2
} from 'lucide-react';
import InteractiveWaterCanvas from './InteractiveWaterCanvas';
import ChennaiMapCanvas from './ChennaiMapCanvas';

export default function LandingPage({
  locations,
  selectedLocation,
  onSelectLocation,
  gisLayersData,
  coverageStats,
  onEnterApp
}) {
  const loc = selectedLocation || locations[0];
  const [activeRulePreview, setActiveRulePreview] = useState(0);

  const featuredNodes = useMemo(() => {
    const names = ['velachery', 'anna nagar', 'adyar', 'sholinganallur', 'guindy'];
    return names.map((n) => locations.find((l) => l.name.toLowerCase() === n)).filter(Boolean);
  }, [locations]);

  const comparePreviewNodes = useMemo(() => {
    const names = ['velachery', 'anna nagar', 'guindy'];
    return names.map((n) => locations.find((l) => l.name.toLowerCase() === n)).filter(Boolean);
  }, [locations]);

  const scrollToDiscover = () => {
    const el = document.getElementById('discover-platform');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const rulePreviews = [
    {
      code: 'RULE-IS456-COASTAL',
      standard: 'BIS IS 456:2000 (Table 3 & Table 5)',
      condition: `IF geodesic_coastal_distance (${loc.geographic_context.coastal_distance_km} km) <= 5.0 km`,
      recommendation: 'Adopt M30 structural concrete with 45 mm nominal reinforcement cover and PPC/GGBS blended binder.',
      evidence: `OpenStreetMap Bay of Bengal shoreline polyline distance = ${loc.geographic_context.coastal_distance_km} km for ${loc.name} (${loc.id}).`
    },
    {
      code: 'RULE-HYDRO-PLINTH',
      standard: 'TNCDBR 2019 + NCCR CFLOWS Basin Datum',
      condition: `IF watershed_sensitivity == "${loc.environmental_and_flood.flood_hazard_category || 'Moderate'}" OR elevation_msl (${loc.geographic_context.elevation_m_msl}m) <= 9.0m`,
      recommendation: 'Set minimum finished plinth level +1.05 m to +1.35 m above adjacent road crown with perimeter storm swale.',
      evidence: `Copernicus DEM / SRTM elevation = ${loc.geographic_context.elevation_m_msl} m MSL; Basin = ${loc.environmental_and_flood.watershed_basin.split('(')[0].trim()}.`
    },
    {
      code: 'RULE-IS1892-BOREHOLE',
      standard: 'BIS IS 1892:1979 (Subsurface Investigation)',
      condition: 'IF plot_level_SPT_borehole == UNAVAILABLE_IN_PUBLIC_GIS',
      recommendation: 'Mandate minimum 2 rotary core boreholes to 15–25 m depth with SPT N-value logging every 1.5 m before footing design.',
      evidence: `Regional lithology (${loc.ground_and_soil.soil_classification ? loc.ground_and_soil.soil_classification.split('(')[0].trim() : 'Outer CMA'}) is mapped at 1:50,000 scale and cannot replace plot-level SBC testing.`
    }
  ];

  return (
    <div className="landing-wrapper topo-surface">
      {/* Subtle Topographic Contour Backdrop */}
      <svg className="landing-topo-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path
          className="topo-contour-line"
          d="M-100,180 C220,90 440,290 760,190 C1080,90 1260,240 1560,150"
        />
        <path
          className="topo-contour-line solid"
          d="M-80,320 C260,210 510,420 840,300 C1140,190 1310,370 1540,280"
        />
        <path
          className="topo-contour-line copper"
          d="M-120,490 C190,390 480,580 820,460 C1120,350 1320,510 1560,430"
        />
        <path
          className="topo-contour-line"
          d="M-90,660 C250,560 560,740 890,620 C1190,510 1340,690 1550,610"
        />
        <circle className="topo-particle-dot" cx="280" cy="240" r="2.5" />
        <circle className="topo-particle-dot" cx="760" cy="190" r="3" />
        <circle className="topo-particle-dot" cx="1140" cy="310" r="2" />
        <circle className="topo-particle-dot" cx="520" cy="540" r="2.5" />
      </svg>

      {/* Dedicated Starting Page Navigation Bar */}
      <header className="landing-header">
        <div className="brand-lockup">
          <div className="brand-emblem" aria-hidden="true">TF</div>
          <div>
            <div className="brand-title">TERRA FORGE</div>
            <div className="brand-subtitle">CHENNAI LAND INTELLIGENCE PLATFORM · 167 VERIFIED NODES</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }} aria-label="Starting Page Navigation">
          <button
            type="button"
            className="btn-ghost"
            onClick={scrollToDiscover}
          >
            Discover the Platform
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onEnterApp('map')}
          >
            <MapPin size={15} />
            GIS Workstation
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onEnterApp('assessment')}
          >
            <Scale size={15} />
            Site Assessments
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onEnterApp('sources')}
          >
            <Database size={15} />
            Data Sources
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onEnterApp('overview')}
          >
            Explore Terra Forge
            <ArrowRight size={17} />
          </button>
        </nav>
      </header>

      <main style={{ maxWidth: '1560px', width: '100%', margin: '0 auto', padding: '0 3rem 4rem', position: 'relative', zIndex: 2 }}>
        {/* ==================================================================
            HERO SECTION: EDITORIAL HEADLINE + INTERACTIVE WATER SURFACE
            ================================================================== */}
        <section className="editorial-hero-stage landing-hero-entrance" aria-label="Terra Forge Starting Hero">
          <div className="hero-copy-column">
            <div className="editorial-kicker">
              TERRA FORGE · INTELLIGENCE BEFORE CONSTRUCTION
            </div>

            <h1 className="hero-headline">
              Understand the land.{' '}
              <em>Engineer what comes next.</em>
            </h1>

            <p className="hero-tagline">
              Explore Chennai through location intelligence, environmental context, engineering recommendations, and transparent site assessments.
            </p>

            <p className="hero-description">
              Unifying 167 verified OpenStreetMap locality nodes, Copernicus DEM / NASA SRTM 90m terrain elevations, CGWB hydrogeological sub-basins, NCCR flood context, and deterministic BIS civil engineering rules (IS 456, IS 1893, IS 1892).
            </p>

            <div className="hero-cta-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onEnterApp('overview')}
              >
                <Compass size={18} />
                Explore Terra Forge
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={scrollToDiscover}
              >
                <ArrowDown size={17} />
                Discover the platform
              </button>
            </div>

            {/* Restrained Location-Coverage Ribbon Grounded in Actual Application Data */}
            <div className="hero-coverage-ribbon" role="region" aria-label="Verified Application Data Coverage">
              <div className="coverage-datum">
                <div className="coverage-datum-value">
                  {coverageStats.registered} <span>/ {coverageStats.totalTarget}</span>
                </div>
                <div className="coverage-datum-label">Verified Chennai Locations</div>
              </div>
              <div className="coverage-datum">
                <div className="coverage-datum-value">
                  {coverageStats.withSoil} <span>({Math.round((coverageStats.withSoil / coverageStats.totalTarget) * 100)}%)</span>
                </div>
                <div className="coverage-datum-label">CGWB / GSI Soil Profiles</div>
              </div>
              <div className="coverage-datum">
                <div className="coverage-datum-value">
                  {coverageStats.withGw} <span>({Math.round((coverageStats.withGw / coverageStats.totalTarget) * 100)}%)</span>
                </div>
                <div className="coverage-datum-label">Aquifer Depth Records</div>
              </div>
              <div className="coverage-datum">
                <div className="coverage-datum-value">
                  {coverageStats.withFlood} <span>({Math.round((coverageStats.withFlood / coverageStats.totalTarget) * 100)}%)</span>
                </div>
                <div className="coverage-datum-label">Flood Basin Profiles</div>
              </div>
            </div>
          </div>

          {/* Signature Interactive Water Physics Stage */}
          <div className="hero-fluid-column">
            <InteractiveWaterCanvas
              selectedLocation={loc}
              onSelectFeaturedLocation={onSelectLocation}
              featuredLocations={featuredNodes}
            />
          </div>
        </section>

        {/* ==================================================================
            FEATURE INTRODUCTION SEQUENCE BELOW THE HERO (5 DISTINCT COMPOSITIONS)
            ================================================================== */}
        <div id="discover-platform" style={{ paddingTop: '1rem' }}>
          {/* SECTION 01: EXPLORE THE LAND */}
          <section className="editorial-chapter" aria-label="01 Explore the Land">
            <div>
              <span className="chapter-number">01 / EXPLORE THE LAND</span>
              <h2 className="chapter-heading">
                Discover and inspect available Chennai locations with custom cartographic doodles.
              </h2>
              <p className="chapter-lead">
                Navigate 167 verified Chennai localities across dark terrain, topographic contour, street vector, and satellite basemaps—paired with custom-illustrated geological and hydrological survey markers, OpenStreetMap waterways, CMRL metro corridors, and Bay of Bengal shoreline buffers.
              </p>

              <div className="spec-ledger" style={{ marginBottom: '1.65rem' }}>
                <div className="spec-row" style={{ gridTemplateColumns: '170px 1fr' }}>
                  <span className="spec-key">Spatial Registry</span>
                  <span className="spec-val">167 / 167 distinct Chennai localities verified against OpenStreetMap EPSG:4326</span>
                </div>
                <div className="spec-row" style={{ gridTemplateColumns: '170px 1fr' }}>
                  <span className="spec-key">Elevation Datum</span>
                  <span className="spec-val">Copernicus DEM GLO-90 / NASA SRTM spot heights (4 m to 53 m MSL)</span>
                </div>
                <div className="spec-row" style={{ gridTemplateColumns: '170px 1fr' }}>
                  <span className="spec-key">Cartographic Markers</span>
                  <span className="spec-val">Custom land-survey doodle icons for Coastal Sand, Estuarine Clay, Charnockite Rock, Alluvium, and Unmapped Outer-CMA nodes</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={() => onEnterApp('map')}>
                  <Layers size={16} />
                  Open Interactive GIS Map
                </button>
                <button type="button" className="btn-secondary" onClick={() => onEnterApp('profile')}>
                  <MapPin size={16} />
                  Inspect {loc.name} Profile
                </button>
              </div>
            </div>

            {/* Live Mini GIS Preview with Custom Doodle Icons */}
            <div className="hero-terrain-stage">
              <div className="hero-terrain-header">
                <span>LIVE GIS PREVIEW · CUSTOM LAND SURVEY DOODLE MARKERS</span>
                <span style={{ color: 'var(--accent-sage-bright)' }}>
                  ACTIVE: {loc.name.toUpperCase()} ({loc.id})
                </span>
              </div>
              <div style={{ height: '360px', width: '100%' }}>
                <ChennaiMapCanvas
                  locations={locations}
                  selectedLocation={loc}
                  onSelectLocation={onSelectLocation}
                  basemap="dark"
                  colorMode="soil"
                  activeOverlays={{
                    water: true,
                    transit: false,
                    gccZones: false,
                    landmarks: false,
                    coastline: true,
                    soilHalos: false
                  }}
                  gisLayersData={gisLayersData}
                  compact={true}
                />
              </div>
            </div>
          </section>

          {/* SECTION 02: UNDERSTAND THE GROUND */}
          <section className="editorial-chapter reverse" aria-label="02 Understand the Ground">
            {/* Left: Illustrated Stratigraphic & Aquifer Cross-Section Visual */}
            <div className="panel-card" style={{ background: 'rgba(13, 18, 15, 0.92)' }}>
              <div className="panel-card-header">
                <h3 className="panel-card-title">
                  Chennai Subsurface Lithology &amp; Aquifer Cross-Section
                </h3>
                <span className="status-pill verified">CGWB + GSI 1:50k</span>
              </div>

              {/* Custom Technical SVG Stratigraphic Illustration */}
              <svg
                viewBox="0 0 640 240"
                style={{ width: '100%', height: 'auto', borderRadius: '8px', background: '#080b09', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}
                role="img"
                aria-label="Illustrated cross-section of Chennai geological provinces from West Charnockite hills to East Coast Bay of Bengal marine sands"
              >
                {/* Sky / Ground Datum Line */}
                <text x="18" y="24" fill="#9e9483" fontFamily="JetBrains Mono, monospace" fontSize="10">
                  WEST (SW CORRIDOR: 18–53m MSL)
                </text>
                <text x="415" y="24" fill="#4fa8c2" fontFamily="JetBrains Mono, monospace" fontSize="10">
                  EAST (BAY OF BENGAL: 4–9m MSL)
                </text>

                {/* Layer 1: Upper Alluvial & Coastal Sand */}
                <path
                  d="M0,45 Q180,55 340,72 T640,88 L640,132 Q380,124 180,98 L0,82 Z"
                  fill="rgba(224, 159, 80, 0.22)"
                  stroke="#e09f50"
                  strokeWidth="1.5"
                />
                {/* Water Table Dashed Line */}
                <path
                  d="M0,68 Q220,78 420,92 T640,102"
                  fill="none"
                  stroke="#4fa8c2"
                  strokeWidth="1.8"
                  strokeDasharray="6 4"
                />
                <text x="20" y="62" fill="#4fa8c2" fontFamily="JetBrains Mono, monospace" fontSize="10">
                  PRE-MONSOON WATER TABLE (1.8m – 6.5m bgl)
                </text>

                {/* Layer 2: Estuarine / Lacustrine Clay Lens */}
                <path
                  d="M190,99 Q370,122 640,132 L640,176 Q380,168 190,134 Z"
                  fill="rgba(207, 92, 71, 0.22)"
                  stroke="#cf5c47"
                  strokeWidth="1.3"
                />

                {/* Layer 3: Weathered & Fractured Archaean Charnockite Bedrock */}
                <path
                  d="M0,82 L190,99 L190,134 Q380,168 640,176 L640,240 L0,240 Z"
                  fill="rgba(36, 71, 53, 0.36)"
                  stroke="#84c7a3"
                  strokeWidth="1.5"
                />

                {/* Labels inside strata */}
                <text x="24" y="114" fill="#84c7a3" fontFamily="Space Grotesk, sans-serif" fontSize="12" fontWeight="700">
                  Archaean Charnockite &amp; Gneiss Basement (Hard Rock)
                </text>
                <text x="310" y="112" fill="#f5f0e6" fontFamily="Space Grotesk, sans-serif" fontSize="11" fontWeight="600">
                  Quaternary Fluvial &amp; Coastal Alluvium
                </text>
                <text x="345" y="156" fill="#f49b8c" fontFamily="Space Grotesk, sans-serif" fontSize="11" fontWeight="600">
                  Estuarine / Marine Soft Clay Lens
                </text>
                <text x="24" y="216" fill="#c7bca9" fontFamily="JetBrains Mono, monospace" fontSize="10">
                  IS 1892 MANDATORY BOREHOLE VERIFICATION ZONE (SPT N-VALUE &amp; LAB SBC)
                </text>
              </svg>

              <div className="monument-strip" style={{ marginBottom: 0 }}>
                <div className="monument-cell" style={{ padding: '0.9rem 1rem' }}>
                  <span className="monument-label">Soil Coverage</span>
                  <span className="monument-value amber" style={{ fontSize: '1.35rem' }}>152 / 167</span>
                  <span className="monument-sub">15 outer-CMA sites disclosed as unmapped</span>
                </div>
                <div className="monument-cell" style={{ padding: '0.9rem 1rem' }}>
                  <span className="monument-label">Groundwater</span>
                  <span className="monument-value sage" style={{ fontSize: '1.35rem' }}>143 / 167</span>
                  <span className="monument-sub">Pre &amp; Post-monsoon m bgl</span>
                </div>
                <div className="monument-cell" style={{ padding: '0.9rem 1rem' }}>
                  <span className="monument-label">Flood Basins</span>
                  <span className="monument-value" style={{ fontSize: '1.35rem' }}>147 / 167</span>
                  <span className="monument-sub">4 river &amp; estuary carriers</span>
                </div>
              </div>
            </div>

            {/* Right: Editorial Narrative */}
            <div>
              <span className="chapter-number">02 / UNDERSTAND THE GROUND</span>
              <h2 className="chapter-heading">
                Review available soil, groundwater, and environmental information without guesswork.
              </h2>
              <p className="chapter-lead">
                Chennai’s ground profile spans coastal marine sands along the Bay of Bengal, soft estuarine clays in low-lying paleo-basins, and shallow crystalline charnockite bedrock across the southern and western ridges.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Terra Forge explicitly labels the geographic resolution of every dataset (`1:50,000 Regional Lithological Unit` vs. `Verified OSM Point`) and discloses where outer-CMA localities lack ward-level CFLOWS flood maps or local CGWB observation wells.
              </p>
              <button type="button" className="btn-secondary" onClick={() => onEnterApp('profile')}>
                <Compass size={16} />
                Explore Location Monographs
              </button>
            </div>
          </section>

          {/* SECTION 03: EVALUATE WITH EVIDENCE */}
          <section className="editorial-chapter" aria-label="03 Evaluate with Evidence">
            <div>
              <span className="chapter-number">03 / EVALUATE WITH EVIDENCE</span>
              <h2 className="chapter-heading">
                Explore explainable engineering recommendations and their code sources.
              </h2>
              <p className="chapter-lead">
                Every preliminary recommendation is generated by an inspectable rule engine tied to Indian Standards (`IS 456:2000`, `IS 1893:2016`, `IS 1892:1979`, `TNCDBR 2019`). Click any rule on the right to inspect its trigger condition, recommendation, and underlying measurement.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={() => onEnterApp('assessment')}>
                  <Scale size={16} />
                  Open Site Assessment Studio
                </button>
                <button type="button" className="btn-ghost" onClick={() => onEnterApp('sources')}>
                  <Database size={15} />
                  Inspect Rule Methodology
                </button>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-card-header">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--accent-amber)' }}>
                  LIVE RULE ENGINE TRACE · {loc.name.toUpperCase()} ({loc.id})
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {rulePreviews.map((rp, i) => (
                    <button
                      key={rp.code}
                      type="button"
                      className={`layer-toggle-btn ${activeRulePreview === i ? 'active' : ''}`}
                      onClick={() => setActiveRulePreview(i)}
                    >
                      {rp.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="spec-ledger">
                <div className="spec-row" style={{ gridTemplateColumns: '160px 1fr' }}>
                  <span className="spec-key">Standard Reference</span>
                  <span className="spec-val" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {rulePreviews[activeRulePreview].standard}
                  </span>
                </div>
                <div className="spec-row" style={{ gridTemplateColumns: '160px 1fr' }}>
                  <span className="spec-key">Trigger Condition</span>
                  <span className="spec-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                    {rulePreviews[activeRulePreview].condition}
                  </span>
                </div>
                <div className="spec-row" style={{ gridTemplateColumns: '160px 1fr' }}>
                  <span className="spec-key">Recommended Action</span>
                  <span className="spec-val" style={{ fontWeight: 600 }}>
                    {rulePreviews[activeRulePreview].recommendation}
                  </span>
                </div>
                <div className="spec-row" style={{ gridTemplateColumns: '160px 1fr', borderBottom: 'none' }}>
                  <span className="spec-key">Sourced Evidence</span>
                  <span className="spec-val" style={{ color: 'var(--text-sandstone)' }}>
                    {rulePreviews[activeRulePreview].evidence}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 04: COMPARE LOCATIONS */}
          <section className="editorial-chapter reverse" aria-label="04 Compare Locations">
            <div className="table-wrapper">
              <table className="tf-table">
                <caption>
                  Live Multi-Location Comparison Preview — Factual Attribute &amp; Data-Gap Matrix
                </caption>
                <thead>
                  <tr>
                    <th>Attribute</th>
                    {comparePreviewNodes.map((n) => (
                      <th key={n.id}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                          {n.id}
                        </div>
                        <div>{n.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>SRTM Elevation</th>
                    {comparePreviewNodes.map((n) => (
                      <td key={n.id} style={{ fontFamily: 'var(--font-mono)' }}>
                        {n.geographic_context.elevation_m_msl} m MSL
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Coastal Distance</th>
                    {comparePreviewNodes.map((n) => (
                      <td key={n.id} style={{ fontFamily: 'var(--font-mono)' }}>
                        {n.geographic_context.coastal_distance_km} km
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Regional Soil (1:50k)</th>
                    {comparePreviewNodes.map((n) => (
                      <td key={n.id}>
                        {n.ground_and_soil.soil_classification
                          ? n.ground_and_soil.soil_classification.split('(')[0].trim()
                          : 'Unavailable'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Pre-Monsoon GW</th>
                    {comparePreviewNodes.map((n) => (
                      <td key={n.id} style={{ fontFamily: 'var(--font-mono)' }}>
                        {n.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <span className="chapter-number">04 / COMPARE LOCATIONS</span>
              <h2 className="chapter-heading">
                Compare available attributes and data gaps across candidate sites.
              </h2>
              <p className="chapter-lead">
                Evaluate 2 to 4 Chennai localities side-by-side across elevation, coastal exposure, regional lithology, seasonal groundwater depth, watershed sensitivity, and transit access—highlighting meaningful engineering differences without declaring an arbitrary "winner."
              </p>
              <button type="button" className="btn-primary" onClick={() => onEnterApp('compare')}>
                <GitCompare size={16} />
                Launch Multi-Site Comparison
              </button>
            </div>
          </section>

          {/* SECTION 05: PLAN WITH CLARITY */}
          <section className="editorial-chapter" aria-label="05 Plan with Clarity">
            <div>
              <span className="chapter-number">05 / PLAN WITH CLARITY</span>
              <h2 className="chapter-heading">
                Explore preliminary construction planning and transparent cost estimates.
              </h2>
              <p className="chapter-lead">
                Translate site conditions into a 4-phase pre-construction investigation roadmap and an order-of-magnitude INR cost ledger with editable base rates, explicit formulas, and clear cost exclusions.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={() => onEnterApp('planner')}>
                  <Hammer size={16} />
                  Construction Planner
                </button>
                <button type="button" className="btn-secondary" onClick={() => onEnterApp('estimator')}>
                  <Calculator size={16} />
                  Cost Estimator
                </button>
                <button type="button" className="btn-ghost" onClick={() => onEnterApp('reports')}>
                  <FileText size={15} />
                  Executive Reports
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
              <div className="tf-surface-cell accent-amber">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                  PHASE 01 — MANDATORY GATE
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.08rem', margin: '0.25rem 0' }}>
                  IS 1892 Rotary Borehole &amp; Topographic Datum
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-sandstone)' }}>
                  Physical SPT N-value logging every 1.5 m and laboratory triaxial shear testing before structural footing design.
                </p>
              </div>

              <div className="tf-surface-cell accent-sage">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-sage-bright)' }}>
                  PHASE 02–04 — EXECUTION &amp; LEDGER
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.08rem', margin: '0.25rem 0' }}>
                  Plinth Offset, Dewatering &amp; INR Rate Ledger
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-sandstone)' }}>
                  Itemized sq.ft and ₹ Lakhs breakdown separating user rate assumptions from site-condition allowances.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ==================================================================
            FINAL CALL TO ACTION SECTION
            ================================================================== */}
        <section className="landing-final-cta" aria-label="Final Call to Action">
          <div className="editorial-kicker" style={{ justifyContent: 'center' }}>
            167 VERIFIED CHENNAI LOCATIONS · EXPLAINABLE ENGINEERING INTELLIGENCE
          </div>
          <h2 className="landing-final-headline">
            Every site has a story.{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              Start exploring yours.
            </span>
          </h2>
          <p style={{ color: 'var(--text-sandstone)', maxWidth: '58ch', margin: '0 auto 2rem', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Enter the Terra Forge geospatial workstation to inspect Chennai locations, test project assumptions, compare candidate sites, and generate data-grounded engineering reports.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.95rem 2rem', fontSize: '1rem' }}
              onClick={() => onEnterApp('overview')}
            >
              <Compass size={19} />
              Enter Terra Forge
              <ArrowRight size={19} />
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.95rem 1.6rem', fontSize: '0.95rem' }}
              onClick={() => onEnterApp('map')}
            >
              <Layers size={18} />
              Launch Interactive GIS Map
            </button>
          </div>
        </section>

        {/* Restrained Footer with Brand & Existing Project Links */}
        <footer className="landing-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="brand-lockup">
              <div className="brand-emblem" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>TF</div>
              <div>
                <div className="brand-title" style={{ fontSize: '0.95rem' }}>TERRA FORGE</div>
                <div className="brand-subtitle">Intelligence before construction. Build smarter. Build stronger.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.84rem' }}>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('overview')}>Overview</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('map')}>Explore Map</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('profile')}>Location Monograph</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('assessment')}>Site Assessment</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('compare')}>Compare Sites</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('planner')}>Construction Planner</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('estimator')}>Cost Estimator</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('reports')}>Reports</button>
              <button type="button" className="footer-nav-link" onClick={() => onEnterApp('sources')}>Data Sources</button>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span>
              Sources: OpenStreetMap Contributors (ODbL) · Copernicus DEM / NASA SRTM · CGWB Chennai Hydrogeological Brochure · GSI 1:50k Maps · NCCR / GCC Framework
            </span>
            <span>
              Preliminary land intelligence only — does not replace physical IS 1892 borehole investigation or statutory approval.
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
