import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  resolveLocationDoodle,
  buildLocationDoodleHtml,
  buildClusterDoodleHtml,
  buildOverlayDoodleHtml
} from '../utils/mapDoodleIcons';

const BASEMAPS = {
  dark: {
    name: 'Terrain Dark (Esri Topo Dark)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, USGS, METI/NASA, GIS User Community',
    className: 'tf-dark-tiles'
  },
  osm: {
    name: 'Street & Civic Map (Esri Street)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI',
    className: ''
  },
  topo: {
    name: 'OpenTopoMap Contours (SRTM)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    className: ''
  },
  satellite: {
    name: 'Esri World Imagery + Places',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    className: ''
  }
};

export function getMarkerColor(loc, colorMode = 'soil') {
  return resolveLocationDoodle(loc, colorMode).color;
}

export default function ChennaiMapCanvas({
  locations = [],
  selectedLocation = null,
  onSelectLocation,
  basemap = 'dark',
  colorMode = 'soil',
  enableClustering = true,
  activeOverlays = {
    water: true,
    transit: false,
    gccZones: false,
    landmarks: false,
    coastline: true,
    soilHalos: false
  },
  gisLayersData = null,
  customGeoJson = null,
  compact = false,
  resetTrigger = 0
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const overlaysLayerRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(compact ? 13 : 11);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = selectedLocation?.coordinates?.verified
      ? [selectedLocation.coordinates.lat, selectedLocation.coordinates.lon]
      : [13.058, 80.225];
    const initialZoom = compact ? 13 : 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true
    });

    const bm = BASEMAPS[basemap] || BASEMAPS.dark;
    tileLayerRef.current = L.layerGroup().addTo(map);
    L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: 19,
      className: bm.className || ''
    }).addTo(tileLayerRef.current);
    if (bm.labelUrl) {
      L.tileLayer(bm.labelUrl, {
        maxZoom: 19,
        pane: 'overlayPane'
      }).addTo(tileLayerRef.current);
    }

    overlaysLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    const bm = BASEMAPS[basemap] || BASEMAPS.dark;
    tileLayerRef.current.clearLayers();
    L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: 19,
      className: bm.className || ''
    }).addTo(tileLayerRef.current);
    if (bm.labelUrl) {
      L.tileLayer(bm.labelUrl, {
        maxZoom: 19,
        pane: 'overlayPane'
      }).addTo(tileLayerRef.current);
    }
  }, [basemap]);

  // Reset map trigger
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || resetTrigger === 0) return;
    map.setView([13.058, 80.225], 11, { animate: true });
  }, [resetTrigger]);

  // Fly to selected location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation?.coordinates?.verified) return;
    const targetZoom = compact ? 14 : Math.max(map.getZoom(), 13);
    map.setView([selectedLocation.coordinates.lat, selectedLocation.coordinates.lon], targetZoom, {
      animate: true
    });
  }, [selectedLocation?.id, compact]);

  // Render Overlays (Water bodies, Transit stations, GCC zones, Landmarks, Coastline, Custom GeoJSON)
  useEffect(() => {
    const group = overlaysLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!gisLayersData) return;

    // 1. Bay of Bengal Coastline
    if (activeOverlays.coastline && gisLayersData.coastline_polyline) {
      L.polyline(gisLayersData.coastline_polyline, {
        color: '#4aa3ba',
        weight: 2.5,
        dashArray: '6 6',
        opacity: 0.78
      })
        .bindTooltip('Bay of Bengal Shoreline Reference (IS 456 Coastal Exposure Datum)')
        .addTo(group);
    }

    // 2. Soil/Hydrogeological Regional Halos
    if (activeOverlays.soilHalos) {
      locations.forEach((loc) => {
        if (!loc.coordinates?.verified) return;
        const fillColor = getMarkerColor(loc, colorMode);
        L.circle([loc.coordinates.lat, loc.coordinates.lon], {
          radius: 750,
          color: fillColor,
          weight: 1,
          fillColor,
          fillOpacity: 0.14,
          interactive: false
        }).addTo(group);
      });
    }

    // 3. Water Bodies & Waterways (OSM Verified — Custom Hydro Doodle Icons)
    if (activeOverlays.water && gisLayersData.water_bodies_and_waterways) {
      const waterHtml = buildOverlayDoodleHtml('water');
      gisLayersData.water_bodies_and_waterways.forEach((w) => {
        const icon = L.divIcon({
          className: '',
          html: waterHtml,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([w.lat, w.lon], { icon })
          .bindTooltip(
            `<strong>Water Body:</strong> ${w.name} (${w.type})<br/>Source: OpenStreetMap #${w.osm_id}`
          )
          .addTo(group);
      });
    }

    // 4. Rail & Metro Stations (OSM / CMRL / Southern Railway — Custom Transit Doodle Icons)
    if (activeOverlays.transit && gisLayersData.rail_and_metro_nodes) {
      const metroHtml = buildOverlayDoodleHtml('metro');
      const railHtml = buildOverlayDoodleHtml('rail');
      gisLayersData.rail_and_metro_nodes.forEach((st) => {
        const isMetro = st.type.includes('Metro');
        const icon = L.divIcon({
          className: '',
          html: isMetro ? metroHtml : railHtml,
          iconSize: [19, 19],
          iconAnchor: [9.5, 9.5]
        });
        L.marker([st.lat, st.lon], { icon })
          .bindTooltip(
            `<strong>${st.name}</strong><br/>${st.type} (${st.network})<br/>OSM #${st.osm_id}`
          )
          .addTo(group);
      });
    }

    // 5. GCC 15 Administrative Zone Centres
    if (activeOverlays.gccZones && gisLayersData.gcc_zone_centers) {
      gisLayersData.gcc_zone_centers.forEach((z) => {
        L.circle([z.lat, z.lon], {
          radius: 1850,
          color: '#7cb897',
          weight: 1.2,
          dashArray: '4 4',
          fillColor: '#2d5440',
          fillOpacity: 0.08
        })
          .bindTooltip(`<strong>${z.name}</strong><br/>${z.corridor}<br/>Source: Greater Chennai Corporation`)
          .addTo(group);
      });
    }

    // 6. Landmarks & Public Facilities (Custom Civic Doodle Icons)
    if (activeOverlays.landmarks && gisLayersData.public_facilities_and_landmarks) {
      const lmHtml = buildOverlayDoodleHtml('landmark');
      gisLayersData.public_facilities_and_landmarks.slice(0, 90).forEach((lm) => {
        const icon = L.divIcon({
          className: '',
          html: lmHtml,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([lm.lat, lm.lon], { icon })
          .bindTooltip(`<strong>${lm.name}</strong> (${lm.category})<br/>Source: OpenStreetMap #${lm.osm_id}`)
          .addTo(group);
      });
    }

    // 7. Custom Imported GeoJSON Overlay (TNGIS / External File Fallback)
    if (customGeoJson) {
      try {
        L.geoJSON(customGeoJson, {
          style: {
            color: '#ffbe55',
            weight: 2,
            fillOpacity: 0.2
          }
        }).addTo(group);
      } catch (e) {
        console.warn('Invalid custom GeoJSON layer:', e);
      }
    }
  }, [activeOverlays, gisLayersData, locations, colorMode, customGeoJson]);

  // Render Verified Location Doodle Markers (with Zoom-Aware Spatial Clustering to avoid overlap)
  useEffect(() => {
    const group = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!group) return;
    group.clearLayers();

    const validLocations = locations.filter(
      (loc) => loc.coordinates?.verified && typeof loc.coordinates.lat === 'number'
    );

    const renderIndividualMarker = (loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const { badgeLabel } = resolveLocationDoodle(loc, colorMode);
      const size = isSelected ? 42 : compact ? 28 : 32;

      const icon = L.divIcon({
        className: '',
        html: buildLocationDoodleHtml({ loc, colorMode, isSelected, compact }),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([loc.coordinates.lat, loc.coordinates.lon], {
        icon,
        zIndexOffset: isSelected ? 1200 : 100
      });

      const soilLabel = loc.ground_and_soil?.soil_classification
        ? loc.ground_and_soil.soil_classification.split('(')[0].trim()
        : 'Unmapped in 1:50k sheet (Disclosed)';
      const elevLabel =
        loc.geographic_context?.elevation_m_msl !== null
          ? `${loc.geographic_context.elevation_m_msl} m MSL`
          : 'N/A';

      marker.bindTooltip(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;line-height:1.45;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#e09f50;">${loc.id} · ${badgeLabel.toUpperCase()}</div>
          <strong style="font-size:13px;">${loc.name}</strong><br/>
          <span>Zone: ${loc.geographic_context?.zone_code} · Elev: ${elevLabel}</span><br/>
          <span>Soil: ${soilLabel}</span>
        </div>`,
        { direction: 'top', offset: [0, -14] }
      );

      marker.on('click', () => {
        if (onSelectLocation) onSelectLocation(loc);
      });

      marker.on('add', () => {
        const el = marker.getElement();
        if (el) {
          el.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              if (onSelectLocation) onSelectLocation(loc);
            }
          });
        }
      });

      marker.addTo(group);
    };

    // At lower zoom levels (zoom <= 11 when clustering is enabled and not compact),
    // group dense neighboring locations into Cartographic Survey Cluster Medallions
    // while ALWAYS keeping the active selectedLocation rendered as an individual doodle marker.
    const shouldCluster = enableClustering && !compact && currentZoom <= 11 && validLocations.length > 35;

    if (!shouldCluster) {
      validLocations.forEach(renderIndividualMarker);
      return;
    }

    const cellDeg = currentZoom <= 10 ? 0.055 : 0.032;
    const buckets = new Map();

    validLocations.forEach((loc) => {
      if (selectedLocation?.id === loc.id) {
        renderIndividualMarker(loc);
        return;
      }
      const gx = Math.floor(loc.coordinates.lon / cellDeg);
      const gy = Math.floor(loc.coordinates.lat / cellDeg);
      const key = `${gx}:${gy}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(loc);
    });

    buckets.forEach((bucket) => {
      if (bucket.length === 1) {
        renderIndividualMarker(bucket[0]);
        return;
      }

      const avgLat = bucket.reduce((acc, l) => acc + l.coordinates.lat, 0) / bucket.length;
      const avgLon = bucket.reduce((acc, l) => acc + l.coordinates.lon, 0) / bucket.length;
      const firstDoodle = resolveLocationDoodle(bucket[0], colorMode);
      const sampleNames = bucket.map((b) => b.name);
      const size = bucket.length >= 15 ? 46 : bucket.length >= 6 ? 40 : 36;

      const clusterIcon = L.divIcon({
        className: '',
        html: buildClusterDoodleHtml({
          count: bucket.length,
          dominantColor: firstDoodle.color,
          sampleNames
        }),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const clusterMarker = L.marker([avgLat, avgLon], {
        icon: clusterIcon,
        zIndexOffset: 300
      });

      clusterMarker.bindTooltip(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;line-height:1.45;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#e09f50;">CARTOGRAPHIC SURVEY CLUSTER (${bucket.length} SITES)</div>
          <strong>${sampleNames.slice(0, 4).join(', ')}${bucket.length > 4 ? ` +${bucket.length - 4} more` : ''}</strong><br/>
          <span style="color:#84c7a3;">Click to zoom into individual land doodle markers</span>
        </div>`,
        { direction: 'top', offset: [0, -14] }
      );

      clusterMarker.on('click', () => {
        if (map) {
          const bounds = L.latLngBounds(bucket.map((b) => [b.coordinates.lat, b.coordinates.lon]));
          map.flyToBounds(bounds.pad(0.35), { maxZoom: 14, duration: 0.65 });
        }
      });

      clusterMarker.addTo(group);
    });
  }, [locations, selectedLocation?.id, colorMode, compact, enableClustering, currentZoom, onSelectLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="leaflet-map-canvas"
      role="application"
      aria-label="Interactive Chennai Land Intelligence Map with Custom Cartographic Doodle Markers"
    />
  );
}
