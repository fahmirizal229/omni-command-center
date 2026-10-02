/**
 * @file SpotlightDotMatrixBackground.jsx
 * @description High-performance 2D Canvas interactive Spotlight Dot-Matrix & Precision Crosshair background.
 * Perfectly calibrated with high visibility & crisp aesthetic in both Dark Mode and Light Mode.
 */

import React, { useEffect, useRef } from "react";

export function SpotlightDotMatrixBackground({ isDark = true, activeTab = "overview" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Grid spacing & sizing
    const GRID_SPACING = 30; // Distance between dots in px
    const MAJOR_INTERVAL = 4; // Major cross marker every 4 dots

    // Mouse & Cursor state with smooth interpolation (LERP)
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isHovering: false,
      idleTimer: null,
      radius: 220, // Spotlight radius
    };

    // Ripples (Broadcast Radar Ping on click)
    const ripples = [];

    // Ambient floating autonomous probe nodes
    const probes = [
      { x: 0.2, y: 0.3, vx: 0.0004, vy: 0.0003, radius: 120 },
      { x: 0.7, y: 0.6, vx: -0.0003, vy: 0.0005, radius: 140 },
      { x: 0.5, y: 0.8, vx: 0.0005, vy: -0.0004, radius: 110 },
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();

    // Theme & Active Tab Color Profiles
    const getThemeConfig = (dark, tab) => {
      // Dynamic Tab Accent
      let accent = { r: 99, g: 102, b: 241, hex: "#6366f1" }; // indigo default

      if (tab === "terminal" || tab === "fitness" || tab === "database") {
        accent = dark
          ? { r: 16, g: 185, b: 129, hex: "#10b981" } // emerald
          : { r: 5, g: 150, b: 105, hex: "#059669" };
      } else if (tab === "weather" || tab === "storage" || tab === "warroom") {
        accent = dark
          ? { r: 14, g: 165, b: 233, hex: "#0ea5e9" } // sky
          : { r: 2, g: 132, b: 199, hex: "#0284c7" };
      } else if (tab === "kuro" || tab === "shiro" || tab === "security") {
        accent = dark
          ? { r: 168, g: 85, b: 247, hex: "#a855f7" } // purple
          : { r: 124, g: 58, b: 237, hex: "#7c3aed" };
      } else if (tab === "diet") {
        accent = dark
          ? { r: 245, g: 158, b: 11, hex: "#f59e0b" } // amber
          : { r: 217, g: 119, b: 6, hex: "#d97706" };
      }

      if (dark) {
        // Dark Mode: Sophisticated dark console with luminous spotlight
        return {
          // Base dots (subtle but clearly structured)
          baseDotColor: "rgba(100, 116, 139, 0.28)", // slate-500
          baseDotRadius: 1.0,
          // Major cross markers (+)
          majorCrossColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.40)`,
          majorCrossSize: 3.5,
          // Spotlight zone
          spotlightDotColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.95)`,
          spotlightMaxRadius: 2.4,
          spotlightHaloColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.12)`,
          // Crosshair guides
          crosshairColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.35)`,
          crosshairDash: [3, 5],
          telemetryBadgeBg: "rgba(15, 23, 42, 0.85)",
          telemetryBadgeBorder: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.45)`,
          telemetryBadgeText: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.95)`,
          // Radar ping ripple
          rippleColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.45)`,
          probeColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.25)`,
        };
      } else {
        // Light Mode: High-contrast crisp blueprint/millimeter grid (clearly visible on white/slate-50)
        return {
          // Base dots: sharp slate-400 with solid 42% opacity
          baseDotColor: "rgba(100, 116, 139, 0.42)", // slate-500
          baseDotRadius: 1.15,
          // Major cross markers (+)
          majorCrossColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.55)`,
          majorCrossSize: 4.0,
          // Spotlight zone: rich vibrant contrast
          spotlightDotColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 1.0)`,
          spotlightMaxRadius: 2.5,
          spotlightHaloColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.08)`,
          // Crosshair guides
          crosshairColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.40)`,
          crosshairDash: [3, 4],
          telemetryBadgeBg: "rgba(255, 255, 255, 0.92)",
          telemetryBadgeBorder: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.50)`,
          telemetryBadgeText: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 1.0)`,
          // Radar ping ripple
          rippleColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.40)`,
          probeColor: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.20)`,
        };
      }
    };

    let theme = getThemeConfig(isDark, activeTab);

    // Mouse Listeners
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;

      // Reset smooth position if first entry
      if (mouse.x < 0) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }

      if (mouse.idleTimer) clearTimeout(mouse.idleTimer);
      mouse.idleTimer = setTimeout(() => {
        // Keep active but subtle when static
      }, 3000);
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.isHovering = false;
    };

    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.45,
        alpha: 1.0,
        speed: 8,
      });
    };

    const handleResize = () => {
      resize();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let lastTime = performance.now();
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = (time) => {
      if (!isTabVisible) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse position interpolation (LERP)
      if (mouse.isHovering) {
        mouse.x += (mouse.targetX - mouse.x) * 0.14;
        mouse.y += (mouse.targetY - mouse.y) * 0.14;
      } else {
        mouse.x += (-1000 - mouse.x) * 0.1;
        mouse.y += (-1000 - mouse.y) * 0.1;
      }

      // Update autonomous probe positions
      for (const probe of probes) {
        probe.x += probe.vx;
        probe.y += probe.vy;
        if (probe.x < 0.05 || probe.x > 0.95) probe.vx *= -1;
        if (probe.y < 0.05 || probe.y > 0.95) probe.vy *= -1;
      }

      // Clear Canvas
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const spotX = mouse.x;
      const spotY = mouse.y;
      const spotR = mouse.radius;
      const spotRSq = spotR * spotR;

      // 1. Draw Spotlight Radial Ambient Halo if mouse is on screen
      if (mouse.isHovering && spotX > -100 && spotX < width + 100) {
        const haloGrad = ctx.createRadialGradient(
          spotX,
          spotY,
          0,
          spotX,
          spotY,
          spotR * 1.3
        );
        haloGrad.addColorStop(0, theme.spotlightHaloColor);
        haloGrad.addColorStop(0.6, theme.spotlightHaloColor);
        haloGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotR * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Precision Crosshair Guides (X and Y axis)
      if (mouse.isHovering && spotX > 0 && spotX < width && spotY > 0 && spotY < height) {
        ctx.save();
        ctx.setLineDash(theme.crosshairDash);
        ctx.lineWidth = 1;

        // Horizontal line gradient
        const xSpan = 240;
        const hGrad = ctx.createLinearGradient(
          Math.max(0, spotX - xSpan),
          spotY,
          Math.min(width, spotX + xSpan),
          spotY
        );
        hGrad.addColorStop(0, "rgba(0,0,0,0)");
        hGrad.addColorStop(0.5, theme.crosshairColor);
        hGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.strokeStyle = hGrad;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, spotX - xSpan), spotY);
        ctx.lineTo(Math.min(width, spotX + xSpan), spotY);
        ctx.stroke();

        // Vertical line gradient
        const ySpan = 200;
        const vGrad = ctx.createLinearGradient(
          spotX,
          Math.max(0, spotY - ySpan),
          spotX,
          Math.min(height, spotY + ySpan)
        );
        vGrad.addColorStop(0, "rgba(0,0,0,0)");
        vGrad.addColorStop(0.5, theme.crosshairColor);
        vGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.strokeStyle = vGrad;
        ctx.beginPath();
        ctx.moveTo(spotX, Math.max(0, spotY - ySpan));
        ctx.lineTo(spotX, Math.min(height, spotY + ySpan));
        ctx.stroke();

        ctx.restore();

        // Crosshair Center Target Ring
        ctx.save();
        ctx.strokeStyle = theme.crosshairColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = theme.spotlightDotColor;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Digital Telemetry Coordinate Tag
        const badgeX = spotX + 18;
        const badgeY = spotY + 18;
        const coordText = `${Math.round(spotX).toString().padStart(4, "0")} : ${Math.round(spotY).toString().padStart(4, "0")}`;

        ctx.font = "600 9px monospace";
        const textMetrics = ctx.measureText(coordText);
        const paddingX = 6;
        const paddingY = 3;
        const badgeW = textMetrics.width + paddingX * 2;
        const badgeH = 14;

        if (badgeX + badgeW < width - 10 && badgeY + badgeH < height - 10) {
          ctx.fillStyle = theme.telemetryBadgeBg;
          ctx.strokeStyle = theme.telemetryBadgeBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.telemetryBadgeText;
          ctx.fillText(coordText, badgeX + paddingX, badgeY + 10);
        }
        ctx.restore();
      }

      // 3. Draw Ripples (Radar Ping Wave)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha -= 0.016;

        if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = theme.rippleColor;
        ctx.globalAlpha = Math.max(0, rip.alpha);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Render Dot-Matrix Grid with Proximity Spotlight
      const cols = Math.ceil(width / GRID_SPACING);
      const rows = Math.ceil(height / GRID_SPACING);

      for (let col = 0; col <= cols; col++) {
        const x = col * GRID_SPACING;

        for (let row = 0; row <= rows; row++) {
          const y = row * GRID_SPACING;

          // Check distance to mouse spotlight
          let distSq = Infinity;
          if (mouse.isHovering) {
            const dx = x - spotX;
            const dy = y - spotY;
            distSq = dx * dx + dy * dy;
          }

          // Check distance to probes
          let probeInfluence = 0;
          for (const probe of probes) {
            const px = probe.x * width;
            const py = probe.y * height;
            const pdx = x - px;
            const pdy = y - py;
            const pDistSq = pdx * pdx + pdy * pdy;
            const pRSq = probe.radius * probe.radius;
            if (pDistSq < pRSq) {
              const inf = 1 - Math.sqrt(pDistSq) / probe.radius;
              if (inf > probeInfluence) probeInfluence = inf;
            }
          }

          // Check distance to active ripples
          let rippleInfluence = 0;
          for (const rip of ripples) {
            const rdx = x - rip.x;
            const rdy = y - rip.y;
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
            const diff = Math.abs(rDist - rip.radius);
            if (diff < 25) {
              const inf = (1 - diff / 25) * rip.alpha;
              if (inf > rippleInfluence) rippleInfluence = inf;
            }
          }

          const isMajor = col % MAJOR_INTERVAL === 0 && row % MAJOR_INTERVAL === 0;

          if (distSq < spotRSq) {
            // Inside Spotlight
            const dist = Math.sqrt(distSq);
            const ratio = 1 - dist / spotR; // 1 at center, 0 at edge
            const easeRatio = ratio * ratio * (3 - 2 * ratio); // smoothstep

            const currentRadius =
              theme.baseDotRadius +
              (theme.spotlightMaxRadius - theme.baseDotRadius) * easeRatio;

            ctx.fillStyle = theme.spotlightDotColor;
            ctx.globalAlpha = 0.4 + 0.6 * easeRatio;

            if (isMajor) {
              // Draw illuminated cross (+)
              const crossSize = theme.majorCrossSize + 1.2 * easeRatio;
              ctx.lineWidth = 1.2;
              ctx.strokeStyle = theme.spotlightDotColor;
              ctx.beginPath();
              ctx.moveTo(x - crossSize, y);
              ctx.lineTo(x + crossSize, y);
              ctx.moveTo(x, y - crossSize);
              ctx.lineTo(x, y + crossSize);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1.0;
          } else if (rippleInfluence > 0) {
            // Inside Ripple wavefront
            const currentRadius = theme.baseDotRadius + 1.2 * rippleInfluence;
            ctx.fillStyle = theme.spotlightDotColor;
            ctx.globalAlpha = 0.3 + 0.7 * rippleInfluence;

            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          } else if (probeInfluence > 0) {
            // Inside autonomous probe aura
            const currentRadius = theme.baseDotRadius + 0.6 * probeInfluence;
            ctx.fillStyle = theme.probeColor;
            ctx.globalAlpha = 0.3 + 0.5 * probeInfluence;

            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          } else {
            // Base Grid Dot / Major Cross
            if (isMajor) {
              // Draw subtle cross marker (+)
              ctx.strokeStyle = theme.majorCrossColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x - theme.majorCrossSize, y);
              ctx.lineTo(x + theme.majorCrossSize, y);
              ctx.moveTo(x, y - theme.majorCrossSize);
              ctx.lineTo(x, y + theme.majorCrossSize);
              ctx.stroke();
            } else {
              // Standard dot
              ctx.fillStyle = theme.baseDotColor;
              ctx.beginPath();
              ctx.arc(x, y, theme.baseDotRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (mouse.idleTimer) clearTimeout(mouse.idleTimer);
    };
  }, [isDark, activeTab]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 select-none transition-opacity duration-500 ease-in-out"
      style={{
        width: "100%",
        height: "100%",
        opacity: isDark ? 0.95 : 0.98,
      }}
    />
  );
}

// Seamless alias for backward compatibility
export const TopologyMeshBackground = SpotlightDotMatrixBackground;
