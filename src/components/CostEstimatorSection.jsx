import React, { useState } from 'react';
import {
  Calculator,
  RotateCcw,
  FileText,
  Scale,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';
import { DEFAULT_COST_RATES } from '../utils/assessmentEngine';

export default function CostEstimatorSection({
  locations,
  selectedLocation,
  onSelectLocation,
  projectInputs,
  onUpdateProjectInputs,
  costRates,
  onUpdateCostRates,
  currentCostEstimate,
  onNavigate
}) {
  const [showExclusionsDrawer, setShowExclusionsDrawer] = useState(true);
  const [costFilter, setCostFilter] = useState('ALL');
  const [costSort, setCostSort] = useState({ key: 'default', dir: 'asc' });
  const [expandedCostIds, setExpandedCostIds] = useState({
    'COST-COASTAL-DURABILITY': true
  });

  const loc = selectedLocation || locations[0];
  if (!loc || !currentCostEstimate) return null;

  const toggleCostExpand = (id) => {
    setExpandedCostIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCostSort = (key) => {
    setCostSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredAndSortedItems = React.useMemo(() => {
    const list = currentCostEstimate.lineItems.filter((item) => {
      if (costFilter === 'DIRECT') return item.origin.includes('User-Editable');
      if (costFilter === 'ALLOWANCE') return !item.origin.includes('User-Editable');
      return true;
    });
    if (costSort.key === 'amount') {
      list.sort((a, b) =>
        costSort.dir === 'asc' ? a.amountInr - b.amountInr : b.amountInr - a.amountInr
      );
    } else if (costSort.key === 'label') {
      list.sort((a, b) =>
        costSort.dir === 'asc'
          ? a.label.localeCompare(b.label)
          : b.label.localeCompare(a.label)
      );
    }
    return list;
  }, [currentCostEstimate.lineItems, costFilter, costSort]);

  const formatInr = (num) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);

  const totalInr = Math.max(1, currentCostEstimate.totalEstimatedInr);
  const barColors = ['#84c7a3', '#5d9678', '#4fa8c2', '#e09f50', '#c87a48', '#d95d48', '#9e9483'];

  return (
    <div>
      {/* Editorial Header */}
      <div className="section-header">
        <div>
          <div className="editorial-kicker">
            TRANSPARENT QUANTITY & RATE LEDGER · ORDER-OF-MAGNITUDE ESTIMATE
          </div>
          <h1 className="section-title">
            {loc.name}{' '}
            <span className="editorial-serif" style={{ fontWeight: 400 }}>
              Cost Estimator
            </span>
          </h1>
          <p className="section-subtitle">
            Combines user-editable unit rate assumptions with deterministic site-condition allowances for <strong>{loc.name} ({loc.id})</strong> (IS 456 coastal exposure, soil/groundwater sub-structure allowance, plinth offset, and IS 1892 borehole scope).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onUpdateCostRates(DEFAULT_COST_RATES)}
          >
            <RotateCcw size={14} />
            Reset Default Rates
          </button>
          <button type="button" className="btn-secondary" onClick={() => onNavigate('assessment')}>
            <Scale size={15} />
            Site Assessment
          </button>
          <button type="button" className="btn-primary" onClick={() => onNavigate('reports')}>
            <FileText size={15} />
            Include in Report
          </button>
        </div>
      </div>

      {/* Open-Canvas Monument Strip */}
      <div className="monument-strip" role="region" aria-label="Preliminary Cost Summary">
        <div className="monument-cell">
          <span className="monument-label">Calculated Built-Up Area</span>
          <span className="monument-value sage">
            {currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft
          </span>
          <span className="monument-sub">
            {currentCostEstimate.builtUpSqM} sq.m ({projectInputs.plotAreaSqFt} sq.ft × FSI {projectInputs.fsiRatio})
          </span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Subtotal (Excl. Contingency)</span>
          <span className="monument-value">
            ₹{(currentCostEstimate.subtotalBeforeContingency / 100000).toFixed(2)} L
          </span>
          <span className="monument-sub">{formatInr(currentCostEstimate.subtotalBeforeContingency)}</span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Estimated Grand Total</span>
          <span className="monument-value amber">
            ₹{currentCostEstimate.totalEstimatedLakhs} Lakhs
          </span>
          <span className="monument-sub">
            {formatInr(currentCostEstimate.totalEstimatedInr)} (₹{currentCostEstimate.EffectiveRatePerSqFt}/sq.ft)
          </span>
        </div>

        <div className="monument-cell">
          <span className="monument-label">Target Budget Variance</span>
          <span
            className="monument-value"
            style={{ color: currentCostEstimate.withinBudget ? 'var(--accent-sage-bright)' : '#f49b8c' }}
          >
            {currentCostEstimate.withinBudget
              ? `+₹${currentCostEstimate.budgetDeltaLakhs} L Buffer`
              : `-₹${Math.abs(currentCostEstimate.budgetDeltaLakhs).toFixed(2)} L Over`}
          </span>
          <span className="monument-sub">Target Budget: ₹{currentCostEstimate.userBudgetLakhs} Lakhs</span>
        </div>
      </div>

      {/* ====================================================================
          ASYMMETRIC SPLIT WORKSPACE: LEFT CONTROL CONSOLE + RIGHT FINANCIAL SHEET
          ==================================================================== */}
      <div className="estimator-split-layout">
        {/* LEFT COLUMN: UNIT RATE & QUANTITY CONTROL CONSOLE */}
        <aside className="panel-card" aria-label="Unit Rate and Quantity Inputs">
          <div className="panel-card-header">
            <h2 className="panel-card-title">
              <Sliders size={17} style={{ color: 'var(--accent-amber)' }} />
              Rate & Quantity Assumptions
            </h2>
            <span className="status-pill regional">Editable Inputs</span>
          </div>

          <div className="field">
            <label htmlFor="cost-loc-select">Selected Chennai Location</label>
            <span id="cost-loc-hint" className="hint">
              Coast: {loc.geographic_context.coastal_distance_km} km · Updates site allowances
            </span>
            <select
              id="cost-loc-select"
              aria-describedby="cost-loc-hint"
              value={loc.id}
              onChange={(e) => {
                const found = locations.find((x) => x.id === e.target.value);
                if (found) onSelectLocation(found);
              }}
            >
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.id}) — {item.geographic_context.coastal_distance_km} km coast
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="field">
              <label htmlFor="cost-plot">Plot Area (sq.ft)</label>
              <span className="hint">1 sq.m = 10.7639 sq.ft</span>
              <input
                id="cost-plot"
                type="number"
                min="300"
                step="100"
                value={projectInputs.plotAreaSqFt}
                onChange={(e) =>
                  onUpdateProjectInputs({ ...projectInputs, plotAreaSqFt: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="cost-fsi">FSI Ratio</label>
              <span className="hint">Built-up = Plot × FSI</span>
              <input
                id="cost-fsi"
                type="number"
                min="0.5"
                max="4.5"
                step="0.1"
                value={projectInputs.fsiRatio}
                onChange={(e) =>
                  onUpdateProjectInputs({ ...projectInputs, fsiRatio: e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
              BASE UNIT RATES (₹ INR)
            </div>

            <div className="field">
              <label htmlFor="rate-shell">Structural RCC Shell (₹/sq.ft)</label>
              <span id="hint-shell" className="hint">Illustrative base: ₹1,400 – ₹2,100</span>
              <input
                id="rate-shell"
                type="number"
                min="500"
                max="10000"
                step="50"
                value={costRates.baseStructuralShellPerSqFt}
                onChange={(e) =>
                  onUpdateCostRates({ ...costRates, baseStructuralShellPerSqFt: e.target.value })
                }
                aria-describedby="hint-shell"
              />
            </div>

            <div className="field">
              <label htmlFor="rate-finish">Architectural Finishes (₹/sq.ft)</label>
              <span id="hint-finish" className="hint">Illustrative base: ₹700 – ₹1,500</span>
              <input
                id="rate-finish"
                type="number"
                min="200"
                max="10000"
                step="50"
                value={costRates.architecturalFinishingPerSqFt}
                onChange={(e) =>
                  onUpdateCostRates({ ...costRates, architecturalFinishingPerSqFt: e.target.value })
                }
                aria-describedby="hint-finish"
              />
            </div>

            <div className="field">
              <label htmlFor="rate-mep">MEP & RWH Services (₹/sq.ft)</label>
              <span id="hint-mep" className="hint">Illustrative base: ₹280 – ₹600</span>
              <input
                id="rate-mep"
                type="number"
                min="100"
                max="5000"
                step="20"
                value={costRates.mepAndServicesPerSqFt}
                onChange={(e) =>
                  onUpdateCostRates({ ...costRates, mepAndServicesPerSqFt: e.target.value })
                }
                aria-describedby="hint-mep"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="rate-bh">IS 1892 Borehole (₹)</label>
                <span id="hint-bh" className="hint">Per borehole</span>
                <input
                  id="rate-bh"
                  type="number"
                  min="5000"
                  max="200000"
                  step="2000"
                  value={costRates.geotechInvestigationPerBorehole}
                  onChange={(e) =>
                    onUpdateCostRates({ ...costRates, geotechInvestigationPerBorehole: e.target.value })
                  }
                  aria-describedby="hint-bh"
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="rate-contingency">Contingency (%)</label>
                <span id="hint-cont" className="hint">Range: 5% – 15%</span>
                <input
                  id="rate-contingency"
                  type="number"
                  min="0"
                  max="35"
                  step="1"
                  value={costRates.contingencyPct}
                  onChange={(e) => onUpdateCostRates({ ...costRates, contingencyPct: e.target.value })}
                  aria-describedby="hint-cont"
                />
              </div>
            </div>

            <label
              htmlFor="cost-basement"
              className="tf-surface-cell accent-amber"
              style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '1.1rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                id="cost-basement"
                checked={Boolean(projectInputs.includeBasement)}
                onChange={(e) =>
                  onUpdateProjectInputs({ ...projectInputs, includeBasement: e.target.checked })
                }
                style={{ width: '17px', height: '17px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.84rem' }}>
                <strong>Include Basement Excavation</strong> (+8.5% Sub-Structure Allowance)
              </span>
            </label>
          </div>
        </aside>

        {/* RIGHT COLUMN: PROPORTIONAL COST BAR, ITEMIZED LEDGER TABLE & EXCLUSIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Visual Cost Allocation Bar */}
          <div className="panel-card">
            <div className="panel-card-header" style={{ marginBottom: '0.9rem', paddingBottom: '0.65rem' }}>
              <h2 className="panel-card-title">Proportional Cost Composition</h2>
              <span className="status-pill verified">Live Calculation</span>
            </div>

            <div
              style={{
                display: 'flex',
                height: '14px',
                borderRadius: '999px',
                overflow: 'hidden',
                background: 'var(--bg-obsidian)',
                marginBottom: '0.95rem'
              }}
              role="img"
              aria-label="Proportional cost breakdown bar"
            >
              {currentCostEstimate.lineItems.map((item, idx) => {
                const pct = Math.max(0.5, (item.amountInr / totalInr) * 100);
                return (
                  <div
                    key={item.id}
                    style={{
                      width: `${pct}%`,
                      background: barColors[idx % barColors.length],
                      transition: 'width 0.35s ease'
                    }}
                    title={`${item.label}: ${formatInr(item.amountInr)}`}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-sandstone)' }}>
              {currentCostEstimate.lineItems.map((item, idx) => (
                <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: barColors[idx % barColors.length]
                    }}
                  />
                  <span>{item.label.split('(')[0].trim()}:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-ivory)' }}>
                    ₹{(item.amountInr / 100000).toFixed(1)}L
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Calculation Breakdown Table (Interactive, Sortable & Expandable) */}
          <div className="panel-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  ['ALL', `All Line Items (${currentCostEstimate.lineItems.length})`],
                  ['DIRECT', 'Base Direct Works'],
                  ['ALLOWANCE', 'Site-Condition Allowances']
                ].map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    className={`btn-ghost ${costFilter === k ? 'active' : ''}`}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                    onClick={() => setCostFilter(k)}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {(costFilter !== 'ALL' || costSort.key !== 'default') && (
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', color: 'var(--accent-amber)' }}
                  onClick={() => {
                    setCostFilter('ALL');
                    setCostSort({ key: 'default', dir: 'asc' });
                  }}
                >
                  <RotateCcw size={13} />
                  Reset Table View
                </button>
              )}
            </div>

            <div tabIndex={0} role="region" aria-labelledby="cost-table-caption" className="table-wrapper">
              <table
                className="tf-table"
                style={{
                  '--label-2': '"Data Origin"',
                  '--label-3': '"Quantity"',
                  '--label-4': '"Unit Rate"',
                  '--label-5': '"Share & Amount (INR)"'
                }}
              >
                <caption id="cost-table-caption">
                  Preliminary Cost Estimate for {loc.name} ({currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft / {currentCostEstimate.builtUpSqM} sq.m built-up area) — Click column headers to sort or expand any row to inspect its formula
                </caption>
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className={`tf-sort-btn ${costSort.key === 'label' ? 'is-sorted' : ''}`}
                        onClick={() => handleCostSort('label')}
                      >
                        <span>Cost Component</span>
                        <span>{costSort.key === 'label' ? (costSort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>Basis / Provenance</th>
                    <th className="tf-numeric-cell">Quantity</th>
                    <th className="tf-numeric-cell">Unit Rate</th>
                    <th className="tf-numeric-cell">
                      <button
                        type="button"
                        className={`tf-sort-btn ${costSort.key === 'amount' ? 'is-sorted' : ''}`}
                        style={{ justifyContent: 'flex-end', width: '100%' }}
                        onClick={() => handleCostSort('amount')}
                      >
                        <span>Amount (₹ INR / Lakhs)</span>
                        <span>{costSort.key === 'amount' ? (costSort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedItems.map((item) => {
                    const isExpanded = Boolean(expandedCostIds[item.id]);
                    const sharePct = ((item.amountInr / totalInr) * 100).toFixed(1);
                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <th>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span>{item.label}</span>
                              <button
                                type="button"
                                className="btn-ghost"
                                style={{ padding: '0.18rem 0.45rem', fontSize: '0.7rem', flexShrink: 0 }}
                                aria-expanded={isExpanded}
                                onClick={() => toggleCostExpand(item.id)}
                                title="Inspect calculation formula and site-condition trigger"
                              >
                                {isExpanded ? 'Formula ▲' : 'Formula ▼'}
                              </button>
                            </div>
                          </th>
                          <td>
                            <span
                              className={`status-pill ${
                                item.origin.includes('User-Editable') ? 'regional' : 'verified'
                              }`}
                            >
                              {item.origin}
                            </span>
                          </td>
                          <td className="tf-numeric-cell">{item.quantity}</td>
                          <td className="tf-numeric-cell">{item.unitRate}</td>
                          <td className="tf-numeric-cell" style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                            <div>
                              {formatInr(item.amountInr)}{' '}
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                (₹{(item.amountInr / 100000).toFixed(2)} L)
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
                              {sharePct}% of estimated total
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="tf-expanded-detail-row">
                            <td colSpan={5}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.83rem' }}>
                                <div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                                    FORMULA &amp; DERIVATION:{' '}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-ivory)' }}>
                                    {item.quantity} × {item.unitRate} = {formatInr(item.amountInr)}
                                  </span>
                                </div>
                                <div style={{ color: 'var(--text-sandstone)' }}>
                                  <strong>Site Context ({loc.name}):</strong> Coast {loc.geographic_context.coastal_distance_km} km · Elev {loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL · Soil: {loc.ground_and_soil.soil_classification ? loc.ground_and_soil.soil_classification.split('(')[0].trim() : 'Outer CMA'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <tr>
                    <th>Subtotal (Before Contingency)</th>
                    <td>
                      <span className="status-pill verified">Calculated Sum</span>
                    </td>
                    <td className="tf-numeric-cell">{currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft</td>
                    <td className="tf-numeric-cell">—</td>
                    <td className="tf-numeric-cell" style={{ fontWeight: 700, color: 'var(--accent-sage-bright)' }}>
                      {formatInr(currentCostEstimate.subtotalBeforeContingency)} (₹{(currentCostEstimate.subtotalBeforeContingency / 100000).toFixed(2)} L)
                    </td>
                  </tr>
                  <tr>
                    <th>Design &amp; Escalation Contingency ({currentCostEstimate.ratesUsed.contingencyPct}%)</th>
                    <td>
                      <span className="status-pill regional">User Assumption</span>
                    </td>
                    <td className="tf-numeric-cell">{currentCostEstimate.ratesUsed.contingencyPct}% of Subtotal</td>
                    <td className="tf-numeric-cell">Percentage</td>
                    <td className="tf-numeric-cell" style={{ fontWeight: 600 }}>
                      {formatInr(currentCostEstimate.contingencyCost)} (₹{(currentCostEstimate.contingencyCost / 100000).toFixed(2)} L)
                    </td>
                  </tr>
                  <tr className="tf-selected-row">
                    <th style={{ color: 'var(--accent-amber)', fontSize: '0.96rem' }}>
                      ESTIMATED PRELIMINARY TOTAL
                    </th>
                    <td>
                      <span className="status-pill verified">Grand Total</span>
                    </td>
                    <td className="tf-numeric-cell">
                      {currentCostEstimate.builtUpSqFt.toLocaleString()} sq.ft ({currentCostEstimate.builtUpSqM} sq.m)
                    </td>
                    <td className="tf-numeric-cell">
                      ₹{currentCostEstimate.EffectiveRatePerSqFt.toLocaleString()} / sq.ft eff.
                    </td>
                    <td className="tf-numeric-cell" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-amber)' }}>
                      {formatInr(currentCostEstimate.totalEstimatedInr)} (₹{currentCostEstimate.totalEstimatedLakhs} Lakhs)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Explicit Exclusions & Methodology Disclosure Drawer */}
          <div className="panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h3 className="panel-card-title">
                <AlertTriangle size={18} style={{ color: '#f49b8c' }} />
                Explicit Cost Exclusions & Estimation Limitations
              </h3>
              <button
                type="button"
                className="btn-ghost"
                aria-expanded={showExclusionsDrawer}
                onClick={() => setShowExclusionsDrawer((v) => !v)}
              >
                <span>{showExclusionsDrawer ? 'Hide Exclusions' : 'Show Exclusions'}</span>
                {showExclusionsDrawer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            <div
              className={`tf-disclosure-drawer ${showExclusionsDrawer ? 'is-open' : ''}`}
              hidden={!showExclusionsDrawer}
            >
              <div style={{ paddingTop: '1.15rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="tf-surface-cell accent-terracotta">
                  <div style={{ marginBottom: '0.65rem', fontSize: '0.88rem', color: 'var(--text-sandstone)' }}>
                    <strong>Transparency Note:</strong> Terra Forge does NOT invent live Chennai contractor quotes or material market feeds. All base ₹/sq.ft unit rates are user-editable planning assumptions. The following items are explicitly excluded from the preliminary civil construction sum above:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-sandstone)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.45rem' }}>
                    {currentCostEstimate.exclusions.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
