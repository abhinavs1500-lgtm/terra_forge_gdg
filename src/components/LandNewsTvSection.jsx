import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Tv,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Calendar,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  RotateCw,
  Play,
  Pause,
  X,
  Scale,
  MapPin,
  CheckCircle2,
  Sparkles,
  Info,
  Radio,
  BookOpen
} from 'lucide-react';

import bundledNewsData from '../data/land_legal_news.json';

const CATEGORIES = [
  'All Updates',
  'Tamil Nadu',
  'Land Records',
  'Legal & Court Updates',
  'Registration & Stamp Duty',
  'Planning & Zoning',
  'Real Estate & RERA',
  'National Policy'
];

export default function LandNewsTvSection({ onNavigate }) {
  const [newsStories, setNewsStories] = useState(bundledNewsData);
  const [selectedCategory, setSelectedCategory] = useState('All Updates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fullStoryModalOpen, setFullStoryModalOpen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date().toISOString());
  const [serverStatus, setServerStatus] = useState('OPERATIONAL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const autoPlayTimerRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const tvScreenRef = useRef(null);

  // Fetch news from /api/news with fallback to bundled news
  const fetchNews = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stories) && data.stories.length > 0) {
          setNewsStories(data.stories);
          setLastRefreshedAt(data.lastRefreshedAt || new Date().toISOString());
          setServerStatus(data.serverStatus || 'OPERATIONAL');
        }
      }
    } catch (e) {
      console.warn('Using bundled Land News dataset:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Filter stories by category and search term
  const filteredStories = useMemo(() => {
    return newsStories.filter((story) => {
      // Category match
      let matchCat = true;
      if (selectedCategory !== 'All Updates') {
        if (selectedCategory === 'Tamil Nadu') {
          matchCat =
            story.jurisdiction.includes('Tamil Nadu') ||
            story.jurisdiction.includes('Chennai');
        } else {
          matchCat =
            story.category.toLowerCase() === selectedCategory.toLowerCase() ||
            story.jurisdiction.toLowerCase().includes(selectedCategory.toLowerCase());
        }
      }

      // Search match
      let matchSearch = true;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        matchSearch =
          story.headline.toLowerCase().includes(q) ||
          story.shortSummary.toLowerCase().includes(q) ||
          story.sourceName.toLowerCase().includes(q) ||
          story.category.toLowerCase().includes(q) ||
          story.jurisdiction.toLowerCase().includes(q) ||
          story.officialReference.toLowerCase().includes(q);
      }

      return matchCat && matchSearch;
    });
  }, [newsStories, selectedCategory, searchQuery]);

  // Ensure selectedIndex is always valid
  useEffect(() => {
    if (selectedIndex >= filteredStories.length) {
      setSelectedIndex(0);
    }
  }, [filteredStories.length, selectedIndex]);

  const activeStory = filteredStories[selectedIndex] || filteredStories[0] || null;

  // Reset image loading and error states when active story changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [activeStory?.id]);

  // Safe navigation with smooth television transition
  const goToStory = useCallback(
    (newIndex) => {
      if (filteredStories.length === 0 || isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        let target = newIndex;
        if (target < 0) target = filteredStories.length - 1;
        if (target >= filteredStories.length) target = 0;
        setSelectedIndex(target);
        setIsTransitioning(false);
      }, 180);
    },
    [filteredStories.length, isTransitioning]
  );

  const handleNext = useCallback(() => {
    goToStory(selectedIndex + 1);
  }, [goToStory, selectedIndex]);

  const handlePrev = useCallback(() => {
    goToStory(selectedIndex - 1);
  }, [goToStory, selectedIndex]);

  // Auto-play timer (paused when user interacts or hover)
  useEffect(() => {
    if (isAutoPlay && filteredStories.length > 1 && !fullStoryModalOpen) {
      autoPlayTimerRef.current = setInterval(() => {
        handleNext();
      }, 10000);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, filteredStories.length, fullStoryModalOpen, handleNext]);

  // Keyboard navigation: Left/Right arrows on TV or Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fullStoryModalOpen) {
        if (e.key === 'Escape') setFullStoryModalOpen(false);
        return;
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, fullStoryModalOpen]);

  // Scroll active card into view in the carousel
  useEffect(() => {
    if (!carouselTrackRef.current) return;
    const cards = carouselTrackRef.current.children;
    if (cards && cards[selectedIndex]) {
      cards[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedIndex]);

  // Formatted date helper
  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Render cinematic SVG news art tailored to category/imageType
  const renderStoryArtwork = (story) => {
    if (!story) return null;
    const type = story.imageType || 'default';

    return (
      <div className="tv-artwork-canvas" aria-hidden="true">
        <svg viewBox="0 0 600 380" className="tv-artwork-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="tvArtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#17221c" />
              <stop offset="50%" stopColor="#0c120e" />
              <stop offset="100%" stopColor="#050806" />
            </linearGradient>
            <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(224, 159, 80, 0.4)" />
              <stop offset="100%" stopColor="rgba(224, 159, 80, 0)" />
            </linearGradient>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </linearGradient>
            <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(216, 204, 184, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background & Grid */}
          <rect width="600" height="380" fill="url(#tvArtGrad)" />
          <rect width="600" height="380" fill="url(#gridPattern)" />

          {/* Dynamic Theme Graphic Elements based on Type */}
          {type === 'court_gavel' && (
            <g transform="translate(300, 190)">
              <circle r="120" fill="none" stroke="rgba(224, 159, 80, 0.15)" strokeWidth="1.5" />
              <circle r="85" fill="none" stroke="rgba(224, 159, 80, 0.25)" strokeWidth="1" strokeDasharray="6,4" />
              {/* Scales of Justice */}
              <line x1="0" y1="-75" x2="0" y2="75" stroke="var(--accent-amber)" strokeWidth="3.5" />
              <line x1="-70" y1="-50" x2="70" y2="-50" stroke="var(--accent-amber)" strokeWidth="3" />
              {/* Left Scale */}
              <line x1="-70" y1="-50" x2="-95" y2="-10" stroke="rgba(216, 204, 184, 0.5)" strokeWidth="1.5" />
              <line x1="-70" y1="-50" x2="-45" y2="-10" stroke="rgba(216, 204, 184, 0.5)" strokeWidth="1.5" />
              <path d="M -105 -10 Q -70 15 -35 -10 Z" fill="rgba(224, 159, 80, 0.3)" stroke="var(--accent-amber)" strokeWidth="2" />
              {/* Right Scale */}
              <line x1="70" y1="-50" x2="45" y2="-10" stroke="rgba(216, 204, 184, 0.5)" strokeWidth="1.5" />
              <line x1="70" y1="-50" x2="95" y2="-10" stroke="rgba(216, 204, 184, 0.5)" strokeWidth="1.5" />
              <path d="M 35 -10 Q 70 15 105 -10 Z" fill="rgba(224, 159, 80, 0.3)" stroke="var(--accent-amber)" strokeWidth="2" />
              {/* Base */}
              <path d="M -35 75 L 35 75 L 45 85 L -45 85 Z" fill="var(--accent-amber)" opacity="0.8" />
            </g>
          )}

          {type === 'registration_seal' && (
            <g transform="translate(300, 190)">
              <circle r="115" fill="none" stroke="rgba(200, 122, 72, 0.2)" strokeWidth="2" />
              <circle r="100" fill="rgba(200, 122, 72, 0.06)" stroke="var(--accent-copper)" strokeWidth="2.5" />
              <circle r="88" fill="none" stroke="rgba(224, 159, 80, 0.4)" strokeWidth="1" strokeDasharray="4,4" />
              <text x="0" y="-55" textAnchor="middle" fill="var(--accent-amber)" fontSize="11" letterSpacing="4" fontFamily="monospace">
                GOVERNMENT OF TAMIL NADU
              </text>
              <text x="0" y="65" textAnchor="middle" fill="var(--text-sandstone)" fontSize="10" letterSpacing="3" fontFamily="monospace">
                REGISTRATION DEPT · STAR 2.0
              </text>
              {/* Center Emblem */}
              <circle r="36" fill="rgba(224, 159, 80, 0.15)" stroke="var(--accent-amber)" strokeWidth="2" />
              <path d="M -15 -10 L 0 -25 L 15 -10 L 10 18 L -10 18 Z" fill="none" stroke="var(--accent-amber)" strokeWidth="2" />
              <line x1="-8" y1="2" x2="8" y2="2" stroke="var(--accent-amber)" strokeWidth="2" />
            </g>
          )}

          {type === 'blueprint_zoning' && (
            <g transform="translate(300, 190)">
              <rect x="-180" y="-110" width="360" height="220" fill="rgba(56, 189, 248, 0.04)" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" />
              {/* Metro & Transit Alignment Curves */}
              <path d="M -180 40 Q -60 -80 60 20 T 180 -40" fill="none" stroke="var(--accent-sage-bright)" strokeWidth="3" />
              <path d="M -140 100 Q 0 -40 140 80" fill="none" stroke="var(--accent-amber)" strokeWidth="2.5" strokeDasharray="6,4" />
              {/* Transit Nodes */}
              <circle cx="-60" cy="-22" r="6" fill="var(--accent-sage-bright)" stroke="#050806" strokeWidth="2" />
              <circle cx="60" cy="20" r="6" fill="var(--accent-amber)" stroke="#050806" strokeWidth="2" />
              <circle cx="120" cy="-15" r="6" fill="var(--accent-sage-bright)" stroke="#050806" strokeWidth="2" />
              <text x="-165" y="-85" fill="var(--accent-sage-bright)" fontSize="10" fontFamily="monospace" letterSpacing="2">
                CMDA 2046 MASTER PLAN · TOD ZONING CORRIDOR
              </text>
            </g>
          )}

          {type === 'land_cadastre' && (
            <g transform="translate(300, 190)">
              {/* Cadastral Polygon Boundaries */}
              <polygon points="-130,-70 -30,-95 80,-50 140,-10 60,85 -80,60" fill="rgba(45, 212, 191, 0.08)" stroke="var(--accent-hydro)" strokeWidth="2" />
              <polygon points="-30,-95 40,-115 110,-85 80,-50" fill="rgba(224, 159, 80, 0.08)" stroke="var(--accent-amber)" strokeWidth="1.5" />
              <polygon points="80,-50 160,-65 170,10 140,-10" fill="rgba(168, 85, 247, 0.08)" stroke="var(--accent-copper)" strokeWidth="1.5" />
              <polygon points="-80,60 60,85 20,115 -70,110" fill="rgba(56, 189, 248, 0.08)" stroke="var(--accent-sage-bright)" strokeWidth="1.5" />
              {/* Centroid Pin */}
              <circle cx="10" cy="-10" r="5" fill="var(--accent-amber)" />
              <circle cx="10" cy="-10" r="16" fill="none" stroke="var(--accent-amber)" strokeWidth="1" strokeDasharray="3,3" />
              <text x="10" y="16" textAnchor="middle" fill="var(--text-sandstone)" fontSize="9" fontFamily="monospace">
                SURVEY FMB #160/2A
              </text>
            </g>
          )}

          {type === 'waterbody_protection' && (
            <g transform="translate(300, 190)">
              {/* Hydrographic Contours */}
              <path d="M -180 60 C -100 20 -40 80 40 40 C 100 10 140 50 180 30" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="3" />
              <path d="M -180 85 C -90 45 -30 105 50 65 C 110 35 150 75 180 55" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
              <path d="M -180 110 C -80 70 -20 130 60 90 C 120 60 160 100 180 80" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1.5" />
              {/* Wetland Buffer Zone Outline */}
              <rect x="-140" y="-80" width="280" height="90" rx="4" fill="rgba(244, 63, 94, 0.08)" stroke="var(--accent-terracotta)" strokeWidth="2" strokeDasharray="6,4" />
              <text x="0" y="-45" textAnchor="middle" fill="var(--accent-terracotta)" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="2">
                PROTECTED WATERBODY BUFFER · ZERO AMNESTY
              </text>
              <text x="0" y="-25" textAnchor="middle" fill="var(--text-sandstone)" fontSize="9" fontFamily="sans-serif">
                Pallikaranai &amp; Adyar Basin Drainage Encroachment Prohibition
              </text>
            </g>
          )}

          {type !== 'court_gavel' &&
            type !== 'registration_seal' &&
            type !== 'blueprint_zoning' &&
            type !== 'land_cadastre' &&
            type !== 'waterbody_protection' && (
              <g transform="translate(300, 190)">
                <rect x="-160" y="-90" width="320" height="180" rx="6" fill="rgba(224, 159, 80, 0.05)" stroke="var(--border-copper)" strokeWidth="2" />
                <circle cx="0" cy="0" r="50" fill="none" stroke="var(--accent-amber)" strokeWidth="2" />
                <path d="M -25 -25 L 25 25 M -25 25 L 25 -25" stroke="var(--accent-amber)" strokeWidth="2" />
                <text x="0" y="70" textAnchor="middle" fill="var(--accent-amber)" fontSize="10" fontFamily="monospace" letterSpacing="2">
                  OFFICIAL STATUTORY GAZETTE DIRECTIVE
                </text>
              </g>
            )}

          {/* Vignette Overlay */}
          <rect width="600" height="380" fill="url(#cyanGlow)" opacity="0.3" pointerEvents="none" />
        </svg>
      </div>
    );
  };

  return (
    <div className="land-news-tv-container topo-surface">
      {/* 1. SECTION EDITORIAL HEADER & METADATA */}
      <header className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="editorial-kicker" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="live-broadcast-dot" />
            <span>TERRASHIELD LAND TELEVISION · LIVE STATUTORY BROADCAST</span>
          </div>
          <h1 className="section-title">
            Land News &amp; Legal Updates TV
          </h1>
          <p className="section-subtitle">
            A minimalist, dedicated digital news broadcast curating verified land records, Tamil Nadu Registration Department guideline value circulars, CMDA zoning gazettes, and High Court property rulings.
          </p>
        </div>

        {/* Refresh & Channel Health Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="status-pill verified" title={`Last synced: ${formatDate(lastRefreshedAt)}`}>
            <Radio size={12} className="pulse-icon" />
            <span>9 Official Channels Synced</span>
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
            onClick={fetchNews}
            disabled={isRefreshing}
            title="Re-synchronize with official government endpoints"
          >
            <RotateCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </header>

      {/* 2. COMPACT CATEGORY FILTER BAR & SEARCH */}
      <div className="news-filter-bar">
        {/* Horizontal Category Scroll */}
        <div className="news-categories-wrap" role="tablist" aria-label="News Categories">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`news-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedIndex(0);
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Compact Search Input */}
        <div className="news-search-box">
          <Search size={14} className="news-search-icon" />
          <input
            type="search"
            className="news-search-input"
            placeholder="Search land updates (e.g. Guideline values, Patta, CMDA, High Court)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            aria-label="Search land records and legal updates"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 3. THE PREMIUM DIGITAL TELEVISION DISPLAY */}
      {filteredStories.length === 0 ? (
        <div className="news-empty-state">
          <AlertCircle size={32} style={{ color: 'var(--accent-amber)', marginBottom: '0.75rem' }} />
          <h3>No Verifiable Stories Found</h3>
          <p>
            No official announcements or court directives match the filter <strong>&ldquo;{searchQuery || selectedCategory}&rdquo;</strong>.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '1rem', fontSize: '0.85rem' }}
            onClick={() => {
              setSelectedCategory('All Updates');
              setSearchQuery('');
            }}
          >
            Reset Filters &amp; View All Updates
          </button>
        </div>
      ) : (
        <div className="tv-stage-wrapper">
          {/* Main Television Chassis Frame */}
          <div ref={tvScreenRef} className="tv-chassis" role="region" aria-label="Land News Television Broadcast">
            {/* Bezel Metallic Highlight & Glare */}
            <div className="tv-bezel-glare" aria-hidden="true" />

            {/* Inner TV Display Screen */}
            <div className={`tv-display-screen ${isTransitioning ? 'tv-transition-flicker' : ''}`}>
              {/* Broadcast Top Bug / Channel Lockup */}
              <div className="tv-screen-top-bar">
                <div className="tv-network-badge">
                  <div className="tv-live-indicator">
                    <span className="live-dot" />
                    <span>BROADCAST</span>
                  </div>
                  <span className="tv-network-name">TERRASHIELD LAND TV</span>
                </div>

                <div className="tv-top-meta">
                  <span className="tv-status-badge">{activeStory?.status || 'Published'}</span>
                  <span className="tv-counter-badge">
                    {String(selectedIndex + 1).padStart(2, '0')} / {String(filteredStories.length).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Television Content Layout: Left News Art / Right Broadcast Typography */}
              <div className="tv-screen-body">
                {/* Visual Artwork Canvas / Real Verified Story Photograph */}
                <div className="tv-media-frame">
                  {activeStory?.imageUrl && !imgError ? (
                    <div className="tv-image-wrapper">
                      {!imgLoaded && (
                        <div className="tv-image-skeleton" aria-hidden="true">
                          <div className="tv-skeleton-shimmer" />
                        </div>
                      )}
                      <img
                        key={activeStory.id}
                        src={activeStory.imageUrl}
                        alt={activeStory.imageAlt || activeStory.headline}
                        className={`tv-story-photo ${imgLoaded ? 'is-loaded' : 'is-loading'}`}
                        loading="eager"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                      />
                    </div>
                  ) : (
                    renderStoryArtwork(activeStory)
                  )}

                  <div className="tv-media-overlay" />

                  {/* Source Attribution Watermark */}
                  <div className="tv-source-watermark">
                    <Building size={12} />
                    <span>{activeStory?.sourceName}</span>
                  </div>

                  {/* Specific Image Context / Location Caption */}
                  {activeStory?.imageCaption && (
                    <div className="tv-caption-badge" title={activeStory.imageCaption}>
                      <MapPin size={11} />
                      <span>{activeStory.imageCaption}</span>
                    </div>
                  )}
                </div>

                {/* News Presentation Story Area */}
                <div className="tv-story-content">
                  {/* Category & Date Line */}
                  <div className="tv-story-eyebrow">
                    <span className="tv-category-tag">{activeStory?.category}</span>
                    <span className="tv-meta-divider">·</span>
                    <span className="tv-date-tag">
                      <Calendar size={12} />
                      {formatDate(activeStory?.publicationDate)}
                    </span>
                  </div>

                  {/* Prominent Headline (Visual Focal Point) */}
                  <h2 className="tv-headline">
                    {activeStory?.headline}
                  </h2>

                  {/* Concise 2-3 Line Summary */}
                  <p className="tv-summary">
                    {activeStory?.shortSummary}
                  </p>

                  {/* Television Action Controls & Details Trigger */}
                  <div className="tv-action-footer">
                    <button
                      type="button"
                      className="btn-primary tv-read-btn"
                      onClick={() => setFullStoryModalOpen(true)}
                      aria-label="Read full news story"
                    >
                      <BookOpen size={14} />
                      <span>Read Full Story &amp; Official References</span>
                    </button>

                    <div className="tv-controls-group">
                      <button
                        type="button"
                        className="tv-nav-arrow-btn"
                        onClick={handlePrev}
                        aria-label="Previous news story"
                        title="Previous story (Left Arrow)"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        type="button"
                        className="tv-nav-arrow-btn"
                        onClick={handleNext}
                        aria-label="Next news story"
                        title="Next story (Right Arrow)"
                      >
                        <ChevronRight size={18} />
                      </button>

                      <button
                        type="button"
                        className={`tv-nav-arrow-btn tv-autoplay-btn ${isAutoPlay ? 'active' : ''}`}
                        onClick={() => setIsAutoPlay((v) => !v)}
                        aria-label={isAutoPlay ? 'Pause auto-rotation' : 'Play auto-rotation'}
                        title={isAutoPlay ? 'Pause automatic TV rotation' : 'Enable 10s auto-rotation'}
                      >
                        {isAutoPlay ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Television Scanline & Glass Sheen Overlay */}
              <div className="tv-scanlines" aria-hidden="true" />
            </div>

            {/* Television Hardware Stand Base */}
            <div className="tv-stand-neck" aria-hidden="true" />
            <div className="tv-stand-base" aria-hidden="true" />
          </div>

          {/* 4. COMPACT HORIZONTAL NEWS CAROUSEL DIRECTLY BENEATH TV */}
          <div className="news-carousel-section">
            <div className="news-carousel-header">
              <div className="carousel-title-row">
                <span className="carousel-label">NEWS ARCHIVE CAROUSEL</span>
                <span className="carousel-counter">
                  STORY {String(selectedIndex + 1).padStart(2, '0')} OF {String(filteredStories.length).padStart(2, '0')}
                </span>
              </div>

              <div className="carousel-nav-arrows">
                <button
                  type="button"
                  className="btn-ghost carousel-arrow"
                  onClick={handlePrev}
                  aria-label="Previous card"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn-ghost carousel-arrow"
                  onClick={handleNext}
                  aria-label="Next card"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cards Container */}
            <div ref={carouselTrackRef} className="news-carousel-track" role="list">
              {filteredStories.map((story, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={story.id}
                    type="button"
                    role="listitem"
                    className={`news-card-thumb ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => goToStory(idx)}
                    aria-selected={isSelected}
                    aria-label={`View story ${idx + 1}: ${story.headline}`}
                  >
                    <div className="news-card-thumb-header">
                      {story.imageUrl && (
                        <div className="news-card-thumb-img-wrap">
                          <img
                            src={story.imageUrl}
                            alt=""
                            className="news-card-mini-img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="news-card-meta-col">
                        <div className="news-card-top">
                          <span className="news-card-badge">{story.category}</span>
                          <span className="news-card-date">{formatDate(story.publicationDate)}</span>
                        </div>
                        <div className="news-card-source">
                          <Building size={11} />
                          <span>{story.sourceName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="news-card-headline">
                      {story.headline}
                    </div>

                    {isSelected && <span className="news-card-active-indicator" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. FULL STORY ON DEMAND (CLEAN DETAIL MODAL) */}
      {fullStoryModalOpen && activeStory && (
        <div
          className="story-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={activeStory.headline}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullStoryModalOpen(false);
          }}
        >
          <div className="story-modal-card">
            {/* Modal Header */}
            <div className="story-modal-header">
              <div className="story-modal-kicker">
                <span className="tv-category-tag">{activeStory.category}</span>
                <span className="tv-status-badge">{activeStory.status}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--accent-amber)' }}>
                  {activeStory.jurisdiction}
                </span>
              </div>

              <button
                type="button"
                className="btn-ghost story-modal-close"
                onClick={() => setFullStoryModalOpen(false)}
                aria-label="Close full story"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="story-modal-body">
              <h1 className="story-modal-title">{activeStory.headline}</h1>

              {activeStory.imageUrl && (
                <div className="modal-hero-image-wrap">
                  <img
                    src={activeStory.imageUrl}
                    alt={activeStory.imageAlt || activeStory.headline}
                    className="modal-hero-photo"
                  />
                  {activeStory.imageCaption && (
                    <div className="modal-hero-caption">
                      <MapPin size={12} />
                      <span>{activeStory.imageCaption}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="story-modal-meta-grid">
                <div className="meta-cell">
                  <span className="meta-label">GOVERNMENT / JUDICIAL SOURCE</span>
                  <span className="meta-val">{activeStory.sourceName}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">PUBLICATION DATE</span>
                  <span className="meta-val">{formatDate(activeStory.publicationDate)}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">OFFICIAL GAZETTE / CIRCULAR REF</span>
                  <span className="meta-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    {activeStory.officialReference}
                  </span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">JURISDICTION</span>
                  <span className="meta-val">{activeStory.jurisdiction}</span>
                </div>
              </div>

              {/* Extended Summary */}
              <div className="story-modal-section">
                <h3 className="modal-sec-title">Executive Briefing &amp; Statutory Background</h3>
                <p className="modal-sec-text">{activeStory.fullSummary}</p>
              </div>

              {/* Key Practical Implications for Landowners / Developers */}
              {activeStory.keyImplications && activeStory.keyImplications.length > 0 && (
                <div className="story-modal-section">
                  <h3 className="modal-sec-title">Key Regulatory &amp; Real Estate Implications</h3>
                  <div className="modal-implications-list">
                    {activeStory.keyImplications.map((imp, iIdx) => (
                      <div key={iIdx} className="modal-imp-item">
                        <CheckCircle2 size={16} className="modal-imp-icon" />
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Transparency Disclaimer */}
              <div className="story-disclaimer-box">
                <Info size={16} className="disclaimer-icon" />
                <div className="disclaimer-text">
                  <strong>Source Transparency Notice:</strong> Information presented in this broadcast is synthesized from published government gazettes, statutory circulars, and official judicial rulings. Summaries are provided for land intelligence and informational orientation only, and do not constitute formal legal counsel or statutory clearance.
                </div>
              </div>
            </div>

            {/* Modal Footer with Link to Official Government Portal */}
            <div className="story-modal-footer">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setFullStoryModalOpen(false)}
              >
                Return to Broadcast TV
              </button>

              <a
                href={activeStory.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <span>View Official Source Document</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
