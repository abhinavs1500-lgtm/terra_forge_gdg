import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Droplets,
  Building2,
  Train,
  Database,
  Scale,
  GitCompare,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Compass,
  FileCheck2,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import ChennaiMapCanvas from './ChennaiMapCanvas';

export default function SiteIntelligenceSection({
  locations,
  selectedLocation,
  onSelectLocation,
  gisLayersData,
  onNavigate,
  onToggleCompare,
  compareIds,
  onToggleFavourite,
  favouriteIds
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [showProvenanceDrawer, setShowProvenanceDrawer] = useState(false);

  const loc = selectedLocation || locations[0];
  if (!loc) return null;

  const isFav = favouriteIds.includes(loc.id);
  const inComp = compareIds.includes(loc.id);

  const tabs = [
    ['all', 'Complete Workspace & Monograph'],
    ['spatial', 'Spatial & Transit Workspace'],
    ['ground', 'Ground & Soil'],
    ['env', 'Hydrology & Flood'],
    ['construction', 'Materials & Structural'],
    ['quality', 'Provenance & Missing Data']
  ];

  return (
    <div>
      {/* ====================================================================
          EDITORIAL LOCATION MONOGRAPH HEADER (OPEN CANVAS, NOT BOXED)
          ==================================================================== */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="editorial-kicker">
            SITE INTELLIGENCE WORKSPACE · {loc.id} · OSM NODE #{loc.coordinates.osm_id}
          </div>
          <h1 className="section-title" style={{ fontSize: 'clamp(2.1rem, 3.3vw, 3.1rem)', marginBottom: '0.45rem' }}>
            {loc.name}{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              ({loc.geographic_context.zone_code})
            </span>
          </h1>
          <p className="section-subtitle">{loc.geographic_context.topographic_summary}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={loc.id}
            onChange={(e) => {
              const found = locations.find((x) => x.id === e.target.value);
              if (found) onSelectLocation(found);
            }}
            aria-label="Switch Chennai location profile"
            style={{
              background: 'var(--bg-graphite)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.58rem 0.9rem',
              color: 'var(--text-ivory)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.88rem'
            }}
          >
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.id}) — {item.geographic_context.zone_code}
              </option>
            ))}
          </select>

          <button type="button" className="btn-primary" onClick={() => onNavigate('assessment')}>
            <Scale size={15} />
            Assess {loc.name}
          </button>
          <button
            type="button"
            className={`btn-secondary ${inComp ? 'active' : ''}`}
            onClick={() => onToggleCompare(loc.id)}
          >
            <GitCompare size={15} />
            {inComp ? 'In Compare' : '+ Compare'}
          </button>
          <button
            type="button"
            className={`btn-ghost ${isFav ? 'active' : ''}`}
            onClick={() => onToggleFavourite(loc.id)}
          >
            <Bookmark size={15} />
            {isFav ? 'Saved Fav' : 'Save Fav'}
          </button>
        </div>
      </div>

      {/* ====================================================================
          PRIMARY GEODESIC MONUMENT STRIP
          ==================================================================== */}
      <div className="monument-strip" role="region" aria-label="Primary Geodesic & Evidence Metrics">
        <div className="monument-cell">
          <span className="monument-label">Verified Coordinates (WGS 84)</span>
          <span className="monument-value" style={{ fontSize: '1.38rem', fontFamily: 'var(--font-mono)' }}>
            {loc.coordinates.lat}°N, {loc.coordinates.lon}°E
          </span>
          <span className="monument-sub">{loc.coordinates.crs}</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Terrain Elevation (SRTM)</span>
          <span className="monument-value amber">
            {loc.geographic_context.elevation_m_msl !== null ? `${loc.geographic_context.elevation_m_msl} m MSL` : 'Unavailable'}
          </span>
          <span className="monument-sub">Copernicus DEM GLO-90</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Coastal Distance</span>
          <span className="monument-value sage">
            {loc.geographic_context.coastal_distance_km} km
          </span>
          <span className="monument-sub">From Bay of Bengal shoreline</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Regional Evidence Coverage</span>
          <span className="monument-value">
            {loc.data_quality.completeness_pct}%
          </span>
          <span className="monument-sub">
            {loc.data_quality.missing_regional_attributes.length === 0
              ? 'All 8 core regional attributes present'
              : `${loc.data_quality.missing_regional_attributes.length} regional gaps disclosed`}
          </span>
        </div>
      </div>

      {/* ====================================================================
          SECTION FILTER TABS
          ==================================================================== */}
      <div
        role="tablist"
        aria-label="Site Profile Sections"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={activeTab === key ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====================================================================
          PART 1: UNIFIED 2-COLUMN SITE INTELLIGENCE WORKSPACE
          Left column: Existing Interactive Map Canvas
          Right column: Transit Information, Landmarks & Provenance, Missing Data
          Both columns begin at the same vertical level side-by-side!
          ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'spatial' || activeTab === 'quality') && (
        <section aria-label="Locality Spatial, Transit and Infrastructure Workspace">
          <div className="site-spatial-workspace">
            {/* LEFT COLUMN: INTERACTIVE MAP CANVAS */}
            <div className="site-spatial-map-col">
              <div className="hero-terrain-stage">
                <div className="hero-terrain-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Compass size={15} style={{ color: 'var(--accent-amber)' }} />
                    <span>LOCALITY SPATIAL CONTEXT — {loc.name.toUpperCase()}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '0.22rem 0.6rem', fontSize: '0.72rem' }}
                    onClick={() => onNavigate('map')}
                  >
                    Open in Full GIS
                  </button>
                </div>

                <div style={{ flex: 1, minHeight: '480px', width: '100%' }}>
                  <ChennaiMapCanvas
                    locations={locations}
                    selectedLocation={loc}
                    onSelectLocation={onSelectLocation}
                    basemap="dark"
                    colorMode="soil"
                    activeOverlays={{
                      water: true,
                      transit: true,
                      gccZones: false,
                      landmarks: true,
                      coastline: true,
                      soilHalos: true
                    }}
                    gisLayersData={gisLayersData}
                    compact={true}
                  />
                </div>

                <div className="hero-node-switcher-strip" style={{ fontSize: '0.82rem' }}>
                  <span>{loc.geographic_context.jurisdiction} · {loc.geographic_context.planning_corridor}</span>
                  <a
                    href={`https://www.openstreetmap.org/${loc.coordinates.osm_type}/${loc.coordinates.osm_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Verify on OSM <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: TRANSIT, LANDMARKS & PROVENANCE, MISSING DATA (VERTICALLY ARRANGED) */}
            <div className="site-spatial-info-col">
              {/* SECTION A: TRANSIT & CONNECTIVITY */}
              {(activeTab === 'all' || activeTab === 'spatial') && (
                <article className="panel-card" style={{ margin: 0 }} aria-label="Transit Corridors and Connectivity">
                  <div className="panel-card-header">
                    <div>
                      <div className="editorial-kicker" style={{ marginBottom: '0.15rem' }}>
                        CONNECTIVITY & ACCESS
                      </div>
                      <h2 className="panel-card-title" style={{ fontSize: '1.25rem' }}>
                        <Train size={18} style={{ color: 'var(--accent-amber)' }} />
                        Transit Corridors & Road Network
                      </h2>
                    </div>
                    <span className="status-pill verified">OpenStreetMap Graph</span>
                  </div>

                  <div className="spec-ledger">
                    <div className="spec-row">
                      <div className="spec-key">Rail & CMRL Metro</div>
                      <div className="spec-val">
                        {loc.accessibility_and_connectivity.nearest_transit_stations.length > 0 ? (
                          loc.accessibility_and_connectivity.nearest_transit_stations.map((st) => (
                            <div key={st.osm_id} style={{ marginBottom: '0.35rem' }}>
                              <strong>{st.name}</strong> ({st.type}) —{' '}
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sage-bright)', fontWeight: 600 }}>
                                {st.distance_km} km
                              </span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No rail/metro station within 8.5 km; served by local MTC bus routes.</span>
                        )}
                      </div>
                    </div>

                    <div className="spec-row">
                      <div className="spec-key">Arterial Roads</div>
                      <div className="spec-val">
                        {loc.accessibility_and_connectivity.arterial_roads.length > 0 ? (
                          loc.accessibility_and_connectivity.arterial_roads.map((rd) => (
                            <div key={rd.osm_id} style={{ marginBottom: '0.3rem' }}>
                              <strong>{rd.name}</strong> ({rd.classification}) —{' '}
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                                {rd.distance_km} km
                              </span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Connected via secondary municipal collector roads.</span>
                        )}
                      </div>
                    </div>

                    <div className="spec-row">
                      <div className="spec-key">Corridor Classification</div>
                      <div className="spec-val">
                        <strong>{loc.geographic_context.planning_corridor}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Municipal Jurisdiction: {loc.geographic_context.jurisdiction} ({loc.geographic_context.zone_code})
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* SECTION B: LANDMARKS & PUBLIC INFRASTRUCTURE */}
              {(activeTab === 'all' || activeTab === 'spatial') && (
                <article className="panel-card" style={{ margin: 0 }} aria-label="Landmarks and Civic Facilities">
                  <div className="panel-card-header">
                    <div>
                      <div className="editorial-kicker" style={{ marginBottom: '0.15rem' }}>
                        CIVIC INFRASTRUCTURE
                      </div>
                      <h2 className="panel-card-title" style={{ fontSize: '1.25rem' }}>
                        <Building2 size={18} style={{ color: 'var(--accent-sage-bright)' }} />
                        Landmarks & Public Facilities
                      </h2>
                    </div>
                    <span className="status-pill regional">GCC Geo-Nodes</span>
                  </div>

                  <div className="spec-ledger">
                    <div className="spec-row">
                      <div className="spec-key">Public Facilities</div>
                      <div className="spec-val">
                        {loc.accessibility_and_connectivity.landmarks_and_facilities.length > 0 ? (
                          loc.accessibility_and_connectivity.landmarks_and_facilities.map((lm) => (
                            <div key={lm.osm_id} style={{ marginBottom: '0.3rem' }}>
                              <strong>{lm.name}</strong> ({lm.category}) —{' '}
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sage-bright)' }}>
                                {lm.distance_km} km
                              </span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No major tagged institutional node within 3.8 km search radius.</span>
                        )}
                      </div>
                    </div>

                    <div className="spec-row">
                      <div className="spec-key">Verified Provenance</div>
                      <div className="spec-val">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                          {loc.sources.map((s, idx) => (
                            <div key={idx} className="tf-surface-cell accent-sage" style={{ fontSize: '0.8rem', padding: '0.65rem 0.85rem' }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)' }}>
                                {s.attribute_group}
                              </div>
                              <div style={{ fontWeight: 600, margin: '0.15rem 0' }}>{s.source_name}</div>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--accent-sage-bright)', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                Source Link <ExternalLink size={10} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* SECTION C: MISSING DATA & BOREHOLE GATES */}
              {(activeTab === 'all' || activeTab === 'spatial' || activeTab === 'quality') && (
                <article className="panel-card" style={{ margin: 0 }} aria-label="Data Provenance and Missing Attributes">
                  <div className="panel-card-header">
                    <div>
                      <div className="editorial-kicker" style={{ marginBottom: '0.15rem' }}>
                        DATA INTEGRITY & INVESTIGATION GATES
                      </div>
                      <h2 className="panel-card-title" style={{ fontSize: '1.25rem' }}>
                        <ShieldAlert size={18} style={{ color: '#f49b8c' }} />
                        Disclosed Missing Data & Field Origins
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.32rem 0.7rem', fontSize: '0.76rem' }}
                      aria-expanded={showProvenanceDrawer}
                      onClick={() => setShowProvenanceDrawer((v) => !v)}
                    >
                      <span>{showProvenanceDrawer ? 'Hide Field Origins' : 'Inspect Field Origins'}</span>
                      {showProvenanceDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <div className="tf-surface-cell accent-terracotta" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f49b8c', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', marginBottom: '0.45rem' }}>
                      <AlertTriangle size={15} />
                      <span>DISCLOSED MISSING REGIONAL & PLOT PARAMETERS</span>
                    </div>

                    {loc.data_quality.missing_regional_attributes.length > 0 ? (
                      <ul style={{ margin: '0 0 0.65rem', paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-sandstone)' }}>
                        {loc.data_quality.missing_regional_attributes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '0.86rem', color: 'var(--accent-sage-bright)', marginBottom: '0.65rem' }}>
                        All 8 core regional attributes are populated for {loc.name}.
                      </div>
                    )}

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      <strong>Mandatory Plot Investigations (IS 1892):</strong> {loc.data_quality.unverified_plot_parameters.join(' · ')}
                    </div>
                  </div>

                  {/* Expandable Field Origins Drawer */}
                  <div
                    className={`tf-disclosure-drawer ${showProvenanceDrawer ? 'is-open' : ''}`}
                    hidden={!showProvenanceDrawer}
                  >
                    <div className="spec-ledger" style={{ marginBottom: 0 }}>
                      {Object.entries(loc.data_quality.field_provenance).map(([field, origin]) => (
                        <div key={field} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{field}</span>
                          <span style={{ color: origin === 'Unavailable' ? '#f49b8c' : 'var(--text-ivory)', fontWeight: 500 }}>{origin}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          SUBSURFACE, HYDROLOGY & STRUCTURAL ENGINEERING MONOGRAPH
          Balanced multi-column cards, preventing empty columns or wasted space
          ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'ground' || activeTab === 'env' || activeTab === 'construction') && (
        <section aria-label="Civil Engineering Monograph Ledgers" style={{ marginTop: '2.5rem' }}>
          <div className="editorial-kicker" style={{ marginBottom: '0.75rem' }}>
            ENGINEERING SPECIFICATION LEDGERS · GROUND, HYDROLOGY & STRUCTURAL ENVELOPE
          </div>

          <div className="site-monograph-grid">
            {/* 1. GROUND & SOIL INTELLIGENCE */}
            {(activeTab === 'all' || activeTab === 'ground') && (
              <article className="panel-card" style={{ margin: 0 }} aria-label="Ground and Soil Intelligence">
                <div className="panel-card-header">
                  <div>
                    <div className="editorial-kicker" style={{ marginBottom: 0 }}>
                      01 · GROUND, LITHOLOGY & AQUIFER
                    </div>
                    <h2 className="panel-card-title" style={{ fontSize: '1.2rem' }}>
                      Ground &amp; Subsurface Table
                    </h2>
                  </div>
                  <span className={`status-pill ${loc.ground_and_soil.soil_classification ? 'regional' : 'missing'}`}>
                    {loc.ground_and_soil.soil_status}
                  </span>
                </div>

                <div className="spec-ledger">
                  <div className="spec-row">
                    <div className="spec-key">Soil Classification</div>
                    <div className="spec-val">
                      {loc.ground_and_soil.soil_classification ? (
                        <strong>{loc.ground_and_soil.soil_classification}</strong>
                      ) : (
                        <span style={{ color: '#f49b8c' }}>
                          Unavailable — Outside Chennai District 1:50,000 Soil Series Sheet; requires site-specific IS 1892 borehole log.
                        </span>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Resolution: {loc.ground_and_soil.soil_resolution}
                      </div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Geological Formation</div>
                    <div className="spec-val">
                      <strong>{loc.ground_and_soil.geological_formation}</strong>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-sandstone)', marginTop: '0.25rem' }}>
                        {loc.ground_and_soil.geotechnical_note}
                      </div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Groundwater Depth</div>
                    <div className="spec-val">
                      {loc.ground_and_soil.groundwater_pre_monsoon_m_bgl ? (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                          <div>Pre-Monsoon (May): <strong>{loc.ground_and_soil.groundwater_pre_monsoon_m_bgl}</strong></div>
                          <div>Post-Monsoon (Jan): <strong>{loc.ground_and_soil.groundwater_post_monsoon_m_bgl}</strong></div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Aquifer: {loc.ground_and_soil.groundwater_aquifer_type} ({loc.ground_and_soil.groundwater_yield_range})
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#f49b8c' }}>{loc.ground_and_soil.groundwater_status}</span>
                      )}
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Plot Borehole Gate</div>
                    <div className="spec-val" style={{ color: '#f49b8c', fontSize: '0.86rem' }}>
                      <strong>IS 1892 Mandate:</strong> Standard Penetration Test (<code>SPT N-values</code>) and Laboratory Safe Bearing Capacity (<code>SBC in kN/m²</code>) require physical rotary core drilling.
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* 2. HYDROLOGY & FLOOD CONTEXT */}
            {(activeTab === 'all' || activeTab === 'env') && (
              <article className="panel-card" style={{ margin: 0 }} aria-label="Environmental and Flood Context">
                <div className="panel-card-header">
                  <div>
                    <div className="editorial-kicker" style={{ marginBottom: 0 }}>
                      02 · WATERSHED & FLOOD HAZARD
                    </div>
                    <h2 className="panel-card-title" style={{ fontSize: '1.2rem' }}>
                      Hydrology &amp; Drainage Channel
                    </h2>
                  </div>
                  <span className={`status-pill ${loc.environmental_and_flood.flood_hazard_category ? 'regional' : 'missing'}`}>
                    {loc.environmental_and_flood.flood_status}
                  </span>
                </div>

                <div className="spec-ledger">
                  <div className="spec-row">
                    <div className="spec-key">Watershed Basin</div>
                    <div className="spec-val">
                      <strong>{loc.environmental_and_flood.watershed_basin}</strong>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Primary Drainage Carrier: {loc.environmental_and_flood.primary_drainage_channel}
                      </div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Flood Sensitivity</div>
                    <div className="spec-val">
                      {loc.environmental_and_flood.flood_hazard_category ? (
                        <>
                          <strong style={{ color: loc.environmental_and_flood.flood_hazard_category.includes('High') ? '#f49b8c' : 'var(--text-ivory)' }}>
                            {loc.environmental_and_flood.flood_hazard_category}
                          </strong>
                          <div style={{ fontSize: '0.86rem', color: 'var(--text-sandstone)', marginTop: '0.25rem' }}>
                            {loc.environmental_and_flood.historical_inundation_context}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#f49b8c' }}>
                          Outside GCC 200-Ward CFLOWS-Chennai boundary. Refer to SRTM elevation ({loc.geographic_context.elevation_m_msl} m MSL).
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Nearby Water Bodies</div>
                    <div className="spec-val">
                      {loc.environmental_and_flood.water_bodies_nearby.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {loc.environmental_and_flood.water_bodies_nearby.map((wb) => (
                            <div key={wb.osm_id}>
                              <strong>{wb.name}</strong> ({wb.type}) —{' '}
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{wb.distance_km} km</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No named water body within immediate search radius.</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* 3. MATERIALS & STRUCTURAL */}
            {(activeTab === 'all' || activeTab === 'construction') && (
              <article className="panel-card" style={{ margin: 0 }} aria-label="Materials and Construction Considerations">
                <div className="panel-card-header">
                  <div>
                    <div className="editorial-kicker" style={{ marginBottom: 0 }}>
                      03 · MATERIALS & STRUCTURAL ENVELOPE
                    </div>
                    <h2 className="panel-card-title" style={{ fontSize: '1.2rem' }}>
                      IS 456 / IS 1893 Synthesis
                    </h2>
                  </div>
                  <span className="status-pill verified">Rule-Grounded</span>
                </div>

                <div className="spec-ledger">
                  <div className="spec-row">
                    <div className="spec-key">Coastal Exposure</div>
                    <div className="spec-val">
                      <strong>{loc.construction_and_materials.coastal_exposure_class}</strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {loc.geographic_context.coastal_distance_km} km from Bay of Bengal
                      </div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Concrete & Rebar</div>
                    <div className="spec-val">
                      <div><strong>Grade:</strong> {loc.construction_and_materials.recommended_concrete_grade}</div>
                      <div><strong>Steel:</strong> {loc.construction_and_materials.reinforcement_specification}</div>
                      <div><strong>Binder:</strong> {loc.construction_and_materials.cement_and_binder_guidance}</div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Seismic & Wind</div>
                    <div className="spec-val">
                      <div>{loc.construction_and_materials.seismic_zone}</div>
                      <div>{loc.construction_and_materials.wind_load_zone}</div>
                    </div>
                  </div>

                  <div className="spec-row">
                    <div className="spec-key">Plinth Guidance</div>
                    <div className="spec-val">{loc.construction_and_materials.plinth_and_drainage_guidance}</div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
