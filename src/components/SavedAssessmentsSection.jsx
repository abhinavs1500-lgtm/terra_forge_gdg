import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Trash2,
  Edit3,
  Check,
  FolderOpen,
  MapPin,
  Scale,
  GitCompare,
  Download,
  ShieldAlert,
  Search
} from 'lucide-react';

export default function SavedAssessmentsSection({
  locations,
  savedWorkspace,
  onReopenAssessment,
  onRenameAssessment,
  onDeleteAssessment,
  onReopenComparison,
  onRenameComparison,
  onDeleteComparison,
  onToggleFavourite,
  onSelectLocation,
  onNavigate
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTab, setCategoryTab] = useState('all'); // 'all' | 'assessments' | 'comparisons' | 'favourites'

  const q = searchQuery.trim().toLowerCase();

  const filteredAssessments = useMemo(() => {
    return (savedWorkspace.assessments || []).filter(
      (item) =>
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.locationName?.toLowerCase().includes(q) ||
        item.locationId?.toLowerCase().includes(q)
    );
  }, [savedWorkspace.assessments, q]);

  const filteredComparisons = useMemo(() => {
    return (savedWorkspace.comparisons || []).filter(
      (comp) =>
        !q ||
        comp.title?.toLowerCase().includes(q) ||
        comp.locationIds?.some((id) => id.toLowerCase().includes(q))
    );
  }, [savedWorkspace.comparisons, q]);

  const favLocations = useMemo(() => {
    return (savedWorkspace.favourites || [])
      .map((id) => locations.find((l) => l.id === id))
      .filter(Boolean)
      .filter(
        (loc) =>
          !q ||
          loc.name.toLowerCase().includes(q) ||
          loc.id.toLowerCase().includes(q) ||
          loc.geographic_context?.jurisdiction?.toLowerCase().includes(q)
      );
  }, [savedWorkspace.favourites, locations, q]);

  const startEditing = (id, currentTitle) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const commitAssessmentRename = (id) => {
    if (editingTitle.trim()) {
      onRenameAssessment(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const commitComparisonRename = (id) => {
    if (editingTitle.trim()) {
      onRenameComparison(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportWorkspaceJson = () => {
    const blob = new Blob([JSON.stringify(savedWorkspace, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terra-forge-saved-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="eyebrow-badge">
            <Bookmark size={14} />
            <span>LOCAL & BACKEND WORKSPACE PERSISTENCE</span>
          </div>
          <h2 className="section-title">Saved Assessments, Comparisons & Favourites</h2>
          <p className="section-subtitle">
            Search, filter, reopen, rename, or delete saved site assessments, multi-location comparisons, and favourite Chennai locations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={handleExportWorkspaceJson}>
            <Download size={15} />
            Export Workspace JSON
          </button>
          <button type="button" className="btn-primary" onClick={() => onNavigate('assessment')}>
            <Scale size={15} />
            New Site Assessment
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div
        className="panel-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="search"
            placeholder="Search saved assessments, comparisons, or favourites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search saved workspace items"
            style={{
              width: '100%',
              padding: '0.62rem 0.9rem 0.62rem 2.4rem',
              background: 'var(--bg-obsidian)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-ivory)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            ['all', 'All Items'],
            ['assessments', `Assessments (${savedWorkspace.assessments.length})`],
            ['comparisons', `Comparisons (${savedWorkspace.comparisons.length})`],
            ['favourites', `Favourites (${savedWorkspace.favourites.length})`]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`btn-ghost ${categoryTab === key ? 'active' : ''}`}
              onClick={() => setCategoryTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SAVED SITE ASSESSMENTS */}
      {(categoryTab === 'all' || categoryTab === 'assessments') && (
        <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-card-header">
            <h3 className="panel-card-title">
              <Scale size={18} style={{ color: 'var(--accent-amber)' }} />
              Saved Site Assessments ({filteredAssessments.length})
            </h3>
            <span className="status-pill verified">Includes Project Inputs & Rules</span>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="tf-surface-cell" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                {q
                  ? `No saved assessments match "${searchQuery}".`
                  : 'No saved assessments yet. Configure project parameters in Site Assessment and click Save Assessment.'}
              </div>
              <button type="button" className="btn-secondary" onClick={() => onNavigate('assessment')}>
                <Scale size={15} />
                Open Site Assessment
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem' }}>
              {filteredAssessments.map((item) => (
                <div
                  key={item.id}
                  className="tf-surface-cell accent-amber"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          aria-label="Edit assessment title"
                          style={{
                            flex: 1,
                            background: 'var(--bg-obsidian)',
                            border: '1px solid var(--accent-amber)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.65rem',
                            color: 'var(--text-ivory)',
                            fontSize: '0.88rem'
                          }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => commitAssessmentRename(item.id)}
                        >
                          <Check size={14} />
                          Save
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                          {item.locationId} · Saved {new Date(item.savedAt).toLocaleString()}
                        </div>
                        <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                          {item.title}
                        </h4>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-sandstone)', fontFamily: 'var(--font-mono)' }}>
                    Plot: {item.userInputs?.plotAreaSqFt?.toLocaleString()} sq.ft · FSI: {item.userInputs?.fsiRatio} · Floors: {item.userInputs?.proposedFloors} · Budget: ₹{item.userInputs?.budgetLakhs}L
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => onReopenAssessment(item)}
                    >
                      <FolderOpen size={14} />
                      Reopen Assessment
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => startEditing(item.id, item.title)}
                    >
                      <Edit3 size={13} />
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#f49b8c' }}
                      onClick={() => onDeleteAssessment(item.id)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. SAVED COMPARISONS */}
      {(categoryTab === 'all' || categoryTab === 'comparisons') && (
        <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-card-header">
            <h3 className="panel-card-title">
              <GitCompare size={18} style={{ color: 'var(--accent-sage-bright)' }} />
              Saved Multi-Site Comparisons ({filteredComparisons.length})
            </h3>
            <span className="status-pill verified">Side-by-Side Records</span>
          </div>

          {filteredComparisons.length === 0 ? (
            <div className="tf-surface-cell" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                {q
                  ? `No saved comparisons match "${searchQuery}".`
                  : 'No saved comparisons yet. Open Compare Sites and click Save Comparison.'}
              </div>
              <button type="button" className="btn-secondary" onClick={() => onNavigate('compare')}>
                <GitCompare size={15} />
                Open Compare Sites
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem' }}>
              {filteredComparisons.map((comp) => (
                <div
                  key={comp.id}
                  className="tf-surface-cell accent-sage"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                >
                  {editingId === comp.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--bg-obsidian)',
                          border: '1px solid var(--accent-amber)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.65rem',
                          color: 'var(--text-ivory)',
                          fontSize: '0.88rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => commitComparisonRename(comp.id)}
                      >
                        <Check size={14} />
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-sage-bright)' }}>
                        {comp.locationIds.length} Locations · Saved {new Date(comp.savedAt).toLocaleString()}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.04rem', fontFamily: 'var(--font-display)' }}>
                        {comp.title}
                      </h4>
                    </>
                  )}

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    IDs: {comp.locationIds.join(', ')}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => onReopenComparison(comp)}
                    >
                      <FolderOpen size={14} />
                      Reopen Comparison
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => startEditing(comp.id, comp.title)}
                    >
                      <Edit3 size={13} />
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#f49b8c' }}
                      onClick={() => onDeleteComparison(comp.id)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. FAVOURITE CHENNAI LOCATIONS */}
      {(categoryTab === 'all' || categoryTab === 'favourites') && (
        <div className="panel-card">
          <div className="panel-card-header">
            <h3 className="panel-card-title">
              <MapPin size={18} style={{ color: 'var(--accent-copper)' }} />
              Saved Favourite Locations ({favLocations.length})
            </h3>
            <span className="status-pill regional">Local + Backend Synced</span>
          </div>

          {favLocations.length === 0 ? (
            <div className="tf-surface-cell" style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              No favourite locations match your filter. Click <strong>Save Favourite</strong> on any location in the GIS Map or Site Profile.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {favLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="tf-surface-cell accent-sage"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                      {loc.id} · {loc.geographic_context.zone_code}
                    </div>
                    <strong style={{ fontSize: '0.98rem' }}>{loc.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {loc.geographic_context.elevation_m_msl ?? 'N/A'} m MSL · {loc.geographic_context.coastal_distance_km} km coast
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() => {
                        onSelectLocation(loc);
                        onNavigate('profile');
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.4rem 0.55rem', color: '#f49b8c' }}
                      aria-label={`Remove ${loc.name} from favourites`}
                      onClick={() => onToggleFavourite(loc.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.9rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem'
            }}
          >
            <ShieldAlert size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <span>
              Saved items are persisted locally in browser storage (<code>localStorage</code>) and mirrored to <code>backend/saved_workspace.json</code>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
