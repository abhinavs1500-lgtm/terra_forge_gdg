import React, { useEffect, useRef, useState } from 'react';
import { Droplets, Compass, Sparkles } from 'lucide-react';

const BASIN_PRESETS = [
  {
    id: 'adyar',
    name: 'Adyar Estuarine Sheet',
    datum: 'ELEV: +4.2m MSL · ESTUARINE CLAY & SAND',
    coord: '13.0124°N, 80.2582°E',
    deepColor: [8, 13, 11],
    waterTint: [26, 62, 54],
    highlightColor: [224, 159, 80],
    emeraldAccent: [110, 188, 152]
  },
  {
    id: 'cooum',
    name: 'Cooum Alluvial Channel',
    datum: 'ELEV: +6.8m MSL · QUATERNARY ALLUVIUM',
    coord: '13.0692°N, 80.2314°E',
    waterTint: [24, 54, 62],
    deepColor: [9, 12, 13],
    highlightColor: [200, 122, 72],
    emeraldAccent: [79, 168, 194]
  },
  {
    id: 'pallikaranai',
    name: 'Pallikaranai Freshwater Marsh',
    datum: 'ELEV: +3.1m MSL · LACUSTRINE BASIN',
    coord: '12.9416°N, 80.2145°E',
    deepColor: [8, 12, 10],
    waterTint: [32, 68, 50],
    highlightColor: [228, 168, 96],
    emeraldAccent: [132, 199, 163]
  }
];

/**
 * InteractiveWaterCanvas
 * Real-time shallow-water wave & pointer-parting physics simulation.
 * Moving the pointer parts the water surface to reveal the submerged topographic
 * bedrock contour layer underneath, creating a meniscus rim and outward ripples.
 */
export default function InteractiveWaterCanvas({
  selectedLocation,
  onSelectFeaturedLocation,
  featuredLocations = []
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeBasinIdx, setActiveBasinIdx] = useState(0);
  const [pointerStatus, setPointerStatus] = useState({
    active: false,
    xNorm: 0.5,
    yNorm: 0.5,
    partingDepth: 0
  });

  const activeBasin = BASIN_PRESETS[activeBasinIdx] || BASIN_PRESETS[0];

  // Store mutable simulation state in a ref so animation loop stays allocation-free
  const simRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Simulation grid dimensions (Eulerian shallow-water heightfield + parting wake field)
    const cols = 96;
    const rows = 64;
    const size = cols * rows;

    const hCurr = new Float32Array(size); // current wave height
    const hPrev = new Float32Array(size); // previous wave height
    const hNext = new Float32Array(size); // next wave height
    const parting = new Float32Array(size); // 0.0 = closed water, 1.0 = fully parted cavity revealing terrain bed
    const bedElevation = new Float32Array(size); // underlying bedrock topographic elevation map

    // Precompute deterministic subterranean bedrock topography (charnockite ridges + drainage channels)
    for (let j = 0; j < rows; j++) {
      const ny = j / (rows - 1);
      for (let i = 0; i < cols; i++) {
        const nx = i / (cols - 1);
        const ridge1 = Math.sin(nx * 6.2 + ny * 3.8) * 0.35;
        const ridge2 = Math.cos(nx * 11.4 - ny * 7.2) * 0.22;
        const basin = Math.sin((nx - 0.5) * 4.0) * Math.cos((ny - 0.5) * 4.0) * 0.4;
        bedElevation[j * cols + i] = (ridge1 + ridge2 + basin + 1.0) * 0.5;
      }
    }

    const state = {
      width: 680,
      height: 500,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      pointerActive: false,
      hasInteracted: false,
      px: 0.48,
      py: 0.48,
      smoothPx: 0.48,
      smoothPy: 0.48,
      vx: 0,
      vy: 0,
      lastMoveTime: 0,
      isVisible: true,
      time: 0,
      basin: BASIN_PRESETS[activeBasinIdx] || BASIN_PRESETS[0],
      triggerPulse: false
    };
    simRef.current = state;

    const updateSize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      state.width = Math.max(300, Math.floor(rect.width));
      state.height = Math.max(360, Math.floor(rect.height));
      canvas.width = state.width * state.dpr;
      canvas.height = state.height * state.dpr;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          state.isVisible = entries[0].isIntersecting;
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // Seed an initial gentle hydrological wave so the canvas feels alive on load
    const injectDisturbance = (normX, normY, radiusCells, strength, partAmount) => {
      const cx = normX * (cols - 1);
      const cy = normY * (rows - 1);
      const r2 = radiusCells * radiusCells;

      const minI = Math.max(1, Math.floor(cx - radiusCells - 2));
      const maxI = Math.min(cols - 2, Math.ceil(cx + radiusCells + 2));
      const minJ = Math.max(1, Math.floor(cy - radiusCells - 2));
      const maxJ = Math.min(rows - 2, Math.ceil(cy + radiusCells + 2));

      for (let j = minJ; j <= maxJ; j++) {
        const dy = j - cy;
        for (let i = minI; i <= maxI; i++) {
          const dx = i - cx;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const idx = j * cols + i;
            const dist = Math.sqrt(d2);
            const q = dist / radiusCells; // 0 at center, 1 at rim
            // Parting cavity inside the cursor wake
            if (partAmount > 0) {
              const cavityProfile = Math.pow(1 - q * q, 1.75) * partAmount;
              if (cavityProfile > parting[idx]) {
                parting[idx] = Math.min(1.0, cavityProfile);
              }
            }
            // Outward hydraulic rim wave (water displaced from center piles up at the boundary)
            const rimWave = Math.sin(q * Math.PI * 1.35) * (1 - q) * strength;
            hCurr[idx] += rimWave;
          }
        }
      }
    };

    if (!prefersReducedMotion) {
      injectDisturbance(0.48, 0.52, 13, 0.85, 0.55);
    }

    let rafId = null;
    let frameCount = 0;

    const stepSimulation = () => {
      state.time += prefersReducedMotion ? 0.004 : 0.018;

      // Smoothly interpolate pointer & inject continuous parting wake along pointer path
      const dx = state.px - state.smoothPx;
      const dy = state.py - state.smoothPy;
      state.smoothPx += dx * 0.24;
      state.smoothPy += dy * 0.24;
      const speed = Math.hypot(dx, dy);

      if (state.triggerPulse) {
        injectDisturbance(0.5, 0.5, 16, 1.4, 0.92);
        state.triggerPulse = false;
      }

      if (state.pointerActive && !prefersReducedMotion) {
        // Interpolate along pointer segment so fast cursor sweeps create a continuous parted trench
        const steps = Math.max(1, Math.min(6, Math.ceil(speed * 45)));
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const ix = state.smoothPx - dx * t;
          const iy = state.smoothPy - dy * t;
          const wakeRadius = 11.5 + Math.min(5.5, speed * 90);
          const waveStrength = 0.22 + Math.min(0.65, speed * 18);
          injectDisturbance(ix, iy, wakeRadius, waveStrength, 0.95);
        }
      } else if (!state.hasInteracted && !prefersReducedMotion && state.time < 5.5) {
        // Gentle initial demonstration parting sweep on load until user moves pointer
        const demoX = 0.48 + Math.sin(state.time * 1.15) * 0.16;
        const demoY = 0.47 + Math.cos(state.time * 0.85) * 0.11;
        state.px = demoX;
        state.py = demoY;
        state.smoothPx = demoX;
        state.smoothPy = demoY;
        injectDisturbance(demoX, demoY, 13.0, 0.28, 0.88);
      }

      // 1. Evolve 2D shallow-water wave equation & relax the parting wake field back together
      const damping = 0.968;
      let maxParting = 0;

      for (let j = 1; j < rows - 1; j++) {
        const rowOffset = j * cols;
        for (let i = 1; i < cols - 1; i++) {
          const idx = rowOffset + i;

          // 5-point discrete Laplacian for wave propagation
          const neighbors =
            hCurr[idx - 1] +
            hCurr[idx + 1] +
            hCurr[idx - cols] +
            hCurr[idx + cols];
          let nextH = (neighbors * 0.5 - hPrev[idx]) * damping;

          // Gentle ambient tidal swell
          nextH +=
            Math.sin(i * 0.16 + state.time * 1.4) *
            Math.cos(j * 0.14 - state.time * 1.1) *
            0.0045;

          hNext[idx] = Math.max(-2.2, Math.min(2.2, nextH));

          // Organic healing of the parted water surface (advection + surface tension closure)
          if (parting[idx] > 0.001) {
            const avgNeighborParting =
              (parting[idx - 1] +
                parting[idx + 1] +
                parting[idx - cols] +
                parting[idx + cols]) *
              0.25;
            // Flow inward from edges + exponential decay
            const healed = (parting[idx] * 0.84 + avgNeighborParting * 0.16) * 0.955;
            parting[idx] = healed < 0.004 ? 0 : healed;
            if (parting[idx] > maxParting) maxParting = parting[idx];
          }
        }
      }

      // Swap wave buffers
      for (let k = 0; k < size; k++) {
        hPrev[k] = hCurr[k];
        hCurr[k] = hNext[k];
      }

      if (frameCount % 8 === 0) {
        setPointerStatus({
          active: state.pointerActive || maxParting > 0.12,
          xNorm: state.smoothPx,
          yNorm: state.smoothPy,
          partingDepth: maxParting
        });
      }
    };

    const renderFrame = () => {
      const W = state.width;
      const H = state.height;
      const basin = state.basin;

      // ======================================================================
      // LAYER 1: SUBMERGED BEDROCK & TOPOGRAPHIC TERRAIN BED (REVEALED ON PARTING)
      // ======================================================================
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#070a08');
      bgGrad.addColorStop(0.5, '#0b100d');
      bgGrad.addColorStop(1, '#080b09');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle engineering survey grid on the submerged terrain floor
      ctx.strokeStyle = 'rgba(200, 122, 72, 0.09)';
      ctx.lineWidth = 1;
      const gridStep = 44;
      ctx.beginPath();
      for (let x = gridStep; x < W; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = gridStep; y < H; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Subterranean topographic elevation contour lines (copper/sandstone)
      const numBedContours = 14;
      for (let c = 0; c < numBedContours; c++) {
        const baseY = ((c + 0.5) / numBedContours) * H;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const nx = x / W;
          const ny = baseY / H;
          const elevOffset =
            Math.sin(nx * 5.5 + c * 0.7) * 18 +
            Math.cos(nx * 11.0 - ny * 4.2) * 9;
          const py = baseY + elevOffset;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.strokeStyle =
          c % 3 === 0
            ? 'rgba(224, 159, 80, 0.24)'
            : 'rgba(199, 188, 169, 0.11)';
        ctx.lineWidth = c % 3 === 0 ? 1.3 : 0.85;
        ctx.stroke();
      }

      // ======================================================================
      // LAYER 2: FLUID WATER SURFACE WITH POINTER-DRIVEN PARTING & REFRACTION
      // ======================================================================
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);

      // Render layered fluid horizontal wave bands that deform and PART around the cursor wake
      const numWaterLayers = 42;
      for (let l = 0; l < numWaterLayers; l++) {
        const vNorm = l / (numWaterLayers - 1);
        const baseLineY = vNorm * H;
        const rowIdx = Math.min(rows - 2, Math.max(1, Math.floor(vNorm * (rows - 1))));

        // Draw continuous water ribbon segments (skipping or parting where parting[idx] is high)
        ctx.beginPath();
        let penDown = false;

        for (let i = 0; i < cols; i++) {
          const idx = rowIdx * cols + i;
          const pVal = parting[idx];
          const waveH = hCurr[idx];

          // Calculate vertical gradient of parting field to push water ribbons away from the parted core!
          const pUp = parting[Math.max(0, (rowIdx - 1) * cols + i)];
          const pDown = parting[Math.min(size - 1, (rowIdx + 1) * cols + i)];
          const pushDirY = pDown - pUp; // pushes lines outward away from the parted cavity

          const ambientWave =
            Math.sin(i * 0.22 + state.time * 1.9 + l * 0.35) * 4.2 +
            Math.cos(i * 0.11 - state.time * 1.3 - l * 0.2) * 3.1;

          // Deform water outward around the parted opening
          const partedDisplacement = pushDirY * 38.0 + waveH * 14.0;
          const x = i * cellW;
          const y = baseLineY + ambientWave + partedDisplacement;

          // If the water is deeply parted here (> 0.42), break the water ribbon to expose the dark terrain bed!
          if (pVal > 0.42) {
            penDown = false;
          } else {
            if (!penDown) {
              ctx.moveTo(x, y);
              penDown = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        // Color & specular highlight intensity based on wave slope
        const isCrestHighlight = l % 4 === 0;
        const alpha = isCrestHighlight ? 0.48 : 0.24;
        if (isCrestHighlight) {
          ctx.strokeStyle = `rgba(${basin.emeraldAccent[0]}, ${basin.emeraldAccent[1]}, ${basin.emeraldAccent[2]}, ${alpha})`;
          ctx.lineWidth = 1.65;
        } else {
          ctx.strokeStyle = `rgba(${basin.waterTint[0] + 45}, ${basin.waterTint[1] + 55}, ${basin.waterTint[2] + 50}, ${alpha})`;
          ctx.lineWidth = 1.1;
        }
        ctx.stroke();
      }

      // ======================================================================
      // LAYER 3: VOLUMETRIC WATER SHEEN & MENISCUS PARTING RIM GLOW
      // ======================================================================
      for (let j = 1; j < rows - 1; j += 1) {
        for (let i = 1; i < cols - 1; i += 1) {
          const idx = j * cols + i;
          const pVal = parting[idx];
          const waveH = hCurr[idx];

          const x = i * cellW;
          const y = j * cellH;

          // Render the luminous hydraulic meniscus rim right where the water parts (0.18 < pVal < 0.62)
          if (pVal > 0.15 && pVal < 0.68) {
            const rimIntensity = Math.sin(((pVal - 0.15) / 0.53) * Math.PI);
            ctx.fillStyle = `rgba(${basin.highlightColor[0]}, ${basin.highlightColor[1]}, ${basin.highlightColor[2]}, ${rimIntensity * 0.34})`;
            ctx.beginPath();
            ctx.arc(x, y, cellW * 1.15, 0, Math.PI * 2);
            ctx.fill();
          } else if (pVal <= 0.15) {
            // Subtle deep water surface tint over unparted regions
            const slopeX = hCurr[idx + 1] - hCurr[idx - 1];
            const slopeY = hCurr[idx + cols] - hCurr[idx - cols];
            const specular = Math.max(0, slopeX * 0.7 - slopeY * 0.7);

            if (specular > 0.08) {
              const specAlpha = Math.min(0.38, specular * 0.65);
              ctx.fillStyle = `rgba(245, 240, 230, ${specAlpha})`;
              ctx.fillRect(x - cellW * 0.5, y - cellH * 0.5, cellW * 1.05, cellH * 1.05);
            } else if ((i + j) % 2 === 0 && Math.abs(waveH) > 0.02) {
              ctx.fillStyle = `rgba(${basin.waterTint[0]}, ${basin.waterTint[1]}, ${basin.waterTint[2]}, 0.16)`;
              ctx.fillRect(x - cellW * 0.5, y - cellH * 0.5, cellW * 1.1, cellH * 1.1);
            }
          } else {
            // Inside the parted opening: highlight exposed bedrock survey benchmarks!
            if (i % 6 === 0 && j % 6 === 0) {
              const bedVal = (bedElevation[idx] * 14 + 2).toFixed(1);
              ctx.fillStyle = `rgba(224, 159, 80, ${Math.min(0.9, (pVal - 0.4) * 1.6)})`;
              ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
              if (i % 12 === 0 && j % 12 === 0) {
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillText(`${bedVal}m`, x + 5, y + 3);
              }
            }
          }
        }
      }

      // Draw a subtle cartographic reticle around the active cursor parting zone
      const showReticle =
        state.pointerActive || (!state.hasInteracted && !prefersReducedMotion && state.time < 5.5);
      if (showReticle) {
        const cx = state.smoothPx * W;
        const cy = state.smoothPy * H;
        ctx.save();
        ctx.strokeStyle = 'rgba(224, 159, 80, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(245, 240, 230, 0.85)';
        ctx.font = '10px "JetBrains Mono", monospace';
        const lat = (12.9 + (1 - state.smoothPy) * 0.28).toFixed(4);
        const lon = (80.14 + state.smoothPx * 0.18).toFixed(4);
        ctx.fillText(`BEDROCK EXPOSED · ${lat}°N, ${lon}°E`, cx - 78, Math.max(22, cy - 56));
        ctx.restore();
      }
    };

    const loop = () => {
      frameCount++;
      if (state.isVisible) {
        stepSimulation();
        renderFrame();
      }
      rafId = window.requestAnimationFrame(loop);
    };

    // Render initial frame immediately and start animation loop
    stepSimulation();
    renderFrame();
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  // Keep active basin synced in simulation state
  useEffect(() => {
    if (simRef.current) {
      simRef.current.basin = BASIN_PRESETS[activeBasinIdx] || BASIN_PRESETS[0];
      simRef.current.triggerPulse = true;
    }
  }, [activeBasinIdx]);

  const handlePointerMove = (e) => {
    const state = simRef.current;
    const container = containerRef.current;
    if (!state || !container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
    state.vx = x - state.px;
    state.vy = y - state.py;
    state.px = x;
    state.py = y;
    state.pointerActive = true;
    state.hasInteracted = true;
    state.lastMoveTime = performance.now();
  };

  const handlePointerLeave = () => {
    if (simRef.current) {
      simRef.current.pointerActive = false;
    }
  };

  const handleTriggerWave = () => {
    if (simRef.current) {
      simRef.current.triggerPulse = true;
    }
  };

  return (
    <div
      ref={containerRef}
      className="water-hero-stage"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      role="region"
      aria-label="Interactive Chennai Hydrological & Subsurface Terrain Simulation — Move cursor across the water surface to part the water and inspect underlying bedrock contours"
    >
      {/* Top Floating Telemetry Header */}
      <div className="water-stage-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <Droplets size={14} style={{ color: 'var(--accent-amber)' }} />
          <span>HYDRO-TERRAIN FLUID SIMULATION · MOVE POINTER TO PART WATER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className={`status-pill ${pointerStatus.active ? 'regional' : 'verified'}`}
            style={{ fontSize: '0.67rem', padding: '0.16rem 0.55rem' }}
          >
            {pointerStatus.active
              ? `SURFACE PARTED · BEDROCK REVEALED`
              : `FLUID EQUILIBRIUM · ${activeBasin.coord}`}
          </span>
        </div>
      </div>

      {/* Basin Selector & Interactive Pulse Trigger */}
      <div className="water-stage-subbar">
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
            HYDRO SHEET:
          </span>
          {BASIN_PRESETS.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              className={`layer-toggle-btn ${activeBasinIdx === idx ? 'active' : ''}`}
              onClick={(ev) => {
                ev.stopPropagation();
                setActiveBasinIdx(idx);
              }}
            >
              {b.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="layer-toggle-btn"
          style={{ border: '1px solid var(--border-copper)', color: 'var(--accent-amber)' }}
          onClick={(ev) => {
            ev.stopPropagation();
            handleTriggerWave();
          }}
          title="Emit a hydrological wave pulse across the terrain bed"
        >
          <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Pulse Wave
        </button>
      </div>

      {/* Interactive Physics Canvas */}
      <div className="water-canvas-viewport">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair'
          }}
        />

        {/* Subtle Floating Interaction Hint Pill */}
        <div className="water-interaction-hint" aria-hidden="true">
          <Compass size={13} style={{ color: 'var(--accent-amber)' }} />
          <span>
            Sweep cursor or touch across the water to part the hydrological layer &amp; expose underlying SRTM bedrock contours
          </span>
        </div>
      </div>

      {/* Bottom Data-Driven Locality Switcher Strip */}
      <div className="hero-node-switcher-strip">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-amber)' }}>
            {activeBasin.datum}
          </div>
          {selectedLocation && (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-ivory)', marginTop: '0.1rem' }}>
              Active Node: {selectedLocation.name} ({selectedLocation.id}) · {selectedLocation.geographic_context?.elevation_m_msl ?? 'N/A'}m MSL · {selectedLocation.geographic_context?.coastal_distance_km}km coast
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {featuredLocations.map((node) => {
            const isSelected = selectedLocation?.id === node.id;
            return (
              <button
                key={node.id}
                type="button"
                className={`layer-toggle-btn ${isSelected ? 'active' : ''}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (onSelectFeaturedLocation) onSelectFeaturedLocation(node);
                  handleTriggerWave();
                }}
              >
                {node.name} ({node.geographic_context?.elevation_m_msl}m)
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
