import React, { useEffect, useRef } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Eye,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export const THEMES = [
  {
    id: 'obsidian',
    name: 'Obsidian Forge',
    category: 'Cinematic Dark',
    description: 'Deep black and charcoal surfaces with molten amber accents and subtle metallic borders. Premium engineering aesthetic.',
    palette: {
      bg: '#090c0a',
      surface: '#1b241f',
      text: '#f5f0e6',
      accent1: '#e09f50',
      accent2: '#84c7a3',
      border: 'rgba(216, 204, 184, 0.18)'
    }
  },
  {
    id: 'arctic',
    name: 'Arctic Intelligence',
    category: 'High-Clarity Light',
    description: 'Cool white and pale blue surfaces, deep navy typography, and ice-blue accents. Clean, technical, high-clarity interface.',
    palette: {
      bg: '#f3f7fa',
      surface: '#ffffff',
      text: '#0c1b2a',
      accent1: '#0284c7',
      accent2: '#0ea5e9',
      border: 'rgba(12, 27, 42, 0.22)'
    }
  },
  {
    id: 'forest',
    name: 'Forest Terrain',
    category: 'Environmental Green',
    description: 'Deep forest green, moss, and warm stone with natural emerald accents. Earthy, environmental intelligence aesthetic.',
    palette: {
      bg: '#061109',
      surface: '#183421',
      text: '#ecf5ee',
      accent1: '#52c478',
      accent2: '#69e09d',
      border: 'rgba(194, 217, 199, 0.22)'
    }
  },
  {
    id: 'desert',
    name: 'Desert Cartography',
    category: 'Warm Topographic',
    description: 'Sandstone, warm ivory, terracotta, and dark brown. Elegant topographic details with warm, refined cartographic design.',
    palette: {
      bg: '#191410',
      surface: '#3a2c23',
      text: '#faf4eb',
      accent1: '#e69138',
      accent2: '#cf5c36',
      border: 'rgba(223, 207, 188, 0.24)'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Night',
    category: 'Futuristic Neon',
    description: 'Deep midnight purple and near-black with electric cyan and magenta accents. High futuristic contrast with crisp readability.',
    palette: {
      bg: '#080512',
      surface: '#241a4a',
      text: '#f6f2ff',
      accent1: '#00f0ff',
      accent2: '#ff007f',
      border: 'rgba(0, 240, 255, 0.35)'
    }
  },
  {
    id: 'military',
    name: 'Military Field Operations',
    category: 'Tactical Survey',
    description: 'Olive, graphite, khaki, and muted tactical green. Compact technical labels inspired by rugged field-survey instruments.',
    palette: {
      bg: '#0f130e',
      surface: '#273024',
      text: '#e8ede4',
      accent1: '#d4a34b',
      accent2: '#8fb35f',
      border: 'rgba(197, 206, 192, 0.22)'
    }
  },
  {
    id: 'blueprint',
    name: 'Blueprint Engineering',
    category: 'Architectural Drafting',
    description: 'Blueprint blue surfaces, white/pale-blue technical grid lines, and cyan highlights inspired by architectural plans.',
    palette: {
      bg: '#071526',
      surface: '#163660',
      text: '#f0f7ff',
      accent1: '#38bdf8',
      accent2: '#7dd3fc',
      border: 'rgba(125, 211, 252, 0.32)'
    }
  },
  {
    id: 'luxury',
    name: 'Luxury Ivory',
    category: 'Editorial Minimal',
    description: 'Warm ivory backgrounds, charcoal typography, understated bronze accents, spacious layouts, and subtle shadows.',
    palette: {
      bg: '#faf8f5',
      surface: '#ffffff',
      text: '#1c1917',
      accent1: '#b45309',
      accent2: '#a16207',
      border: 'rgba(68, 64, 60, 0.22)'
    }
  },
  {
    id: 'volcanic',
    name: 'Volcanic Core',
    category: 'High-Impact Magma',
    description: 'Deep graphite, volcanic black, and dark slate with lava orange and restrained crimson accents. Bold and dramatic.',
    palette: {
      bg: '#0e090b',
      surface: '#2e1e24',
      text: '#fdf2f2',
      accent1: '#ff5722',
      accent2: '#f43f5e',
      border: 'rgba(255, 87, 34, 0.32)'
    }
  },
  {
    id: 'aurora',
    name: 'Aurora Glass',
    category: 'Atmospheric Luminous',
    description: 'Midnight blue and deep teal with aurora-inspired cyan, teal, and violet accents. Smooth, luminous atmospheric interface.',
    palette: {
      bg: '#050e16',
      surface: '#152d43',
      text: '#ecfeff',
      accent1: '#2dd4bf',
      accent2: '#a855f7',
      border: 'rgba(45, 212, 191, 0.32)'
    }
  }
];

export default function ThemeStudioModal({
  isOpen,
  onClose,
  activeTheme,
  previewTheme,
  onPreviewTheme,
  onApplyTheme,
  onCancelPreview,
  onResetTheme
}) {
  const dialogRef = useRef(null);

  // Sync open state with native HTML5 <dialog> showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Fallback for light-dismiss on browsers without closedBy support (as per modern web guidance)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isContentClick = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isContentClick) {
        onCancelPreview();
      }
    };

    const handleCancel = (e) => {
      e.preventDefault();
      onCancelPreview();
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onCancelPreview]);

  if (!isOpen) return null;

  const currentEffectiveTheme = previewTheme || activeTheme;
  const activeThemeMeta = THEMES.find((t) => t.id === currentEffectiveTheme) || THEMES[0];

  return (
    <dialog
      ref={dialogRef}
      className="theme-studio-dialog"
      aria-labelledby="theme-studio-heading"
      closedby="any"
    >
      {/* DIALOG HEADER */}
      <div className="theme-studio-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-copper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h2 id="theme-studio-heading" style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-ivory)' }}>
              Appearance &amp; Theme Studio
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-sandstone)', marginTop: '0.15rem' }}>
              Select from 10 fully coordinated visual themes covering backgrounds, surfaces, typography, borders, and cartographic overlays.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {previewTheme && previewTheme !== activeTheme && (
            <span
              className="status-pill regional"
              style={{
                background: 'rgba(224, 159, 80, 0.15)',
                color: 'var(--accent-amber)',
                borderColor: 'var(--accent-amber)'
              }}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Live Preview Active
            </span>
          )}

          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            onClick={onCancelPreview}
            aria-label="Close Theme Studio"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* DIALOG BODY: 10 THEME PREVIEW CARDS */}
      <div className="theme-studio-body">
        <div className="theme-grid">
          {THEMES.map((theme) => {
            const isApplied = activeTheme === theme.id;
            const isPreviewing = currentEffectiveTheme === theme.id;

            return (
              <div
                key={theme.id}
                className={`theme-card ${isPreviewing ? 'is-previewing' : ''} ${isApplied ? 'is-active' : ''}`}
                onClick={() => onPreviewTheme(theme.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreviewTheme(theme.id);
                  }
                }}
                aria-pressed={isPreviewing}
                aria-label={`Preview ${theme.name} theme`}
              >
                <div>
                  {/* Miniature Theme Window Rendering */}
                  <div
                    className="theme-card-preview-window"
                    style={{
                      background: theme.palette.bg,
                      borderColor: theme.palette.border
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          color: theme.palette.accent1,
                          fontWeight: 700,
                          letterSpacing: '0.04em'
                        }}
                      >
                        {theme.category.toUpperCase()}
                      </span>
                      {isApplied && (
                        <span
                          style={{
                            background: theme.palette.accent2,
                            color: theme.palette.bg,
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 700
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Miniature UI surface block */}
                    <div
                      style={{
                        background: theme.palette.surface,
                        border: `1px solid ${theme.palette.border}`,
                        borderRadius: '3px',
                        padding: '0.35rem 0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ color: theme.palette.text, fontSize: '0.74rem', fontWeight: 600 }}>
                        {theme.name}
                      </div>
                      <div
                        style={{
                          background: theme.palette.accent1,
                          color: theme.palette.bg,
                          fontSize: '0.6rem',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontWeight: 700
                        }}
                      >
                        UI
                      </div>
                    </div>
                  </div>

                  {/* Header Title & Palette Swatch Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-ivory)' }}>
                      {theme.name}
                    </div>

                    <div className="theme-swatch-row" title="Palette Swatches">
                      <div className="theme-swatch" style={{ background: theme.palette.bg }} />
                      <div className="theme-swatch" style={{ background: theme.palette.surface }} />
                      <div className="theme-swatch" style={{ background: theme.palette.accent1 }} />
                      <div className="theme-swatch" style={{ background: theme.palette.accent2 }} />
                      <div className="theme-swatch" style={{ background: theme.palette.text }} />
                    </div>
                  </div>

                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--text-sandstone)', lineHeight: 1.5 }}>
                    {theme.description}
                  </p>
                </div>

                {/* Card Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: isPreviewing ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                    {isApplied ? '● Currently Active' : isPreviewing ? '◉ Live Previewing' : 'Click to preview'}
                  </span>

                  <button
                    type="button"
                    className={isApplied ? 'btn-ghost' : isPreviewing ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPreviewing && !isApplied) {
                        onApplyTheme(theme.id);
                      } else {
                        onPreviewTheme(theme.id);
                      }
                    }}
                  >
                    {isApplied ? 'Applied' : isPreviewing ? 'Apply This' : 'Preview'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIALOG FOOTER CONTROLS */}
      <div className="theme-studio-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.82rem' }}
            onClick={onResetTheme}
            title="Reset theme to original Obsidian Forge"
          >
            <RotateCcw size={14} />
            <span>Reset to Default</span>
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Active theme: <strong style={{ color: 'var(--text-ivory)' }}>{activeThemeMeta.name}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancelPreview}
          >
            <span>Cancel Preview</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onApplyTheme(currentEffectiveTheme)}
          >
            <Check size={15} />
            <span>Apply &amp; Save Theme</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
