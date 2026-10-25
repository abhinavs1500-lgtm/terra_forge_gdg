import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Map,
  FileSearch,
  Scale,
  GitCompare,
  Hammer,
  Calculator,
  Bookmark,
  FileText,
  Database,
  Search,
  Menu,
  X,
  Home,
  Palette,
  Tv
} from 'lucide-react';

import locationsData from './data/chennai_167_locations.json';
import gisLayersData from './data/gis_layers.json';
import sourcesMethodologyData from './data/sources_methodology.json';

import {
  DEFAULT_PROJECT_INPUTS,
  DEFAULT_COST_RATES,
  runSiteAssessment,
  calculateCostEstimate
} from './utils/assessmentEngine';

import LandingPage from './components/LandingPage';
import OverviewSection from './components/OverviewSection';
import ExploreMapSection from './components/ExploreMapSection';
import SiteIntelligenceSection from './components/SiteIntelligenceSection';
import SiteAssessmentSection from './components/SiteAssessmentSection';
import CompareSitesSection from './components/CompareSitesSection';
import ConstructionPlannerSection from './components/ConstructionPlannerSection';
import CostEstimatorSection from './components/CostEstimatorSection';
import SavedAssessmentsSection from './components/SavedAssessmentsSection';
import ReportsSection from './components/ReportsSection';
import DataSourcesSection from './components/DataSourcesSection';
import TerrashieldIntro from './components/TerrashieldIntro';
import ThemeStudioModal from './components/ThemeStudioModal';
import VoiceSearchButton from './components/VoiceSearchButton';
import FloatingChatbot from './components/FloatingChatbot';
import LandNewsTvSection from './components/LandNewsTvSection';

const STORAGE_KEY = 'terra_forge_chennai_workspace_v1';

function loadInitialWorkspace() {
  const defaultWorkspace = {
    favourites: ['TF-CHN-163', 'TF-CHN-002', 'TF-CHN-013'], // Velachery, Adyar, Anna Nagar defaults
    assessments: [],
    comparisons: []
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkspace;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultWorkspace;
    return {
      favourites: Array.isArray(parsed.favourites) ? parsed.favourites : defaultWorkspace.favourites,
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : []
    };
  } catch (err) {
    console.warn('Recovered from malformed localStorage workspace record:', err);
    return defaultWorkspace;
  }
}

export default function App() {
  const [showLanding, setShowLanding] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('landing') === '0') return false;
    if (params.get('landing') === '1') return true;
    return !params.has('section');
  });
  const [introActive, setIntroActive] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('intro') === '1') return true;
      if (params.get('intro') === '0') return false;
      return !sessionStorage.getItem('terrashield_intro_played');
    } catch (e) {
      return false;
    }
  });
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('section') || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedMapLayer, setFocusedMapLayer] = useState(null);

  // Default selected location: Velachery or Anna Nagar or first record
  const initialLoc = useMemo(() => {
    return (
      locationsData.find((l) => l.name.toLowerCase() === 'velachery') ||
      locationsData[0]
    );
  }, []);

  const [selectedLocation, setSelectedLocation] = useState(initialLoc);
  const [recentIds, setRecentIds] = useState(() => {
    const v = locationsData.find((l) => l.name.toLowerCase() === 'velachery')?.id;
    const a = locationsData.find((l) => l.name.toLowerCase() === 'anna nagar')?.id;
    const t = locationsData.find((l) => l.name.toLowerCase() === 'thiyagaraya nagar')?.id;
    const s = locationsData.find((l) => l.name.toLowerCase() === 'sholinganallur')?.id;
    return [v, a, t, s].filter(Boolean);
  });

  // Comparison state (at least 2 locations initialized)
  const [compareIds, setCompareIds] = useState(() => {
    const v = locationsData.find((l) => l.name.toLowerCase() === 'velachery')?.id || locationsData[0].id;
    const a = locationsData.find((l) => l.name.toLowerCase() === 'anna nagar')?.id || locationsData[1].id;
    const g = locationsData.find((l) => l.name.toLowerCase() === 'guindy')?.id || locationsData[2].id;
    return [v, a, g];
  });

  const [projectInputs, setProjectInputs] = useState(DEFAULT_PROJECT_INPUTS);
  const [costRates, setCostRates] = useState(DEFAULT_COST_RATES);
  const [savedWorkspace, setSavedWorkspace] = useState(loadInitialWorkspace);

  // Theme Studio state & persistence (10 coordinated themes)
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem('terraforge_theme') || 'obsidian';
    } catch (e) {
      return 'obsidian';
    }
  });
  const [previewTheme, setPreviewTheme] = useState(null);
  const [themeStudioOpen, setThemeStudioOpen] = useState(false);

  useEffect(() => {
    const t = previewTheme || activeTheme;
    document.documentElement.setAttribute('data-theme', t);
  }, [activeTheme, previewTheme]);

  const handlePreviewTheme = (themeId) => {
    setPreviewTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleApplyTheme = (themeId) => {
    setActiveTheme(themeId);
    setPreviewTheme(null);
    try {
      localStorage.setItem('terraforge_theme', themeId);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', themeId);
    setThemeStudioOpen(false);
  };

  const handleCancelPreview = () => {
    setPreviewTheme(null);
    document.documentElement.setAttribute('data-theme', activeTheme);
    setThemeStudioOpen(false);
  };

  const handleResetTheme = () => {
    setActiveTheme('obsidian');
    setPreviewTheme(null);
    try {
      localStorage.setItem('terraforge_theme', 'obsidian');
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', 'obsidian');
  };

  // Global topbar search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Persist workspace to localStorage and sync with backend middleware
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWorkspace));
      fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedWorkspace)
      }).catch(() => {});
    } catch (e) {
      console.warn('Persistence warning:', e);
    }
  }, [savedWorkspace]);

  // Dynamically calculate coverage statistics from the actual 167-location database
  const coverageStats = useMemo(() => {
    const totalTarget = 167;
    const registered = locationsData.length;
    const verifiedCoords = locationsData.filter((l) => l.coordinates?.verified).length;
    const withSoil = locationsData.filter((l) => Boolean(l.ground_and_soil?.soil_classification)).length;
    const withGw = locationsData.filter((l) => Boolean(l.ground_and_soil?.groundwater_pre_monsoon_m_bgl)).length;
    const withFlood = locationsData.filter((l) => Boolean(l.environmental_and_flood?.flood_hazard_category)).length;
    const withTransit = locationsData.filter(
      (l) =>
        (l.accessibility_and_connectivity?.nearest_transit_stations?.length || 0) > 0 ||
        (l.accessibility_and_connectivity?.arterial_roads?.length || 0) > 0
    ).length;
    const withSources = locationsData.filter((l) => (l.sources?.length || 0) > 0).length;
    const requiringFurtherCollection = locationsData.filter(
      (l) =>
        !l.ground_and_soil?.soil_classification ||
        !l.ground_and_soil?.groundwater_pre_monsoon_m_bgl ||
        !l.environmental_and_flood?.flood_hazard_category
    ).length;

    return {
      totalTarget,
      registered,
      verifiedCoords,
      withSoil,
      withGw,
      withFlood,
      withTransit,
      withSources,
      requiringFurtherCollection
    };
  }, []);

  // Select a location & track in recently viewed
  const handleSelectLocation = (loc) => {
    if (!loc) return;
    setSelectedLocation(loc);
    setRecentIds((prev) => [loc.id, ...prev.filter((id) => id !== loc.id)].slice(0, 8));
  };

  const recentLocations = useMemo(() => {
    return recentIds.map((id) => locationsData.find((l) => l.id === id)).filter(Boolean);
  }, [recentIds]);

  // Real-time assessment & cost calculation for selected location
  const currentAssessment = useMemo(() => {
    return runSiteAssessment(selectedLocation, projectInputs);
  }, [selectedLocation, projectInputs]);

  const currentCostEstimate = useMemo(() => {
    return calculateCostEstimate(currentAssessment, costRates);
  }, [currentAssessment, costRates]);

  // Compare toggle handlers
  const handleToggleCompare = (locId) => {
    setCompareIds((prev) => {
      if (prev.includes(locId)) {
        if (prev.length <= 2) return prev; // Keep at least 2 in comparison
        return prev.filter((id) => id !== locId);
      }
      if (prev.length >= 4) return [...prev.slice(1), locId];
      return [...prev, locId];
    });
  };

  const handleAddCompareId = (locId) => {
    if (!locId || compareIds.includes(locId)) return;
    setCompareIds((prev) => (prev.length >= 4 ? [...prev.slice(1), locId] : [...prev, locId]));
  };

  const handleRemoveCompareId = (locId) => {
    setCompareIds((prev) => (prev.length <= 2 ? prev : prev.filter((id) => id !== locId)));
  };

  // Favourite toggle handler
  const handleToggleFavourite = (locId) => {
    setSavedWorkspace((prev) => {
      const exists = prev.favourites.includes(locId);
      return {
        ...prev,
        favourites: exists
          ? prev.favourites.filter((id) => id !== locId)
          : [locId, ...prev.favourites]
      };
    });
  };

  // Save / Reopen / Rename / Delete Assessment
  const handleSaveAssessment = (title) => {
    if (!currentAssessment) return;
    const newRecord = {
      id: `ASSESS-${Date.now()}`,
      title,
      savedAt: new Date().toISOString(),
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      userInputs: currentAssessment.userInputs,
      calculatedMetrics: currentAssessment.calculatedMetrics
    };
    setSavedWorkspace((prev) => ({
      ...prev,
      assessments: [newRecord, ...prev.assessments]
    }));
  };

  const handleReopenAssessment = (savedItem) => {
    const loc = locationsData.find((l) => l.id === savedItem.locationId);
    if (loc) handleSelectLocation(loc);
    if (savedItem.userInputs) setProjectInputs(savedItem.userInputs);
    setActiveSection('assessment');
  };

  const handleRenameAssessment = (id, newTitle) => {
    setSavedWorkspace((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) => (a.id === id ? { ...a, title: newTitle } : a))
    }));
  };

  const handleDeleteAssessment = (id) => {
    setSavedWorkspace((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== id)
    }));
  };

  // Save / Reopen / Rename / Delete Comparison
  const handleSaveComparison = (title, locIds) => {
    const newComp = {
      id: `COMP-${Date.now()}`,
      title,
      savedAt: new Date().toISOString(),
      locationIds: [...locIds]
    };
    setSavedWorkspace((prev) => ({
      ...prev,
      comparisons: [newComp, ...prev.comparisons]
    }));
  };

  const handleReopenComparison = (comp) => {
    if (Array.isArray(comp.locationIds) && comp.locationIds.length >= 2) {
      setCompareIds(comp.locationIds);
      setActiveSection('compare');
    }
  };

  const handleRenameComparison = (id, newTitle) => {
    setSavedWorkspace((prev) => ({
      ...prev,
      comparisons: prev.comparisons.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    }));
  };

  const handleDeleteComparison = (id) => {
    setSavedWorkspace((prev) => ({
      ...prev,
      comparisons: prev.comparisons.filter((c) => c.id !== id)
    }));
  };

  // Global search suggestions
  const globalSuggestions = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return locationsData
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.geographic_context?.zone_code?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [globalSearch]);

  const navigateToSection = (sec, options = {}) => {
    if (options.mapLayer) {
      setFocusedMapLayer({ layer: options.mapLayer, ts: Date.now() });
    }
    setActiveSection(sec);
    setShowLanding(false);
    setMobileMenuOpen(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('section', sec);
      url.searchParams.delete('landing');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navGroups = [
    {
      label: 'Geospatial Core',
      items: [
        { id: 'overview', label: '1. Overview', icon: Compass, badge: '167' },
        { id: 'map', label: '2. Explore Map', icon: Map, badge: 'GIS' },
        { id: 'profile', label: '3. Site Intelligence', icon: FileSearch }
      ]
    },
    {
      label: 'Analysis & Planning',
      items: [
        { id: 'assessment', label: '4. Site Assessment', icon: Scale },
        { id: 'compare', label: '5. Compare Sites', icon: GitCompare, badge: String(compareIds.length) },
        { id: 'planner', label: '6. Construction Planner', icon: Hammer },
        { id: 'estimator', label: '7. Cost Estimator', icon: Calculator }
      ]
    },
    {
      label: 'Dossiers & Provenance',
      items: [
        {
          id: 'saved',
          label: '8. Saved Assessments',
          icon: Bookmark,
          badge: String(savedWorkspace.assessments.length + savedWorkspace.comparisons.length)
        },
        { id: 'reports', label: '9. Reports', icon: FileText },
        { id: 'sources', label: '10. Data Sources', icon: Database },
        { id: 'tv', label: '11. Land News TV', icon: Tv, badge: 'LIVE' }
      ]
    }
  ];

  return (
    <>
      {introActive && <TerrashieldIntro onComplete={() => setIntroActive(false)} />}

      {showLanding ? (
        <LandingPage
          locations={locationsData}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          gisLayersData={gisLayersData}
          coverageStats={coverageStats}
          onEnterApp={(targetSection) => {
            const sec = targetSection || 'overview';
            navigateToSection(sec);
          }}
        />
      ) : (
        <div className="app-shell topo-surface">
          {/* Left Navigation Sidebar */}
          <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Main Application Navigation">
        <div className="sidebar-header">
          <div className="brand-lockup" style={{ cursor: 'pointer' }} onClick={() => setShowLanding(true)}>
            <div className="brand-emblem">TF</div>
            <div>
              <div className="brand-title" style={{ fontSize: '1.02rem' }}>TERRA FORGE</div>
              <div className="brand-subtitle" style={{ fontSize: '0.66rem' }}>CHENNAI LAND INTELLIGENCE</div>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Currently Selected Location Context Pill */}
        {selectedLocation && (
          <div className="sidebar-active-loc">
            <div className="sidebar-active-loc-label">ACTIVE CHENNAI SITE</div>
            <div className="sidebar-active-loc-name">{selectedLocation.name}</div>
            <div className="sidebar-active-loc-meta">
              {selectedLocation.id} · {selectedLocation.geographic_context.zone_code} · {selectedLocation.geographic_context.elevation_m_msl ?? 'N/A'}m MSL
            </div>
          </div>
        )}

        {/* 10 Functional Navigation Sections */}
        {navGroups.map((grp) => (
          <div key={grp.label} className="nav-section-group">
            <div className="nav-group-label">{grp.label}</div>
            {grp.items.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => navigateToSection(item.id)}
                >
                  <span className="nav-item-left">
                    <IconComp size={16} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </button>
              );
            })}
          </div>
        ))}

        {/* Theme Studio Access Control */}
        <div style={{ padding: '0.65rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', padding: '0.5rem 0.65rem' }}
            onClick={() => setThemeStudioOpen(true)}
            title="Open Theme Studio (10 Coordinated Themes)"
          >
            <Palette size={16} style={{ color: 'var(--accent-amber)' }} />
            <span>Theme Studio</span>
            <span
              className="status-pill"
              style={{
                marginLeft: 'auto',
                fontSize: '0.68rem',
                padding: '1px 6px',
                textTransform: 'capitalize'
              }}
            >
              {activeTheme}
            </span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.6rem' }}
            onClick={() => {
              setShowLanding(true);
              try {
                const url = new URL(window.location.href);
                url.searchParams.set('landing', '1');
                url.searchParams.delete('section');
                window.history.replaceState({}, '', url.toString());
              } catch (e) {}
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Home size={14} />
            Return to Starting Page
          </button>
          <div>
            <strong>167 / 167 Verified Locations</strong><br />
            Zero Supplied CSVs Used · OSM + SRTM + CGWB + NCCR/GCC
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="app-content">
        {/* Sticky Topbar with Global 167-Location Search */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <button
              type="button"
              className="btn-ghost mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            <div className="topbar-search-wrap">
              <Search size={15} className="topbar-search-icon" />
              <input
                type="search"
                className="topbar-search-input"
                placeholder="Quick search any of the 167 Chennai locations (e.g. Velachery, Anna Nagar, Adyar, Ennore)..."
                value={globalSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setGlobalSearch(e.target.value)}
                aria-label="Global search 167 Chennai locations"
              />

              <VoiceSearchButton
                locations={locationsData}
                onNavigate={(targetSection) => {
                  navigateToSection(targetSection);
                }}
                onSelectLocation={(loc) => {
                  handleSelectLocation(loc);
                  setGlobalSearch('');
                  if (activeSection === 'overview' || activeSection === 'sources') {
                    setActiveSection('profile');
                  }
                }}
                onSetGlobalSearch={(text) => {
                  setGlobalSearch(text);
                  setSearchFocused(true);
                }}
                onSetSearchFocused={setSearchFocused}
                onOpenThemeStudio={() => setThemeStudioOpen(true)}
              />

              {searchFocused && globalSuggestions.length > 0 && (
                <div className="search-suggestions-popover" role="listbox">
                  {globalSuggestions.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      className="suggestion-row"
                      onMouseDown={() => {
                        handleSelectLocation(loc);
                        setGlobalSearch('');
                        if (activeSection === 'overview' || activeSection === 'sources') {
                          setActiveSection('profile');
                        }
                      }}
                    >
                      <div>
                        <strong>{loc.name}</strong>{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--accent-amber)' }}>
                          ({loc.id})
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {loc.geographic_context.jurisdiction}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--accent-sage-bright)' }}>
                        {loc.geographic_context.elevation_m_msl ?? 'N/A'}m MSL
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <span className="status-pill verified">
              Active: {selectedLocation?.name} ({selectedLocation?.id})
            </span>
            <button
              type="button"
              className="btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
              onClick={() => setThemeStudioOpen(true)}
              title="Open Theme Studio (10 Coordinated Themes)"
            >
              <Palette size={14} style={{ color: 'var(--accent-amber)' }} />
              <span>Theme</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--accent-amber)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'capitalize'
                }}
              >
                {activeTheme}
              </span>
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigateToSection('profile')}
            >
              Site Profile
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              onClick={() => navigateToSection('assessment')}
            >
              Assess Site
            </button>
          </div>
        </header>

        <main className={`workspace-container ${activeSection === 'map' ? 'map-bleed-mode' : ''}`}>
          {activeSection === 'overview' && (
            <OverviewSection
              locations={locationsData}
              coverageStats={coverageStats}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              gisLayersData={gisLayersData}
              currentAssessment={currentAssessment}
              onNavigate={navigateToSection}
              recentLocations={recentLocations}
              savedWorkspace={savedWorkspace}
              onToggleCompare={handleToggleCompare}
              compareIds={compareIds}
            />
          )}

          {activeSection === 'map' && (
            <ExploreMapSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              gisLayersData={gisLayersData}
              focusedMapLayer={focusedMapLayer}
              onNavigate={navigateToSection}
              onToggleCompare={handleToggleCompare}
              compareIds={compareIds}
              onToggleFavourite={handleToggleFavourite}
              favouriteIds={savedWorkspace.favourites}
            />
          )}

          {activeSection === 'profile' && (
            <SiteIntelligenceSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              gisLayersData={gisLayersData}
              onNavigate={navigateToSection}
              onToggleCompare={handleToggleCompare}
              compareIds={compareIds}
              onToggleFavourite={handleToggleFavourite}
              favouriteIds={savedWorkspace.favourites}
            />
          )}

          {activeSection === 'assessment' && (
            <SiteAssessmentSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              projectInputs={projectInputs}
              onUpdateProjectInputs={setProjectInputs}
              currentAssessment={currentAssessment}
              onSaveAssessment={handleSaveAssessment}
              onNavigate={navigateToSection}
            />
          )}

          {activeSection === 'compare' && (
            <CompareSitesSection
              locations={locationsData}
              compareIds={compareIds}
              onAddCompareId={handleAddCompareId}
              onRemoveCompareId={handleRemoveCompareId}
              onSaveComparison={handleSaveComparison}
              onSelectLocation={handleSelectLocation}
              onNavigate={navigateToSection}
            />
          )}

          {activeSection === 'planner' && (
            <ConstructionPlannerSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              projectInputs={projectInputs}
              onUpdateProjectInputs={setProjectInputs}
              currentAssessment={currentAssessment}
              onNavigate={navigateToSection}
            />
          )}

          {activeSection === 'estimator' && (
            <CostEstimatorSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              projectInputs={projectInputs}
              onUpdateProjectInputs={setProjectInputs}
              costRates={costRates}
              onUpdateCostRates={setCostRates}
              currentCostEstimate={currentCostEstimate}
              onNavigate={navigateToSection}
            />
          )}

          {activeSection === 'saved' && (
            <SavedAssessmentsSection
              locations={locationsData}
              savedWorkspace={savedWorkspace}
              onReopenAssessment={handleReopenAssessment}
              onRenameAssessment={handleRenameAssessment}
              onDeleteAssessment={handleDeleteAssessment}
              onReopenComparison={handleReopenComparison}
              onRenameComparison={handleRenameComparison}
              onDeleteComparison={handleDeleteComparison}
              onToggleFavourite={handleToggleFavourite}
              onSelectLocation={handleSelectLocation}
              onNavigate={navigateToSection}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsSection
              locations={locationsData}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              currentAssessment={currentAssessment}
              currentCostEstimate={currentCostEstimate}
              compareIds={compareIds}
              savedWorkspace={savedWorkspace}
            />
          )}

          {activeSection === 'sources' && (
            <DataSourcesSection
              sourcesMethodology={sourcesMethodologyData}
              coverageStats={coverageStats}
              gisLayersData={gisLayersData}
            />
          )}

          {activeSection === 'tv' && (
            <LandNewsTvSection onNavigate={navigateToSection} />
          )}
        </main>
      </div>
    </div>
    )}

    {/* Theme Studio Modal with Live Preview */}
    <ThemeStudioModal
      isOpen={themeStudioOpen}
      onClose={() => setThemeStudioOpen(false)}
      activeTheme={activeTheme}
      previewTheme={previewTheme}
      onPreviewTheme={handlePreviewTheme}
      onApplyTheme={handleApplyTheme}
      onCancelPreview={handleCancelPreview}
      onResetTheme={handleResetTheme}
    />

    {/* Persistent Floating AI Chatbot Across All Views */}
    <FloatingChatbot
      activeSection={showLanding ? 'landing' : activeSection}
      showLanding={showLanding}
      selectedLocation={selectedLocation}
      locations={locationsData}
      currentAssessment={currentAssessment}
      currentCostEstimate={currentCostEstimate}
      onNavigate={(targetSection) => {
        navigateToSection(targetSection);
      }}
      onSelectLocation={handleSelectLocation}
      onOpenThemeStudio={() => setThemeStudioOpen(true)}
    />
    </>
  );
}
