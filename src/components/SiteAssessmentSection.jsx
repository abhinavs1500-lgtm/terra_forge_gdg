import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bookmark,
  FileText,
  Calculator,
  Hammer,
  Layers,
  ShieldAlert,
  MapPin,
  ExternalLink,
  BookOpen,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Compass,
  ArrowRight,
  RotateCw,
  Waves,
  Mountain,
  CloudRain,
  Wind,
  ShieldCheck,
  Building2,
  Check
} from 'lucide-react';

const dirtyInputMap = new WeakMap();

export default function SiteAssessmentSection({
  locations,
  selectedLocation,
  onSelectLocation,
  projectInputs,
  onUpdateProjectInputs,
  currentAssessment,
  onSaveAssessment,
  onNavigate
}) {
  // Navigation / Journey Mode: 'opening' | 'step' | 'summary'
  const [journeyMode, setJourneyMode] = useState('opening');
  const [activeStep, setActiveStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Assumptions & secondary drawers
  const [showAssumptionsPanel, setShowAssumptionsPanel] = useState(false);
  const [showFactComparisonDrawer, setShowFactComparisonDrawer] = useState(false);
  const [showMissingChecklistDrawer, setShowMissingChecklistDrawer] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Expanded state for detailed recommendations in summary mode
  const [expandedRecs, setExpandedRecs] = useState({
    'REC-DURABILITY-IS456': true,
    'REC-HYDRO-PLINTH': false,
    'REC-GEOTECH-IS1892': false,
    'REC-SEISMIC-LOGISTICS': false
  });

  const stepContainerRef = useRef(null);
  const radarCanvasRef = useRef(null);
  const formRef = useRef(null);

  const loc = selectedLocation || locations[0];
  if (!loc || !currentAssessment) return null;

  // =========================================================================
  // AUTOMATIC SMOOTH SCROLLING SYNCHRONIZER
  // Positions the newly revealed assessment near the top of the viewport
  // accounting for the fixed topbar height (~76px)
  // =========================================================================
  const scrollToActiveAssessment = useCallback(() => {
    setTimeout(() => {
      if (!stepContainerRef.current) return;
      const rect = stepContainerRef.current.getBoundingClientRect();
      const topbarHeight = 78;
      const targetY = window.pageYOffset + rect.top - topbarHeight;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }, 80);
  }, []);

  // =========================================================================
  // 6 DATA-GROUNDED ASSESSMENT STEPS FOR GUIDED JOURNEY
  // =========================================================================
  const assessmentSteps = useMemo(() => {
    return [
      {
        id: 'coastal-durability',
        stepNumber: '01',
        title: 'Coastal Chloride & Airborne Salt Exposure',
        standard: 'IS 456:2000 (Plain & Reinforced Concrete Table 3 & 5)',
        category: 'Durability & Materials Engineering',
        icon: Waves,
        accentColor: 'var(--accent-amber)',
        metric1: {
          label: 'Shoreline Distance',
          val: `${loc.geographic_context.coastal_distance_km} km`
        },
        metric2: {
          label: 'Concrete Grade',
          val: currentAssessment.calculatedMetrics.minConcreteGrade.split('(')[0].trim()
        },
        metric3: {
          label: 'Nominal Cover',
          val: `${currentAssessment.calculatedMetrics.nominalCoverMm} mm`
        },
        primaryFinding: `Located ${loc.geographic_context.coastal_distance_km} km from the Bay of Bengal coastline. ${
          loc.geographic_context.coastal_distance_km <= 5.0
            ? 'Subjected to severe airborne marine chloride deposition. Standard OPC concrete risks accelerated carbonation and rebar corrosion.'
            : 'Moderate coastal buffer zone; standard atmospheric durability specifications apply.'
        }`,
        engineeringAction: `Mandates minimum ${currentAssessment.calculatedMetrics.minConcreteGrade.split('(')[0].trim()} structural concrete with ${currentAssessment.calculatedMetrics.nominalCoverMm} mm clear cover. Strongly recommends PPC or GGBS-blended cementitious binders and Fe 500D Corrosion-Resistant Steel (CRS) or epoxy-coated reinforcement.`,
        whyItMatters: 'Marine salt aerosols penetrate porous cement matrices, triggering electrochemical oxidation of steel reinforcement, concrete spalling, and premature structural degradation within coastal Chennai environments.',
        provenance: 'Geodesic coastal distance calculated via Haversine formula from OpenStreetMap Bay of Bengal coastline vector. Durability envelope codified under IS 456:2000 Table 3.',
        limitations: 'Local windward exposure, micro-topography, and localized groundwater salinity require physical soil/water chemical testing per IS 3025.'
      },
      {
        id: 'subsurface-soil',
        stepNumber: '02',
        title: 'Subsurface Lithology & Exploratory Borehole Gate',
        standard: 'IS 1892:1979 & IS 1904:1986 (Foundations)',
        category: 'Geotechnical & Subsurface Engineering',
        icon: Mountain,
        accentColor: '#d95d48',
        metric1: {
          label: 'Geological Formation',
          val: loc.ground_and_soil.geological_formation.split('/')[0].trim()
        },
        metric2: {
          label: 'Regional Soil',
          val: loc.ground_and_soil.soil_classification ? loc.ground_and_soil.soil_classification.split('(')[0].trim() : 'Unclassified'
        },
        metric3: {
          label: 'Mandatory Drilling Scope',
          val: `${currentAssessment.calculatedMetrics.recommendedBoreholes} BHs × ${currentAssessment.calculatedMetrics.targetBoreholeDepthM}m`
        },
        primaryFinding: `Regional lithology maps identify ${loc.ground_and_soil.geological_formation}. ${loc.ground_and_soil.geotechnical_note}`,
        engineeringAction: `Requires minimum ${currentAssessment.calculatedMetrics.recommendedBoreholes} physical exploratory core borehole(s) drilled to ${currentAssessment.calculatedMetrics.targetBoreholeDepthM} m depth (or bedrock refusal) with Standard Penetration Testing (SPT 'N' values) taken at 1.5 m intervals per IS 1892.`,
        whyItMatters: 'Regional 1:50,000 geological sheets cannot identify localized soft compressible clay pockets, historic brick quarry backfill, or variable weathered rock sockets that dictate safe bearing capacity (SBC).',
        provenance: 'Geological Survey of India (GSI) 1:50,000 Chennai Lithological Map & CGWB District Atlas.',
        limitations: 'Regional map resolution is ~1 km; does NOT replace plot-specific borehole logs or laboratory consolidation testing.'
      },
      {
        id: 'aquifer-groundwater',
        stepNumber: '03',
        title: 'Aquifer Water Table Depth & Basement Hydrostatic Head',
        standard: 'CGWB Hydrogeological Network & IS 1904',
        category: 'Hydrogeological Table Analysis',
        icon: Compass,
        accentColor: '#38bdf8',
        metric1: {
          label: 'Pre-Monsoon GW (May)',
          val: loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'Unavailable'
        },
        metric2: {
          label: 'Post-Monsoon GW (Jan)',
          val: loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'Unavailable'
        },
        metric3: {
          label: 'Basement Scope',
          val: projectInputs.includeBasement ? 'Basement Included' : 'No Basement'
        },
        primaryFinding: `Observation wells indicate pre-monsoon water tables at ${loc.ground_and_soil.groundwater_pre_monsoon_m_bgl || 'N/A'}, rising to ${loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'N/A'} following northeast monsoon recharge.`,
        engineeringAction: projectInputs.includeBasement
          ? 'Mandatory continuous perimeter dewatering during deep excavation, external bentonite/SBS tanking waterproofing, and concrete retaining walls designed for full hydrostatic uplift head.'
          : 'Shallow footings or pile caps must account for post-monsoon saturation softening and reduced soil shear strength.',
        whyItMatters: 'Post-monsoon water table rebound generates significant upward buoyancy forces on underground basement slabs and can saturate foundation bearing strata.',
        provenance: 'Central Ground Water Board (CGWB) Chennai District Observation Well Network.',
        limitations: 'Hydrogeological ranges represent sub-basin averages. Perched water tables and localized pumping drawdown must be measured on-site.'
      },
      {
        id: 'watershed-flood',
        stepNumber: '04',
        title: 'Watershed Basin & Inundation Plinth Protection',
        standard: 'TNCDBR 2019, NBC 2016 Part 3 & GCC Flood Guidelines',
        category: 'Environmental Hydrology & Drainage',
        icon: CloudRain,
        accentColor: 'var(--accent-hydro)',
        metric1: {
          label: 'Watershed Basin',
          val: loc.environmental_and_flood.watershed_basin.split(' ')[0]
        },
        metric2: {
          label: 'SRTM Elevation',
          val: `${loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL`
        },
        metric3: {
          label: 'Recommended Plinth Lift',
          val: `+${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m`
        },
        primaryFinding: `Situated in the ${loc.environmental_and_flood.watershed_basin} with primary drainage toward ${loc.environmental_and_flood.primary_drainage_channel}. Classified as: ${loc.environmental_and_flood.flood_hazard_category || loc.environmental_and_flood.flood_status}.`,
        engineeringAction: `Mandates elevating the finished ground-floor plinth level +${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m above the adjacent road crown. Install non-return backflow flap valves on stormwater outfalls and avoid grade-level electrical switchgear.`,
        whyItMatters: 'During severe cyclonic precipitation events (e.g. Cyclone Michaung / 2015 floods), stormwater drainage networks back up, inundating sub-plinth road levels.',
        provenance: 'NCCR CFLOWS-Chennai Framework & Greater Chennai Corporation (GCC) 15-Zone SWD basin registry.',
        limitations: 'HFL (Highest Flood Level) must be confirmed relative to the adjacent road centerline benchmark and municipal storm drain invert.'
      },
      {
        id: 'seismic-wind',
        stepNumber: '05',
        title: 'Seismic Zone III & Cyclonic Wind Lateral Envelope',
        standard: 'IS 1893:2016 (Part 1), IS 13920:2016 & IS 875:2015 (Part 3)',
        category: 'Structural Dynamics & Lateral Loading',
        icon: Wind,
        accentColor: '#818cf8',
        metric1: {
          label: 'Seismic Zone',
          val: 'Zone III (Z = 0.16)'
        },
        metric2: {
          label: 'Basic Wind Speed',
          val: 'Vb = 50 m/s'
        },
        metric3: {
          label: 'Ductile Detailing',
          val: 'Mandatory (IS 13920)'
        },
        primaryFinding: 'Entire Chennai region is codified under Seismic Zone III (Moderate Seismic Intensity, Z = 0.16) and Cyclonic Coastal Wind Region (Basic wind speed Vb = 50 m/s / 180 km/h).',
        engineeringAction: 'Enforce ductile reinforcement detailing per IS 13920 (closed column stirrups with 135° seismic hooks) and secure roof trusses/cladding against cyclonic aerodynamic uplift per IS 875 Part 3.',
        whyItMatters: 'Coastal structures experience combined lateral forces from periodic cyclonic wind gusts and moderate seismic ground motion.',
        provenance: 'Bureau of Indian Standards National Building Code of India (NBC 2016) & IS 1893:2016.',
        limitations: 'Soil-structure resonance and site class amplification factor require measured 30m shear wave velocity (Vs30) or SPT N-values.'
      },
      {
        id: 'construction-envelope',
        stepNumber: '06',
        title: 'Project Development Feasibility & Structural Envelope',
        standard: 'TNCDBR 2019 & Terra Forge Cost Engine',
        category: 'Zoning & Construction Feasibility',
        icon: Building2,
        accentColor: 'var(--accent-sage-bright)',
        metric1: {
          label: 'Proposed Built-Up',
          val: `${currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft`
        },
        metric2: {
          label: 'Proposed Storeys',
          val: `${projectInputs.proposedFloors} Floors`
        },
        metric3: {
          label: 'FSI Ratio',
          val: `FSI ${projectInputs.fsiRatio}`
        },
        primaryFinding: `Project parameters assume ${projectInputs.projectCategory} with ${Number(projectInputs.plotAreaSqFt).toLocaleString()} sq.ft plot area yielding ${currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft built-up area across ${projectInputs.proposedFloors} floors.`,
        engineeringAction: 'All preliminary spatial metrics align with standard Chennai planning envelopes. Proceed to detailed itemized financial budgeting in the Cost Estimator and construction milestone sequencing in the Planner.',
        whyItMatters: 'Validating spatial feasibility against ground constraints early prevents costly redesigns and regulatory compliance delays during CMDA approval.',
        provenance: 'Tamil Nadu Combined Development and Building Rules (TNCDBR 2019) & Terra Forge Estimation Engine.',
        limitations: 'Statutory approvals require official CMDA planning permission, road width verification, and licensed architect/engineer certification.'
      }
    ];
  }, [loc, currentAssessment, projectInputs]);

  const activeAssessment = assessmentSteps[activeStep] || assessmentSteps[0];
  const StepIcon = activeAssessment.icon;

  // =========================================================================
  // ANIMATED OPENING RADAR CANVAS
  // Smooth zooming towards the selected coordinates with contour sweep
  // =========================================================================
  useEffect(() => {
    if (journeyMode !== 'opening') return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || 700;
        canvas.height = parent.clientHeight || 480;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.48;

      ctx.clearRect(0, 0, w, h);

      // 1. Subtle topographic perspective contour rings
      for (let r = 1; r <= 5; r++) {
        const radius = (r * 50 + (time * 12) % 50);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(224, 159, 80, ${Math.max(0, 0.25 - radius / 320)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 2. Rotating radar beam
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.6);
      const beamGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 220);
      beamGrad.addColorStop(0, 'rgba(224, 159, 80, 0.4)');
      beamGrad.addColorStop(0.5, 'rgba(224, 159, 80, 0.08)');
      beamGrad.addColorStop(1, 'rgba(224, 159, 80, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 220, 0, Math.PI * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. Central pulsing target beacon for the selected site
      const pulseSize = 8 + Math.sin(time * 3) * 3;
      ctx.fillStyle = 'var(--accent-amber)';
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(245, 240, 230, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize + 6, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Coordinates reticle crosshair
      ctx.strokeStyle = 'rgba(216, 204, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy);
      ctx.lineTo(cx + 35, cy);
      ctx.moveTo(cx, cy - 35);
      ctx.lineTo(cx, cy + 35);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [journeyMode, loc]);

  // Handle start journey
  const handleStartAssessment = () => {
    setJourneyMode('step');
    setActiveStep(0);
    scrollToActiveAssessment();
  };

  // Handle next assessment with smooth auto-scroll
  const handleNextStep = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (activeStep < assessmentSteps.length - 1) {
      setActiveStep((prev) => prev + 1);
      scrollToActiveAssessment();
    } else {
      setJourneyMode('summary');
      scrollToActiveAssessment();
    }

    setTimeout(() => setIsNavigating(false), 400);
  };

  // Handle previous assessment with smooth auto-scroll
  const handlePrevStep = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (journeyMode === 'summary') {
      setJourneyMode('step');
      setActiveStep(assessmentSteps.length - 1);
      scrollToActiveAssessment();
    } else if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      scrollToActiveAssessment();
    } else {
      setJourneyMode('opening');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setTimeout(() => setIsNavigating(false), 400);
  };

  // Jump to specific step
  const handleJumpToStep = (idx) => {
    if (isNavigating) return;
    setJourneyMode('step');
    setActiveStep(idx);
    scrollToActiveAssessment();
  };

  // Toggle recommendation detail in summary
  const toggleRec = (id) => {
    setExpandedRecs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save assessment
  const handleSave = () => {
    const title =
      saveTitle.trim() ||
      `${loc.name} — ${projectInputs.projectCategory.split('(')[0].trim()} (${projectInputs.plotAreaSqFt} sq.ft)`;
    onSaveAssessment(title);
    setSaveFeedback(`Saved assessment "${title}" to workspace.`);
    setSaveTitle('');
    setTimeout(() => setSaveFeedback(''), 4000);
  };

  return (
    <div>
      {/* SECTION EDITORIAL HEADER */}
      <div className="section-header">
        <div>
          <div className="editorial-kicker">
            INTERACTIVE SITE JOURNEY · DETERMINISTIC CIVIL ENGINEERING EVALUATION
          </div>
          <h1 className="section-title">
            {loc.name}{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              Guided Site Assessment
            </span>
          </h1>
          <p className="section-subtitle">
            Experience an intelligent step-by-step exploration of <strong>{loc.name} ({loc.id})</strong>. Layer-by-layer evaluation grounded in verified OpenStreetMap, SRTM elevation, CGWB hydrogeology, and Bureau of Indian Standards civil engineering codes.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={showAssumptionsPanel}
            onClick={() => setShowAssumptionsPanel((v) => !v)}
          >
            <Sliders size={15} />
            <span>{showAssumptionsPanel ? 'Close Assumptions' : 'Modify Assumptions'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('planner')}
          >
            <Hammer size={15} />
            <span>Planner</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('estimator')}
          >
            <Calculator size={15} />
            <span>Cost Estimator</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate('reports')}
          >
            <FileText size={15} />
            <span>Dossier Report</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          OPTIONAL PROJECT ASSUMPTIONS STUDIO DRAWER
          ===================================================================== */}
      {showAssumptionsPanel && (
        <div className="panel-card" style={{ marginBottom: '2rem' }}>
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">
                <Sliders size={17} style={{ color: 'var(--accent-amber)' }} />
                User-Configurable Project Parameters
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Changing any assumption instantly recalculates the engineering envelope and rules.
              </p>
            </div>
            <span className="status-pill regional">Live Engine Synchronization</span>
          </div>

          <form ref={formRef} onSubmit={(e) => e.preventDefault()} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.15rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="assess-loc-select">Target Location (167 Verified)</label>
                <select
                  id="assess-loc-select"
                  value={loc.id}
                  onChange={(e) => {
                    const found = locations.find((x) => x.id === e.target.value);
                    if (found) onSelectLocation(found);
                  }}
                >
                  {locations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id}) — {item.geographic_context.zone_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="assess-category">Building Occupancy Category</label>
                <select
                  id="assess-category"
                  value={projectInputs.projectCategory}
                  onChange={(e) => onUpdateProjectInputs({ ...projectInputs, projectCategory: e.target.value })}
                >
                  <option value="Residential Independent Villa (G+1 / G+2)">Residential Independent Villa (G+1 / G+2)</option>
                  <option value="Residential Multi-Family (Stilt + 4 Floors)">Residential Multi-Family (Stilt + 4 Floors)</option>
                  <option value="Mid-Rise Apartment / Mixed Use (Stilt + 8 Floors)">Mid-Rise Apartment / Mixed Use (Stilt + 8 Floors)</option>
                  <option value="Commercial / IT Office Building">Commercial / IT Office Building</option>
                  <option value="Institutional / Educational Facility">Institutional / Educational Facility</option>
                  <option value="Light Industrial / Logistics Warehouse">Light Industrial / Logistics Warehouse</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="assess-plot-sqft">Plot Area (sq.ft)</label>
                <input
                  type="number"
                  id="assess-plot-sqft"
                  min="300"
                  max="500000"
                  step="100"
                  value={projectInputs.plotAreaSqFt}
                  onChange={(e) => onUpdateProjectInputs({ ...projectInputs, plotAreaSqFt: Number(e.target.value) })}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="assess-fsi">Proposed FSI Ratio</label>
                <input
                  type="number"
                  id="assess-fsi"
                  min="0.5"
                  max="4.5"
                  step="0.1"
                  value={projectInputs.fsiRatio}
                  onChange={(e) => onUpdateProjectInputs({ ...projectInputs, fsiRatio: Number(e.target.value) })}
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          SCENE 1: OPENING SCENE — VISUALIZE THE SELECTED LOCATION
          ===================================================================== */}
      {journeyMode === 'opening' && (
        <div className="assessment-opening-stage" role="region" aria-label={`Opening visualization for ${loc.name}`}>
          {/* Animated Topographic Radar Canvas */}
          <canvas ref={radarCanvasRef} className="assessment-radar-canvas" />

          {/* Top Telemetry Header */}
          <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="assessment-telemetry-badge">
                <Compass size={13} />
                <span>COORDINATES ACQUIRED · {loc.coordinates.lat}°N, {loc.coordinates.lon}°E</span>
              </span>
              <span className="assessment-telemetry-badge" style={{ borderColor: 'var(--border-sage)', color: 'var(--accent-sage-bright)' }}>
                <span>OSM NODE #{loc.coordinates.osm_id}</span>
              </span>
            </div>

            <div className="assessment-telemetry-badge">
              <span>SRTM ELEVATION: {loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL</span>
            </div>
          </div>

          {/* Center Location Hero Card */}
          <div style={{ position: 'relative', zIndex: 5, maxWidth: '680px', margin: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TARGET SITE SELECTED FOR PRELIMINARY ASSESSMENT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Site:</span>
                <select
                  value={loc.id}
                  onChange={(e) => {
                    const found = locations.find((x) => x.id === e.target.value);
                    if (found) onSelectLocation(found);
                  }}
                  style={{
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-copper)',
                    color: 'var(--text-ivory)',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {locations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h2
              style={{
                margin: '0.4rem 0 0.6rem',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                fontWeight: 800,
                color: 'var(--text-ivory)',
                lineHeight: 1.15
              }}
            >
              {loc.name}
            </h2>
            <div style={{ fontSize: '0.96rem', color: 'var(--text-sandstone)', lineHeight: 1.6 }}>
              {loc.geographic_context.jurisdiction} · {loc.geographic_context.planning_corridor}
            </div>

            {/* Quick Stat Tags */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.85)', padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">COASTAL DISTANCE</span>
                <span className="monument-value amber" style={{ fontSize: '1.25rem' }}>{loc.geographic_context.coastal_distance_km} km</span>
              </div>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.85)', padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">TERRAIN ELEVATION</span>
                <span className="monument-value sage" style={{ fontSize: '1.25rem' }}>{loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL</span>
              </div>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.85)', padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">ESTIMATED BUILT-UP</span>
                <span className="monument-value" style={{ fontSize: '1.25rem' }}>{currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft</span>
              </div>
            </div>
          </div>

          {/* Action Row: Start Assessment Button */}
          <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              6 Step-by-Step Categories Configured · Bureau of Indian Standards Engine Ready
            </span>

            <button
              type="button"
              className="btn-primary"
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.96rem',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(224, 159, 80, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
              onClick={handleStartAssessment}
            >
              <span>START SITE ASSESSMENT</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCENE 2: GUIDED SEQUENTIAL ASSESSMENT STEPS (REVEALED 1-BY-1 WITH AUTO-SCROLL)
          ===================================================================== */}
      {journeyMode === 'step' && (
        <div ref={stepContainerRef}>
          {/* Active Step Progress Indicator Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.2rem',
              padding: '0.65rem 1.15rem',
              background: 'var(--bg-graphite)',
              border: '1px solid var(--border-copper)',
              borderRadius: 'var(--radius-sm)',
              flexWrap: 'wrap',
              gap: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                ASSESSMENT {activeStep + 1} OF {assessmentSteps.length}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-sandstone)' }}>{activeAssessment.category}</span>
            </div>

            {/* Step Pips */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {assessmentSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`assessment-step-pip ${idx === activeStep ? 'active' : ''} ${idx < activeStep ? 'passed' : ''}`}
                  onClick={() => handleJumpToStep(idx)}
                  title={`Jump to Assessment ${idx + 1}: ${step.title}`}
                />
              ))}
            </div>
          </div>

          {/* Active Assessment Step Card */}
          <div
            className="assessment-step-card"
            style={{ borderColor: activeAssessment.accentColor }}
            role="region"
            aria-label={`Assessment Step ${activeStep + 1}: ${activeAssessment.title}`}
          >
            {/* Step Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: `1.5px solid ${activeAssessment.accentColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeAssessment.accentColor,
                    flexShrink: 0
                  }}
                >
                  <StepIcon size={24} />
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: activeAssessment.accentColor, fontWeight: 700 }}>
                    STEP {activeAssessment.stepNumber} · {activeAssessment.standard}
                  </div>
                  <h2
                    style={{
                      margin: '0.25rem 0 0',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.65rem',
                      fontWeight: 800,
                      color: 'var(--text-ivory)',
                      lineHeight: 1.25
                    }}
                  >
                    {activeAssessment.title}
                  </h2>
                </div>
              </div>

              <span className="status-pill verified">Evaluated for {loc.name}</span>
            </div>

            {/* Key Data Measurements Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.75)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">{activeAssessment.metric1.label}</span>
                <span className="monument-value amber" style={{ fontSize: '1.35rem' }}>{activeAssessment.metric1.val}</span>
              </div>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.75)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">{activeAssessment.metric2.label}</span>
                <span className="monument-value sage" style={{ fontSize: '1.35rem' }}>{activeAssessment.metric2.val}</span>
              </div>
              <div className="monument-cell" style={{ background: 'rgba(15, 20, 17, 0.75)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="monument-label">{activeAssessment.metric3.label}</span>
                <span className="monument-value" style={{ fontSize: '1.35rem' }}>{activeAssessment.metric3.val}</span>
              </div>
            </div>

            {/* Primary Finding */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: activeAssessment.accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                PRIMARY FINDING
              </div>
              <p style={{ margin: 0, fontSize: '1.02rem', color: 'var(--text-ivory)', lineHeight: 1.65 }}>
                {activeAssessment.primaryFinding}
              </p>
            </div>

            {/* Mandatory Engineering Action */}
            <div className="tf-surface-cell accent-amber" style={{ padding: '1.15rem 1.35rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-ivory)', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent-sage-bright)' }} />
                <span>Recommended Engineering Action</span>
              </div>
              <div style={{ fontSize: '0.94rem', color: 'var(--text-sandstone)', lineHeight: 1.65 }}>
                {activeAssessment.engineeringAction}
              </div>
            </div>

            {/* Why It Matters */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                WHY THIS MATTERS FOR CONSTRUCTION
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-sandstone)', lineHeight: 1.6 }}>
                {activeAssessment.whyItMatters}
              </p>
            </div>

            {/* Data Provenance & Limitations Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1.25rem' }}>
              <div>
                <strong style={{ color: 'var(--text-ivory)' }}>Data Provenance:</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>{activeAssessment.provenance}</span>
              </div>
              <div>
                <strong style={{ color: '#f49b8c' }}>Limitation Notice:</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>{activeAssessment.limitations}</span>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="assessment-step-nav-bar">
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrevStep}
                disabled={isNavigating}
                aria-label="Previous assessment step"
              >
                <ChevronLeft size={16} />
                <span>{activeStep === 0 ? 'Location Overview' : 'Previous Assessment'}</span>
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setJourneyMode('summary');
                  scrollToActiveAssessment();
                }}
                style={{ fontSize: '0.82rem' }}
              >
                <span>Skip to All Results Summary</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleNextStep}
                disabled={isNavigating}
                aria-label={activeStep >= assessmentSteps.length - 1 ? 'Finish assessment and view complete results' : 'Next assessment step'}
              >
                <span>{activeStep >= assessmentSteps.length - 1 ? 'View Complete Assessment Summary' : 'Next Assessment'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCENE 3: FINAL ASSESSMENT SUMMARY & PERSISTENCE DOSSIER
          ===================================================================== */}
      {journeyMode === 'summary' && (
        <div ref={stepContainerRef}>
          {/* Top Finish Banner */}
          <div
            style={{
              padding: '1.5rem 1.85rem',
              background: 'linear-gradient(145deg, rgba(36, 71, 53, 0.4) 0%, rgba(15, 20, 17, 0.9) 100%)',
              border: '1.5px solid var(--accent-sage-bright)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-sage-bright)', fontWeight: 700, fontSize: '0.84rem' }}>
                <Check size={16} />
                <span>SITE ASSESSMENT JOURNEY COMPLETE · 6 CATEGORIES EVALUATED</span>
              </div>
              <h2 style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '1.65rem', color: 'var(--text-ivory)' }}>
                Comprehensive Assessment Summary — {loc.name}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setJourneyMode('step');
                  setActiveStep(0);
                  scrollToActiveAssessment();
                }}
              >
                <RotateCw size={14} />
                <span>Re-Explore Step-by-Step</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigate('reports')}
              >
                <FileText size={14} />
                <span>Open Dossier Report</span>
              </button>
            </div>
          </div>

          {/* Primary Calculated Engineering Envelope Monument Strip */}
          <div className="monument-strip" role="region" aria-label="Calculated Engineering Envelope">
            <div className="monument-cell">
              <span className="monument-label">Proposed Built-Up Area</span>
              <span className="monument-value sage">
                {currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft
              </span>
              <span className="monument-sub">
                {currentAssessment.calculatedMetrics.estimatedBuiltUpSqM} sq.m (Plot {currentAssessment.userInputs.plotAreaSqFt.toLocaleString()} sq.ft × FSI {currentAssessment.userInputs.fsiRatio})
              </span>
            </div>

            <div className="monument-cell">
              <span className="monument-label">IS 456 Concrete &amp; Cover</span>
              <span className="monument-value amber">
                {currentAssessment.calculatedMetrics.minConcreteGrade.split('(')[0].trim()} · {currentAssessment.calculatedMetrics.nominalCoverMm} mm
              </span>
              <span className="monument-sub">
                {loc.geographic_context.coastal_distance_km} km from Bay of Bengal shoreline
              </span>
            </div>

            <div className="monument-cell">
              <span className="monument-label">Recommended Plinth Offset</span>
              <span className="monument-value">
                +{currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m
              </span>
              <span className="monument-sub">
                Above road crown ({loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL SRTM)
              </span>
            </div>

            <div className="monument-cell">
              <span className="monument-label">IS 1892 Borehole Scope</span>
              <span className="monument-value">
                {currentAssessment.calculatedMetrics.recommendedBoreholes} BHs × {currentAssessment.calculatedMetrics.targetBoreholeDepthM} m
              </span>
              <span className="monument-sub">
                Mandatory rotary core drilling scope
              </span>
            </div>
          </div>

          {/* Detailed Engineering Findings Accordion */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--text-ivory)', marginBottom: '1rem' }}>
              Detailed Engineering Recommendations ({currentAssessment.recommendations.length})
            </h3>

            <div className="rec-list-stack">
              {currentAssessment.recommendations.map((rec, index) => {
                const isOpen = Boolean(expandedRecs[rec.id]);
                return (
                  <article key={rec.id} className={`rec-card ${isOpen ? 'is-expanded' : ''}`}>
                    <button
                      type="button"
                      className="rec-summary-trigger"
                      onClick={() => toggleRec(rec.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="rec-summary-body">
                        <div className="rec-meta-row">
                          <span className="rec-category-tag">
                            0{index + 1} · {rec.category}
                          </span>
                          <span className="status-pill verified">Verified BIS Rule</span>
                        </div>
                        <h4 className="rec-title-heading">{rec.title}</h4>
                        <p className="rec-concise-text">{rec.conciseSummary || rec.recommendationText}</p>
                      </div>

                      <span className="rec-expand-pill">
                        <span>{isOpen ? 'Close Details' : 'Inspect Evidence'}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="rec-details-drawer is-open">
                        <div className="rec-details-inner" style={{ padding: '1.25rem 1.75rem' }}>
                          <div style={{ marginBottom: '0.85rem' }}>
                            <strong style={{ color: 'var(--text-ivory)' }}>Recommended Action:</strong>{' '}
                            <span style={{ color: 'var(--text-sandstone)' }}>{rec.recommendationText}</span>
                          </div>
                          <div style={{ marginBottom: '0.85rem' }}>
                            <strong style={{ color: 'var(--accent-amber)' }}>Rule Basis:</strong>{' '}
                            <span style={{ color: 'var(--text-sandstone)' }}>{rec.reasoningExplanation} ({rec.sourceReference})</span>
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#f49b8c' }}>
                            <strong>Limitations:</strong> {rec.limitations}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          {/* Sourced Facts & Missing Data Checklist Drawers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="panel-card">
              <h3 className="panel-card-title" style={{ fontSize: '1.15rem' }}>
                <MapPin size={18} style={{ color: 'var(--accent-sage-bright)' }} />
                Sourced Facts vs. Regional Observations
              </h3>
              <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.85rem', color: 'var(--text-sandstone)' }}>
                <div><strong>Coordinates:</strong> {currentAssessment.sourcedFacts.coordinates}</div>
                <div><strong>Terrain Elevation:</strong> {currentAssessment.sourcedFacts.elevationMsl}</div>
                <div><strong>Coastal Distance:</strong> {currentAssessment.sourcedFacts.coastalDistanceKm}</div>
                <div><strong>Watershed Basin:</strong> {currentAssessment.regionalObservations.watershedBasin}</div>
                <div><strong>Regional Soil:</strong> {currentAssessment.regionalObservations.soilClassification}</div>
              </div>
            </div>

            <div className="panel-card">
              <h3 className="panel-card-title" style={{ fontSize: '1.15rem', color: '#f49b8c' }}>
                <ShieldAlert size={18} />
                Mandatory Pre-Construction Checklist
              </h3>
              <ul style={{ margin: '0.85rem 0 0', paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-sandstone)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {currentAssessment.missingDataDisclosures.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Save to Workspace Form */}
          <div className="panel-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="panel-card-title" style={{ fontSize: '1.1rem' }}>
                  <Bookmark size={16} style={{ color: 'var(--accent-amber)' }} />
                  Save Assessment to Persistent Workspace
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {saveFeedback ? (
                    <span style={{ color: 'var(--accent-sage-bright)', fontWeight: 600 }}>{saveFeedback}</span>
                  ) : (
                    `Save ${loc.name} configuration and civil engineering findings.`
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', flex: 1, maxWidth: '480px', justifyContent: 'flex-end' }}>
                <input
                  type="text"
                  placeholder="Optional custom title..."
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.52rem 0.85rem',
                    color: 'var(--text-ivory)',
                    fontSize: '0.85rem'
                  }}
                />
                <button type="button" className="btn-primary" onClick={handleSave}>
                  <Bookmark size={14} />
                  <span>Save Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
