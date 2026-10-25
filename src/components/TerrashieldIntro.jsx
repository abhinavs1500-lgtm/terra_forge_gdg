import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

/**
 * TerrashieldIntro
 * Cinematic full-screen opening animation:
 * Dark Terrain -> Lightning Strike -> Shockwave & Debris ->
 * Particle Swirl Convergence -> Assembles into "TERRASHIELD AI" ->
 * Forged Metal Glow & Sparks -> Smooth Dissolve to Website.
 */
export default function TerrashieldIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const animFrameRef = useRef(null);

  const handleFinish = useCallback(() => {
    if (isCompleted) return;
    setIsCompleted(true);
    setFadingOut(true);
    try {
      sessionStorage.setItem('terrashield_intro_played', 'true');
    } catch (e) {}
    setTimeout(() => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      onComplete?.();
    }, 700);
  }, [isCompleted, onComplete]);

  useEffect(() => {
    // Fail-safe timeout: never block user longer than 6.5s
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 6500);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      handleFinish();
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Lightweight reduced-motion fallback: short 1.8s hold then complete
      const reducedTimer = setTimeout(() => {
        handleFinish();
      }, 1800);
      return () => {
        clearTimeout(safetyTimer);
        clearTimeout(reducedTimer);
      };
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 1. SAMPLE TARGET LETTER GLYPH POINTS FOR "TERRASHIELD AI"
    // =========================================================================
    const sampleTextTargets = (w, h) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return [];

      const text = 'TERRASHIELD AI';
      // Compute responsive font size
      const fontSize = Math.max(28, Math.min(78, Math.floor(w / 14.5)));
      offCtx.font = `900 ${fontSize}px "Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#ffffff';

      const textY = h * 0.44;
      offCtx.fillText(text, w / 2, textY);

      // Sample non-transparent pixels
      const imgData = offCtx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const points = [];
      const step = Math.max(3, Math.floor(fontSize / 16));

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          if (data[idx + 3] > 140) {
            // Point on text
            // Determine normalized letter progress from left to right (for sequential assembly)
            const normX = x / w;
            points.push({
              x,
              y,
              normX
            });
          }
        }
      }
      return points;
    };

    const textTargets = sampleTextTargets(width, height);
    const numParticles = Math.max(600, Math.min(1300, textTargets.length));

    // =========================================================================
    // 2. PARTICLE SYSTEM & PHYSICS SIMULATION
    // =========================================================================
    const groundY = height * 0.68;
    const impactX = width * 0.5;
    const impactY = groundY;

    // Ambient floating dust motes
    const ambientMotes = [];
    for (let i = 0; i < 70; i++) {
      ambientMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.25,
        size: 1 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.35
      });
    }

    // Main debris fragments that will form "TERRASHIELD AI"
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      const target = textTargets[i % textTargets.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 18;
      const upwardBias = 6 + Math.random() * 14;

      particles.push({
        // Start clustered at impact crater
        x: impactX + (Math.random() - 0.5) * 20,
        y: impactY + (Math.random() - 0.5) * 12,
        z: 0.5 + Math.random() * 1.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5 - upwardBias,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        size: 2.2 + Math.random() * 3.8,
        targetX: target ? target.x : width / 2,
        targetY: target ? target.y : height * 0.44,
        targetNormX: target ? target.normX : 0.5,
        isLocked: false,
        shapeSides: Math.random() > 0.4 ? 4 : 3,
        // Material tone: amber-copper molten shard transitioning to forged titanium
        colorType: Math.random()
      });
    }

    // Ground cracks radiating from strike center
    const cracks = [];
    for (let c = 0; c < 12; c++) {
      const crackAngle = (c / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const maxLen = 70 + Math.random() * 140;
      const segments = [];
      let cx = impactX;
      let cy = impactY;
      for (let s = 0; s < 5; s++) {
        const segLen = maxLen / 5;
        cx += Math.cos(crackAngle + (Math.random() - 0.5) * 0.5) * segLen;
        cy += Math.sin(crackAngle + (Math.random() - 0.5) * 0.5) * segLen * 0.45;
        segments.push({ x: cx, y: cy });
      }
      cracks.push(segments);
    }

    // Dynamic lightning bolt generator
    const generateBolt = (startX, startY, endX, endY) => {
      const segments = [{ x: startX, y: startY }];
      let currX = startX;
      let currY = startY;
      const totalSteps = 22;
      const dy = (endY - startY) / totalSteps;

      for (let i = 1; i <= totalSteps; i++) {
        const progress = i / totalSteps;
        const targetX = startX + (endX - startX) * progress;
        currX = targetX + (Math.random() - 0.5) * (48 * (1 - progress * 0.3));
        currY += dy;
        segments.push({ x: currX, y: currY });
      }
      segments[segments.length - 1] = { x: endX, y: endY };
      return segments;
    };

    let lightningBolt = null;
    let lightningBranches = [];

    // Animation state timeline
    const startTime = performance.now();
    let cameraShake = 0;
    let flashIntensity = 0;

    // Render loop
    const render = (now) => {
      const elapsed = (now - startTime) / 1000; // in seconds

      // =======================================================================
      // TIMELINE PHASES
      // 0.0 - 0.7s: Dark Atmospheric Terrain
      // 0.7 - 1.0s: Lightning Strike & White/Amber Flash
      // 0.8 - 2.1s: Shockwave & Debris Explosion
      // 2.0 - 3.4s: Vortex Swirl & Particle Convergence onto Letters
      // 3.4 - 4.5s: Wordmark Assembly & Forged Metal Finish
      // 4.6 - 5.4s: Smooth Transition to Website
      // =======================================================================

      // Phase trigger: Lightning at t = 0.7s
      if (elapsed >= 0.7 && !lightningBolt) {
        lightningBolt = generateBolt(width * 0.44, 0, impactX, impactY);
        lightningBranches = [
          generateBolt(width * 0.45, height * 0.22, width * 0.32, height * 0.4),
          generateBolt(width * 0.47, height * 0.35, width * 0.62, height * 0.52),
          generateBolt(width * 0.49, height * 0.48, width * 0.41, height * 0.62)
        ];
        cameraShake = 22;
        flashIntensity = 0.95;
      }

      // Camera shake decay
      cameraShake *= 0.88;
      const shakeX = (Math.random() - 0.5) * cameraShake;
      const shakeY = (Math.random() - 0.5) * cameraShake;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // =======================================================================
      // LAYER 1: 3D-PERSPECTIVE DARK ROCKY TERRAIN LANDSCAPE
      // =======================================================================
      // Deep void sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#040605');
      skyGrad.addColorStop(0.65, '#080d0a');
      skyGrad.addColorStop(1, '#0e1511');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-50, -50, width + 100, height + 100);

      // Distant mountain ridges (3 atmospheric perspective layers)
      const drawRidge = (baseElevation, freq, amp, color, lineWidth) => {
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        for (let x = 0; x <= width; x += 16) {
          const y =
            groundY -
            baseElevation -
            Math.sin(x * freq) * amp -
            Math.cos(x * freq * 2.3) * (amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, groundY);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 122, 72, 0.12)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      // Far ridge
      drawRidge(120, 0.0035, 45, '#070b08', 0.8);
      // Mid ridge
      drawRidge(75, 0.007, 32, '#0a100c', 1.0);
      // Near foothills
      drawRidge(30, 0.012, 18, '#0f1713', 1.2);

      // Subterranean ground plane with 3D perspective topographic grid
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#0d1310');
      groundGrad.addColorStop(0.4, '#090d0b');
      groundGrad.addColorStop(1, '#050706');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // 3D perspective grid lines converging toward horizon center
      ctx.strokeStyle = 'rgba(216, 204, 184, 0.06)';
      ctx.lineWidth = 1;
      const numRays = 26;
      ctx.beginPath();
      for (let r = 0; r <= numRays; r++) {
        const bottomX = (r / numRays) * (width * 1.6) - width * 0.3;
        ctx.moveTo(impactX, groundY);
        ctx.lineTo(bottomX, height);
      }
      ctx.stroke();

      // Horizontal depth rings along ground
      for (let d = 1; d <= 9; d++) {
        const ringY = groundY + Math.pow(d / 9, 1.8) * (height - groundY);
        ctx.beginPath();
        ctx.moveTo(0, ringY);
        ctx.lineTo(width, ringY);
        ctx.strokeStyle = `rgba(200, 122, 72, ${0.04 + (d / 9) * 0.08})`;
        ctx.stroke();
      }

      // Ambient dust motes
      for (let m of ambientMotes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < 0) m.y = height;
        if (m.x < 0) m.x = width;
        if (m.x > width) m.x = 0;
        ctx.fillStyle = `rgba(224, 159, 80, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // =======================================================================
      // LAYER 2: LIGHTNING STRIKE & AMBER GROUND FISSURES (t >= 0.7s)
      // =======================================================================
      if (elapsed >= 0.7 && elapsed < 1.15 && lightningBolt) {
        // Draw secondary branches
        for (let branch of lightningBranches) {
          ctx.beginPath();
          ctx.moveTo(branch[0].x, branch[0].y);
          for (let p of branch) ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = 'rgba(224, 159, 80, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Draw primary core lightning bolt
        ctx.beginPath();
        ctx.moveTo(lightningBolt[0].x, lightningBolt[0].y);
        for (let p of lightningBolt) ctx.lineTo(p.x, p.y);

        // Outer plasma glow
        ctx.strokeStyle = 'rgba(255, 200, 120, 0.55)';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Mid golden discharge
        ctx.strokeStyle = 'rgba(224, 159, 80, 0.85)';
        ctx.lineWidth = 7;
        ctx.stroke();

        // White-hot core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Molten ground impact crater & radiating fissures (t >= 0.72s)
      if (elapsed >= 0.72) {
        const fissureAge = elapsed - 0.72;
        const fissureGlow = Math.max(0, 1 - fissureAge / 3.2);

        if (fissureGlow > 0) {
          // Radiating molten cracks
          for (let crack of cracks) {
            ctx.beginPath();
            ctx.moveTo(impactX, impactY);
            for (let seg of crack) ctx.lineTo(seg.x, seg.y);
            ctx.strokeStyle = `rgba(255, 140, 50, ${fissureGlow * 0.85})`;
            ctx.lineWidth = 2.4 * fissureGlow;
            ctx.stroke();
          }

          // Central molten strike crater
          const craterGrad = ctx.createRadialGradient(
            impactX,
            impactY,
            0,
            impactX,
            impactY,
            75 * Math.min(1, fissureAge * 2)
          );
          craterGrad.addColorStop(0, `rgba(255, 235, 180, ${fissureGlow})`);
          craterGrad.addColorStop(0.3, `rgba(224, 159, 80, ${fissureGlow * 0.8})`);
          craterGrad.addColorStop(1, 'rgba(200, 80, 20, 0)');
          ctx.fillStyle = craterGrad;
          ctx.beginPath();
          ctx.ellipse(impactX, impactY, 80, 35, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Expanding ground shockwave ring
        if (fissureAge < 1.2) {
          const shockProgress = fissureAge / 1.2;
          const shockRadiusX = shockProgress * width * 0.55;
          const shockRadiusY = shockProgress * height * 0.22;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(impactX, impactY, shockRadiusX, shockRadiusY, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 220, 150, ${(1 - shockProgress) * 0.75})`;
          ctx.lineWidth = (1 - shockProgress) * 5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Atmospheric lightning flash over the entire scene
      if (flashIntensity > 0.01) {
        ctx.fillStyle = `rgba(255, 245, 230, ${flashIntensity * 0.75})`;
        ctx.fillRect(-50, -50, width + 100, height + 100);
        flashIntensity *= 0.82;
      }

      // =======================================================================
      // LAYER 3: DEBRIS EXPLOSION & CONVERGENCE ONTO "TERRASHIELD AI"
      // =======================================================================
      if (elapsed >= 0.75) {
        const explosionAge = elapsed - 0.75;

        // Convergence timeline:
        // 0.0 - 1.2s of explosion (t=0.75 to 1.95): outward ballistic explosion
        // 1.2 - 2.8s of explosion (t=1.95 to 3.55): vortex pull + spring to target letters
        // > 2.8s of explosion (t > 3.55): locked into letter strokes with molten sheen
        const isConverging = explosionAge >= 1.2;
        const convergenceFactor = Math.min(1, Math.max(0, (explosionAge - 1.2) / 1.4));

        for (let p of particles) {
          if (!p.isLocked) {
            if (!isConverging) {
              // Ballistic motion with gravity and air drag
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.42; // gravity
              p.vx *= 0.96; // air drag
              p.vy *= 0.96;
              p.rot += p.vRot;
            } else {
              // Swirling vortex attraction toward target letter position
              // Stagger convergence by letter position (normX) for stroke-by-stroke emergence!
              const staggerThreshold = 1.2 + p.targetNormX * 0.55;
              if (explosionAge >= staggerThreshold) {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.hypot(dx, dy);

                // Vortex tangential swirl
                const swirlAngle = Math.atan2(dy, dx) + Math.PI * 0.35 * (1 - convergenceFactor);
                const swirlForce = Math.min(8, dist * 0.08) * (1 - convergenceFactor);
                p.x += Math.cos(swirlAngle) * swirlForce;
                p.y += Math.sin(swirlAngle) * swirlForce;

                // Magnetic spring to target letter point
                const spring = 0.14 + convergenceFactor * 0.16;
                p.x += dx * spring;
                p.y += dy * spring;
                p.rot += p.vRot * (1 - convergenceFactor);

                if (dist < 2.5 && convergenceFactor > 0.85) {
                  p.x = p.targetX;
                  p.y = p.targetY;
                  p.isLocked = true;
                }
              } else {
                // Suspended swirling in air before letter assembly
                p.vx *= 0.92;
                p.vy *= 0.92;
                p.x += p.vx + Math.sin(now * 0.005 + p.targetNormX * 10) * 0.8;
                p.y += p.vy + Math.cos(now * 0.005 + p.targetNormX * 10) * 0.6;
              }
            }
          }

          // Render particle fragment
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);

          // Color shifts from incandescent amber during blast to forged bronze/titanium when locked
          if (p.isLocked) {
            // Forged metal stroke point
            ctx.fillStyle =
              p.colorType > 0.5
                ? 'rgba(245, 240, 230, 0.92)'
                : 'rgba(224, 159, 80, 0.95)';
            ctx.fillRect(-1.8, -1.8, 3.6, 3.6);
          } else {
            // Hot debris rock fragment
            const shardAlpha = Math.min(1, Math.max(0.2, 1 - (p.y - height) / 300));
            if (p.colorType > 0.7) {
              // Molten glowing spark
              ctx.fillStyle = `rgba(255, 200, 100, ${shardAlpha})`;
              ctx.shadowColor = '#e09f50';
              ctx.shadowBlur = 6;
            } else if (p.colorType > 0.3) {
              // Amber rock shard
              ctx.fillStyle = `rgba(200, 122, 72, ${shardAlpha})`;
            } else {
              // Dark charcoal terrain rock
              ctx.fillStyle = `rgba(32, 42, 36, ${shardAlpha})`;
              ctx.strokeStyle = `rgba(224, 159, 80, ${shardAlpha * 0.6})`;
              ctx.lineWidth = 0.8;
              ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
          ctx.restore();
        }
      }

      // =======================================================================
      // LAYER 4: FORGED-METAL WORDMARK OVERLAY & SPARKS (t >= 3.3s)
      // =======================================================================
      if (elapsed >= 3.3) {
        const wordmarkAge = elapsed - 3.3;
        const wordmarkAlpha = Math.min(1, wordmarkAge / 0.8);

        const text = 'TERRASHIELD AI';
        const fontSize = Math.max(28, Math.min(78, Math.floor(width / 14.5)));
        const textY = height * 0.44;

        ctx.save();
        ctx.font = `900 ${fontSize}px "Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Molten bloom and edge glow
        ctx.shadowColor = 'rgba(224, 159, 80, 0.8)';
        ctx.shadowBlur = 24 * wordmarkAlpha;
        ctx.strokeStyle = `rgba(224, 159, 80, ${wordmarkAlpha * 0.9})`;
        ctx.lineWidth = 3;
        ctx.strokeText(text, width / 2, textY);

        // Forged metal fill with dynamic specular sheen sweeping across letters
        const sheenProgress = Math.min(1.4, wordmarkAge * 0.85);
        const sheenX = (width * 0.2) + sheenProgress * (width * 0.6);
        const metalGrad = ctx.createLinearGradient(
          sheenX - 120,
          textY,
          sheenX + 120,
          textY
        );
        metalGrad.addColorStop(0, `rgba(216, 204, 184, ${wordmarkAlpha * 0.75})`);
        metalGrad.addColorStop(0.5, `rgba(255, 245, 230, ${wordmarkAlpha})`);
        metalGrad.addColorStop(1, `rgba(200, 122, 72, ${wordmarkAlpha * 0.85})`);
        ctx.fillStyle = metalGrad;
        ctx.fillText(text, width / 2, textY);
        ctx.restore();

        // Architectural subtitle & technical coordinate reticles beneath wordmark
        if (wordmarkAge >= 0.5) {
          const subAlpha = Math.min(1, (wordmarkAge - 0.5) / 0.6);
          ctx.save();
          ctx.textAlign = 'center';
          ctx.font = '600 12px "JetBrains Mono", monospace';
          ctx.letterSpacing = '0.22em';
          ctx.fillStyle = `rgba(224, 159, 80, ${subAlpha * 0.9})`;
          ctx.fillText(
            'INTELLIGENCE BEFORE CONSTRUCTION · 13.0827°N, 80.2707°E',
            width / 2,
            textY + fontSize * 0.72
          );

          // Technical bracket lines
          const bracketW = Math.min(width * 0.65, 520);
          ctx.strokeStyle = `rgba(216, 204, 184, ${subAlpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(width / 2 - bracketW / 2, textY + fontSize * 0.95);
          ctx.lineTo(width / 2 + bracketW / 2, textY + fontSize * 0.95);
          ctx.stroke();
          ctx.restore();
        }

        // Glowing molten spark embers dancing around the forged wordmark
        for (let i = 0; i < 18; i++) {
          const emberX =
            width / 2 + (Math.sin(now * 0.003 + i * 1.7) * (width * 0.32));
          const emberY =
            textY + (Math.cos(now * 0.004 + i * 2.3) * (fontSize * 0.6));
          const emberAlpha = Math.sin(now * 0.006 + i) * 0.4 + 0.4;
          ctx.fillStyle = `rgba(255, 215, 140, ${emberAlpha * wordmarkAlpha})`;
          ctx.beginPath();
          ctx.arc(emberX, emberY, 1.2 + (i % 3) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // Automatic completion transition at 4.8s
      if (elapsed >= 4.8) {
        handleFinish();
        return;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [handleFinish]);

  if (isCompleted && !fadingOut) return null;

  return (
    <div
      ref={containerRef}
      className={`terrashield-intro-overlay ${fadingOut ? 'fade-out' : ''}`}
      role="dialog"
      aria-label="Terrashield AI Opening Sequence"
      aria-modal="true"
    >
      <canvas
        ref={canvasRef}
        className="terrashield-intro-canvas"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Floating Skip Intro Pill Button */}
      <button
        type="button"
        className="terrashield-skip-btn"
        onClick={handleFinish}
        aria-label="Skip opening animation"
      >
        <span>Skip Intro</span>
        <ArrowRight size={14} style={{ marginLeft: '4px' }} />
      </button>

      {/* Screen-reader descriptive announcement */}
      <div className="sr-only">
        Opening cinematic animation: Lightning strikes dark terrain, debris fragments explode and converge to form TERRASHIELD AI wordmark, then transitions to the homepage.
      </div>
    </div>
  );
}
