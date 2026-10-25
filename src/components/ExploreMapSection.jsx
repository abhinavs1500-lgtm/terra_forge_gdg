import React, { useEffect, useMemo, useState } from 'react';
import {
  Layers,
  RotateCcw,
  Upload,
  Bookmark,
  GitCompare,
  Scale,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ChennaiMapCanvas from './ChennaiMapCanvas';
import {
  DOODLE_CATEGORIES,
  getDoodleInnerSvg,
  resolveLocationDoodle
} from '../utils/mapDoodleIcons';

export default function ExploreMapSection({
  locations,
  selectedLocation,
  onSelectLocation,
  gisLayersData,
  focusedMapLayer,
  onNavigate,
  onToggleCompare,
  compareIds,
  onToggleFavourite,
  favouriteIds
}) {
  const [searchText, setSearchText] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [basemap, setBasemap] = useState('dark');
  const [colorMode, setColorMode] = useState('soil');
  const [resetCounter, setResetCounter] = useState(0);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [enableClustering, setEnableClustering] = useState(true);
  const [layerToast, setLayerToast] = useState('');

  const [activeOverlays, setActiveOverlays] = useState({
    water: true,
    transit: true,
    gccZones: false,
    landmarks: false,
    coastline: true,
    soilHalos: false
  });

  const [customGeoJson, setCustomGeoJson] = useState(null);
  const [customLayerName, setCustomLayerName] = useState('');

  // Synchronize focusedMapLayer when navigating from an Engineering Recommendation ("Inspect on GIS Map")
  useEffect(() => {
    if (!focusedMapLayer?.layer) return;
    const layerKey = focusedMapLayer.layer;
    setActiveOverlays((prev) => ({
      ...prev,
      [layerKey]: true
    }));
    if (layerKey === 'water') setColorMode('flood');
    if (layerKey === 'soilHalos') setColorMode('soil');
    setInspectorOpen(true);
    setLayerToast(`Activated "${layerKey}" GIS layer for ${selectedLocation?.name || 'selected site'}`);
    const timer = setTimeout(() => setLayerToast(''), 4500);
    return () => clearTimeout(timer);
  }, [focusedMapLayer?.ts]);

  const zoneOptions = useMemo(() => {
    const s = new Set();
    locations.forEach((l) => {
      if (l.geographic_context?.zone_code) s.add(l.geographic_context.zone_code);
    });
    return ['ALL', ...Array.from(s).sort()];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = locations.filter((loc) => {
      if (zoneFilter !== 'ALL' && loc.geographic_context?.zone_code !== zoneFilter) return false;
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.id.toLowerCase().includes(q) ||
        loc.geographic_context?.jurisdiction?.toLowerCase().includes(q) ||
        (loc.ground_and_soil?.soil_classification || '').toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      if (sortBy === 'elev_asc') {
        return (a.geographic_context?.elevation_m_msl ?? 999) - (b.geographic_context?.elevation_m_msl ?? 999);
      }
      if (sortBy === 'coast_asc') {
        return (a.geographic_context?.coastal_distance_km ?? 999) - (b.geographic_context?.coastal_distance_km ?? 999);
      }
      if (sortBy === 'completeness') {
        return (b.data_quality?.completeness_pct ?? 0) - (a.data_quality?.completeness_pct ?? 0);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [locations, searchText, zoneFilter, sortBy]);

  const toggleOverlay = (key) => {
    setActiveOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGeoJsonUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        setCustomGeoJson(parsed);
        setCustomLayerName(file.name);
      } catch (err) {
        alert('Could not parse GeoJSON file. Please provide a valid RFC 7946 GeoJSON file.');
      }
    };
    reader.readAsText(file);
  };

  const isFav = selectedLocation && favouriteIds.includes(selectedLocation.id);
  const inComp = selectedLocation && compareIds.includes(selectedLocation.id);

  return (
    <div className="map-workstation-stage" role="region" aria-label="Chennai Interactive GIS Workstation">
      {/* ====================================================================
          COLLAPSIBLE LEFT FLOATING DIRECTORY & SEARCH DRAWER
          ==================================================================== */}
      <aside
        className={`map-floating-left-drawer ${leftDrawerOpen ? '' : 'collapsed'}`}
        aria-label="167 Chennai Locations Directory"
      >
        <div className="directory-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)', letterSpacing: '0.08em' }}>
                CHENNAI SPATIAL DIRECTORY
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.96rem' }}>
                {filteredLocations.length} / {locations.length} Verified Sites
              </div>
            </div>

            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => setLeftDrawerOpen(false)}
              title="Collapse directory drawer to maximize map canvas"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          <input
            type="search"
            placeholder="Filter by locality, ID, or soil unit..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Filter locations on map"
            style={{
              width: '100%',
              padding: '0.55rem 0.8rem',
              background: 'var(--bg-obsidian)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-ivory)',
              fontSize: '0.85rem'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter by administrative zone"
              style={{
                background: 'var(--bg-obsidian)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.42rem',
                color: 'var(--text-sandstone)',
                fontSize: '0.76rem'
              }}
            >
              {zoneOptions.map((z) => (
                <option key={z} value={z}>
                  {z === 'ALL' ? 'All Zones (167)' : z}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort locations"
              style={{
                background: 'var(--bg-obsidian)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.42rem',
                color: 'var(--text-sandstone)',
                fontSize: '0.76rem'
              }}
            >
              <option value="name">Sort: Name (A–Z)</option>
              <option value="elev_asc">Sort: Elevation (Low–High)</option>
              <option value="coast_asc">Sort: Coastal Proximity</option>
              <option value="completeness">Sort: Data Completeness</option>
            </select>
          </div>
        </div>

        <div className="directory-list" role="listbox" aria-label="Chennai Locations List">
          {filteredLocations.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No locations match "{searchText}".
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const doodle = resolveLocationDoodle(loc, colorMode);
              return (
                <button
                  key={loc.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`directory-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setInspectorOpen(true);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <svg
                        viewBox="0 0 36 36"
                        width="22"
                        height="22"
                        style={{ flexShrink: 0, borderRadius: '50%', background: '#0c110e', border: `1px solid ${doodle.color}` }}
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: getDoodleInnerSvg(doodle.archetype, doodle.color) }}
                      />
                      <strong style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {loc.name}
                      </strong>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--accent-amber)', flexShrink: 0 }}>
                      {loc.id}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.73rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.2rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <span>{loc.geographic_context.zone_code}</span>
                    <span>
                      {loc.geographic_context.elevation_m_msl ?? 'N/A'}m MSL · {loc.geographic_context.coastal_distance_km}km coast
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* GeoJSON Import Footer */}
        <div style={{ padding: '0.65rem 0.9rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 20, 17, 0.95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            className="btn-ghost"
            style={{ cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.76rem', padding: '0.4rem 0.6rem' }}
            title="Import a local GeoJSON layer exported from TNGIS or QGIS"
          >
            <Upload size={13} />
            <span>{customLayerName ? `Loaded: ${customLayerName}` : 'Import TNGIS / Local GeoJSON'}</span>
            <input
              type="file"
              accept=".geojson,.json"
              onChange={handleGeoJsonUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </aside>

      {/* ====================================================================
          TOP FLOATING HUD: BASEMAPS, LENSES & PANEL TOGGLES
          ==================================================================== */}
      <div className={`map-overlay-toolbar ${leftDrawerOpen ? '' : 'left-collapsed'} ${inspectorOpen ? '' : 'right-collapsed'}`}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!leftDrawerOpen && (
            <button
              type="button"
              className="map-layer-pill-bar layer-toggle-btn active"
              style={{ padding: '0.48rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              onClick={() => setLeftDrawerOpen(true)}
            >
              <PanelLeftOpen size={14} />
              <span>Directory ({filteredLocations.length})</span>
            </button>
          )}

          {/* Base Tile Controls */}
          <div className="map-layer-pill-bar">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.15rem 0.45rem' }}>
              BASEMAP:
            </span>
            {[
              ['dark', 'Dark Terrain'],
              ['topo', 'Topo Contours'],
              ['osm', 'Street Vector'],
              ['satellite', 'Satellite']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`layer-toggle-btn ${basemap === key ? 'active' : ''}`}
                onClick={() => setBasemap(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Marker Color Lens Controls */}
          <div className="map-layer-pill-bar">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.15rem 0.45rem' }}>
              LENS:
            </span>
            {[
              ['soil', 'Soil Province'],
              ['flood', 'Flood Basin'],
              ['groundwater', 'Groundwater'],
              ['completeness', 'Evidence Quality']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`layer-toggle-btn ${colorMode === key ? 'active' : ''}`}
                onClick={() => setColorMode(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="map-layer-pill-bar">
          {layerToast && (
            <span className="status-pill verified" role="status" style={{ marginRight: '0.35rem' }}>
              {layerToast}
            </span>
          )}
          <button
            type="button"
            className={`layer-toggle-btn ${enableClustering ? 'active' : ''}`}
            onClick={() => setEnableClustering((c) => !c)}
            title="Toggle zoom-based cartographic cluster medallions at wide zoom levels"
          >
            {enableClustering ? 'Cluster: ON' : 'All 167 Pins'}
          </button>
          <button
            type="button"
            className="layer-toggle-btn"
            onClick={() => {
              setSearchText('');
              setZoneFilter('ALL');
              setResetCounter((c) => c + 1);
            }}
            title="Reset map bounds to all 167 Chennai sites"
          >
            <RotateCcw size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Reset View
          </button>
          <button
            type="button"
            className={`layer-toggle-btn ${inspectorOpen ? 'active' : ''}`}
            onClick={() => setInspectorOpen((o) => !o)}
          >
            {inspectorOpen ? <PanelRightClose size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> : <PanelRightOpen size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
            {inspectorOpen ? 'Hide Inspector' : 'Inspect Site'}
          </button>
        </div>
      </div>

      {/* ====================================================================
          FULL-BLEED INTERACTIVE LEAFLET CANVAS
          ==================================================================== */}
      <ChennaiMapCanvas
        locations={filteredLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={(loc) => {
          onSelectLocation(loc);
          setInspectorOpen(true);
        }}
        basemap={basemap}
        colorMode={colorMode}
        enableClustering={enableClustering}
        activeOverlays={activeOverlays}
        gisLayersData={gisLayersData}
        customGeoJson={customGeoJson}
        resetTrigger={resetCounter}
      />

      {/* ====================================================================
          COLLAPSIBLE LAYER OVERLAYS & CUSTOM DOODLE LEGEND PANEL (BOTTOM-LEFT)
          ==================================================================== */}
      <div className={`map-legend-box ${leftDrawerOpen ? '' : 'left-collapsed'}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: legendExpanded ? '0.55rem' : 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={13} />
            <span>CARTOGRAPHIC DOODLE LEGEND &amp; OVERLAYS</span>
          </div>
          <button
            type="button"
            className="layer-toggle-btn"
            style={{ padding: '0.18rem 0.45rem' }}
            aria-expanded={legendExpanded}
            onClick={() => setLegendExpanded((v) => !v)}
          >
            {legendExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>

        <div className={`tf-disclosure-drawer ${legendExpanded ? 'is-open' : ''}`} hidden={!legendExpanded}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem', marginBottom: '0.65rem' }}>
            {[
              ['water', 'Water Bodies (120)'],
              ['transit', 'Metro & Rail (120)'],
              ['gccZones', 'GCC 15 Zones'],
              ['landmarks', 'Landmarks'],
              ['coastline', 'Shoreline Datum'],
              ['soilHalos', '750m Buffers']
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                className={`layer-toggle-btn ${activeOverlays[k] ? 'active' : ''}`}
                onClick={() => toggleOverlay(k)}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.55rem',
              fontSize: '0.73rem',
              color: 'var(--text-sandstone)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.36rem'
            }}
          >
            {(DOODLE_CATEGORIES[colorMode] || DOODLE_CATEGORIES.soil).map((item) => (
              <div
                key={item.key + item.label}
                style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}
                title={item.description}
              >
                <svg
                  viewBox="0 0 36 36"
                  width="22"
                  height="22"
                  style={{
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: '#0c110e',
                    border: `1.2px solid ${item.color}`
                  }}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: getDoodleInnerSvg(item.key, item.color) }}
                />
                <span style={{ lineHeight: 1.25 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          CONTEXTUAL LOCATION-INSPECTION PANEL (RIGHT FLOATING DOCK)
          ==================================================================== */}
      <aside
        className={`map-floating-inspector ${inspectorOpen ? '' : 'collapsed'}`}
        aria-label="Selected Location Inspector"
      >
        {selectedLocation ? (
          <div style={{ padding: '1.35rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                  {selectedLocation.id} · {selectedLocation.geographic_context.zone_code}
                </span>
                <span
                  className={`status-pill ${
                    selectedLocation.data_quality.completeness_pct === 100 ? 'verified' : 'regional'
                  }`}
                >
                  {selectedLocation.data_quality.completeness_pct}% Evidence Coverage
                </span>
              </div>

              <h2 style={{ margin: '0.3rem 0 0.15rem', fontFamily: 'var(--font-display)', fontSize: '1.45rem', lineHeight: 1.2 }}>
                {selectedLocation.name}
              </h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {selectedLocation.geographic_context.jurisdiction} · OSM #{selectedLocation.coordinates.osm_id}
              </div>

              {/* Primary Actions: Inspect Profile or Run Assessment */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.95rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.58rem 0.75rem', fontSize: '0.82rem' }}
                  onClick={() => onNavigate('profile')}
                >
                  Inspect Profile
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.58rem 0.75rem', fontSize: '0.82rem' }}
                  onClick={() => onNavigate('assessment')}
                >
                  <Scale size={14} />
                  Run Assessment
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                <button
                  type="button"
                  className={`btn-ghost ${inComp ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.76rem', padding: '0.4rem' }}
                  onClick={() => onToggleCompare(selectedLocation.id)}
                >
                  <GitCompare size={13} />
                  {inComp ? 'In Compare' : '+ Compare'}
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${isFav ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.76rem', padding: '0.4rem' }}
                  onClick={() => onToggleFavourite(selectedLocation.id)}
                >
                  <Bookmark size={13} />
                  {isFav ? 'Saved Fav' : 'Save Fav'}
                </button>
              </div>
            </div>

            {/* Key Geospatial Measurements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              <div className="tf-surface-cell accent-sage" style={{ padding: '0.65rem 0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>COORDINATES (WGS84)</div>
                <div style={{ marginTop: '0.15rem' }}>{selectedLocation.coordinates.lat}°N, {selectedLocation.coordinates.lon}°E</div>
              </div>
              <div className="tf-surface-cell accent-amber" style={{ padding: '0.65rem 0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>TERRAIN ELEVATION</div>
                <div style={{ marginTop: '0.15rem' }}>{selectedLocation.geographic_context.elevation_m_msl ?? 'N/A'} m MSL</div>
              </div>
              <div className="tf-surface-cell" style={{ padding: '0.65rem 0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>COASTAL DISTANCE</div>
                <div style={{ marginTop: '0.15rem' }}>{selectedLocation.geographic_context.coastal_distance_km} km</div>
              </div>
              <div className="tf-surface-cell accent-hydro" style={{ padding: '0.65rem 0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>PRE-MONSOON GW</div>
                <div style={{ marginTop: '0.15rem' }}>{selectedLocation.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'}</div>
              </div>
            </div>

            {/* Ground & Soil Summary */}
            <div className="tf-surface-cell accent-sage" style={{ fontSize: '0.84rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-sage-bright)', marginBottom: '0.2rem' }}>
                REGIONAL SOIL & LITHOLOGY (CGWB / GSI)
              </div>
              <div>
                {selectedLocation.ground_and_soil.soil_classification || (
                  <span style={{ color: '#f49b8c' }}>{selectedLocation.ground_and_soil.soil_status}</span>
                )}
              </div>
            </div>

            {/* Flood & Basin Summary */}
            <div className="tf-surface-cell accent-amber" style={{ fontSize: '0.84rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)', marginBottom: '0.2rem' }}>
                WATERSHED BASIN & FLOOD SENSITIVITY
              </div>
              <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                {selectedLocation.environmental_and_flood.watershed_basin}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-sandstone)' }}>
                {selectedLocation.environmental_and_flood.flood_hazard_category || 'Outside GCC 200-Ward CFLOWS Map'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Nearest Water:{' '}
                {selectedLocation.environmental_and_flood.nearest_water_body
                  ? `${selectedLocation.environmental_and_flood.nearest_water_body.name} (${selectedLocation.environmental_and_flood.nearest_water_body.distance_km} km)`
                  : 'None in immediate buffer'}
              </div>
            </div>

            {/* Transit & Landmarks */}
            <div className="tf-surface-cell" style={{ fontSize: '0.82rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                VERIFIED TRANSIT & ARTERIAL ROADS (OSM)
              </div>
              {selectedLocation.accessibility_and_connectivity.nearest_transit_stations.slice(0, 2).map((st) => (
                <div key={st.osm_id} style={{ marginBottom: '0.18rem' }}>
                  • {st.name} ({st.distance_km} km)
                </div>
              ))}
              {selectedLocation.accessibility_and_connectivity.arterial_roads.slice(0, 2).map((rd) => (
                <div key={rd.osm_id} style={{ color: 'var(--text-muted)' }}>
                  Road: {rd.name} ({rd.distance_km} km)
                </div>
              ))}
            </div>

            {/* TNGIS / Official Portal Status Note */}
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
              <strong>Map Attribution:</strong> Esri World Topo / OpenTopoMap / OpenStreetMap Contributors (ODbL).{' '}
              <a
                href="https://tngis.tn.gov.in/apps.html"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                TNGIS Portal <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
