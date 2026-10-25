import React, { useMemo, useState } from 'react';
import {
  Compass,
  MapPin,
  Database,
  Scale,
  GitCompare,
  Hammer,
  FileText,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react';
import ChennaiMapCanvas from './ChennaiMapCanvas';

export default function OverviewSection({
  locations,
  coverageStats,
  selectedLocation,
  onSelectLocation,
  gisLayersData,
  currentAssessment,
  onNavigate,
  recentLocations,
  savedWorkspace,
  onToggleCompare,
  compareIds
}) {
  const [tableQuery, setTableQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'complete' | 'missing'
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'name', dir: 'asc' });
  const [expandedRowIds, setExpandedRowIds] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFullRegistryDrawer, setShowFullRegistryDrawer] = useState(true);

  // Genuinely data-driven featured Chennai indicator nodes from the actual database
  const featuredIndicatorNodes = useMemo(() => {
    const targetNames = ['velachery', 'anna nagar', 'adyar', 'sholinganallur', 'guindy'];
    return targetNames
      .map((name) => locations.find((l) => l.name.toLowerCase() === name))
      .filter(Boolean);
  }, [locations]);

  const comparedSites = useMemo(() => {
    return compareIds.map((id) => locations.find((l) => l.id === id)).filter(Boolean);
  }, [compareIds, locations]);

  // Real data aggregations from the 167-location database
  const soilBreakdown = useMemo(() => {
    const counts = {
      'Coastal Alluvial & Marine Sand': 0,
      'Quaternary Fluvial Alluvium': 0,
      'Upper Gondwana Sandstone / Clay': 0,
      'Archaean Charnockite / Gneiss': 0,
      'Lacustrine / Estuarine Clay': 0,
      'Outer CMA (Unmapped in 1:50k Soil Sheet)': 0
    };
    locations.forEach((l) => {
      const s = l.ground_and_soil?.soil_classification || '';
      if (!s) counts['Outer CMA (Unmapped in 1:50k Soil Sheet)'] += 1;
      else if (s.includes('Coastal Alluvial')) counts['Coastal Alluvial & Marine Sand'] += 1;
      else if (s.includes('Lacustrine') || s.includes('Estuarine')) counts['Lacustrine / Estuarine Clay'] += 1;
      else if (s.includes('Charnockite')) counts['Archaean Charnockite / Gneiss'] += 1;
      else if (s.includes('Gondwana')) counts['Upper Gondwana Sandstone / Clay'] += 1;
      else counts['Quaternary Fluvial Alluvium'] += 1;
    });
    return Object.entries(counts);
  }, [locations]);

  const basinBreakdown = useMemo(() => {
    const counts = {};
    locations.forEach((l) => {
      const b = l.environmental_and_flood?.watershed_basin || 'Unspecified Basin';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [locations]);

  const zoneOptions = useMemo(() => {
    const s = new Set();
    locations.forEach((l) => {
      if (l.geographic_context?.zone_code) s.add(l.geographic_context.zone_code);
    });
    return ['ALL', ...Array.from(s).sort()];
  }, [locations]);

  const filteredTableLocations = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    const list = locations.filter((l) => {
      if (zoneFilter !== 'ALL' && l.geographic_context?.zone_code !== zoneFilter) return false;
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.geographic_context?.zone_code?.toLowerCase().includes(q) ||
        l.geographic_context?.jurisdiction?.toLowerCase().includes(q) ||
        (l.ground_and_soil?.soil_classification || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const hasMissingCore =
        !l.ground_and_soil?.soil_classification ||
        !l.ground_and_soil?.groundwater_pre_monsoon_m_bgl ||
        !l.environmental_and_flood?.flood_hazard_category;

      if (filterMode === 'complete') return !hasMissingCore;
      if (filterMode === 'missing') return hasMissingCore;
      return true;
    });

    list.sort((a, b) => {
      const dir = sortConfig.dir === 'asc' ? 1 : -1;
      if (sortConfig.key === 'elevation') {
        return ((a.geographic_context?.elevation_m_msl ?? -99) - (b.geographic_context?.elevation_m_msl ?? -99)) * dir;
      }
      if (sortConfig.key === 'coastal') {
        return ((a.geographic_context?.coastal_distance_km ?? 999) - (b.geographic_context?.coastal_distance_km ?? 999)) * dir;
      }
      if (sortConfig.key === 'completeness') {
        return ((a.data_quality?.completeness_pct ?? 0) - (b.data_quality?.completeness_pct ?? 0)) * dir;
      }
      if (sortConfig.key === 'zone') {
        return (a.geographic_context?.zone_code || '').localeCompare(b.geographic_context?.zone_code || '') * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });

    return list;
  }, [locations, tableQuery, filterMode, zoneFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredTableLocations.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLocations = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTableLocations.slice(start, start + pageSize);
  }, [filteredTableLocations, safePage, pageSize]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleExpandRow = (id) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetTable = () => {
    setTableQuery('');
    setFilterMode('all');
    setZoneFilter('ALL');
    setSortConfig({ key: 'name', dir: 'asc' });
    setPage(1);
  };

  const coverageBars = [
    { label: 'Verified Coordinates (OpenStreetMap EPSG:4326)', count: coverageStats.verifiedCoords, total: coverageStats.totalTarget, color: '#84c7a3' },
    { label: 'Regional Soil Classification (CGWB / GSI 1:50k)', count: coverageStats.withSoil, total: coverageStats.totalTarget, color: '#e09f50' },
    { label: 'Seasonal Groundwater Depth Range (m bgl)', count: coverageStats.withGw, total: coverageStats.totalTarget, color: '#4fa8c2' },
    { label: 'Flood Basin & Inundation Context (NCCR / GCC)', count: coverageStats.withFlood, total: coverageStats.totalTarget, color: '#c87a48' },
    { label: 'Transit & Arterial Road Connectivity (OSM)', count: coverageStats.withTransit, total: coverageStats.totalTarget, color: '#5d9678' },
    { label: 'Outer CMA Locations With Disclosed Regional Gaps', count: coverageStats.requiringFurtherCollection, total: coverageStats.totalTarget, color: '#d95d48' }
  ];

  const loc = selectedLocation || locations[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* ====================================================================
          HERO STAGE: CINEMATIC TERRAIN INTELLIGENCE COMPOSITION
          ==================================================================== */}
      <section className="editorial-hero-stage" aria-label="Terra Forge Overview Hero">
        {/* Subtle Animated SVG Topographic Contours */}
        <svg className="hero-topo-backdrop" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path className="topo-contour-line" d="M-80,120 C240,40 480,220 820,130 C1120,50 1290,190 1540,110" />
          <path className="topo-contour-line solid" d="M-60,260 C290,160 540,360 880,250 C1180,150 1340,310 1560,230" />
          <path className="topo-contour-line copper" d="M-100,420 C210,330 510,500 860,390 C1150,290 1350,440 1580,370" />
          <path className="topo-contour-line" d="M-70,580 C270,490 590,650 920,540 C1210,440 1370,610 1560,530" />
          <circle className="topo-particle-dot" cx="310" cy="180" r="2.5" />
          <circle className="topo-particle-dot" cx="860" cy="250" r="3" />
          <circle className="topo-particle-dot" cx="1180" cy="390" r="2" />
          <circle className="topo-particle-dot" cx="540" cy="480" r="2.5" />
        </svg>

        {/* Left Column: Editorial Headline, Actions & Restrained Coverage Ribbon */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="editorial-kicker">
            TERRAIN INTELLIGENCE · CHENNAI METROPOLITAN GEOSPATIAL WORKSTATION
          </div>

          <h1 className="hero-headline">
            Understand the land.{' '}
            <em>Engineer with evidence.</em>
          </h1>

          <p className="hero-tagline">
            Explore Chennai through location intelligence, environmental context, engineering rules, and transparent site assessments.
          </p>

          <p className="hero-description">
            Synthesizing 167 verified OpenStreetMap locality nodes, Copernicus DEM / NASA SRTM 90m elevation models, CGWB hydrogeological sub-basins, NCCR flood context, and deterministic BIS civil engineering rules (IS 456, IS 1893, IS 1892).
          </p>

          <div className="hero-cta-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onNavigate('map')}
            >
              <Layers size={17} />
              Explore Chennai
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('assessment')}
            >
              <Scale size={17} />
              View site assessments
            </button>
          </div>

          {/* Restrained Location-Coverage Indicator Based on Actual Application Data */}
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

        {/* Right Column: High-Quality Interactive Terrain & Topographic Visualization */}
        <div className="hero-terrain-stage" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-terrain-header">
            <span>CHENNAI TOPOGRAPHIC & LITHOLOGICAL TERRAIN STAGE</span>
            <span style={{ color: 'var(--accent-sage-bright)' }}>
              ACTIVE: {loc.name.toUpperCase()} ({loc.geographic_context.elevation_m_msl ?? 'N/A'}m MSL)
            </span>
          </div>

          {/* Data-Driven Location Indicator Bar Over the Map */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'rgba(9, 12, 10, 0.92)',
              borderBottom: '1px solid var(--border-subtle)'
            }}
            aria-label="Data-driven Chennai location indicators"
          >
            {featuredIndicatorNodes.map((node) => {
              const active = node.id === loc.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`layer-toggle-btn ${active ? 'active' : ''}`}
                  style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => onSelectLocation(node)}
                >
                  <span>{node.name}</span>
                  <span style={{ color: active ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                    {node.geographic_context.elevation_m_msl}m · {node.geographic_context.coastal_distance_km}km
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hero-terrain-canvas-wrap">
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
                soilHalos: true
              }}
              gisLayersData={gisLayersData}
              compact={false}
            />
          </div>

          {/* Active Location Telemetry Footer */}
          <div className="hero-node-switcher-strip">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                {loc.id} · {loc.geographic_context.jurisdiction}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-ivory)' }}>
                {loc.name} — {loc.ground_and_soil.soil_classification ? loc.ground_and_soil.soil_classification.split('(')[0].trim() : 'Outer CMA Corridor'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Coord: {loc.coordinates.lat}°N, {loc.coordinates.lon}°E · Pre-Monsoon GW: {loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'} · Basin: {loc.environmental_and_flood.watershed_basin.split('(')[0].trim()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onNavigate('profile')}
              >
                Inspect Profile
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem' }}
                onClick={() => onNavigate('map')}
              >
                Open Full GIS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CHAPTER 01: LOCATION EXPLORATION & HYDROLOGICAL TERRAIN
          ==================================================================== */}
      <section className="editorial-chapter" aria-label="Location Exploration and Hydrological Context">
        <div>
          <span className="chapter-number">01 / SPATIAL & LITHOLOGICAL EXPLORATION</span>
          <h2 className="chapter-heading">
            Six geological provinces across four major river & estuary basins.
          </h2>
          <p className="chapter-lead">
            Chennai’s ground conditions shift sharply from East Coast marine sands and Adyar-Cooum estuarine clays to West-South-West Archaean charnockite hard rock. Terra Forge maps every locality against its regional lithology and watershed carrier.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button type="button" className="btn-primary" onClick={() => onNavigate('map')}>
              <Compass size={16} />
              Launch Interactive Map
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('profile')}>
              <MapPin size={16} />
              Inspect {loc.name} Profile
            </button>
          </div>

          <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
            RECENTLY INSPECTED NODES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {recentLocations.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`btn-ghost ${loc.id === r.id ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                onClick={() => onSelectLocation(r)}
              >
                {r.name} ({r.geographic_context.elevation_m_msl}m)
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)', marginBottom: '0.75rem', letterSpacing: '0.06em' }}>
              REGIONAL LITHOLOGY DISTRIBUTION (167 SITES)
            </div>
            <div className="spec-ledger">
              {soilBreakdown.map(([label, count]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-sandstone)' }}>{label}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-sage-bright)', marginBottom: '0.75rem', letterSpacing: '0.06em' }}>
              HYDROLOGICAL WATERSHED BASINS
            </div>
            <div className="spec-ledger">
              {basinBreakdown.map(([basin, count]) => (
                <div key={basin} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-sandstone)', paddingRight: '1rem' }}>{basin}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sage-bright)' }}>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CHAPTER 02: EXPLAINABLE ENGINEERING INTELLIGENCE
          ==================================================================== */}
      <section className="editorial-chapter reverse" aria-label="Explainable Engineering Intelligence">
        {/* Left: Live Engineering Rules Preview for Active Location */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)', marginBottom: '0.85rem', letterSpacing: '0.08em' }}>
            ACTIVE SITE PRELIMINARY ENVELOPE — {loc.name.toUpperCase()} ({loc.id})
          </div>

          {currentAssessment && (
            <>
              <div className="monument-strip" style={{ marginBottom: '1.5rem' }}>
                <div className="monument-cell">
                  <span className="monument-label">IS 456 Concrete & Cover</span>
                  <span className="monument-value amber" style={{ fontSize: '1.35rem' }}>
                    {currentAssessment.calculatedMetrics.minConcreteGrade.split('(')[0].trim()} · {currentAssessment.calculatedMetrics.nominalCoverMm}mm
                  </span>
                  <span className="monument-sub">{loc.geographic_context.coastal_distance_km} km from shoreline</span>
                </div>
                <div className="monument-cell">
                  <span className="monument-label">Recommended Plinth</span>
                  <span className="monument-value sage" style={{ fontSize: '1.35rem' }}>
                    +{currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m
                  </span>
                  <span className="monument-sub">Above adjacent road crown</span>
                </div>
                <div className="monument-cell">
                  <span className="monument-label">IS 1892 Borehole Gate</span>
                  <span className="monument-value" style={{ fontSize: '1.35rem' }}>
                    {currentAssessment.calculatedMetrics.recommendedBoreholes} BH × {currentAssessment.calculatedMetrics.targetBoreholeDepthM}m
                  </span>
                  <span className="monument-sub">Mandatory field verification</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {currentAssessment.recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="tf-surface-cell accent-amber"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)' }}>
                        {rec.ruleId || rec.category}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-ivory)', margin: '0.15rem 0' }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-sandstone)' }}>
                        {rec.conciseSummary}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onNavigate('assessment')}
                    >
                      Inspect Evidence
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Editorial Narrative */}
        <div>
          <span className="chapter-number">02 / EVIDENCE-ON-DEMAND ENGINEERING</span>
          <h2 className="chapter-heading">
            Every recommendation traces back to a measurement and a code clause.
          </h2>
          <p className="chapter-lead">
            Instead of opaque scores or generic checklists, Terra Forge evaluates verified coastal distance, SRTM elevation, CGWB groundwater tables, and watershed sensitivity against BIS standards (IS 456:2000, IS 1893:2016, IS 1892:1979, TNCDBR 2019).
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            Where plot-level borehole logs (SPT N-value or Safe Bearing Capacity) do not exist in public datasets, Terra Forge explicitly flags them as unavailable and calculates the required subsurface exploration scope.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={() => onNavigate('assessment')}>
              <Scale size={16} />
              Open Site Assessment Studio
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('sources')}>
              <Database size={16} />
              Inspect Rule Methodology
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CHAPTER 03: SITE COMPARISON & CONSTRUCTION PLANNING
          ==================================================================== */}
      <section className="editorial-chapter" aria-label="Site Comparison and Construction Planning">
        <div>
          <span className="chapter-number">03 / COMPARATIVE & PHASED PLANNING</span>
          <h2 className="chapter-heading">
            Compare candidate locations and structure pre-construction gates.
          </h2>
          <p className="chapter-lead">
            Evaluate 2 to 4 Chennai sites side-by-side without artificial "winner" scores, then translate site constraints into a 4-phase engineering roadmap and transparent order-of-magnitude cost estimate.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={() => onNavigate('compare')}>
              <GitCompare size={16} />
              Compare {comparedSites.length} Selected Sites
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('planner')}>
              <Hammer size={16} />
              Construction Planner
            </button>
            <button type="button" className="btn-ghost" onClick={() => onNavigate('reports')}>
              <FileText size={15} />
              Executive Dossier
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
          {comparedSites.map((site) => (
            <div key={site.id} className="tf-surface-cell accent-sage" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                  {site.id}
                </span>
                <span className="status-pill verified">{site.geographic_context.elevation_m_msl ?? 'N/A'}m MSL</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-ivory)' }}>
                {site.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-sandstone)' }}>
                <strong>Soil:</strong> {site.ground_and_soil.soil_classification ? site.ground_and_soil.soil_classification.split('(')[0].trim() : 'Outer CMA Unmapped'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-sandstone)' }}>
                <strong>Pre-Monsoon GW:</strong> {site.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Coast: {site.geographic_context.coastal_distance_km} km · {site.geographic_context.zone_code}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          CHAPTER 04: TRANSPARENT COVERAGE AUDIT & 167-LOCATION REGISTRY
          ==================================================================== */}
      <section style={{ paddingTop: '3.5rem' }} aria-label="Database Coverage Audit and 167-Location Registry">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <span className="chapter-number">04 / DATA INTEGRITY & 167-LOCATION REGISTRY</span>
            <h2 className="chapter-heading" style={{ marginBottom: '0.4rem' }}>
              Location Registration vs. Attribute-Level Verification
            </h2>
            <p style={{ margin: 0, color: 'var(--text-sandstone)', maxWidth: '72ch', fontSize: '0.98rem' }}>
              All 167 target Chennai locations are verified with OpenStreetMap coordinates and SRTM elevations. Where outer-CMA localities lie outside 1:50,000 soil sheets or ward-level flood maps, Terra Forge explicitly surfaces those gaps rather than fabricating data.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            aria-expanded={showFullRegistryDrawer}
            onClick={() => setShowFullRegistryDrawer((v) => !v)}
          >
            <Database size={16} />
            <span>{showFullRegistryDrawer ? 'Hide 167-Location Registry Table' : 'Inspect All 167 Chennai Locations'}</span>
            {showFullRegistryDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Clean Open-Canvas Coverage Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.35rem 2.5rem', marginBottom: '2.25rem' }}>
          {coverageBars.map((item) => {
            const pct = Math.round((item.count / item.total) * 100);
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.38rem' }}>
                  <span style={{ color: 'var(--text-sandstone)' }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-ivory)', fontWeight: 600 }}>
                    {item.count} / {item.total} ({pct}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '999px',
                      transition: 'width 0.45s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible 167-Location Registry Table */}
        <div
          className={`tf-disclosure-drawer ${showFullRegistryDrawer ? 'is-open' : ''}`}
          hidden={!showFullRegistryDrawer}
        >
          <div className="panel-card" style={{ marginTop: '0.5rem' }}>
            <div className="panel-card-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <h3 className="panel-card-title">Complete 167-Location Registry & Attribute Coverage Audit</h3>
              </div>

              <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="search"
                  placeholder="Search 167 locations by name, ID, zone, or soil..."
                  value={tableQuery}
                  onChange={(e) => {
                    setTableQuery(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter 167 locations by name, ID, or zone"
                  style={{
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.85rem',
                    color: 'var(--text-ivory)',
                    fontSize: '0.84rem',
                    minWidth: '230px'
                  }}
                />
                <select
                  value={zoneFilter}
                  onChange={(e) => {
                    setZoneFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by GCC Zone"
                  style={{
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.7rem',
                    color: 'var(--text-ivory)',
                    fontSize: '0.82rem'
                  }}
                >
                  {zoneOptions.map((z) => (
                    <option key={z} value={z}>
                      {z === 'ALL' ? 'All Zones (167)' : z}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`btn-ghost ${filterMode === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterMode('all');
                    setPage(1);
                  }}
                >
                  All ({locations.length})
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${filterMode === 'complete' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterMode('complete');
                    setPage(1);
                  }}
                >
                  Full Regional Data ({locations.length - coverageStats.requiringFurtherCollection})
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${filterMode === 'missing' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterMode('missing');
                    setPage(1);
                  }}
                >
                  Has Regional Gaps ({coverageStats.requiringFurtherCollection})
                </button>
                {(tableQuery || filterMode !== 'all' || zoneFilter !== 'ALL' || sortConfig.key !== 'name' || sortConfig.dir !== 'asc') && (
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: 'var(--accent-amber)', borderColor: 'var(--border-copper)' }}
                    onClick={handleResetTable}
                  >
                    Reset Sort &amp; Filters
                  </button>
                )}
              </div>
            </div>

            <div tabIndex={0} role="region" aria-labelledby="registry-audit-caption" className="table-wrapper" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
              <table
                className="tf-table"
                style={{
                  '--label-2': '"Administrative Zone"',
                  '--label-3': '"SRTM Elevation"',
                  '--label-4': '"Coastal Dist."',
                  '--label-5': '"Evidence Coverage"',
                  '--label-6': '"Actions"'
                }}
              >
                <caption id="registry-audit-caption">
                  Showing {paginatedLocations.length} of {filteredTableLocations.length} matching Chennai locations (Total verified database: 167) — Click column headers to sort, click location names for monographs, or expand rows for technical metadata
                </caption>
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className={`tf-sort-btn ${sortConfig.key === 'name' ? 'is-sorted' : ''}`}
                        onClick={() => handleSort('name')}
                      >
                        <span>Location &amp; Stable ID</span>
                        <span>{sortConfig.key === 'name' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className={`tf-sort-btn ${sortConfig.key === 'zone' ? 'is-sorted' : ''}`}
                        onClick={() => handleSort('zone')}
                      >
                        <span>Administrative Zone</span>
                        <span>{sortConfig.key === 'zone' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th className="tf-numeric-cell" title="Copernicus DEM GLO-90 / NASA SRTM elevation above Mean Sea Level">
                      <button
                        type="button"
                        className={`tf-sort-btn ${sortConfig.key === 'elevation' ? 'is-sorted' : ''}`}
                        onClick={() => handleSort('elevation')}
                      >
                        <span>Elevation (m MSL)</span>
                        <span>{sortConfig.key === 'elevation' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th className="tf-numeric-cell" title="Geodesic distance to nearest Bay of Bengal shoreline (IS 456 exposure)">
                      <button
                        type="button"
                        className={`tf-sort-btn ${sortConfig.key === 'coastal' ? 'is-sorted' : ''}`}
                        onClick={() => handleSort('coastal')}
                      >
                        <span>Coast Dist. (km)</span>
                        <span>{sortConfig.key === 'coastal' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className={`tf-sort-btn ${sortConfig.key === 'completeness' ? 'is-sorted' : ''}`}
                        onClick={() => handleSort('completeness')}
                      >
                        <span>Soil, Aquifer &amp; Flood Status</span>
                        <span>{sortConfig.key === 'completeness' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>Inspect &amp; Expand</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.map((item) => {
                    const inComp = compareIds.includes(item.id);
                    const isSelected = loc.id === item.id;
                    const isExpanded = Boolean(expandedRowIds[item.id]);
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={isSelected ? 'tf-selected-row' : ''}>
                          <th>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                              {item.id} · OSM #{item.coordinates.osm_id}
                            </div>
                            <button
                              type="button"
                              className="tf-clickable-name"
                              onClick={() => {
                                onSelectLocation(item);
                                onNavigate('profile');
                              }}
                              title={`Open Location Profile Monograph for ${item.name}`}
                            >
                              {item.name}
                            </button>
                          </th>
                          <td>
                            <div>{item.geographic_context.jurisdiction}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {item.geographic_context.planning_corridor}
                            </div>
                          </td>
                          <td className="tf-numeric-cell">
                            <strong style={{ color: 'var(--text-ivory)' }}>
                              {item.geographic_context.elevation_m_msl !== null
                                ? `${item.geographic_context.elevation_m_msl} m`
                                : 'Not available'}
                            </strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {item.coordinates.lat}°N, {item.coordinates.lon}°E
                            </div>
                          </td>
                          <td className="tf-numeric-cell">
                            <strong style={{ color: 'var(--accent-amber)' }}>
                              {item.geographic_context.coastal_distance_km} km
                            </strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {item.geographic_context.coastal_distance_km <= 5 ? 'IS 456 Severe' : 'IS 456 Moderate'}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
                              {item.ground_and_soil.soil_classification ? (
                                <span className="status-pill verified" title={item.ground_and_soil.soil_classification}>
                                  Soil: {item.ground_and_soil.soil_classification.split('(')[0].trim()}
                                </span>
                              ) : (
                                <span className="status-pill missing">Soil: Not available</span>
                              )}
                              {item.ground_and_soil.groundwater_pre_monsoon_m_bgl ? (
                                <span className="status-pill verified">
                                  GW: {item.ground_and_soil.groundwater_pre_monsoon_m_bgl}
                                </span>
                              ) : (
                                <span className="status-pill missing">GW: Not available</span>
                              )}
                              {item.environmental_and_flood.flood_hazard_category ? (
                                <span className="status-pill regional">
                                  {item.environmental_and_flood.flood_hazard_category.split('(')[0].trim()}
                                </span>
                              ) : (
                                <span className="status-pill missing">Flood: Not available</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn-ghost"
                                style={{ padding: '0.32rem 0.6rem', fontSize: '0.76rem' }}
                                aria-expanded={isExpanded}
                                onClick={() => toggleExpandRow(item.id)}
                              >
                                {isExpanded ? 'Hide Details ▲' : 'Details ▼'}
                              </button>
                              <button
                                type="button"
                                className="btn-ghost"
                                style={{ padding: '0.32rem 0.6rem', fontSize: '0.76rem' }}
                                onClick={() => {
                                  onSelectLocation(item);
                                  onNavigate('profile');
                                }}
                              >
                                Monograph
                              </button>
                              <button
                                type="button"
                                className={`btn-ghost ${inComp ? 'active' : ''}`}
                                style={{ padding: '0.32rem 0.6rem', fontSize: '0.76rem' }}
                                onClick={() => onToggleCompare(item.id)}
                              >
                                {inComp ? 'In Compare' : '+ Compare'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="tf-expanded-detail-row">
                            <td colSpan={6}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', fontSize: '0.84rem' }}>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)', marginBottom: '0.2rem' }}>
                                    GEOLOGICAL FORMATION &amp; SOIL (CGWB / GSI)
                                  </div>
                                  <div style={{ color: 'var(--text-ivory)' }}>{item.ground_and_soil.geological_formation}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                                    Soil: {item.ground_and_soil.soil_classification || 'Not available in 1:50,000 sheet'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-sage-bright)', marginBottom: '0.2rem' }}>
                                    SEASONAL GROUNDWATER &amp; WATERSHED
                                  </div>
                                  <div style={{ color: 'var(--text-ivory)' }}>
                                    Pre-Monsoon: {item.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Not available'} · Post-Monsoon: {item.ground_and_soil.groundwater_post_monsoon_m_bgl || 'Not available'}
                                  </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                                    Basin: {item.environmental_and_flood.watershed_basin}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#4fa8c2', marginBottom: '0.2rem' }}>
                                    TRANSIT &amp; LIMITATIONS
                                  </div>
                                  <div style={{ color: 'var(--text-ivory)' }}>
                                    Nearest Transit: {item.accessibility_and_connectivity.nearest_transit_stations?.[0] ? `${item.accessibility_and_connectivity.nearest_transit_stations[0].name} (${item.accessibility_and_connectivity.nearest_transit_stations[0].distance_km} km)` : 'Road network only'}
                                  </div>
                                  <div style={{ color: '#f49b8c', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                                    {item.data_quality.missing_regional_attributes.length > 0
                                      ? `Disclosed gaps: ${item.data_quality.missing_regional_attributes.join(', ')}`
                                      : 'Plot-level SPT borehole & laboratory SBC required per IS 1892.'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Page Size Footer */}
            <div className="tf-table-pagination">
              <div>
                Showing <strong>{filteredTableLocations.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
                <strong>{Math.min(safePage * pageSize, filteredTableLocations.length)}</strong> of{' '}
                <strong>{filteredTableLocations.length}</strong> locations
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{
                      background: 'var(--bg-obsidian)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: 'var(--text-ivory)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value={15}>15 / page</option>
                    <option value={30}>30 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={167}>All 167</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Restrained Engineering Disclaimer Footer */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}
        >
          <ShieldAlert size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--text-sandstone)' }}>Engineering Scope Note:</strong> Terra Forge supports preliminary land intelligence and separates verified spatial nodes from regional hydrogeological sheets. It does not replace physical IS 1892 borehole testing, structural certification, or statutory land-title verification.
          </span>
        </div>
      </section>
    </div>
  );
}
