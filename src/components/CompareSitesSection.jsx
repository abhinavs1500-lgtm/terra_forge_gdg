import React, { useMemo, useState } from 'react';
import {
  GitCompare,
  Plus,
  Trash2,
  Bookmark,
  FileText,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function CompareSitesSection({
  locations,
  compareIds,
  onAddCompareId,
  onRemoveCompareId,
  onSaveComparison,
  onSelectLocation,
  onNavigate
}) {
  const [selectedToAdd, setSelectedToAdd] = useState(locations[10]?.id || '');
  const [compTitle, setCompTitle] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [attrCategory, setAttrCategory] = useState('ALL');
  const [attrSearch, setAttrSearch] = useState('');
  const [highlightDiffs, setHighlightDiffs] = useState(true);
  const [expandedAttrs, setExpandedAttrs] = useState({
    soil: true
  });

  const comparedLocations = compareIds
    .map((id) => locations.find((l) => l.id === id))
    .filter(Boolean);

  const handleSave = () => {
    if (comparedLocations.length < 2) return;
    const title =
      compTitle.trim() ||
      `Comparison: ${comparedLocations.map((l) => l.name).join(' vs. ')}`;
    onSaveComparison(title, compareIds);
    setSaveMsg(`Saved comparison "${title}" to workspace.`);
    setCompTitle('');
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const toggleExpandAttr = (id) => {
    setExpandedAttrs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Factual trade-off observations (no arbitrary "winner" score)
  const highestElevLoc =
    comparedLocations.length >= 2
      ? [...comparedLocations].sort(
          (a, b) =>
            (b.geographic_context?.elevation_m_msl ?? -1) -
            (a.geographic_context?.elevation_m_msl ?? -1)
        )[0]
      : null;

  const closestTransitLoc =
    comparedLocations.length >= 2
      ? [...comparedLocations].sort(
          (a, b) =>
            (a.accessibility_and_connectivity?.nearest_transit_stations?.[0]?.distance_km ?? 99) -
            (b.accessibility_and_connectivity?.nearest_transit_stations?.[0]?.distance_km ?? 99)
        )[0]
      : null;

  const inlandLoc =
    comparedLocations.length >= 2
      ? [...comparedLocations].sort(
          (a, b) =>
            (b.geographic_context?.coastal_distance_km ?? 0) -
            (a.geographic_context?.coastal_distance_km ?? 0)
        )[0]
      : null;

  const maxElev = Math.max(15, ...comparedLocations.map((l) => l.geographic_context?.elevation_m_msl || 0));
  const maxCoast = Math.max(15, ...comparedLocations.map((l) => l.geographic_context?.coastal_distance_km || 0));

  // Structured comparison rows with category, difference detection, tooltip, and expandable methodology
  const comparisonRows = useMemo(() => {
    const hasDiff = (getter) => {
      const vals = comparedLocations.map(getter);
      return new Set(vals).size > 1;
    };

    return [
      {
        id: 'zone',
        category: 'GEOGRAPHIC',
        label: 'Administrative Zone & Corridor',
        unit: 'GCC Zone / CMA',
        tooltip: 'Greater Chennai Corporation 15-Zone or Outer CMA planning jurisdiction',
        isDifferent: hasDiff((l) => l.geographic_context.jurisdiction),
        methodology:
          'Identifies whether the locality falls under Greater Chennai Corporation (Zones I–XV) or surrounding CMDA local planning authorities, governing storm water drain connectivity and FSI schedules.',
        renderCell: (loc) => (
          <>
            <strong>{loc.geographic_context.jurisdiction}</strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {loc.geographic_context.planning_corridor}
            </div>
          </>
        )
      },
      {
        id: 'coords',
        category: 'GEOGRAPHIC',
        label: 'Verified Coordinates (WGS 84)',
        unit: '°N, °E (EPSG:4326)',
        tooltip: 'Directly sourced from OpenStreetMap locality node geometry',
        isDifferent: true,
        methodology:
          'Directly queried from OpenStreetMap Overpass API locality nodes. Used to compute geodesic distances to shoreline, waterways, and transit stations.',
        renderCell: (loc) => (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
            {loc.coordinates.lat}°N, {loc.coordinates.lon}°E
            <div style={{ fontSize: '0.73rem', color: 'var(--accent-sage-bright)' }}>
              OSM Node #{loc.coordinates.osm_id}
            </div>
          </div>
        )
      },
      {
        id: 'elevation',
        category: 'GEOGRAPHIC',
        label: 'Ground Elevation (SRTM)',
        unit: 'm MSL',
        tooltip: 'Meters above Mean Sea Level from Copernicus DEM GLO-90 / NASA SRTM',
        isDifferent: hasDiff((l) => l.geographic_context.elevation_m_msl),
        methodology:
          'Sampled at the verified locality coordinate from Copernicus DEM GLO-90 / NASA SRTM. Lower elevations (< 8m MSL) require careful gravity drainage invert checks and higher finished plinth offsets.',
        renderCell: (loc) => {
          const isHighest = highestElevLoc?.id === loc.id;
          return (
            <div style={{ fontFamily: 'var(--font-mono)' }}>
              <strong style={{ color: isHighest ? 'var(--accent-sage-bright)' : 'var(--text-ivory)' }}>
                {loc.geographic_context.elevation_m_msl !== null
                  ? `${loc.geographic_context.elevation_m_msl} m MSL`
                  : 'Not available'}
              </strong>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Copernicus DEM 90m {isHighest ? '· Highest in set' : ''}
              </div>
            </div>
          );
        }
      },
      {
        id: 'coastal',
        category: 'GEOGRAPHIC',
        label: 'Coastal Proximity',
        unit: 'km to shoreline',
        tooltip: 'Geodesic distance to nearest Bay of Bengal coastline segment',
        isDifferent: hasDiff((l) => l.geographic_context.coastal_distance_km <= 5),
        methodology:
          'Governs environmental exposure severity under BIS IS 456:2000 Table 3. Sites within 1.5 km are Very Severe coastal exposure (M35, 50mm cover); 1.5–5.0 km are Severe near-coastal (M30, 45mm cover).',
        renderCell: (loc) => (
          <div style={{ fontFamily: 'var(--font-mono)' }}>
            <strong style={{ color: 'var(--accent-amber)' }}>
              {loc.geographic_context.coastal_distance_km} km
            </strong>{' '}
            from Bay of Bengal
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              {loc.geographic_context.coastal_distance_km <= 1.5
                ? 'Very Severe Exposure (IS 456)'
                : loc.geographic_context.coastal_distance_km <= 5
                ? 'Severe Near-Coastal (IS 456)'
                : 'Moderate Urban Exposure (IS 456)'}
            </div>
          </div>
        )
      },
      {
        id: 'soil',
        category: 'GROUND',
        label: 'Soil Classification (CGWB/GSI)',
        unit: '1:50,000 Regional Class',
        tooltip: 'Regional soil unit from CGWB Chennai Brochure & GSI 1:50k sheet',
        isDifferent: hasDiff((l) => l.ground_and_soil.soil_classification || 'MISSING'),
        methodology:
          'Regional soil mapping indicates whether the locality is underlain by marine sand, fluvial alluvium, expansive estuarine clay, or shallow crystalline rock. Plot-specific SPT borehole testing per IS 1892 remains mandatory.',
        renderCell: (loc) =>
          loc.ground_and_soil.soil_classification ? (
            <>
              <div>{loc.ground_and_soil.soil_classification}</div>
              <span className="status-pill regional" style={{ marginTop: '0.25rem' }}>
                1:50k Regional Unit
              </span>
            </>
          ) : (
            <span className="status-pill missing">Not available (Unmapped in 1:50k Sheet)</span>
          )
      },
      {
        id: 'geology',
        category: 'GROUND',
        label: 'Geological Formation',
        unit: 'Stratigraphic Unit',
        tooltip: 'Underlying geological province from Geological Survey of India',
        isDifferent: hasDiff((l) => l.ground_and_soil.geological_formation),
        methodology:
          'Identifies the primary parent rock or Quaternary sedimentary unit beneath the locality (e.g., Archaean Charnockite basement vs. Adyar-Cooum estuarine fill).',
        renderCell: (loc) => <span>{loc.ground_and_soil.geological_formation || 'Not available'}</span>
      },
      {
        id: 'groundwater',
        category: 'GROUND',
        label: 'Groundwater Depth (Pre / Post-Monsoon)',
        unit: 'm bgl (meters below ground)',
        tooltip: 'Seasonal piezometric depth range from CGWB observation wells',
        isDifferent: hasDiff((l) => l.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'MISSING'),
        methodology:
          'Shallow post-monsoon water tables (< 2.0 m bgl) require well-point dewatering during foundation excavation and integral crystalline waterproofing for substructure concrete.',
        renderCell: (loc) =>
          loc.ground_and_soil.groundwater_pre_monsoon_m_bgl ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div>Pre (May): {loc.ground_and_soil.groundwater_pre_monsoon_m_bgl}</div>
              <div>Post (Jan): {loc.ground_and_soil.groundwater_post_monsoon_m_bgl}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Yield: {loc.ground_and_soil.groundwater_yield_range}
              </div>
            </div>
          ) : (
            <span className="status-pill missing">Not available (No Local CGWB Well)</span>
          )
      },
      {
        id: 'watershed',
        category: 'FLOOD',
        label: 'Hydrological Watershed Basin',
        unit: 'Drainage Carrier & Distance',
        tooltip: 'Primary river/canal basin and nearest verified OSM water body',
        isDifferent: hasDiff((l) => l.environmental_and_flood.watershed_basin),
        methodology:
          'Maps each site to Chennai’s four major drainage basins (Kosasthalaiyar, Cooum, Adyar, Kovalam-Pallikaranai) and computes geodesic distance to the nearest mapped lake, tank, or canal.',
        renderCell: (loc) => (
          <>
            <div>{loc.environmental_and_flood.watershed_basin}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Nearest Water:{' '}
              {loc.environmental_and_flood.nearest_water_body
                ? `${loc.environmental_and_flood.nearest_water_body.name} (${loc.environmental_and_flood.nearest_water_body.distance_km} km)`
                : 'None in immediate buffer'}
            </div>
          </>
        )
      },
      {
        id: 'flood',
        category: 'FLOOD',
        label: 'Flood Hazard Sensitivity (NCCR / GCC)',
        unit: 'Basin Sensitivity Class',
        tooltip: 'Regional flood sensitivity from NCCR CFLOWS-Chennai & GCC ward data',
        isDifferent: hasDiff((l) => l.environmental_and_flood.flood_hazard_category || 'MISSING'),
        methodology:
          'Synthesizes historical inundation context (2015 / 2023 monsoon events) and topographic depression sensitivity to guide plinth elevation and stilt-parking planning.',
        renderCell: (loc) =>
          loc.environmental_and_flood.flood_hazard_category ? (
            <div>
              <span
                className={`status-pill ${
                  loc.environmental_and_flood.flood_hazard_category.includes('High')
                    ? 'missing'
                    : 'verified'
                }`}
              >
                {loc.environmental_and_flood.flood_hazard_category}
              </span>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {loc.environmental_and_flood.historical_inundation_context}
              </div>
            </div>
          ) : (
            <span className="status-pill missing">Not available (Outside GCC 200-Ward Map)</span>
          )
      },
      {
        id: 'concrete',
        category: 'ENGINEERING',
        label: 'IS 456 Concrete & Rebar Specification',
        unit: 'Grade & Cover (mm)',
        tooltip: 'Minimum structural concrete grade and rebar specification per IS 456',
        isDifferent: hasDiff((l) => l.construction_and_materials.recommended_concrete_grade),
        methodology:
          'Derived deterministically from coastal distance and groundwater exposure per BIS IS 456:2000 Table 3 & Table 5.',
        renderCell: (loc) => (
          <div style={{ fontSize: '0.82rem' }}>
            <div>
              <strong>Grade:</strong> {loc.construction_and_materials.recommended_concrete_grade}
            </div>
            <div>
              <strong>Rebar:</strong> {loc.construction_and_materials.reinforcement_specification}
            </div>
          </div>
        )
      },
      {
        id: 'transit',
        category: 'ENGINEERING',
        label: 'Nearest Rail / CMRL Metro Station',
        unit: 'Geodesic km (OSM)',
        tooltip: 'Closest verified CMRL Metro, Suburban Rail, or MRTS station',
        isDifferent: true,
        methodology:
          'Computed using Haversine geodesic distance against 120 verified OpenStreetMap rail and metro station nodes across the Chennai Metropolitan Area.',
        renderCell: (loc) => {
          const st = loc.accessibility_and_connectivity.nearest_transit_stations[0];
          return st ? (
            <div>
              <strong>{st.name}</strong> ({st.distance_km} km)
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{st.type}</div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Not available within 8.5 km</span>
          );
        }
      },
      {
        id: 'completeness',
        category: 'ENGINEERING',
        label: 'Data Completeness & Missing Fields',
        unit: '% Regional Coverage',
        tooltip: 'Percentage of core regional attributes present vs. unmapped gaps',
        isDifferent: hasDiff((l) => l.data_quality.completeness_pct),
        methodology:
          'Tracks whether all 8 regional attributes are present and explicitly lists any unmapped regional sheets plus mandatory plot-level IS 1892 borehole requirements.',
        renderCell: (loc) => (
          <>
            <span className="status-pill verified">
              {loc.data_quality.completeness_pct}% Regional Coverage
            </span>
            {loc.data_quality.missing_regional_attributes.length > 0 ? (
              <div style={{ fontSize: '0.76rem', color: '#f09383', marginTop: '0.3rem' }}>
                Missing: {loc.data_quality.missing_regional_attributes.join('; ')}
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--accent-sage-bright)', marginTop: '0.3rem' }}>
                All 8 core regional attributes present; plot SPT borehole required.
              </div>
            )}
          </>
        )
      }
    ];
  }, [comparedLocations, highestElevLoc]);

  const filteredRows = useMemo(() => {
    const q = attrSearch.trim().toLowerCase();
    return comparisonRows.filter((row) => {
      if (attrCategory !== 'ALL' && row.category !== attrCategory) return false;
      if (!q) return true;
      return (
        row.label.toLowerCase().includes(q) ||
        row.unit.toLowerCase().includes(q) ||
        row.methodology.toLowerCase().includes(q)
      );
    });
  }, [comparisonRows, attrCategory, attrSearch]);

  return (
    <div>
      {/* Editorial Header */}
      <div className="section-header">
        <div>
          <div className="editorial-kicker">
            COMPARATIVE GEOSPATIAL MATRIX · FACTUAL TRADE-OFF ANALYSIS
          </div>
          <h1 className="section-title">
            Compare Candidate{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              Chennai Locations ({comparedLocations.length})
            </span>
          </h1>
          <p className="section-subtitle">
            Side-by-side comparison of verified coordinates, SRTM terrain elevation, CGWB soil and groundwater profiles, watershed flood sensitivity, BIS material specifications, and transit connectivity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            aria-label="Select location to add to comparison"
            style={{
              background: 'var(--bg-graphite)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.8rem',
              color: 'var(--text-ivory)',
              fontSize: '0.86rem'
            }}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id} disabled={compareIds.includes(l.id)}>
                {l.name} ({l.id}) — {l.geographic_context.zone_code}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secondary"
            disabled={compareIds.includes(selectedToAdd) || compareIds.length >= 4}
            onClick={() => onAddCompareId(selectedToAdd)}
          >
            <Plus size={15} />
            Add Site (Max 4)
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate('reports')}
          >
            <FileText size={15} />
            Include in Report
          </button>
        </div>
      </div>

      {/* Factual Trade-Off Monument Strip */}
      {comparedLocations.length >= 2 && (
        <div className="monument-strip" role="region" aria-label="Comparative Trade-Off Highlights">
          <div className="monument-cell">
            <span className="monument-label">Highest SRTM Elevation</span>
            <span className="monument-value sage" style={{ fontSize: '1.35rem' }}>
              {highestElevLoc?.name} ({highestElevLoc?.geographic_context?.elevation_m_msl ?? 'N/A'} m MSL)
            </span>
            <span className="monument-sub">Lowest gravity drainage surcharge sensitivity</span>
          </div>

          <div className="monument-cell">
            <span className="monument-label">Furthest Inland (Lowest Salt Spray)</span>
            <span className="monument-value amber" style={{ fontSize: '1.35rem' }}>
              {inlandLoc?.name} ({inlandLoc?.geographic_context?.coastal_distance_km} km)
            </span>
            <span className="monument-sub">Reduced airborne marine chloride exposure (IS 456)</span>
          </div>

          <div className="monument-cell">
            <span className="monument-label">Closest Rail / Metro Station</span>
            <span className="monument-value" style={{ fontSize: '1.35rem' }}>
              {closestTransitLoc?.name} ({closestTransitLoc?.accessibility_and_connectivity?.nearest_transit_stations?.[0]?.distance_km ?? 'N/A'} km)
            </span>
            <span className="monument-sub">
              {closestTransitLoc?.accessibility_and_connectivity?.nearest_transit_stations?.[0]?.name || 'Road access'}
            </span>
          </div>
        </div>
      )}

      {/* Aligned Visual Comparison Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(2, comparedLocations.length)}, minmax(240px, 1fr))`,
          gap: '1.25rem',
          marginBottom: '2.25rem',
          overflowX: 'auto'
        }}
      >
        {comparedLocations.map((loc) => {
          const elevPct = Math.round(((loc.geographic_context?.elevation_m_msl || 0) / maxElev) * 100);
          const coastPct = Math.round(((loc.geographic_context?.coastal_distance_km || 0) / maxCoast) * 100);
          return (
            <div key={loc.id} className="panel-card" style={{ padding: '1.4rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                    {loc.id} · {loc.geographic_context.zone_code}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '0.15rem 0 0' }}>
                    {loc.name}
                  </h2>
                </div>
                {comparedLocations.length > 2 && (
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '0.3rem 0.5rem', color: '#f49b8c' }}
                    onClick={() => onRemoveCompareId(loc.id)}
                    aria-label={`Remove ${loc.name} from comparison`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Visual Bar 1: Elevation */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Elevation (SRTM)</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sage-bright)' }}>
                    {loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL
                  </strong>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-obsidian)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${elevPct}%`, height: '100%', background: 'var(--accent-sage-bright)', borderRadius: '999px' }} />
                </div>
              </div>

              {/* Visual Bar 2: Coastal Distance */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Coastal Distance</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                    {loc.geographic_context.coastal_distance_km} km
                  </strong>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-obsidian)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${coastPct}%`, height: '100%', background: 'var(--accent-amber)', borderRadius: '999px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  onClick={() => {
                    onSelectLocation(loc);
                    onNavigate('profile');
                  }}
                >
                  Monograph
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem' }}
                  onClick={() => {
                    onSelectLocation(loc);
                    onNavigate('assessment');
                  }}
                >
                  Assess Site
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Comparison & Interactive Matrix Filter Bar */}
      <div
        className="panel-card"
        style={{
          marginBottom: '1.25rem',
          padding: '1.15rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              placeholder="Filter attributes (e.g. soil, flood, elevation)..."
              value={attrSearch}
              onChange={(e) => setAttrSearch(e.target.value)}
              aria-label="Filter comparison attributes"
              style={{
                background: 'var(--bg-obsidian)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.8rem',
                color: 'var(--text-ivory)',
                fontSize: '0.82rem',
                minWidth: '220px'
              }}
            />
            {[
              ['ALL', `All Attributes (${comparisonRows.length})`],
              ['GEOGRAPHIC', 'Geographic & Datum'],
              ['GROUND', 'Soil & Groundwater'],
              ['FLOOD', 'Watershed & Flood'],
              ['ENGINEERING', 'BIS Specs & Transit']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`btn-ghost ${attrCategory === key ? 'active' : ''}`}
                style={{ padding: '0.38rem 0.7rem', fontSize: '0.78rem' }}
                onClick={() => setAttrCategory(key)}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              className={`btn-ghost ${highlightDiffs ? 'active' : ''}`}
              style={{ padding: '0.38rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setHighlightDiffs((v) => !v)}
              title="Highlight attribute rows where the compared sites have different classifications or values"
            >
              <Sparkles size={13} />
              <span>{highlightDiffs ? 'Highlighting Differences: ON' : 'Highlight Differences'}</span>
            </button>

            {(attrCategory !== 'ALL' || attrSearch) && (
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.38rem 0.7rem', fontSize: '0.78rem', color: 'var(--accent-amber)' }}
                onClick={() => {
                  setAttrCategory('ALL');
                  setAttrSearch('');
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Custom title to save comparison..."
              value={compTitle}
              onChange={(e) => setCompTitle(e.target.value)}
              aria-label="Comparison title"
              style={{
                background: 'var(--bg-obsidian)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.8rem',
                color: 'var(--text-ivory)',
                fontSize: '0.82rem',
                minWidth: '210px'
              }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.48rem 0.95rem', fontSize: '0.8rem' }}
              disabled={comparedLocations.length < 2}
              onClick={handleSave}
            >
              <Bookmark size={14} />
              Save Comparison
            </button>
          </div>
        </div>
        {saveMsg && (
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-sage-bright)', fontWeight: 600 }}>
            {saveMsg}
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix Table (Interactive & Expandable) */}
      <div tabIndex={0} role="region" aria-labelledby="compare-matrix-caption" className="table-wrapper">
        <table
          className="tf-table"
          style={{
            '--label-2': `"${comparedLocations[0]?.name || 'Site 1'}"`,
            '--label-3': `"${comparedLocations[1]?.name || 'Site 2'}"`,
            '--label-4': `"${comparedLocations[2]?.name || 'Site 3'}"`,
            '--label-5': `"${comparedLocations[3]?.name || 'Site 4'}"`
          }}
        >
          <caption id="compare-matrix-caption">
            Multi-location comparison matrix ({filteredRows.length} attributes shown) — Click any attribute row to inspect its engineering significance, or click a site name to open its monograph (No arbitrary winner declared)
          </caption>
          <thead>
            <tr>
              <th style={{ minWidth: '235px' }}>Site Attribute, Unit &amp; Method</th>
              {comparedLocations.map((loc) => (
                <th key={loc.id} style={{ minWidth: '235px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                    {loc.id} · {loc.geographic_context.zone_code}
                  </div>
                  <button
                    type="button"
                    className="tf-clickable-name"
                    style={{ fontSize: '1.02rem' }}
                    onClick={() => {
                      onSelectLocation(loc);
                      onNavigate('profile');
                    }}
                  >
                    {loc.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isExpanded = Boolean(expandedAttrs[row.id]);
              const showDiff = highlightDiffs && row.isDifferent;
              return (
                <React.Fragment key={row.id}>
                  <tr className={showDiff ? 'tf-diff-row' : ''}>
                    <th title={row.tooltip}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div>{row.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.15rem' }}>
                            Unit: {row.unit} {showDiff ? '· Differs across sites' : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', flexShrink: 0 }}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpandAttr(row.id)}
                          title="Inspect engineering significance and methodology"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </th>
                    {comparedLocations.map((loc) => (
                      <td key={loc.id}>{row.renderCell(loc)}</td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="tf-expanded-detail-row">
                      <td colSpan={comparedLocations.length + 1}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.84rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)', textTransform: 'uppercase', flexShrink: 0, marginTop: '2px' }}>
                            METHODOLOGY &amp; SIGNIFICANCE:
                          </span>
                          <span style={{ color: 'var(--text-sandstone)', lineHeight: 1.55 }}>
                            {row.methodology}
                          </span>
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
    </div>
  );
}
