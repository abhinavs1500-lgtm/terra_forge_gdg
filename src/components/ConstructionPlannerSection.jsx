import React, { useState } from 'react';
import {
  Hammer,
  Calculator,
  FileText,
  Compass,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ConstructionPlannerSection({
  locations,
  selectedLocation,
  onSelectLocation,
  projectInputs,
  onUpdateProjectInputs,
  currentAssessment,
  onNavigate
}) {
  const [showInputsDrawer, setShowInputsDrawer] = useState(false);

  const loc = selectedLocation || locations[0];
  if (!loc || !currentAssessment) return null;

  const phases = [
    {
      step: '01',
      phase: 'Phase 1 — Sub-Surface & Topographic Investigation Gate',
      status: 'Mandatory Gate',
      pillClass: 'missing',
      accentClass: 'accent-terracotta',
      summary: 'Physical borehole exploration and total station datum survey required before structural foundation sizing.',
      items: [
        {
          tag: 'Mandatory Investigation',
          text: `Execute ${currentAssessment.calculatedMetrics.recommendedBoreholes} rotary core boreholes down to ${currentAssessment.calculatedMetrics.targetBoreholeDepthM} m depth per BIS IS 1892:1979.`
        },
        {
          tag: 'Mandatory Investigation',
          text: 'Perform Standard Penetration Tests (SPT N-value) at 1.5 m intervals and laboratory triaxial shear, grain-size, and Atterberg limit tests to determine Safe Bearing Capacity (SBC in kN/m²).'
        },
        {
          tag: 'Verified Fact + Survey',
          text: `Conduct Total Station topographic survey tying plot corners to adjacent road crown and nearest GCC Storm Water Drain (SWD) invert (Macro SRTM elevation: ${loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL).`
        },
        {
          tag: 'Mandatory Investigation',
          text: 'Test groundwater chemical profile (pH, chlorides Cl⁻, sulfates SO₃ in mg/L per IS 456 Clause 8.2).'
        }
      ]
    },
    {
      step: '02',
      phase: 'Phase 2 — Statutory CMDA / GCC Planning & Buffer Verification',
      status: 'Statutory Requirement',
      pillClass: 'regional',
      accentClass: 'accent-amber',
      summary: 'Master plan zoning, road frontage width verification, and coastal or water-body NOC checks.',
      items: [
        {
          tag: 'Verified Fact',
          text: `Verify survey number land-use zoning under ${loc.geographic_context.jurisdiction} (${loc.geographic_context.planning_corridor}).`
        },
        {
          tag: 'User Assumption Check',
          text: `Confirm abutting road width on-site to validate assumed FSI of ${projectInputs.fsiRatio} (${currentAssessment.calculatedMetrics.estimatedBuiltUpSqFt.toLocaleString()} sq.ft proposed built-up area) under TNCDBR 2019.`
        },
        {
          tag: 'Verified Geodesic Rule',
          text:
            loc.geographic_context.coastal_distance_km <= 1.5
              ? `CRITICAL: Site is ${loc.geographic_context.coastal_distance_km} km from the Bay of Bengal shoreline — verify Coastal Regulation Zone (CRZ-II / CRZ-III) clearance and Aquifer Recharge Zone restrictions.`
              : `Verify minimum buffer distance from ${loc.environmental_and_flood.nearest_water_body ? loc.environmental_and_flood.nearest_water_body.name : 'local water courses'} per Revenue FMB and PWD/WRD NOC norms.`
        }
      ]
    },
    {
      step: '03',
      phase: 'Phase 3 — Sub-Structure, Plinth Offset & Dewatering Strategy',
      status: 'Subject to Borehole Logs',
      pillClass: 'regional',
      accentClass: 'accent-hydro',
      summary: 'Plinth elevation above road crown, seasonal excavation window, and buoyancy mitigation.',
      items: [
        {
          tag: 'Rule-Computed Plinth',
          text: `Target finished plinth elevation: +${currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m above adjacent road crown (${loc.environmental_and_flood.flood_hazard_category || 'Basin buffer rule'}).`
        },
        {
          tag: 'Regional Observation',
          text: `Seasonal groundwater depth is ${loc.ground_and_soil.groundwater_post_monsoon_m_bgl || 'unverified locally'} post-monsoon; schedule foundation excavation during pre-monsoon dry months (Feb–May) to minimize dewatering.`
        },
        {
          tag: 'User Assumption Option',
          text: projectInputs.includeBasement
            ? 'HYPOTHETICAL BASEMENT ALERT: Underground basement enabled — requires hydrostatic uplift (buoyancy) check, diaphragm/shoring wall evaluation, and crystalline + membrane tanking.'
            : 'Stilt / Podium parking configuration recommended over underground basements to mitigate northeast monsoon inundation risk.'
        },
        {
          tag: 'Engineering Constraint',
          text: `Foundation system (isolated/combined footings vs. mat raft vs. bored cast-in-situ piles) MUST NOT be selected until IS 1892 borehole logs confirm depth to competent strata across ${loc.ground_and_soil.geological_formation}.`
        }
      ]
    },
    {
      step: '04',
      phase: 'Phase 4 — Superstructure Materials & Seismic/Cyclonic Detailing',
      status: 'Evidence-Backed BIS Codes',
      pillClass: 'verified',
      accentClass: 'accent-sage',
      summary: 'Concrete durability grade, rebar corrosion protection, Seismic Zone III ductile detailing, and cyclonic wind load.',
      items: [
        {
          tag: 'IS 456 Durability Rule',
          text: `Concrete Durability (${currentAssessment.calculatedMetrics.exposureTier}): Minimum ${currentAssessment.calculatedMetrics.minConcreteGrade} with ${currentAssessment.calculatedMetrics.nominalCoverMm} mm clear cover.`
        },
        {
          tag: 'Material Specification',
          text: `Binder & Reinforcement: ${loc.construction_and_materials.cement_and_binder_guidance}; ${loc.construction_and_materials.reinforcement_specification}.`
        },
        {
          tag: 'IS 1893 / IS 875',
          text: 'Seismic & Wind Detailing: Seismic Zone III (Z = 0.16 per IS 1893:2016) with IS 13920:2016 ductile confinement and Cyclonic Basic Wind Speed Vb = 50 m/s (IS 875 Part 3).'
        }
      ]
    }
  ];

  return (
    <div>
      {/* Editorial Header */}
      <div className="section-header">
        <div>
          <div className="editorial-kicker">
            PHASED PRE-CONSTRUCTION WORKSPACE · INVESTIGATION GATES
          </div>
          <h1 className="section-title">
            {loc.name}{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              Construction Planner
            </span>
          </h1>
          <p className="section-subtitle">
            Translates verified site characteristics, regional hydrogeology, and user project assumptions into a 4-phase engineering execution sequence for <strong>{loc.name} ({loc.id})</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={showInputsDrawer}
            onClick={() => setShowInputsDrawer((v) => !v)}
          >
            <Sliders size={15} />
            <span>{showInputsDrawer ? 'Hide Assumptions' : 'Adjust Assumptions'}</span>
            {showInputsDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" className="btn-secondary" onClick={() => onNavigate('profile')}>
            <Compass size={15} />
            Site Monograph
          </button>
          <button type="button" className="btn-secondary" onClick={() => onNavigate('estimator')}>
            <Calculator size={15} />
            Cost Estimator
          </button>
          <button type="button" className="btn-primary" onClick={() => onNavigate('reports')}>
            <FileText size={15} />
            Export Plan in Report
          </button>
        </div>
      </div>

      {/* Open-Canvas Monument Strip */}
      <div className="monument-strip" role="region" aria-label="Construction Planning Summary">
        <div className="monument-cell">
          <span className="monument-label">Geological Unit</span>
          <span className="monument-value" style={{ fontSize: '1.18rem' }}>
            {loc.ground_and_soil.geological_formation.split('(')[0].trim()}
          </span>
          <span className="monument-sub">{loc.ground_and_soil.soil_classification ? loc.ground_and_soil.soil_classification.split('(')[0].trim() : 'Outer CMA Unmapped'}</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">IS 1892 Exploration Gate</span>
          <span className="monument-value amber">
            {currentAssessment.calculatedMetrics.recommendedBoreholes} BHs × {currentAssessment.calculatedMetrics.targetBoreholeDepthM} m
          </span>
          <span className="monument-sub">Mandatory pre-design drilling</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Target Plinth Offset</span>
          <span className="monument-value sage">
            +{currentAssessment.calculatedMetrics.recommendedPlinthMeters.toFixed(2)} m
          </span>
          <span className="monument-sub">{loc.environmental_and_flood.watershed_basin.split('(')[0].trim()}</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Durability Envelope</span>
          <span className="monument-value" style={{ fontSize: '1.25rem' }}>
            {currentAssessment.calculatedMetrics.minConcreteGrade.split('(')[0].trim()} · {currentAssessment.calculatedMetrics.nominalCoverMm} mm
          </span>
          <span className="monument-sub">{currentAssessment.calculatedMetrics.exposureTier}</span>
        </div>
      </div>

      {/* Collapsible Synchronized Project Assumption Bar */}
      <div
        className={`tf-disclosure-drawer ${showInputsDrawer ? 'is-open' : ''}`}
        hidden={!showInputsDrawer}
      >
        <div className="panel-card" style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.1rem' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan-loc">Selected Chennai Site</label>
              <select
                id="plan-loc"
                value={loc.id}
                onChange={(e) => {
                  const found = locations.find((x) => x.id === e.target.value);
                  if (found) onSelectLocation(found);
                }}
              >
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan-plot">Plot Area (sq.ft)</label>
              <input
                id="plan-plot"
                type="number"
                min="300"
                max="500000"
                step="100"
                value={projectInputs.plotAreaSqFt}
                onChange={(e) => onUpdateProjectInputs({ ...projectInputs, plotAreaSqFt: e.target.value })}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan-fsi">Assumed FSI Ratio</label>
              <input
                id="plan-fsi"
                type="number"
                min="0.5"
                max="4.5"
                step="0.1"
                value={projectInputs.fsiRatio}
                onChange={(e) => onUpdateProjectInputs({ ...projectInputs, fsiRatio: e.target.value })}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan-floors">Proposed Storeys</label>
              <input
                id="plan-floors"
                type="number"
                min="1"
                max="30"
                value={projectInputs.proposedFloors}
                onChange={(e) => onUpdateProjectInputs({ ...projectInputs, proposedFloors: e.target.value })}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan-budget">Budget Assumption (₹ Lakhs)</label>
              <input
                id="plan-budget"
                type="number"
                min="10"
                step="10"
                value={projectInputs.budgetLakhs}
                onChange={(e) => onUpdateProjectInputs({ ...projectInputs, budgetLakhs: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connected Vertical Architectural Timeline Spine */}
      <div className="planner-timeline" role="region" aria-label="4-Phase Pre-Construction Execution Spine">
        {phases.map((p) => (
          <section key={p.step} className="planner-phase-node" data-step={p.step}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.9rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '0 0 0.25rem', color: 'var(--text-ivory)' }}>
                  {p.phase}
                </h2>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  {p.summary}
                </p>
              </div>
              <span className={`status-pill ${p.pillClass}`}>{p.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {p.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`tf-surface-cell ${p.accentClass}`}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.95rem 1.25rem' }}
                >
                  <span
                    className="status-pill verified"
                    style={{ fontSize: '0.68rem', padding: '0.18rem 0.6rem', marginTop: '0.15rem', flexShrink: 0 }}
                  >
                    {item.tag}
                  </span>
                  <div style={{ fontSize: '0.94rem', color: 'var(--text-sandstone)', lineHeight: 1.62 }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
