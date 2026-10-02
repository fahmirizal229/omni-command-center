/**
 * @file canvasUtils.js
 * @description High-Performance Canvas Rendering Utilities, GPU Offscreen Sprite Blitting,
 * Batched Vector Links, Halo Auras, and Text Shading.
 */

import { hexToRgba } from './graphEngine';

/**
 * Creates or retrieves a pre-rendered 3D Sphere Offscreen Canvas Texture Sprite.
 * Drastically improves rendering performance by replacing expensive createRadialGradient calls.
 * @param {string} color - Sphere base hex color
 * @param {Map<string, HTMLCanvasElement>} spriteCache - Cache map
 * @returns {HTMLCanvasElement} Offscreen canvas sprite
 */
export function getSphereSprite(color, spriteCache) {
  if (!color) color = '#6366f1';
  if (spriteCache.has(color)) return spriteCache.get(color);

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const sCtx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  const grad = sCtx.createRadialGradient(
    cx - r * 0.35,
    cy - r * 0.35,
    r * 0.08,
    cx,
    cy,
    r
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, color);
  grad.addColorStop(0.80, color);
  grad.addColorStop(1, '#05070e');

  sCtx.fillStyle = grad;
  sCtx.beginPath();
  sCtx.arc(cx, cy, r, 0, Math.PI * 2);
  sCtx.fill();

  sCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  sCtx.lineWidth = 1.2;
  sCtx.stroke();

  spriteCache.set(color, canvas);
  return canvas;
}

/**
 * Renders the globe atmosphere background glow.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Projected radius
 * @param {number} tick - Animation tick for breathing effect
 */
export function drawAtmosphereGlow(ctx, cx, cy, radius, tick) {
  const pulseBreath = 1 + Math.sin(tick * 0.03) * 0.02;
  const rGlow = radius * 1.25 * pulseBreath;

  const globeBackGlow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, rGlow);
  globeBackGlow.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
  globeBackGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.025)');
  globeBackGlow.addColorStop(1, 'rgba(6, 8, 18, 0)');

  ctx.fillStyle = globeBackGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, rGlow, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renders batched links (normal & highlighted paths).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<object>} normalLinks - Regular links
 * @param {Array<object>} specialLinks - Highlighted / active links
 * @param {boolean} hasFocus - If a node is selected in focus spotlight
 * @param {boolean} hasSearchMatches - If search query is active
 */
export function drawBatchedLinks(ctx, normalLinks, specialLinks, hasFocus, hasSearchMatches) {
  // Pass 1: Single path batch for regular links
  if (normalLinks.length > 0) {
    ctx.beginPath();
    const len = normalLinks.length;
    for (let i = 0; i < len; i++) {
      const l = normalLinks[i];
      ctx.moveTo(l.source.screenX, l.source.screenY);
      ctx.lineTo(l.target.screenX, l.target.screenY);
    }
    const linkAlpha = hasFocus ? 0.02 : hasSearchMatches ? 0.04 : 0.09;
    ctx.strokeStyle = `rgba(99, 102, 241, ${linkAlpha})`;
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }

  // Pass 2: Highlighted links
  if (specialLinks.length > 0) {
    specialLinks.forEach(({ link, isFocusedLink, isHoverConnected }) => {
      ctx.beginPath();
      ctx.moveTo(link.source.screenX, link.source.screenY);
      ctx.lineTo(link.target.screenX, link.target.screenY);
      if (isFocusedLink) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.2;
      } else if (isHoverConnected) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.80)';
        ctx.lineWidth = 1.6;
      }
      ctx.stroke();
    });
  }
}
