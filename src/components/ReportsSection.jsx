import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckSquare,
  ShieldAlert,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCw,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ReportsSection({
  locations,
  selectedLocation,
  onSelectLocation,
  currentAssessment,
  currentCostEstimate,
  compareIds = [],
  savedWorkspace
}) {
  const [viewMode, setViewMode] = useState('deck'); // 'deck' | 'dossier'
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [animState, setAnimState] = useState('state-idle'); // 'state-idle' | 'state-exiting-next' | 'state-exiting-prev' | 'state-entering'
  const [slideDirection, setSlideDirection] = useState('next');

  // Dossier section inclusion toggles (for printable dossier sheet)
  const [sections, setSections] = useState({
    geographic: true,
    ground: true,
    environmental: true,
    connectivity: true,
    assessment: true,
    recommendations: true,
    comparison: true,
    costEstimate: true,
    missingData: true,
    sourcesDisclaimer: true
  });

  const loc = selectedLocation || locations[0];
  if (!loc || !currentAssessment || !currentCostEstimate) return null;

  const comparedLocations = useMemo(() => {
    return compareIds
      .map((id) => locations.find((l) => l.id === id))
      .filter(Boolean);
  }, [compareIds, locations]);

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# TERRA FORGE — PRELIMINARY LAND INTELLIGENCE REPORT`,
      `**Tagline:** Intelligence before construction. Build smarter. Build stronger.`,
      `**Target Location:** ${loc.name} (${loc.id})`,
      `**Assessment Date:** ${new Date().toISOString().slice(0, 10)}`,
      `**Jurisdiction:** ${loc.geographic_context.jurisdiction}`,
      ``,
      `---`,
      ``
    ];

    if (sections.geographic) {
      lines.push(
        `## 1. Geographic & Topographic Context`,
        `- **Verified Coordinates (WGS 84):** ${loc.coordinates.lat}°N, ${loc.coordinates.lon}°E (OpenStreetMap Node #${loc.coordinates.osm_id})`,
        `- **Terrain Elevation (Copernicus DEM / SRTM 90m):** ${loc.geographic_context.elevation_m_msl ?? 'Unavailable'} m MSL`,
        `- **Coastal Distance:** ${loc.geographic_context.coastal_distance_km} km from Bay of Bengal shoreline`,
        `- **Planning Corridor:** ${loc.geographic_context.planning_corridor}`,
        ``
      );
    }

    if (sections.ground) {
      lines.push(
        `## 2. Ground, Soil & Hydrogeological Intelligence`,
        `- **Geological Formation:** ${loc.ground_and_soil.geological_formation}`,
        `- **Regional Soil Classification:** ${loc.ground_and_soil.soil_classification || 'Unavailable in 1:50k Soil Sheet'}`,
        `- **Geographic Resolution:** ${loc.ground_and_soil.soil_resolution}`,
        `- **Pre-Monsoon Groundwater (May):** ${loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'}`,
        `- **Post-Monsoon Groundwater (Jan):** ${loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'Unavailable'}`,
        `- **Geotechnical Note:** ${loc.ground_and_soil.geotechnical_note}`,
        ``
      );
    }

    if (sections.environmental) {
      lines.push(
        `## 3. Environmental & Flood Context`,
        `- **Watershed Basin:** ${loc.environmental_and_flood.watershed_basin}`,
        `- **Flood Sensitivity:** ${loc.environmental_and_flood.flood_hazard_category || 'Unavailable (Outside GCC 200-Ward CFLOWS Map)'}`,
        `- **Nearest Verified Water Body:** ${loc.environmental_and_flood.nearest_water_body ? `${loc.environmental_and_flood.nearest_water_body.name} (${loc.environmental_and_flood.nearest_water_body.distance_km} km)` : 'None in immediate buffer'}`,
        ``
      );
    }

    if (sections.assessment) {
      lines.push(
        `## 4. Preliminary Site Assessment & User Assumptions`,
        `- **Project Category:** ${currentAssessment.userInputs.projectCategory}`,
        `- **Plot Area:** ${currentAssessment.userInputs.plotAreaSqFt.toLocaleString()} sq.ft (${currentAssessment.userInputs.plotAreaSqM} sq.m)`,
        `- **Assumed FSI & Built-Up Area:** FSI ${currentAssessment.userInputs.fsiRatio} -> ${currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft (${currentAssessment.calculatedMetrics.estimatedBuiltUpSqM} sq.m)`,
        `- **Minimum Concrete & Cover (IS 456):** ${currentAssessment.calculatedMetrics.minConcreteGrade} with ${currentAssessment.calculatedMetrics.nominalCoverMm} mm cover`,
        `- **Recommended Plinth Offset:** +${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m above road crown`,
        `- **IS 1892 Borehole Scope:** ${currentAssessment.calculatedMetrics.recommendedBoreholes} boreholes to ${currentAssessment.calculatedMetrics.targetBoreholeDepthM} m depth`,
        ``
      );
    }

    if (sections.recommendations) {
      lines.push(`## 5. Explainable Engineering Recommendations`);
      currentAssessment.recommendations.forEach((r, idx) => {
        lines.push(
          `### 5.${idx + 1} ${r.title} (${r.id})`,
          `- **Recommendation:** ${r.recommendationText}`,
          `- **Supporting Data:** ${r.supportingSourceData}`,
          `- **Reasoning:** ${r.reasoningExplanation}`,
          `- **Source:** ${r.sourceReference}`,
          `- **Limitations:** ${r.limitations}`,
          ``
        );
      });
    }

    if (sections.costEstimate) {
      lines.push(
        `## 6. Assumption-Based Preliminary Cost Estimate`,
        `- **Subtotal Before Contingency:** ₹${(currentCostEstimate.subtotalBeforeContingency / 100000).toFixed(2)} Lakhs`,
        `- **Contingency (${currentCostEstimate.ratesUsed.contingencyPct}%):** ₹${(currentCostEstimate.contingencyCost / 100000).toFixed(2)} Lakhs`,
        `- **Estimated Preliminary Total:** ₹${currentCostEstimate.totalEstimatedLakhs} Lakhs (₹${currentCostEstimate.EffectiveRatePerSqFt}/sq.ft)`,
        ``
      );
    }

    if (sections.missingData) {
      lines.push(`## 7. Missing Information & Mandatory Further Investigations`);
      currentAssessment.missingDataDisclosures.forEach((m) => {
        lines.push(`- ${m}`);
      });
      lines.push(``);
    }

    if (sections.sourcesDisclaimer) {
      lines.push(
        `## 8. Data Sources & Engineering Disclaimer`,
        `- **Sources Used:** OpenStreetMap Contributors (ODbL 1.0), Copernicus DEM GLO-90 / NASA SRTM via Open-Meteo API, Central Ground Water Board (CGWB) Chennai Brochure, GSI 1:50,000 Lithological Map, NCCR CFLOWS-Chennai Framework, GCC 15-Zone Registry, and BIS Civil Engineering Standards (IS 456, IS 1893, IS 1904).`,
        `- **Disclaimer:** Preliminary land intelligence only. Does NOT replace physical geotechnical borehole testing (IS 1892), structural engineering certification, legal title verification, or statutory CMDA/GCC environmental clearance.`
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TerraForge-Report-${loc.id}-${loc.normalized_name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // ACTUAL REPORT CARDS GROUNDED IN VERIFIED CHENNAI DATA
  // =========================================================================
  const reportCards = useMemo(() => {
    const cards = [
      {
        id: 'master-dossier',
        reportNumber: '01',
        category: 'Master Intelligence Dossier',
        themeColor: '#e09f50', // Warm Amber
        themeBg: 'rgba(224, 159, 80, 0.08)',
        badgeClass: 'badge-copper',
        title: 'Comprehensive Land Intelligence Dossier',
        locationName: `${loc.name} (${loc.id})`,
        jurisdiction: loc.geographic_context.jurisdiction,
        corridor: loc.geographic_context.planning_corridor,
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'SRTM Elevation',
          value: `${loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL`
        },
        secondaryMetric: {
          label: 'Shoreline Buffer',
          value: `${loc.geographic_context.coastal_distance_km} km`
        },
        summaryText: loc.geographic_context.topographic_summary,
        keyFindings: [
          `Geological Formation: ${loc.ground_and_soil.geological_formation}`,
          `Planning Corridor: ${loc.geographic_context.planning_corridor}`,
          `Verified OSM Node #${loc.coordinates.osm_id} (${loc.coordinates.lat}°N, ${loc.coordinates.lon}°E)`,
          `Data Completeness: ${loc.data_quality.completeness_pct}% verified against official records`
        ],
        targetSectionKey: 'geographic'
      },
      {
        id: 'geotech-soil',
        reportNumber: '02',
        category: 'Geotechnical & Soil Stratigraphy',
        themeColor: '#c87a48', // Copper / Terracotta
        themeBg: 'rgba(200, 122, 72, 0.08)',
        badgeClass: 'badge-copper',
        title: 'Ground, Soil & Hydrogeological Stratigraphy',
        locationName: `${loc.name} (${loc.id})`,
        jurisdiction: loc.ground_and_soil.geological_formation,
        corridor: `Resolution: ${loc.ground_and_soil.soil_resolution}`,
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'Pre-Monsoon GW',
          value: loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'
        },
        secondaryMetric: {
          label: 'Concrete Grade (IS 456)',
          value: currentAssessment.calculatedMetrics.minConcreteGrade
        },
        summaryText: loc.ground_and_soil.geotechnical_note,
        keyFindings: [
          `Regional Soil: ${loc.ground_and_soil.soil_classification || loc.ground_and_soil.soil_status}`,
          `Mandatory Boreholes: ${currentAssessment.calculatedMetrics.recommendedBoreholes} drilling points to ${currentAssessment.calculatedMetrics.targetBoreholeDepthM}m depth (IS 1892)`,
          `Nominal Cover: ${currentAssessment.calculatedMetrics.nominalCoverMm} mm for coastal exposure`,
          `Post-Monsoon GW: ${loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'Unavailable'}`
        ],
        targetSectionKey: 'ground'
      },
      {
        id: 'watershed-flood',
        reportNumber: '03',
        category: 'Hydrological & Inundation Risk',
        themeColor: '#4fa8c2', // Hydro Cyan
        themeBg: 'rgba(79, 168, 194, 0.08)',
        badgeClass: 'badge-hydro',
        title: 'Watershed Basin & Inundation Sensitivity',
        locationName: `${loc.name} (${loc.id})`,
        jurisdiction: `Basin: ${loc.environmental_and_flood.watershed_basin}`,
        corridor: `Drainage: ${loc.environmental_and_flood.primary_drainage_channel}`,
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'Flood Hazard',
          value: loc.environmental_and_flood.flood_hazard_category || loc.environmental_and_flood.flood_status
        },
        secondaryMetric: {
          label: 'Plinth Offset',
          value: `+${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m`
        },
        summaryText: loc.environmental_and_flood.historical_inundation_context || 'Standard stormwater drainage protocols apply based on GCC 200-Ward CFLOWS map.',
        keyFindings: [
          `Primary Carrier: ${loc.environmental_and_flood.primary_drainage_channel}`,
          `Nearest Water Body: ${loc.environmental_and_flood.nearest_water_body ? `${loc.environmental_and_flood.nearest_water_body.name} (${loc.environmental_and_flood.nearest_water_body.distance_km} km)` : 'None within immediate 1.5 km buffer'}`,
          `Plinth Elevation: Elevate finish level +${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)}m above road crown`,
          `Micro-Watershed: ${loc.environmental_and_flood.watershed_basin}`
        ],
        targetSectionKey: 'environmental'
      },
      {
        id: 'cost-ledger',
        reportNumber: '04',
        category: 'Financial Ledger & Durability',
        themeColor: '#84c7a3', // Sage
        themeBg: 'rgba(132, 199, 163, 0.08)',
        badgeClass: 'badge-sage',
        title: 'Preliminary Cost Estimate & Durability Upgrades',
        locationName: `${loc.name} (${loc.id})`,
        jurisdiction: `Built-up: ${currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft`,
        corridor: `Category: ${currentAssessment.userInputs.projectCategory} (FSI ${currentAssessment.userInputs.fsiRatio})`,
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'Preliminary Total',
          value: `₹${currentCostEstimate.totalEstimatedLakhs} L`
        },
        secondaryMetric: {
          label: 'Effective Rate',
          value: `₹${currentCostEstimate.EffectiveRatePerSqFt}/sq.ft`
        },
        summaryText: `Calculated for ${currentAssessment.userInputs.projectCategory} with FSI ${currentAssessment.userInputs.fsiRatio} across ${currentAssessment.userInputs.proposedFloors} floors, including site-condition allowances for coastal durability and sub-structure ground conditions.`,
        keyFindings: [
          `Subtotal (excl. contingency): ₹${(currentCostEstimate.subtotalBeforeContingency / 100000).toFixed(2)} Lakhs`,
          `Contingency (${currentCostEstimate.ratesUsed.contingencyPct}%): ₹${(currentCostEstimate.contingencyCost / 100000).toFixed(2)} Lakhs`,
          `Coastal Durability Upgrade: ₹${((currentCostEstimate.lineItems.find((i) => i.id === 'coastal')?.amountInr || 0) / 100000).toFixed(2)} Lakhs`,
          `Sub-structure Provision: ₹${((currentCostEstimate.lineItems.find((i) => i.id === 'substructure')?.amountInr || 0) / 100000).toFixed(2)} Lakhs`
        ],
        targetSectionKey: 'costEstimate'
      },
      {
        id: 'comparative-benchmark',
        reportNumber: '05',
        category: 'Corridor Comparative Benchmark',
        themeColor: '#d8ccb8', // Sandstone Ivory
        themeBg: 'rgba(216, 204, 184, 0.08)',
        badgeClass: 'badge-sandstone',
        title: 'Regional Corridor Peer Comparison',
        locationName: comparedLocations.map((c) => c.name).join(' vs. ') || `${loc.name} vs Corridor Peers`,
        jurisdiction: `Compared Sites: ${comparedLocations.length}`,
        corridor: `Planning Corridor: ${loc.geographic_context.planning_corridor}`,
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'Locations Evaluated',
          value: `${comparedLocations.length} Sites`
        },
        secondaryMetric: {
          label: 'Elevation Span',
          value: comparedLocations.length > 0 ? `${Math.min(...comparedLocations.map((c) => c.geographic_context.elevation_m_msl || 0))}–${Math.max(...comparedLocations.map((c) => c.geographic_context.elevation_m_msl || 0))}m` : `${loc.geographic_context.elevation_m_msl}m`
        },
        summaryText: `Benchmark comparison across elevation datums, coastal distance exposure, and regional soil sheets for active comparative site selection.`,
        keyFindings: [
          `Active Benchmark: ${loc.name} (${loc.id})`,
          `Elevation Range: ${Math.min(...comparedLocations.map((c) => c.geographic_context.elevation_m_msl || 0))}m to ${Math.max(...comparedLocations.map((c) => c.geographic_context.elevation_m_msl || 0))}m MSL`,
          `Coastal Proximity: ${Math.min(...comparedLocations.map((c) => c.geographic_context.coastal_distance_km))} km to ${Math.max(...comparedLocations.map((c) => c.geographic_context.coastal_distance_km))} km`,
          `Corridor Peers: ${comparedLocations.map((c) => c.name).join(', ') || loc.name}`
        ],
        targetSectionKey: 'comparison'
      },
      {
        id: 'statutory-checklist',
        reportNumber: '06',
        category: 'Statutory Standards & Investigation',
        themeColor: '#d95d48', // Terracotta Red
        themeBg: 'rgba(217, 93, 72, 0.08)',
        badgeClass: 'badge-terracotta',
        title: 'BIS Code Compliance & Missing Data Checklist',
        locationName: `${loc.name} (${loc.id})`,
        jurisdiction: loc.geographic_context.jurisdiction,
        corridor: 'Bureau of Indian Standards Audit',
        date: new Date().toISOString().slice(0, 10),
        primaryMetric: {
          label: 'Data Completeness',
          value: `${loc.data_quality.completeness_pct}%`
        },
        secondaryMetric: {
          label: 'Mandatory Audits',
          value: `${currentAssessment.missingDataDisclosures.length} Items`
        },
        summaryText: `Comprehensive disclosure of verified regional sources, applicable Bureau of Indian Standards civil engineering codes, and mandatory physical investigation requirements.`,
        keyFindings: [
          `Applicable Standards: IS 456 (Concrete), IS 1893 (Seismic Zone III), IS 1892 (Subsurface Investigation)`,
          `Mandatory Field Test: Minimum ${currentAssessment.calculatedMetrics.recommendedBoreholes} borehole(s) with Standard Penetration Testing (SPT 'N')`,
          `Primary Disclosure: ${currentAssessment.missingDataDisclosures[0] || 'Physical title and structural certification required'}`,
          `Zero Synthetic Data: All records grounded in OSM, SRTM, CGWB, and GCC archives`
        ],
        targetSectionKey: 'missingData'
      }
    ];

    // Append any user-saved assessments as custom cards if available
    if (savedWorkspace?.assessments?.length) {
      savedWorkspace.assessments.forEach((saved) => {
        const num = String(cards.length + 1).padStart(2, '0');
        cards.push({
          id: `saved-${saved.id}`,
          reportNumber: num,
          category: 'Saved Project Assessment',
          themeColor: '#5d9678', // Sage bright
          themeBg: 'rgba(93, 150, 120, 0.09)',
          badgeClass: 'badge-sage',
          title: saved.title || `Saved Assessment: ${saved.locationName}`,
          locationName: `${saved.locationName} (${saved.locationId})`,
          jurisdiction: saved.inputs?.projectCategory || 'Custom Assessment',
          corridor: `Saved Record #${saved.id.slice(-6)}`,
          date: saved.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          primaryMetric: {
            label: 'Plot Area',
            value: `${(saved.inputs?.plotAreaSqFt || 3600).toLocaleString()} sq.ft`
          },
          secondaryMetric: {
            label: 'Est. Cost',
            value: `₹${saved.costEstimate?.totalEstimatedLakhs || 'N/A'} L`
          },
          summaryText: `Custom user-saved assessment with FSI ${saved.inputs?.fsiRatio || 2.0} and ${saved.inputs?.proposedFloors || 3} floors.`,
          keyFindings: [
            `Location: ${saved.locationName} (${saved.locationId})`,
            `Notes: ${saved.notes || 'User-saved configuration with custom parameters'}`,
            `Saved On: ${new Date(saved.createdAt || Date.now()).toLocaleDateString()}`,
            `Status: Saved Workspace Record`
          ],
          targetSectionKey: 'assessment'
        });
      });
    }

    return cards;
  }, [loc, currentAssessment, currentCostEstimate, comparedLocations, savedWorkspace]);

  // Keep active index in bounds if card list changes
  const activeCard = reportCards[activeCardIndex] || reportCards[0];

  // Draw next card with UNO-inspired physical slide & bounce
  const drawNextCard = useCallback(() => {
    if (animState !== 'state-idle') return;
    setSlideDirection('next');
    setAnimState('state-exiting-next');

    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % reportCards.length);
      setAnimState('state-entering');
      setTimeout(() => {
        setAnimState('state-idle');
      }, 260);
    }, 320);
  }, [animState, reportCards.length]);

  // Draw previous card
  const drawPrevCard = useCallback(() => {
    if (animState !== 'state-idle') return;
    setSlideDirection('prev');
    setAnimState('state-exiting-prev');

    setTimeout(() => {
      setActiveCardIndex((prev) => (prev - 1 + reportCards.length) % reportCards.length);
      setAnimState('state-entering');
      setTimeout(() => {
        setAnimState('state-idle');
      }, 260);
    }, 320);
  }, [animState, reportCards.length]);

  // Keyboard navigation: ArrowRight / ArrowDown -> next card; ArrowLeft / ArrowUp -> prev card
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'deck') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        drawNextCard();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        drawPrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, drawNextCard, drawPrevCard]);

  // Open the full report view and scroll to the relevant section
  const handleOpenFullReport = (sectionKey) => {
    setViewMode('dossier');
    if (sectionKey && !sections[sectionKey]) {
      setSections((prev) => ({ ...prev, [sectionKey]: true }));
    }
    setTimeout(() => {
      const el = document.getElementById(`dossier-section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div>
      {/* SECTION TOPBAR (NO-PRINT) */}
      <div className="section-header no-print">
        <div>
          <div className="eyebrow-badge" style={{ marginBottom: '0.5rem' }}>
            <FileText size={14} />
            <span>DATA-GROUNDED REPORT DOSSIER STUDIO</span>
          </div>
          <h2 className="section-title">Reports &amp; Dossiers — {loc.name} ({loc.id})</h2>
          <p className="section-subtitle">
            Browse interactive physical report cards on the survey desk or expand into the full printable engineering dossier.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Location Switcher */}
          <select
            value={loc.id}
            onChange={(e) => {
              const found = locations.find((x) => x.id === e.target.value);
              if (found) onSelectLocation(found);
            }}
            aria-label="Select location for report"
            style={{
              background: 'var(--bg-graphite)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.52rem 0.75rem',
              color: 'var(--text-ivory)',
              fontSize: '0.85rem'
            }}
          >
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.id})
              </option>
            ))}
          </select>

          {/* Mode Switcher Pills */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', padding: '2px' }}>
            <button
              type="button"
              className={`layer-toggle-btn ${viewMode === 'deck' ? 'active' : ''}`}
              onClick={() => setViewMode('deck')}
              title="Interactive Card Deck on Desk"
            >
              <Layers size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Card Deck
            </button>
            <button
              type="button"
              className={`layer-toggle-btn ${viewMode === 'dossier' ? 'active' : ''}`}
              onClick={() => setViewMode('dossier')}
              title="Full Printable Detailed Dossier"
            >
              <FileText size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Full Dossier
            </button>
          </div>

          <button type="button" className="btn-secondary" onClick={handleExportMarkdown} title="Download complete markdown report">
            <Download size={15} />
            Markdown (.md)
          </button>

          <button type="button" className="btn-primary" onClick={handlePrintPdf} title="Print or save as PDF">
            <Printer size={15} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW MODE 1: PHYSICAL CARD DECK ON DESK
          ===================================================================== */}
      {viewMode === 'deck' && (
        <div className="report-desk-viewport" role="region" aria-label="Physical Report Card Deck on Desk">
          {/* Deck Telemetry Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '700px', zIndex: 12, marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Compass size={13} />
              <span>SURVEY DESK · ACTIVE REPORT DECK ({reportCards.length} CARDS)</span>
            </div>
            <div className="report-deck-counter-badge">
              <span>Card {String(activeCardIndex + 1).padStart(2, '0')} of {String(reportCards.length).padStart(2, '0')}</span>
              <div className="report-card-mini-dots" aria-hidden="true">
                {reportCards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`report-card-mini-dot ${activeCardIndex === idx ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (animState === 'state-idle') {
                        setSlideDirection(idx > activeCardIndex ? 'next' : 'prev');
                        setActiveCardIndex(idx);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Jump to Card ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Card Stage with Behind-Stack Depth */}
          <div className="report-deck-stage">
            {/* Stacked background cards (suggesting more cards under the active one) */}
            <div className="card-stack-layer card-stack-3" aria-hidden="true" />
            <div className="card-stack-layer card-stack-2" aria-hidden="true" />
            <div className="card-stack-layer card-stack-1" aria-hidden="true" />

            {/* Active Physical Card */}
            <div
              className={`report-physical-card ${animState}`}
              onClick={drawNextCard}
              role="button"
              tabIndex={0}
              aria-label={`Report card ${activeCard.reportNumber} of ${reportCards.length}: ${activeCard.title}. Click to draw next card.`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  drawNextCard();
                }
              }}
              style={{
                borderColor: `${activeCard.themeColor}77`
              }}
            >
              {/* Inner Fine Tactile Frame */}
              <div className="report-card-inner-frame" />

              {/* CARD TOP: Corner Index & Category Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div className="report-card-corner-index" style={{ color: activeCard.themeColor }}>
                  <span>{activeCard.reportNumber}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {String(reportCards.length).padStart(2, '0')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="report-card-corner-tag"
                    style={{
                      color: activeCard.themeColor,
                      borderColor: `${activeCard.themeColor}55`,
                      background: activeCard.themeBg
                    }}
                  >
                    {activeCard.category}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {activeCard.date}
                  </span>
                </div>
              </div>

              {/* CARD BODY: Title, Subtitle, Metrics & Findings */}
              <div style={{ margin: '0.85rem 0', position: 'relative', zIndex: 2 }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    color: 'var(--text-ivory)',
                    lineHeight: 1.25
                  }}
                >
                  {activeCard.title}
                </h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                  {activeCard.locationName} · {activeCard.jurisdiction}
                </div>

                {/* Twin Primary Visual Metric Callouts */}
                <div style={{ display: 'flex', gap: '0.65rem', margin: '0.9rem 0 0.8rem', flexWrap: 'wrap' }}>
                  <div className="report-card-metric-pill" style={{ borderLeft: `3px solid ${activeCard.themeColor}` }}>
                    <span className="report-card-metric-label">{activeCard.primaryMetric.label}</span>
                    <span className="report-card-metric-val">{activeCard.primaryMetric.value}</span>
                  </div>
                  <div className="report-card-metric-pill">
                    <span className="report-card-metric-label">{activeCard.secondaryMetric.label}</span>
                    <span className="report-card-metric-val" style={{ color: activeCard.themeColor }}>{activeCard.secondaryMetric.value}</span>
                  </div>
                </div>

                {/* Visual Summary Text */}
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.84rem', color: 'var(--text-sandstone)', lineHeight: 1.5 }}>
                  {activeCard.summaryText}
                </p>

                {/* 4 Bullet Highlights */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
                  {activeCard.keyFindings.map((finding, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={13} style={{ color: activeCard.themeColor, flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ lineHeight: 1.4 }}>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD FOOTER: Clear Instruction & Dedicated "Open Full Report" Action */}
              <div className="report-card-action-bar" style={{ position: 'relative', zIndex: 2 }}>
                <div className="report-card-hint">
                  <RotateCw size={13} style={{ color: activeCard.themeColor }} />
                  <span>Click card to reveal next report (or use ← → keys)</span>
                </div>

                {/* Dedicated Action Button to Open Detailed Dossier */}
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Do not trigger card flip
                    handleOpenFullReport(activeCard.targetSectionKey);
                  }}
                  title="Open detailed comprehensive report with full engineering tables"
                >
                  <ExternalLink size={13} style={{ marginRight: '4px' }} />
                  Open Full Report
                </button>
              </div>
            </div>
          </div>

          {/* Alternative Desk Controls Strip */}
          <div className="report-deck-controls-strip">
            <button
              type="button"
              className="btn-secondary"
              onClick={drawPrevCard}
              disabled={animState !== 'state-idle'}
              style={{ fontSize: '0.82rem', padding: '0.48rem 0.9rem' }}
              aria-label="Draw previous report card"
            >
              <ChevronLeft size={16} />
              Previous Report
            </button>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Keyboard: Arrow keys ← → or Space to flip cards
            </span>

            <button
              type="button"
              className="btn-secondary"
              onClick={drawNextCard}
              disabled={animState !== 'state-idle'}
              style={{ fontSize: '0.82rem', padding: '0.48rem 0.9rem' }}
              aria-label="Draw next report card"
            >
              Next Report
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW MODE 2: COMPREHENSIVE DETAILED DOSSIER STUDIO (PRINTABLE)
          ===================================================================== */}
      {viewMode === 'dossier' && (
        <div>
          {/* Quick return banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0.65rem 1rem', background: 'var(--bg-charcoal)', border: '1px solid var(--border-copper)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--accent-amber)' }}>
              <Layers size={15} />
              <span>Viewing Detailed Engineering Dossier · All 10 verifiable sections</span>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setViewMode('deck')}
              style={{ fontSize: '0.78rem' }}
            >
              ← Return to Card Deck on Desk
            </button>
          </div>

          <div className="reports-studio-layout">
            {/* Left Control Rail (no-print) */}
            <aside className="panel-card no-print" aria-label="Report Section Controls">
              <div className="panel-card-header">
                <h3 className="panel-card-title">Dossier Sections</h3>
                <span className="status-pill verified">
                  {Object.values(sections).filter(Boolean).length} / 10 Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem' }}>
                {[
                  ['geographic', '1. Geographic & Coordinate Context'],
                  ['ground', '2. Ground & CGWB Soil/Aquifer Data'],
                  ['environmental', '3. Watershed & Flood Sensitivity'],
                  ['connectivity', '4. Transit & Landmark Connectivity'],
                  ['assessment', '5. Site Assessment & Assumptions'],
                  ['recommendations', '6. Explainable Recommendations'],
                  ['comparison', `7. Multi-Site Comparison (${comparedLocations.length} sites)`],
                  ['costEstimate', '8. Preliminary Cost Breakdown'],
                  ['missingData', '9. Missing Data & Borehole Checklist'],
                  ['sourcesDisclaimer', '10. Data Sources & Disclaimer']
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="tf-surface-cell"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.55rem 0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={() => toggleSection(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </aside>

            {/* Right Bound Printable Dossier Sheet */}
            <div
              className="panel-card report-print-sheet"
              style={{
                padding: '2.5rem 2.75rem',
                background: 'var(--bg-charcoal)',
                border: '1px solid var(--border-strong)'
              }}
            >
              {/* Report Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid var(--border-copper)',
                  paddingBottom: '1.1rem',
                  marginBottom: '1.35rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                    TERRA FORGE · CHENNAI PRELIMINARY LAND INTELLIGENCE DOSSIER
                  </div>
                  <h2 style={{ margin: '0.2rem 0', fontFamily: 'var(--font-display)', fontSize: '1.65rem' }}>
                    {loc.name} ({loc.id})
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-sandstone)' }}>
                    {loc.geographic_context.jurisdiction} · {loc.geographic_context.planning_corridor}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  <div>DATE: {new Date().toISOString().slice(0, 10)}</div>
                  <div>OSM NODE: #{loc.coordinates.osm_id}</div>
                  <div>DATA COMPLETENESS: {loc.data_quality.completeness_pct}%</div>
                </div>
              </div>

              {/* 1. Geographic Context */}
              {sections.geographic && (
                <section id="dossier-section-geographic" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    1. Geographic &amp; Topographic Context
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-sandstone)' }}>
                    {loc.geographic_context.topographic_summary}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                    <div>Coordinates: {loc.coordinates.lat}°N, {loc.coordinates.lon}°E</div>
                    <div>SRTM Elevation: {loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL</div>
                    <div>Coastal Distance: {loc.geographic_context.coastal_distance_km} km</div>
                    <div>Postal PIN: {loc.geographic_context.postal_code || 'Unavailable on OSM node'}</div>
                  </div>
                </section>
              )}

              {/* 2. Ground & Soil Intelligence */}
              {sections.ground && (
                <section id="dossier-section-ground" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    2. Ground, Soil &amp; CGWB Hydrogeological Intelligence
                  </h3>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-sandstone)' }}>
                    <div><strong>Geological Formation:</strong> {loc.ground_and_soil.geological_formation}</div>
                    <div><strong>Regional Soil Classification:</strong> {loc.ground_and_soil.soil_classification || loc.ground_and_soil.soil_status}</div>
                    <div><strong>Geographic Resolution Disclosure:</strong> {loc.ground_and_soil.soil_resolution}</div>
                    <div><strong>Pre-Monsoon Groundwater (May):</strong> {loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'} | <strong>Post-Monsoon (Jan):</strong> {loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'Unavailable'}</div>
                    <div><strong>Geotechnical Consideration:</strong> {loc.ground_and_soil.geotechnical_note}</div>
                  </div>
                </section>
              )}

              {/* 3. Environmental & Flood Context */}
              {sections.environmental && (
                <section id="dossier-section-environmental" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    3. Environmental, Watershed Basin &amp; Flood Context
                  </h3>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-sandstone)' }}>
                    <div><strong>Hydrological Watershed Basin:</strong> {loc.environmental_and_flood.watershed_basin}</div>
                    <div><strong>Primary Drainage Carrier:</strong> {loc.environmental_and_flood.primary_drainage_channel}</div>
                    <div><strong>Flood Sensitivity Status:</strong> {loc.environmental_and_flood.flood_hazard_category || loc.environmental_and_flood.flood_status}</div>
                    {loc.environmental_and_flood.historical_inundation_context && (
                      <div><strong>Historical Context:</strong> {loc.environmental_and_flood.historical_inundation_context}</div>
                    )}
                  </div>
                </section>
              )}

              {/* 4. Accessibility & Connectivity */}
              {sections.connectivity && (
                <section id="dossier-section-connectivity" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    4. Accessibility, Transit &amp; Landmark Connectivity (OpenStreetMap)
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-sandstone)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div>
                      <strong>Nearest Rail / CMRL Metro Nodes:</strong>{' '}
                      {loc.accessibility_and_connectivity.nearest_transit_stations.length > 0
                        ? loc.accessibility_and_connectivity.nearest_transit_stations
                            .map((s) => `${s.name} (${s.type}, ${s.distance_km} km)`)
                            .join(' · ')
                        : 'No station within 8.5 km'}
                    </div>
                    <div>
                      <strong>Arterial Roads:</strong>{' '}
                      {loc.accessibility_and_connectivity.arterial_roads.length > 0
                        ? loc.accessibility_and_connectivity.arterial_roads
                            .map((r) => `${r.name} (${r.distance_km} km)`)
                            .join(' · ')
                        : 'Local municipal road network'}
                    </div>
                    <div>
                      <strong>Public Facilities &amp; Landmarks:</strong>{' '}
                      {loc.accessibility_and_connectivity.landmarks_and_facilities.length > 0
                        ? loc.accessibility_and_connectivity.landmarks_and_facilities
                            .map((l) => `${l.name} (${l.category}, ${l.distance_km} km)`)
                            .join(' · ')
                        : 'Refer to adjacent suburb facilities'}
                    </div>
                  </div>
                </section>
              )}

              {/* 5. Preliminary Site Assessment Findings */}
              {sections.assessment && (
                <section id="dossier-section-assessment" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    5. Preliminary Site Assessment &amp; User Assumptions
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-sandstone)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    <div><strong>Project Category:</strong> {currentAssessment.userInputs.projectCategory}</div>
                    <div><strong>Plot Area (Assumed):</strong> {currentAssessment.userInputs.plotAreaSqFt.toLocaleString()} sq.ft ({currentAssessment.userInputs.plotAreaSqM} sq.m)</div>
                    <div><strong>FSI &amp; Built-Up Area:</strong> FSI {currentAssessment.userInputs.fsiRatio} → {currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft</div>
                    <div><strong>Proposed Height:</strong> {currentAssessment.userInputs.proposedFloors} Floors {currentAssessment.userInputs.includeBasement ? '(+ Basement)' : '(No Basement)'}</div>
                    <div><strong>IS 456 Concrete &amp; Cover:</strong> {currentAssessment.calculatedMetrics.minConcreteGrade} · {currentAssessment.calculatedMetrics.nominalCoverMm} mm</div>
                    <div><strong>Recommended Plinth:</strong> +{currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m above road crown</div>
                  </div>
                </section>
              )}

              {/* 6. Explainable Recommendations */}
              {sections.recommendations && (
                <section id="dossier-section-recommendations" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    6. Explainable Recommendations &amp; Rule Reasoning
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
                    {currentAssessment.recommendations.map((rec) => (
                      <div key={rec.id} className="tf-surface-cell accent-amber">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-ivory)' }}>{rec.title} ({rec.id})</div>
                          <span className="tf-badge badge-copper">{rec.ruleId || rec.category}</span>
                        </div>
                        <div style={{ marginTop: '0.35rem', color: 'var(--text-sandstone)', lineHeight: 1.55 }}>{rec.recommendationText}</div>
                        <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          <strong>Basis:</strong> {rec.reasoningExplanation} ({rec.sourceReference})
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 7. Multi-Site Comparison Summary */}
              {sections.comparison && comparedLocations.length >= 2 && (
                <section id="dossier-section-comparison" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    7. Multi-Site Comparison Summary ({comparedLocations.map((c) => c.name).join(' vs. ')})
                  </h3>
                  <div className="table-wrapper" style={{ marginTop: '0.5rem' }}>
                    <table className="tf-table">
                      <thead>
                        <tr>
                          <th>Location</th>
                          <th className="tf-numeric-cell">Elevation (SRTM)</th>
                          <th className="tf-numeric-cell">Coastal Dist.</th>
                          <th>Regional Soil Class (1:50k)</th>
                          <th>Pre-Monsoon GW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedLocations.map((c) => (
                          <tr key={c.id}>
                            <th>
                              <button
                                type="button"
                                className="tf-clickable-name"
                                style={{ fontSize: '0.88rem' }}
                                onClick={() => onSelectLocation(c)}
                              >
                                {c.name} ({c.id})
                              </button>
                            </th>
                            <td className="tf-numeric-cell">{c.geographic_context.elevation_m_msl ?? 'Not available'} m MSL</td>
                            <td className="tf-numeric-cell">{c.geographic_context.coastal_distance_km} km</td>
                            <td>{c.ground_and_soil.soil_classification ? c.ground_and_soil.soil_classification.split('(')[0].trim() : 'Not available'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                              {c.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Not available'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* 8. Preliminary Cost Estimate */}
              {sections.costEstimate && (
                <section id="dossier-section-costEstimate" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    8. Assumption-Based Preliminary Cost Estimate Summary
                  </h3>
                  <div className="table-wrapper" style={{ marginTop: '0.5rem' }}>
                    <table className="tf-table">
                      <thead>
                        <tr>
                          <th>Cost Line Item</th>
                          <th>Provenance</th>
                          <th className="tf-numeric-cell">Quantity</th>
                          <th className="tf-numeric-cell">Unit Rate</th>
                          <th className="tf-numeric-cell">Amount (₹ Lakhs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCostEstimate.lineItems.map((item) => (
                          <tr key={item.id}>
                            <th>{item.label}</th>
                            <td>{item.origin}</td>
                            <td className="tf-numeric-cell">{item.quantity}</td>
                            <td className="tf-numeric-cell">{item.unitRate}</td>
                            <td className="tf-numeric-cell">₹{(item.amountInr / 100000).toFixed(2)} L</td>
                          </tr>
                        ))}
                        <tr className="tf-selected-row">
                          <th style={{ color: 'var(--accent-amber)' }}>Estimated Preliminary Total (incl. {currentCostEstimate.ratesUsed.contingencyPct}% Contingency)</th>
                          <td>Grand Total</td>
                          <td className="tf-numeric-cell">{currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft</td>
                          <td className="tf-numeric-cell">₹{currentCostEstimate.EffectiveRatePerSqFt}/sq.ft eff.</td>
                          <td className="tf-numeric-cell" style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                            ₹{currentCostEstimate.totalEstimatedLakhs} Lakhs
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* 9. Missing Data & Further Investigation */}
              {sections.missingData && (
                <section id="dossier-section-missingData" style={{ marginBottom: '1.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#f09383', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    9. Missing Information &amp; Mandatory Further Investigation Requirements
                  </h3>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.83rem', color: 'var(--text-sandstone)' }}>
                    {currentAssessment.missingDataDisclosures.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 10. Data Sources & Disclaimer */}
              {sections.sourcesDisclaimer && (
                <section id="dossier-section-sourcesDisclaimer" style={{ borderTop: '1px solid var(--border-strong)', paddingTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div>
                    <strong>Data Sources &amp; Methodology:</strong> Coordinates, roads, transit stations, water bodies, and public facilities sourced from OpenStreetMap Contributors (ODbL 1.0, retrieved 2026-10-24). Digital terrain elevations sourced from Copernicus DEM GLO-90 / NASA SRTM via Open-Meteo Elevation API. Regional soil and groundwater ranges sourced from Central Ground Water Board (CGWB) Chennai District Brochure and GSI 1:50,000 maps. Watershed basins and historical flood context referenced from NCCR CFLOWS-Chennai and GCC 15-Zone framework.
                  </div>
                  <div style={{ marginTop: '0.45rem' }}>
                    <strong>Mandatory Engineering Disclaimer:</strong> Terra Forge is a preliminary land-intelligence and decision-support platform. It does NOT replace professional geotechnical borehole investigation (IS 1892), structural engineering design (IS 456 / IS 1893), legal title verification, or statutory CMDA/GCC environmental clearance.
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
