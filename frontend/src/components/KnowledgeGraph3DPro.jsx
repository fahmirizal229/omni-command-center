/**
 * @file KnowledgeGraph3DPro.jsx
 * @description Sci-Fi 3D Galactic Knowledge Cosmos Canvas.
 * Ultra-immersive Logarithmic Spiral Galaxy visualization for Obsidian Second Brain.
 *
 * Core Features:
 * - Multi-Arm Logarithmic Spiral Galaxy spatial projection with galactic core bulge
 * - Supermassive Galactic Core Singularity with rotating accretion rings and corona aura
 * - Gravitational hierarchy: High-degree hub nodes in the core bulge, leaf notes along spiral arms
 * - Synaptic Photon Pulses traveling across galactic neural vectors
 * - Stellar classification (Hypergiants, Supergiants, Main Sequence stars)
 * - 3D Cosmic Accretion Dust & reactive Starfield particles
 * - Interactive HUD Quick Search with camera hyper-jump fly-to
 * - Neighbor Spotlight Isolation (1st degree backlinks & vectors)
 * - Holographic Glassmorphism Node Inspector side drawer
 * - 60 FPS WebGL/Canvas 2D Hardware-Accelerated 3D projection engine with touch & mouse controls
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Play,
  Pause,
  ArrowRight,
  Search,
  Sliders,
  Activity,
  Crosshair,
  X,
  Compass,
  Disc3,
  Orbit
} from 'lucide-react';
import { playClickSound, playSwitchSound, playSuccessSound } from '../utils/soundEffects';

export function KnowledgeGraph3D({
  graphData = { nodes: [], links: [], categories: [] },
  onNodeClick,
  folderThemes = {},
  isDark = true,
  onSync
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 3D Viewport Controls
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1); // 0.5x, 1x, 2x
  const [showPulses, setShowPulses] = useState(true);
  const [showStarfield, setShowStarfield] = useState(true);
  const [showCoreGlow, setShowCoreGlow] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedInspectorNode, setSelectedInspectorNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // 3D Camera & Simulation Transform Ref
  const transformRef = useRef({
    rotX: 0.38, // Slight default isometric pitch for majestic spiral disk view
    rotY: 0,
    velRotX: 0,
    velRotY: 0.003,
    targetRotX: 0.38,
    targetRotY: 0,
    zoom: 1,
    targetZoom: 1,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    hoveredNodeId: null,
    focusedNodeId: null,
    nodes3D: [],
    links3D: [],
    particles: [],
    coreParticles: [],
    pulses: []
  });

  // Color mapper helper
  const getNodeColor = useCallback((folder) => {
    if (folderThemes[folder]?.color) return folderThemes[folder].color;
    return '#6366f1'; // Indigo fallback
  }, [folderThemes]);

  // Convert hex color to rgba string
  const hexToRgba = useCallback((hex, alpha = 1) => {
    if (!hex) return `rgba(99, 102, 241, ${alpha})`;
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  // Filter nodes & links based on folder & build adjacency
  const { filteredNodes, filteredLinks, nodeAdjacency } = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return { filteredNodes: [], filteredLinks: [], nodeAdjacency: new Map() };
    }

    let nodes = graphData.nodes;
    if (selectedFolder !== 'All') {
      nodes = nodes.filter(n => n.folder === selectedFolder);
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = (graphData.links || []).filter(
      l => nodeIds.has(l.source) && nodeIds.has(l.target)
    );

    // Build Adjacency Map for 1st degree neighbor spotlighting
    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, new Set()));
    links.forEach(l => {
      if (adjacency.has(l.source) && adjacency.has(l.target)) {
        adjacency.get(l.source).add(l.target);
        adjacency.get(l.target).add(l.source);
      }
    });

    return { filteredNodes: nodes, filteredLinks: links, nodeAdjacency: adjacency };
  }, [graphData, selectedFolder]);

  // Initialize 3D Multi-Arm Logarithmic Spiral Galaxy Geometry
  useEffect(() => {
    if (!filteredNodes || filteredNodes.length === 0) {
      transformRef.current.nodes3D = [];
      transformRef.current.links3D = [];
      transformRef.current.particles = [];
      transformRef.current.coreParticles = [];
      transformRef.current.pulses = [];
      return;
    }

    const N = filteredNodes.length;
    const nodes3D = [];
    const NUM_ARMS = 3; // 3-arm grand design spiral galaxy
    const armOffset = (Math.PI * 2) / NUM_ARMS;

    // Map folders to specific galactic sectors / spiral arms for thematic coherence
    const uniqueFolders = [...new Set(filteredNodes.map(n => n.folder))];
    const folderArmMap = {};
    uniqueFolders.forEach((fld, idx) => {
      folderArmMap[fld] = idx % NUM_ARMS;
    });

    // Base galactic disk radius scale
    const maxGalaxyRadius = Math.min(380, 200 + Math.sqrt(N) * 18);
    const coreBulgeRadius = 75;

    filteredNodes.forEach((node, i) => {
      const degree = node.val || 1;
      const isHub = degree >= 4;
      const armIdx = folderArmMap[node.folder] ?? (i % NUM_ARMS);
      const baseArmAngle = armIdx * armOffset;

      let r, theta, heightY;

      if (isHub) {
        // High-degree hubs cluster in the dense Galactic Core Bulge (Gravitational Core)
        const coreFrac = (i % 10) / 10;
        r = 35 + (1 / Math.sqrt(degree)) * 50 + (i % 5) * 12;
        theta = baseArmAngle + (i * 0.9) + (Math.random() * 0.4 - 0.2);
        // Galactic bulge has thicker vertical profile at center
        heightY = (Math.sin(i * 2.3) * 0.5) * (coreBulgeRadius - r * 0.4);
      } else {
        // Logarithmic Spiral Arm Distribution for stellar notes
        // r follows power distribution outward
        const progress = Math.pow((i + 1) / N, 0.7);
        r = coreBulgeRadius + progress * (maxGalaxyRadius - coreBulgeRadius);

        // Logarithmic spiral angle: theta = theta_0 + B * ln(r/r0)
        const spiralCurvature = 2.4;
        const armAngle = baseArmAngle + Math.log(Math.max(1, r / 30)) * spiralCurvature;

        // Add subtle natural orbital dispersion (stellar jitter)
        const jitterAngle = (Math.sin(i * 3.7) * 0.28);
        const jitterRadius = (Math.cos(i * 2.1) * 18);

        theta = armAngle + jitterAngle;
        r = Math.max(coreBulgeRadius, r + jitterRadius);

        // Vertical disk thickness decreases exponentially towards outer rim (lenticular profile)
        const diskThickness = Math.exp(-r / 220) * 48 + 12;
        heightY = (Math.sin(i * 5.1 + r) * 0.5) * diskThickness;
      }

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = heightY;

      nodes3D.push({
        ...node,
        originX: x,
        originY: y,
        originZ: z,
        x,
        y,
        z,
        screenX: 0,
        screenY: 0,
        screenRadius: 6,
        screenZ: 0,
        degree,
        isHub,
        color: getNodeColor(node.folder),
        // Stellar mass radius calculation
        baseRadius: isHub
          ? Math.max(7, Math.min(16, 6 + Math.log2(degree + 1) * 3))
          : Math.max(4.5, Math.min(8.5, 4 + Math.log2(degree + 1) * 1.8))
      });
    });

    // Create Galactic Accretion Disk & Cosmic Dust Streams (130 particles along spiral arms)
    const particles = [];
    for (let p = 0; p < 140; p++) {
      const arm = p % NUM_ARMS;
      const progress = Math.random();
      const pR = 30 + progress * (maxGalaxyRadius + 40);
      const pTheta = arm * armOffset + Math.log(Math.max(1, pR / 30)) * 2.4 + (Math.random() * 0.5 - 0.25);
      const diskHeight = Math.exp(-pR / 200) * 55 + 8;
      const pY = (Math.random() - 0.5) * diskHeight;

      particles.push({
        x: Math.cos(pTheta) * pR,
        y: pY,
        z: Math.sin(pTheta) * pR,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.45 + 0.15,
        twinklePhase: Math.random() * Math.PI * 2,
        speed: (0.002 + Math.random() * 0.003) * (150 / Math.max(50, pR)) // Keplerian rotation
      });
    }

    // Core Singularity orbiting photons
    const coreParticles = [];
    for (let cp = 0; cp < 24; cp++) {
      coreParticles.push({
        radius: 16 + Math.random() * 26,
        angle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        size: Math.random() * 1.6 + 0.8,
        color: cp % 2 === 0 ? '#c084fc' : '#818cf8'
      });
    }

    // Node lookup map
    const nodeMap = new Map();
    nodes3D.forEach(n => nodeMap.set(n.id, n));

    const links3D = [];
    filteredLinks.forEach(l => {
      const source = nodeMap.get(l.source);
      const target = nodeMap.get(l.target);
      if (source && target) {
        links3D.push({ source, target, value: l.value || 1 });
      }
    });

    // Synaptic Photons flowing across galactic neural links
    const pulses = [];
    links3D.forEach((link, idx) => {
      if (idx % 2 === 0 || link.source.isHub || link.target.isHub) {
        pulses.push({
          link,
          progress: Math.random(),
          speed: 0.006 + Math.random() * 0.008,
          size: Math.random() * 1.6 + 1.2,
          color: link.source.color || '#a855f7'
        });
      }
    });

    transformRef.current.nodes3D = nodes3D;
    transformRef.current.links3D = links3D;
    transformRef.current.particles = particles;
    transformRef.current.coreParticles = coreParticles;
    transformRef.current.pulses = pulses;
  }, [filteredNodes, filteredLinks, getNodeColor]);

  // Search Jump & Camera Focus
  const handleSelectSearchNode = (node) => {
    if (!node) return;
    playClickSound();
    const t = transformRef.current;
    t.focusedNodeId = node.id;
    setSelectedInspectorNode(node);

    // Compute target angles to align camera with the target node in 3D
    const targetRotY = Math.atan2(node.originX, node.originZ);
    const targetRotX = -Math.atan2(node.originY, Math.hypot(node.originX, node.originZ)) + 0.15;

    t.targetRotY = targetRotY;
    t.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotX));
    t.targetZoom = 1.65;
    setZoomLevel(165);
    setSearchQuery('');
  };

  // Main 3D Canvas Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 800;
    let height = 600;

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width || 800, 320);
      height = Math.max(rect.height || 600, 480);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 3D Perspective Projection Matrix Parameters
    const FOV = 500;
    const CAMERA_DISTANCE = 680;
    let timeTick = 0;

    const render = () => {
      timeTick += 0.025;
      const t = transformRef.current;

      // Smooth camera interpolation & Continuous Orbit Rotation
      if (autoRotate && !t.isDragging) {
        t.targetRotY += 0.0032 * rotationSpeed;
      }
      t.rotX += (t.targetRotX - t.rotX) * 0.09;
      t.rotY += (t.targetRotY - t.rotY) * 0.09;
      t.zoom += (t.targetZoom - t.zoom) * 0.09;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      // Trigonometric cache for rotation
      const cosX = Math.cos(t.rotX);
      const sinX = Math.sin(t.rotX);
      const cosY = Math.cos(t.rotY);
      const sinY = Math.sin(t.rotY);

      // Active spotlight isolation set
      const activeFocus = t.hoveredNodeId || t.focusedNodeId;
      const spotlightSet = new Set();
      if (activeFocus) {
        spotlightSet.add(activeFocus);
        const neighbors = nodeAdjacency.get(activeFocus);
        if (neighbors) {
          neighbors.forEach(nid => spotlightSet.add(nid));
        }
      }

      // 1. Draw Deep Cosmic Galactic Nebula Backdrop
      const nebulaGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(width, height) * 0.7);
      if (isDark) {
        nebulaGrad.addColorStop(0, 'rgba(49, 46, 129, 0.45)');   // Indigo core
        nebulaGrad.addColorStop(0.35, 'rgba(88, 28, 135, 0.25)'); // Purple dust
        nebulaGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.2)');    // Deep space
        nebulaGrad.addColorStop(1, 'rgba(4, 6, 12, 0)');
      } else {
        nebulaGrad.addColorStop(0, 'rgba(219, 234, 254, 0.5)');
        nebulaGrad.addColorStop(0.5, 'rgba(238, 242, 255, 0.25)');
        nebulaGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Project & Render Supermassive Galactic Core Singularity & Accretion Rings
      // Rotate Core Origin (0,0,0)
      const coreZ = 0;
      const coreDepth = CAMERA_DISTANCE + coreZ * t.zoom;
      const coreScale = (FOV / coreDepth) * t.zoom;
      const coreScreenX = cx;
      const coreScreenY = cy;

      if (showCoreGlow) {
        // A. Core Corona Radiant Glow
        const coreGlowRadius = 70 * coreScale * (1 + Math.sin(timeTick * 2) * 0.08);
        const coreGrad = ctx.createRadialGradient(
          coreScreenX,
          coreScreenY,
          2 * coreScale,
          coreScreenX,
          coreScreenY,
          coreGlowRadius
        );
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(0.15, 'rgba(192, 132, 252, 0.75)');
        coreGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.35)');
        coreGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(coreScreenX, coreScreenY, coreGlowRadius, 0, Math.PI * 2);
        ctx.fill();

        // B. Holographic Accretion Disk Ring
        const ringRadius = 55 * coreScale;
        ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(coreScreenX, coreScreenY, ringRadius, ringRadius * 0.38, t.rotX, 0, Math.PI * 2);
        ctx.stroke();

        // C. Orbiting Core Singularity Photons
        t.coreParticles.forEach(cp => {
          cp.angle += cp.speed;
          const cpX = Math.cos(cp.angle) * cp.radius;
          const cpZ = Math.sin(cp.angle) * cp.radius;
          const cpY = Math.sin(cp.angle * 2) * 4;

          const cx1 = cpX * cosY + cpZ * sinY;
          const cz1 = -cpX * sinY + cpZ * cosY;
          const cy2 = cpY * cosX - cz1 * sinX;
          const cz2 = cpY * sinX + cz1 * cosX;

          const pDepth = CAMERA_DISTANCE + cz2 * t.zoom;
          const pScale = (FOV / pDepth) * t.zoom;
          const psx = cx + cx1 * pScale;
          const psy = cy + cy2 * pScale;

          ctx.fillStyle = cp.color;
          ctx.beginPath();
          ctx.arc(psx, psy, cp.size * pScale, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 3. Project & Draw Galactic Dust & Starfield Particles
      if (showStarfield) {
        t.particles.forEach(p => {
          // Dynamic Keplerian orbital movement
          const x1 = p.x * cosY + p.z * sinY;
          const z1 = -p.x * sinY + p.z * cosY;
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = p.y * sinX + z1 * cosX;

          const depth = CAMERA_DISTANCE + z2 * t.zoom;
          if (depth > 20) {
            const scale = (FOV / depth) * t.zoom;
            const sx = cx + x1 * scale;
            const sy = cy + y2 * scale;
            const twinkle = Math.sin(timeTick * 2.5 + p.twinklePhase) * 0.2;
            const alpha = Math.max(0.04, Math.min(0.65, (p.alpha + twinkle) * scale * 1.4));

            ctx.fillStyle = isDark
              ? `rgba(196, 181, 253, ${alpha})`
              : `rgba(99, 102, 241, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(sx, sy, p.size * Math.max(0.4, scale), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 4. Project 3D Nodes onto 2D Screen Space
      t.nodes3D.forEach(node => {
        const x1 = node.originX * cosY + node.originZ * sinY;
        const z1 = -node.originX * sinY + node.originZ * cosY;
        const y2 = node.originY * cosX - z1 * sinX;
        const z2 = node.originY * sinX + z1 * cosX;

        node.x = x1;
        node.y = y2;
        node.z = z2;

        const depth = CAMERA_DISTANCE + z2 * t.zoom;
        const scale = depth > 10 ? (FOV / depth) * t.zoom : 0.01;

        node.screenX = cx + x1 * scale;
        node.screenY = cy + y2 * scale;
        node.screenRadius = Math.max(3.5, node.baseRadius * scale);
        node.screenZ = z2; // For depth sorting
      });

      // 5. Draw 3D Connecting Link Vectors (Illuminated Galactic Synapses)
      t.links3D.forEach(link => {
        const s = link.source;
        const tg = link.target;

        const isDirectlyConnected =
          activeFocus && (s.id === activeFocus || tg.id === activeFocus);
        const isInSpotlight =
          spotlightSet.size === 0 || (spotlightSet.has(s.id) && spotlightSet.has(tg.id));

        const avgZ = (s.screenZ + tg.screenZ) / 2;
        const depthFade = Math.max(0.08, Math.min(0.95, (avgZ + 400) / 720));

        if (isDirectlyConnected) {
          ctx.strokeStyle = isDark ? '#d8b4fe' : '#6366f1';
          ctx.lineWidth = 2.4;
          ctx.shadowColor = isDark ? '#c084fc' : '#818cf8';
          ctx.shadowBlur = 12;
        } else if (isInSpotlight) {
          ctx.strokeStyle = isDark
            ? `rgba(168, 85, 247, ${0.24 * depthFade})`
            : `rgba(99, 102, 241, ${0.28 * depthFade})`;
          ctx.lineWidth = 1.0;
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = isDark
            ? `rgba(71, 85, 105, ${0.05 * depthFade})`
            : `rgba(148, 163, 184, ${0.08 * depthFade})`;
          ctx.lineWidth = 0.6;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.moveTo(s.screenX, s.screenY);
        ctx.lineTo(tg.screenX, tg.screenY);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // 6. Draw Synaptic Photons (Energy flowing along active vectors)
      if (showPulses) {
        t.pulses.forEach(pulse => {
          pulse.progress += pulse.speed;
          if (pulse.progress > 1) {
            pulse.progress = 0;
          }

          const s = pulse.link.source;
          const tg = pulse.link.target;
          const isHighlighted = activeFocus && (s.id === activeFocus || tg.id === activeFocus);

          const px = s.screenX + (tg.screenX - s.screenX) * pulse.progress;
          const py = s.screenY + (tg.screenY - s.screenY) * pulse.progress;
          const avgZ = (s.screenZ + tg.screenZ) / 2;
          const scale = Math.max(0.4, (FOV / (CAMERA_DISTANCE + avgZ * t.zoom)) * t.zoom);

          ctx.fillStyle = isHighlighted ? '#ffffff' : pulse.color;
          ctx.shadowColor = pulse.color;
          ctx.shadowBlur = isHighlighted ? 12 : 5;
          ctx.beginPath();
          ctx.arc(px, py, pulse.size * scale, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      // 7. Sort Nodes by Depth (Painter's Back-to-Front algorithm)
      const sortedNodes = [...t.nodes3D].sort((a, b) => a.screenZ - b.screenZ);

      // 8. Draw 3D Stellar Nodes
      sortedNodes.forEach(node => {
        const isHovered = t.hoveredNodeId === node.id;
        const isFocused = t.focusedNodeId === node.id;
        const isSelected = selectedInspectorNode?.id === node.id;
        const isHub = node.isHub;
        const isInSpotlight = spotlightSet.size === 0 || spotlightSet.has(node.id);

        const depthAlpha = Math.max(0.2, Math.min(1, (node.screenZ + 420) / 720));
        const alphaMultiplier = isInSpotlight ? 1 : 0.2;
        const r = node.screenRadius * (isHovered || isFocused || isSelected ? 1.45 : 1);

        // A. Planetary / Stellar Orbital Ring for Hubs
        if (isHub && isInSpotlight) {
          const ringRadius = r * 2.3;
          const ringTilt = (node.originX + node.originZ) * 0.01 + timeTick;
          ctx.strokeStyle = hexToRgba(node.color, 0.45 * depthAlpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(node.screenX, node.screenY, ringRadius, ringRadius * 0.4, ringTilt, 0, Math.PI * 2);
          ctx.stroke();
        }

        // B. Pulsing Corona Aura for Hubs, Selected, or Hovered Nodes
        if ((isHub || isHovered || isFocused || isSelected) && isInSpotlight) {
          const haloRadius = r * (isHovered || isSelected ? 3.5 : 2.5);
          const haloGrad = ctx.createRadialGradient(
            node.screenX,
            node.screenY,
            r * 0.3,
            node.screenX,
            node.screenY,
            haloRadius
          );
          haloGrad.addColorStop(0, hexToRgba(node.color, 0.6 * depthAlpha * alphaMultiplier));
          haloGrad.addColorStop(1, hexToRgba(node.color, 0));

          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // C. 3D Stellar Core Gradient Shading
        const sphereGrad = ctx.createRadialGradient(
          node.screenX - r * 0.35,
          node.screenY - r * 0.35,
          r * 0.08,
          node.screenX,
          node.screenY,
          r
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, node.color);
        sphereGrad.addColorStop(1, hexToRgba(node.color, depthAlpha * 0.95 * alphaMultiplier));

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, r, 0, Math.PI * 2);
        ctx.fill();

        // D. Stellar Border Ring / Selection Indicator
        if (isHovered || isSelected || isFocused) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 9;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = hexToRgba(node.color, 0.85 * alphaMultiplier);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // E. Text Label Rendering (Anti-aliased monospace)
        const isClose = node.screenZ > -40;
        if ((isHovered || isFocused || isSelected || isHub || (isClose && node.degree >= 3)) && isInSpotlight) {
          const fontSize = Math.max(9, Math.min(13, 10 * (node.screenRadius / 6)));
          ctx.font = `${isHovered || isSelected ? 'bold ' : ''}${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Text Contrast Backdrop Shadow
          ctx.fillStyle = isDark ? '#000000' : '#ffffff';
          ctx.fillText(node.label, node.screenX + 1, node.screenY + r + 4 + 1);
          ctx.fillText(node.label, node.screenX - 1, node.screenY + r + 4 - 1);

          ctx.fillStyle = isHovered || isSelected
            ? '#ffffff'
            : isDark
            ? hexToRgba('#f1f5f9', depthAlpha * alphaMultiplier)
            : hexToRgba('#0f172a', depthAlpha * alphaMultiplier);
          ctx.fillText(node.label, node.screenX, node.screenY + r + 4);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [autoRotate, rotationSpeed, showPulses, showStarfield, showCoreGlow, isDark, nodeAdjacency, selectedInspectorNode, hexToRgba]);

  // Mouse & Touch Drag Interaction Handlers
  const handleMouseDown = (e) => {
    const t = transformRef.current;
    t.isDragging = true;
    t.startX = e.clientX;
    t.startY = e.clientY;
    t.lastMouseX = e.clientX;
    t.lastMouseY = e.clientY;
  };

  const handleMouseMove = (e) => {
    const t = transformRef.current;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (t.isDragging) {
      const deltaX = e.clientX - t.lastMouseX;
      const deltaY = e.clientY - t.lastMouseY;

      t.targetRotY += deltaX * 0.007;
      t.targetRotX += deltaY * 0.007;
      t.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, t.targetRotX));

      t.lastMouseX = e.clientX;
      t.lastMouseY = e.clientY;
    } else {
      let found = null;
      for (let i = t.nodes3D.length - 1; i >= 0; i--) {
        const node = t.nodes3D[i];
        const dist = Math.hypot(mouseX - node.screenX, mouseY - node.screenY);
        if (dist <= node.screenRadius + 8) {
          found = node;
          break;
        }
      }

      if (found) {
        if (t.hoveredNodeId !== found.id) {
          t.hoveredNodeId = found.id;
          setHoveredNode(found);
        }
      } else {
        if (t.hoveredNodeId !== null) {
          t.hoveredNodeId = null;
          setHoveredNode(null);
        }
      }
    }
  };

  const handleMouseUp = () => {
    transformRef.current.isDragging = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const t = transformRef.current;
    const zoomDelta = e.deltaY < 0 ? 1.15 : 0.85;
    t.targetZoom = Math.max(0.4, Math.min(3.2, t.targetZoom * zoomDelta));
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  const handleCanvasClick = (e) => {
    const t = transformRef.current;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = t.nodes3D.length - 1; i >= 0; i--) {
      const node = t.nodes3D[i];
      const dist = Math.hypot(mouseX - node.screenX, mouseY - node.screenY);
      if (dist <= node.screenRadius + 8) {
        playClickSound();
        t.focusedNodeId = node.id;
        setSelectedInspectorNode(node);
        return;
      }
    }

    t.focusedNodeId = null;
    setSelectedInspectorNode(null);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const t = transformRef.current;
      t.isDragging = true;
      t.lastMouseX = touch.clientX;
      t.lastMouseY = touch.clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const t = transformRef.current;
      if (t.isDragging) {
        const deltaX = touch.clientX - t.lastMouseX;
        const deltaY = touch.clientY - t.lastMouseY;
        t.targetRotY += deltaX * 0.007;
        t.targetRotX += deltaY * 0.007;
        t.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, t.targetRotX));
        t.lastMouseX = touch.clientX;
        t.lastMouseY = touch.clientY;
      }
    }
  };

  // Reset Camera Position
  const handleResetCamera = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetRotX = 0.38;
    t.targetRotY = 0;
    t.targetZoom = 1;
    t.focusedNodeId = null;
    setSelectedInspectorNode(null);
    setZoomLevel(100);
  };

  const handleZoomIn = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetZoom = Math.min(3.2, t.targetZoom * 1.25);
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  const handleZoomOut = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetZoom = Math.max(0.4, t.targetZoom * 0.8);
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return filteredNodes
      .filter(n => n.label.toLowerCase().includes(q) || (n.folder && n.folder.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [filteredNodes, searchQuery]);

  // Compute backlinks & outgoing links for selected inspector node
  const inspectorLinks = useMemo(() => {
    if (!selectedInspectorNode) return { incoming: [], outgoing: [] };
    const nodeId = selectedInspectorNode.id;
    const incoming = [];
    const outgoing = [];

    (graphData.links || []).forEach(l => {
      if (l.target === nodeId) incoming.push(l.source);
      if (l.source === nodeId) outgoing.push(l.target);
    });

    return { incoming, outgoing };
  }, [selectedInspectorNode, graphData]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[620px] sm:h-[680px] lg:h-[740px] rounded-2xl border transition-all duration-300 overflow-hidden select-none flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none bg-[#04060e] h-screen'
          : isDark
          ? 'border-slate-800/80 bg-gradient-to-br from-[#050711] via-[#090d1a] to-[#03050c] shadow-2xl'
          : 'border-slate-200/90 bg-slate-900 shadow-xl'
      }`}
    >
      {/* Background Subtle Starfield Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Floating Glass HUD Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 flex-wrap pointer-events-none">
        {/* Left: 3D Galaxy Telemetry Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 shadow-lg">
          <div className="relative flex items-center justify-center shrink-0">
            <Orbit className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white leading-normal flex items-center gap-1.5">
                <span>3D Galactic Knowledge Cosmos</span>
              </h3>
              <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30 leading-none">
                Logarithmic Spiral Disk
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-tight">
              {filteredNodes.length} Stellar Nodes • {filteredLinks.length} Neural Vectors • {zoomLevel}% Zoom
            </p>
          </div>
        </div>

        {/* Center/Right: In-Graph Quick Search with Fly-To */}
        <div className="pointer-events-auto relative flex-1 max-w-[240px] sm:max-w-[280px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari & hyper-jump ke bintang..."
              className="w-full bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-30 flex flex-col gap-1 animate-fadeIn">
              {searchResults.map(res => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchNode(res)}
                  className="px-2.5 py-1.5 rounded-lg text-left text-xs font-mono text-slate-300 hover:text-white hover:bg-indigo-600/20 border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-2 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: res.color }} />
                    <span className="truncate">{res.label}</span>
                  </div>
                  <Crosshair className="w-3 h-3 text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Interactive Camera Controls Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-lg">
          {/* Orbit Rotation Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setAutoRotate(!autoRotate);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer leading-none ${
              autoRotate
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title={autoRotate ? 'Pause Galactic Orbit' : 'Resume Galactic Orbit'}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-purple-400" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoRotate ? 'Orbiting' : 'Paused'}</span>
          </button>

          {/* Visual Effects & Settings Dropdown Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowSettingsDropdown(!showSettingsDropdown);
            }}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              showSettingsDropdown
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Galactic Visual Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Perspective */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Reset Galactic Perspective"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Galaxy'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Visual FX Settings Dropdown Panel (Top Right) */}
      {showSettingsDropdown && (
        <div className="absolute top-16 right-4 z-30 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl flex flex-col gap-3 min-w-[220px] animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Galactic FX Controls</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSettingsDropdown(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Galactic Core Glow Toggle */}
          <label className="flex items-center justify-between gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <span>Galactic Core Glow</span>
            <input
              type="checkbox"
              checked={showCoreGlow}
              onChange={(e) => setShowCoreGlow(e.target.checked)}
              className="rounded accent-purple-500"
            />
          </label>

          {/* Synaptic Light Pulses Toggle */}
          <label className="flex items-center justify-between gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <span>Synaptic Pulses</span>
            <input
              type="checkbox"
              checked={showPulses}
              onChange={(e) => setShowPulses(e.target.checked)}
              className="rounded accent-purple-500"
            />
          </label>

          {/* Starfield Ambient Particles Toggle */}
          <label className="flex items-center justify-between gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <span>Cosmic Starfield</span>
            <input
              type="checkbox"
              checked={showStarfield}
              onChange={(e) => setShowStarfield(e.target.checked)}
              className="rounded accent-purple-500"
            />
          </label>

          {/* Orbit Velocity Multiplier */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-400">Orbit Velocity</span>
            <div className="flex items-center gap-1">
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setRotationSpeed(speed)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    rotationSpeed === speed
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Category Filter Pills (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 flex-wrap max-w-[75%] bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setSelectedFolder('All');
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center justify-center leading-none ${
            selectedFolder === 'All'
              ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Domains ({graphData.nodes?.length || 0})
        </button>

        {graphData.categories?.map(cat => {
          const isSelected = selectedFolder === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedFolder(cat.name);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border leading-none ${
                isSelected
                  ? 'bg-slate-800 text-white font-bold border-indigo-400 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Holographic Node Inspector Card Drawer (Right Side) */}
      {selectedInspectorNode && (
        <div className="absolute top-20 right-4 z-30 p-4 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col gap-3 w-[280px] sm:w-[320px] max-h-[80%] overflow-y-auto custom-scrollbar animate-fadeIn pointer-events-auto">
          {/* Header with Close */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-flex items-center justify-center"
              style={{
                backgroundColor: hexToRgba(selectedInspectorNode.color, 0.2),
                color: selectedInspectorNode.color,
                border: `1px solid ${hexToRgba(selectedInspectorNode.color, 0.4)}`
              }}
            >
              {selectedInspectorNode.folder}
            </span>
            <button
              type="button"
              onClick={() => setSelectedInspectorNode(null)}
              className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Node Title & Degree */}
          <div>
            <h4 className="text-sm font-mono font-bold text-white leading-snug">
              {selectedInspectorNode.label}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-purple-300">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>{selectedInspectorNode.degree} Connections / Wikilinks</span>
            </div>
          </div>

          {/* Incoming & Outgoing Links Overview */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Connected Vectors</span>
              <span className="text-indigo-400 font-bold">
                {inspectorLinks.incoming.length + inspectorLinks.outgoing.length} Total
              </span>
            </div>

            {/* Outgoing links chips */}
            {inspectorLinks.outgoing.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-slate-500">Outgoing:</span>
                <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                  {inspectorLinks.outgoing.map(targetId => (
                    <span key={targetId} className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                      {targetId.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {selectedInspectorNode.tags && selectedInspectorNode.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-slate-800/80">
              {selectedInspectorNode.tags.map(t => (
                <span key={t} className="text-[10px] font-mono text-purple-400/90">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Action: Open in Vault Reader */}
          <button
            type="button"
            onClick={() => {
              playSuccessSound();
              if (onNodeClick) {
                onNodeClick(selectedInspectorNode);
              }
            }}
            className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(99,102,241,0.35)] transition-all cursor-pointer active:scale-95"
          >
            <span>Buka & Baca Catatan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hovered Node Tooltip (Bottom Right tooltip if no inspector selected) */}
      {hoveredNode && !selectedInspectorNode && (
        <div className="absolute bottom-4 right-4 z-20 p-3.5 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-[0_0_24px_rgba(0,0,0,0.6)] flex flex-col gap-1.5 min-w-[220px] max-w-[300px] animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <span
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase inline-flex items-center justify-center leading-none"
              style={{
                backgroundColor: hexToRgba(hoveredNode.color, 0.15),
                color: hoveredNode.color,
                borderColor: hexToRgba(hoveredNode.color, 0.3)
              }}
            >
              {hoveredNode.folder}
            </span>
            <span className="text-[10px] font-mono text-purple-300 font-semibold leading-none">
              {hoveredNode.degree} Wikilinks
            </span>
          </div>

          <h4 className="text-xs font-mono font-bold text-white truncate">
            {hoveredNode.label}
          </h4>

          <div className="text-[9px] font-mono pt-1 flex items-center gap-1 justify-end text-indigo-300">
            <span>Klik untuk inspeksi bintang</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {filteredNodes.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-slate-400 font-mono text-xs gap-3 bg-slate-950/60 backdrop-blur-sm">
          <Sparkles className="w-8 h-8 animate-spin text-purple-400 opacity-80" />
          <span>Memetakan Galaksi 3D Knowledge Cosmos...</span>
        </div>
      )}

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}
