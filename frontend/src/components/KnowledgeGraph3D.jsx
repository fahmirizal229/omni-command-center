/**
 * @file KnowledgeGraph3D.jsx
 * @description High-Performance Hardware-Accelerated 3D Interactive Knowledge Globe Canvas.
 * Real 3D Spherical Fibonacci Projection with continuous orbital rotation, manual drag tilt,
 * adaptive Level of Detail (LOD), graphics performance presets (Eco, Balanced, Cinematic),
 * Spatial Grid Hash Indexing (O(1) hit testing for 700+ nodes), batched link path rendering,
 * Pre-rendered GPU Sprite Texture Caching, slide-over glass drawer, and Focus Spotlight.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  Search,
  Globe,
  X,
  BookOpen,
  CornerDownRight,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Tag,
  FileText,
  Loader2,
  ChevronRight,
  Settings,
  Sliders,
  Filter
} from 'lucide-react';
import { api } from '../api';
import { playClickSound, playSwitchSound, playSuccessSound } from '../utils/soundEffects';

export function KnowledgeGraph3D({
  graphData = { nodes: [], links: [], categories: [] },
  onNodeClick,
  onOpenInExplorer,
  folderThemes = {},
  isDark = true
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 3D Viewport controls state
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1); // 0.5x, 1x, 2x
  const [showGlobeRings, setShowGlobeRings] = useState(true);
  const [showPulses, setShowPulses] = useState(true);
  const [showHalos, setShowHalos] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Graphics & Performance Optimization Modes: 'eco' | 'balanced' | 'cinematic'
  const [perfPreset, setPerfPreset] = useState('balanced');
  const [hideCodeAst, setHideCodeAst] = useState(false); // Default: FALSE (Show ALL 700+ nodes)
  const [labelMode, setLabelMode] = useState('hubs'); // 'all' | 'hubs' | 'hover'
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Slide-over Glass Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDrawerNode, setSelectedDrawerNode] = useState(null);
  const [drawerNoteDetail, setDrawerNoteDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [copiedWikilink, setCopiedWikilink] = useState(false);

  // 3D Camera, Spatial Index & Transform State Ref
  const transformRef = useRef({
    rotX: 0.22,
    rotY: 0,
    velRotX: 0,
    velRotY: 0.003,
    targetRotX: 0.22,
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
    focusedNeighborIds: new Set(),
    searchMatchedIds: new Set(),
    nodes3D: [],
    links3D: [],
    particles: [],
    pulses: [],
    globeRadius: 320,
    tick: 0,
    // Spatial Hash Grid for O(1) hover & click raycasting
    spatialGrid: new Map(),
    gridCellSize: 45
  });

  // Color mapper helper
  const getNodeColor = useCallback((folder) => {
    if (folderThemes[folder]?.color) return folderThemes[folder].color;
    return '#6366f1'; // Indigo fallback
  }, [folderThemes]);

  // Fast Hex to RGBA Cache
  const rgbaCache = useRef(new Map());
  const hexToRgba = useCallback((hex, alpha = 1) => {
    if (!hex) return `rgba(99, 102, 241, ${alpha})`;
    const key = `${hex}_${alpha.toFixed(2)}`;
    if (rgbaCache.current.has(key)) return rgbaCache.current.get(key);

    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const res = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    if (rgbaCache.current.size < 600) {
      rgbaCache.current.set(key, res);
    }
    return res;
  }, []);

  // Pre-rendered 3D Sphere Offscreen Canvas Sprite Cache (GPU Ultra-Fast Blitting)
  const spriteCache = useRef(new Map());
  const getSphereSprite = useCallback((color) => {
    if (!color) color = '#6366f1';
    if (spriteCache.current.has(color)) return spriteCache.current.get(color);

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

    spriteCache.current.set(color, canvas);
    return canvas;
  }, []);

  // Filter nodes & links based on folder selection & Code AST filter
  const { filteredNodes, filteredLinks, totalAstCount } = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return { filteredNodes: [], filteredLinks: [], totalAstCount: 0 };
    }

    const rawNodes = graphData.nodes;
    const astCount = rawNodes.filter(n => n.path?.includes('Graphify') || n.path?.includes('Clippings/Graphify-Scripts')).length;

    let nodes = rawNodes;
    if (hideCodeAst) {
      nodes = nodes.filter(n => !n.path?.includes('Graphify') && !n.path?.includes('Clippings/Graphify-Scripts'));
    }

    if (selectedFolder !== 'All') {
      nodes = nodes.filter(n => n.folder === selectedFolder);
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = (graphData.links || []).filter(
      l => nodeIds.has(l.source) && nodeIds.has(l.target)
    );

    return { filteredNodes: nodes, filteredLinks: links, totalAstCount: astCount };
  }, [graphData, selectedFolder, hideCodeAst]);

  // Search Results & live matched ID set
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return filteredNodes.filter(n => 
      n.label.toLowerCase().includes(q) || 
      n.id.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, filteredNodes]);

  // Live update search matches in transform ref without removing other nodes
  useEffect(() => {
    const t = transformRef.current;
    if (!searchQuery.trim()) {
      t.searchMatchedIds = new Set();
      return;
    }

    const q = searchQuery.toLowerCase();
    const matched = new Set();
    let bestMatchNode = null;

    filteredNodes.forEach(n => {
      if (n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)) {
        matched.add(n.id);
        if (!bestMatchNode) {
          bestMatchNode = n;
        }
      }
    });

    t.searchMatchedIds = matched;

    if (bestMatchNode) {
      t.hoveredNodeId = bestMatchNode.id;
      setHoveredNode(bestMatchNode);

      const target3D = t.nodes3D.find(n => n.id === bestMatchNode.id);
      if (target3D) {
        const theta = Math.atan2(target3D.originX, target3D.originZ);
        t.targetRotY = -theta;
        t.targetRotX = 0.15;
      }
    }
  }, [searchQuery, filteredNodes]);

  // Select Node Handler: opens Slide-over Glass Drawer & activates Focus Spotlight
  const handleSelectNode = useCallback(async (node) => {
    if (!node) return;
    playClickSound();

    const nodeMap = new Map();
    transformRef.current.nodes3D.forEach(n => nodeMap.set(n.id, n));

    const neighbors = new Set();
    const connectedIncoming = [];
    const connectedOutgoing = [];

    (graphData.links || []).forEach(l => {
      if (l.source === node.id) {
        neighbors.add(l.target);
        const targetNode = nodeMap.get(l.target) || graphData.nodes.find(n => n.id === l.target);
        if (targetNode && !connectedOutgoing.some(o => o.id === targetNode.id)) {
          connectedOutgoing.push(targetNode);
        }
      } else if (l.target === node.id) {
        neighbors.add(l.source);
        const sourceNode = nodeMap.get(l.source) || graphData.nodes.find(n => n.id === l.source);
        if (sourceNode && !connectedIncoming.some(i => i.id === sourceNode.id)) {
          connectedIncoming.push(sourceNode);
        }
      }
    });

    const t = transformRef.current;
    t.focusedNodeId = node.id;
    t.focusedNeighborIds = neighbors;
    setFocusedNode(node);
    setSelectedDrawerNode({
      ...node,
      connectedIncoming,
      connectedOutgoing
    });
    setDrawerOpen(true);

    const target3D = t.nodes3D.find(n => n.id === node.id);
    if (target3D) {
      const theta = Math.atan2(target3D.originX, target3D.originZ);
      t.targetRotY = -theta;
      t.targetRotX = 0.15;
      t.targetZoom = Math.max(1.25, Math.min(2.0, t.targetZoom));
      setZoomLevel(Math.round(t.targetZoom * 100));
    }

    setDrawerLoading(true);
    try {
      const detail = await api.getNoteDetail(node.path || node.id);
      setDrawerNoteDetail(detail);
    } catch (err) {
      console.error('Failed to load note detail for drawer preview:', err);
      setDrawerNoteDetail(null);
    } finally {
      setDrawerLoading(false);
    }

    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [graphData, onNodeClick]);

  // Close Drawer & Clear Focus Spotlight
  const handleCloseDrawer = useCallback(() => {
    playClickSound();
    setDrawerOpen(false);
    setSelectedDrawerNode(null);
    setDrawerNoteDetail(null);
    const t = transformRef.current;
    t.focusedNodeId = null;
    t.focusedNeighborIds = new Set();
    setFocusedNode(null);
  }, []);

  // Copy Wikilink helper
  const handleCopyWikilink = (title) => {
    playClickSound();
    navigator.clipboard.writeText(`[[${title}]]`);
    setCopiedWikilink(true);
    setTimeout(() => setCopiedWikilink(false), 2000);
  };

  // Open Full Note in Vault Explorer
  const handleOpenInExplorer = (node) => {
    playSuccessSound();
    if (onOpenInExplorer) {
      onOpenInExplorer(node);
    } else if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Apply Performance Preset
  const handleSetPreset = (preset) => {
    playClickSound();
    setPerfPreset(preset);
    if (preset === 'eco') {
      setShowGlobeRings(false);
      setShowPulses(false);
      setShowHalos(false);
      setLabelMode('hover');
    } else if (preset === 'balanced') {
      setShowGlobeRings(true);
      setShowPulses(true);
      setShowHalos(true);
      setLabelMode('hubs');
    } else if (preset === 'cinematic') {
      setShowGlobeRings(true);
      setShowPulses(true);
      setShowHalos(true);
      setLabelMode('all');
    }
  };

  // Initialize 3D Spherical Globe Layout (Fibonacci Sphere projection)
  useEffect(() => {
    if (!filteredNodes || filteredNodes.length === 0) {
      transformRef.current.nodes3D = [];
      transformRef.current.links3D = [];
      transformRef.current.particles = [];
      transformRef.current.pulses = [];
      return;
    }

    const N = filteredNodes.length;
    const nodes3D = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    // Spacious globe radius calibrated for 700+ nodes
    const globeRadius = Math.min(420, Math.max(260, 220 + Math.sqrt(N) * 9.5));
    transformRef.current.globeRadius = globeRadius;

    const folderAngles = {};
    const uniqueFolders = [...new Set(filteredNodes.map(n => n.folder))];
    uniqueFolders.forEach((fld, idx) => {
      folderAngles[fld] = (idx / uniqueFolders.length) * Math.PI * 2;
    });

    filteredNodes.forEach((node, i) => {
      const y = 1 - (i / (N - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const clusterAngle = folderAngles[node.folder] || 0;
      const theta = phi * i + clusterAngle * 0.25;

      const degree = node.val || 1;
      const r = globeRadius * (0.92 + Math.min(0.18, (1 / Math.sqrt(degree)) * 0.1));

      const x = Math.cos(theta) * radiusAtY * r;
      const z = Math.sin(theta) * radiusAtY * r;
      const nodeY = y * r;

      const baseRadius = N > 200
        ? Math.max(2.8, Math.min(7.5, 2.8 + Math.log2(degree + 1) * 1.1))
        : Math.max(4.5, Math.min(13, 4.5 + Math.log2(degree + 1) * 2.0));

      nodes3D.push({
        ...node,
        originX: x,
        originY: nodeY,
        originZ: z,
        x,
        y: nodeY,
        z,
        screenX: 0,
        screenY: 0,
        screenRadius: 4,
        screenZ: 0,
        degree,
        color: getNodeColor(node.folder),
        baseRadius
      });
    });

    // Ambient space dust particles (scaled by performance preset)
    const particles = [];
    const particleCount = perfPreset === 'eco' ? 12 : perfPreset === 'balanced' ? 30 : 60;
    for (let p = 0; p < particleCount; p++) {
      const pR = globeRadius * (1.15 + Math.random() * 0.8);
      const pTheta = Math.random() * Math.PI * 2;
      const pPhi = Math.acos(2 * Math.random() - 1);
      particles.push({
        x: pR * Math.sin(pPhi) * Math.cos(pTheta),
        y: pR * Math.sin(pPhi) * Math.sin(pTheta),
        z: pR * Math.cos(pPhi),
        size: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.30 + 0.10,
        color: p % 3 === 0 ? '#93c5fd' : p % 3 === 1 ? '#c084fc' : '#818cf8'
      });
    }

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

    // Synaptic Pulses
    const pulses = [];
    if (showPulses && links3D.length > 0) {
      const maxPulses = perfPreset === 'eco' ? 6 : perfPreset === 'balanced' ? 12 : 20;
      const pulseCount = Math.min(maxPulses, Math.max(4, Math.floor(links3D.length * 0.15)));
      for (let i = 0; i < pulseCount; i++) {
        const link = links3D[Math.floor(Math.random() * links3D.length)];
        pulses.push({
          link,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.005,
          size: 1.6 + Math.random() * 1.0,
          color: link.source.color
        });
      }
    }

    transformRef.current.nodes3D = nodes3D;
    transformRef.current.links3D = links3D;
    transformRef.current.particles = particles;
    transformRef.current.pulses = pulses;
  }, [filteredNodes, filteredLinks, getNodeColor, perfPreset, showPulses]);

  // Main 3D Canvas Render & Interaction Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
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

    const FOV = 540;
    const CAMERA_DISTANCE = 700;

    const render = () => {
      const t = transformRef.current;
      t.tick += 1;

      if (autoRotate && !t.isDragging && !t.focusedNodeId) {
        t.targetRotY += 0.0022 * rotationSpeed;
      }
      t.rotX += (t.targetRotX - t.rotX) * 0.12;
      t.rotY += (t.targetRotY - t.rotY) * 0.12;
      t.zoom += (t.targetZoom - t.zoom) * 0.12;

      // Background fill
      ctx.fillStyle = isDark ? '#060812' : '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const cosX = Math.cos(t.rotX);
      const sinX = Math.sin(t.rotX);
      const cosY = Math.cos(t.rotY);
      const sinY = Math.sin(t.rotY);

      const projectPoint = (x3d, y3d, z3d) => {
        const x1 = x3d * cosY + z3d * sinY;
        const z1 = -x3d * sinY + z3d * cosY;
        const y2 = y3d * cosX - z1 * sinX;
        const z2 = y3d * sinX + z1 * cosX;

        const depth = CAMERA_DISTANCE + z2 * t.zoom;
        const scale = depth > 10 ? (FOV / depth) * t.zoom : 0.01;
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          sz: z2,
          scale,
          depth
        };
      };

      // 1. Globe Atmosphere Glow (Balanced / Cinematic)
      if (perfPreset !== 'eco') {
        const globeGlowR = t.globeRadius * 1.05 * t.zoom * (FOV / CAMERA_DISTANCE);
        const pulseBreath = 1 + Math.sin(t.tick * 0.03) * 0.02;

        const globeBackGlow = ctx.createRadialGradient(cx, cy, globeGlowR * 0.3, cx, cy, globeGlowR * 1.25 * pulseBreath);
        globeBackGlow.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
        globeBackGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.025)');
        globeBackGlow.addColorStop(1, 'rgba(6, 8, 18, 0)');
        ctx.fillStyle = globeBackGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, globeGlowR * 1.25 * pulseBreath, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Globe Latitude Wireframe Rings
      if (showGlobeRings && t.globeRadius > 0 && perfPreset !== 'eco') {
        const R = t.globeRadius * 0.98;
        const segments = 32;
        const latitudes = [-0.5, 0, 0.5];
        latitudes.forEach(sinLat => {
          const cosLat = Math.sqrt(1 - sinLat * sinLat);
          const yRing = sinLat * R;
          const rRing = cosLat * R;
          const isEquator = sinLat === 0;

          ctx.beginPath();
          let started = false;
          for (let s = 0; s <= segments; s++) {
            const angle = (s / segments) * Math.PI * 2;
            const px = Math.cos(angle) * rRing;
            const pz = Math.sin(angle) * rRing;
            const proj = projectPoint(px, yRing, pz);

            if (!started) {
              ctx.moveTo(proj.sx, proj.sy);
              started = true;
            } else {
              ctx.lineTo(proj.sx, proj.sy);
            }
          }
          ctx.strokeStyle = isEquator ? 'rgba(99, 102, 241, 0.20)' : 'rgba(99, 102, 241, 0.06)';
          ctx.lineWidth = isEquator ? 0.9 : 0.5;
          ctx.stroke();
        });
      }

      // 3. Ambient Dust & Star Particles
      if (perfPreset !== 'eco') {
        t.particles.forEach(p => {
          const proj = projectPoint(p.x, p.y, p.z);
          if (proj.depth > 20) {
            const alpha = Math.max(0.05, Math.min(0.35, p.alpha * (proj.scale * 1.2)));
            ctx.fillStyle = hexToRgba(p.color, alpha);
            ctx.beginPath();
            ctx.arc(proj.sx, proj.sy, p.size * Math.max(0.5, proj.scale), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 4. Project 3D Nodes & Rebuild Spatial Grid Index
      const cellSize = t.gridCellSize || 45;
      const grid = new Map();

      t.nodes3D.forEach(node => {
        const proj = projectPoint(node.originX, node.originY, node.originZ);
        node.screenX = proj.sx;
        node.screenY = proj.sy;
        node.screenZ = proj.sz;
        node.screenRadius = Math.max(2.2, node.baseRadius * proj.scale);

        // Put into 2D spatial hash grid
        const cellX = Math.floor(proj.sx / cellSize);
        const cellY = Math.floor(proj.sy / cellSize);
        const cellKey = `${cellX}_${cellY}`;
        if (!grid.has(cellKey)) {
          grid.set(cellKey, []);
        }
        grid.get(cellKey).push(node);
      });
      t.spatialGrid = grid;

      const hasSearchMatches = t.searchMatchedIds && t.searchMatchedIds.size > 0;
      const hasFocus = !!t.focusedNodeId;
      const focusedNeighbors = t.focusedNeighborIds || new Set();

      // 5. High-Performance Batched Link Vectors
      // Pre-allocated classification without array allocation overhead
      const normalLinks = [];
      const specialLinks = [];

      const linkLen = t.links3D.length;
      for (let i = 0; i < linkLen; i++) {
        const link = t.links3D[i];
        const s = link.source;
        const tg = link.target;

        const isFocusedLink = hasFocus && (
          (s.id === t.focusedNodeId && focusedNeighbors.has(tg.id)) ||
          (tg.id === t.focusedNodeId && focusedNeighbors.has(s.id))
        );

        const isHoverConnected = !hasFocus && (
          t.hoveredNodeId === s.id ||
          t.hoveredNodeId === tg.id
        );

        const isSearchConnected =
          hasSearchMatches &&
          (t.searchMatchedIds.has(s.id) || t.searchMatchedIds.has(tg.id));

        if (isFocusedLink || isHoverConnected || isSearchConnected) {
          specialLinks.push({ link, isFocusedLink, isHoverConnected, isSearchConnected });
        } else {
          normalLinks.push(link);
        }
      }

      // Pass 5a: Single batched path for all normal links (Draws 2000+ links in 1 stroke!)
      if (normalLinks.length > 0) {
        ctx.beginPath();
        const nLen = normalLinks.length;
        for (let i = 0; i < nLen; i++) {
          const l = normalLinks[i];
          ctx.moveTo(l.source.screenX, l.source.screenY);
          ctx.lineTo(l.target.screenX, l.target.screenY);
        }
        const linkAlpha = hasFocus ? 0.02 : hasSearchMatches ? 0.04 : 0.09;
        ctx.strokeStyle = `rgba(99, 102, 241, ${linkAlpha})`;
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }

      // Pass 5b: Dedicated paths for highlighted special links
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

      // 6. Draw Synaptic Photon Pulses
      if (showPulses && t.pulses.length > 0) {
        t.pulses.forEach(pulse => {
          pulse.progress += pulse.speed;
          if (pulse.progress > 1) {
            pulse.progress = 0;
            if (t.links3D.length > 0) {
              pulse.link = t.links3D[Math.floor(Math.random() * t.links3D.length)];
              pulse.color = pulse.link.source.color;
            }
          }

          if (pulse.link && pulse.link.source && pulse.link.target) {
            const s = pulse.link.source;
            const tg = pulse.link.target;
            const isPulseInFocus = !hasFocus || (s.id === t.focusedNodeId || tg.id === t.focusedNodeId);

            if (isPulseInFocus) {
              const px = s.screenX + (tg.screenX - s.screenX) * pulse.progress;
              const py = s.screenY + (tg.screenY - s.screenY) * pulse.progress;
              const pz = s.screenZ + (tg.screenZ - s.screenZ) * pulse.progress;

              const depthAlpha = Math.max(0.2, Math.min(1, (pz + 350) / 700));
              ctx.fillStyle = hexToRgba(pulse.color, depthAlpha);
              ctx.beginPath();
              ctx.arc(px, py, pulse.size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }

      // 7. Sort Nodes by Depth for correct occlusion
      const sortedNodes = [...t.nodes3D].sort((a, b) => a.screenZ - b.screenZ);

      // 8. Draw 3D Nodes using Pre-Rendered GPU Texture Sprites (60 FPS Turbo)
      sortedNodes.forEach(node => {
        const isFocused = t.focusedNodeId === node.id;
        const isNeighbor = hasFocus && focusedNeighbors.has(node.id);
        const isHovered = t.hoveredNodeId === node.id;
        const isSearchMatched = hasSearchMatches && t.searchMatchedIds.has(node.id);
        const isHub = node.degree >= 5;

        let depthAlpha = Math.max(0.22, Math.min(1, (node.screenZ + 400) / 700));

        if (hasFocus) {
          if (!isFocused && !isNeighbor) {
            depthAlpha *= 0.12;
          }
        } else if (hasSearchMatches && !isSearchMatched && !isHovered) {
          depthAlpha *= 0.30;
        }

        const isHighlighted = isFocused || isNeighbor || isHovered || isSearchMatched;
        const r = node.screenRadius * (isFocused ? 1.5 : isNeighbor ? 1.25 : isHighlighted ? 1.3 : 1);
        const isDistant = node.screenZ < -40 && !isHighlighted && !isHub;

        // Halo Aura for highlighted / hub nodes
        if (showHalos && (isFocused || isNeighbor || isHovered || isSearchMatched || (isHub && node.screenZ > -10))) {
          const haloRadius = r * (isFocused ? 3.4 : isNeighbor ? 2.5 : isHovered ? 2.8 : 1.9);
          const haloColor = isFocused ? '#c084fc' : isNeighbor ? '#38bdf8' : isSearchMatched ? '#38bdf8' : node.color;

          if (perfPreset === 'cinematic' || isFocused || isHovered) {
            const haloGrad = ctx.createRadialGradient(
              node.screenX,
              node.screenY,
              r * 0.3,
              node.screenX,
              node.screenY,
              haloRadius
            );
            haloGrad.addColorStop(0, hexToRgba(haloColor, (isFocused ? 0.7 : 0.40) * depthAlpha));
            haloGrad.addColorStop(1, hexToRgba(haloColor, 0));
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, haloRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Target focus pulse ring
          if (isFocused || isHovered || isSearchMatched) {
            const ringPulse = r * (1.5 + Math.sin(t.tick * 0.08) * 0.25);
            ctx.strokeStyle = hexToRgba(isFocused ? '#c084fc' : isSearchMatched ? '#38bdf8' : '#ffffff', 0.85 * depthAlpha);
            ctx.lineWidth = isFocused ? 1.5 : 1.0;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, ringPulse, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Fast GPU Sprite Blit (Instant texture rendering without expensive createRadialGradient)
        if (isDistant || perfPreset === 'eco') {
          ctx.fillStyle = hexToRgba(node.color, depthAlpha * 0.80);
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const sprite = getSphereSprite(node.color);
          ctx.save();
          ctx.globalAlpha = depthAlpha;
          ctx.drawImage(sprite, node.screenX - r, node.screenY - r, r * 2, r * 2);
          ctx.restore();

          if (isFocused || isNeighbor || isHovered) {
            ctx.strokeStyle = isFocused ? '#ffffff' : isNeighbor ? '#38bdf8' : '#ffffff';
            ctx.lineWidth = isFocused ? 1.8 : 1.3;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Text Label Rendering based on labelMode & LOD
        const isFront = node.screenZ > -20;
        const shouldShowLabel =
          isFocused ||
          isNeighbor ||
          isHovered ||
          isSearchMatched ||
          (labelMode === 'all' && isFront && !hasFocus && node.screenRadius >= 3.2) ||
          (labelMode === 'hubs' && isHub && isFront && !hasFocus);

        if (shouldShowLabel) {
          const fontSize = Math.max(9, Math.min(12, 9.5 * (node.screenRadius / 5.0)));
          ctx.font = `${isFocused || isHovered || isSearchMatched ? 'bold ' : ''}${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          ctx.fillStyle = '#000000';
          ctx.fillText(node.label, node.screenX + 1, node.screenY + r + 3 + 1);

          ctx.fillStyle = isFocused
            ? '#f8fafc'
            : isNeighbor
            ? '#38bdf8'
            : isHovered
            ? '#ffffff'
            : isSearchMatched
            ? '#38bdf8'
            : hexToRgba('#f1f5f9', depthAlpha);
          ctx.fillText(node.label, node.screenX, node.screenY + r + 3);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [autoRotate, rotationSpeed, showGlobeRings, showPulses, showHalos, isDark, perfPreset, labelMode]);

  // Spatial Grid Raycasting Helper (O(1) lookup instead of O(N) linear scan!)
  const findNodeAtScreen = useCallback((mouseX, mouseY) => {
    const t = transformRef.current;
    const cellSize = t.gridCellSize || 45;
    const cellX = Math.floor(mouseX / cellSize);
    const cellY = Math.floor(mouseY / cellSize);

    let closest = null;
    let minDistance = Infinity;

    // Check target cell and 8 adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx}_${cellY + dy}`;
        const cellNodes = t.spatialGrid.get(key);
        if (cellNodes) {
          for (let i = cellNodes.length - 1; i >= 0; i--) {
            const node = cellNodes[i];
            const dist = Math.hypot(mouseX - node.screenX, mouseY - node.screenY);
            const hitRadius = node.screenRadius + 8;
            if (dist <= hitRadius && dist < minDistance) {
              minDistance = dist;
              closest = node;
            }
          }
        }
      }
    }
    return closest;
  }, []);

  // Mouse & Touch Drag Handlers
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
      // Ultra-Fast O(1) Spatial Hash Grid Hit Testing
      const found = findNodeAtScreen(mouseX, mouseY);
      if (found) {
        if (t.hoveredNodeId !== found.id) {
          t.hoveredNodeId = found.id;
          setHoveredNode(found);
        }
      } else {
        if (t.hoveredNodeId !== null && !searchQuery.trim()) {
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
    t.targetZoom = Math.max(0.4, Math.min(3.0, t.targetZoom * zoomDelta));
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  const handleCanvasClick = (e) => {
    const t = transformRef.current;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedNode = findNodeAtScreen(mouseX, mouseY);

    if (clickedNode) {
      handleSelectNode(clickedNode);
    } else {
      if (t.focusedNodeId) {
        handleCloseDrawer();
      }
    }
  };

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

  const handleResetCamera = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetRotX = 0.22;
    t.targetRotY = 0;
    t.targetZoom = 1;
    setZoomLevel(100);
    if (drawerOpen) {
      handleCloseDrawer();
    }
  };

  const handleZoomIn = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetZoom = Math.min(3.0, t.targetZoom * 1.25);
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  const handleZoomOut = () => {
    playClickSound();
    const t = transformRef.current;
    t.targetZoom = Math.max(0.4, t.targetZoom * 0.8);
    setZoomLevel(Math.round(t.targetZoom * 100));
  };

  const handleSearchSelect = (node) => {
    if (!node) return;
    setSearchQuery('');
    handleSelectNode(node);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[600px] sm:h-[660px] lg:h-[720px] rounded-2xl border transition-all duration-300 overflow-hidden select-none flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none bg-[#05070e] h-screen'
          : isDark
          ? 'border-slate-800/80 bg-gradient-to-br from-[#060810] via-[#090d18] to-[#04060c] shadow-2xl'
          : 'border-slate-200/90 bg-slate-900 shadow-xl'
      }`}
    >
      {/* Background Ambience Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top Floating Glass HUD Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 flex-wrap pointer-events-none">
        {/* Left: 3D Telemetry Badge & Live Node Counter */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800/80 shadow-lg">
          <div className="relative flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-indigo-400 animate-spin-slow" style={{ animationDuration: '18s' }} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white leading-normal flex items-center gap-1.5">
                <span>3D Knowledge Globe</span>
              </h3>
              <span className={`inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border leading-none ${
                perfPreset === 'eco' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : perfPreset === 'balanced'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {perfPreset === 'eco' ? '⚡ Eco 60 FPS' : perfPreset === 'balanced' ? '🚀 Balanced LOD' : '✨ Cinematic'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-tight">
              {filteredNodes.length} Nodes • {filteredLinks.length} Links {hideCodeAst && totalAstCount > 0 && <span className="text-indigo-400">({totalAstCount} Code AST Filtered)</span>}
            </p>
          </div>
        </div>

        {/* Center: Search Node in Globe */}
        <div className="pointer-events-auto relative hidden md:block w-64 lg:w-72">
          <div className="relative flex items-center w-full h-9">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari simpul (FTS5 / hover)..."
              className="w-full h-full bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl pl-9 pr-8 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all flex items-center leading-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  transformRef.current.searchMatchedIds = new Set();
                  transformRef.current.hoveredNodeId = null;
                  setHoveredNode(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 divide-y divide-slate-900">
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSearchSelect(res)}
                  className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-indigo-600/25 text-slate-200 hover:text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="truncate flex-1">{res.label}</span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-md uppercase font-bold shrink-0 inline-flex items-center justify-center leading-none"
                    style={{ backgroundColor: hexToRgba(res.color, 0.2), color: res.color }}
                  >
                    {res.folder}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Interactive Camera & Graphics Settings Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-lg">
          {/* Quick Toggle: Filter Code AST */}
          {totalAstCount > 0 && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setHideCodeAst(!hideCodeAst);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer leading-none ${
                hideCodeAst
                  ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  : 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 font-bold'
              }`}
              title={hideCodeAst ? 'Tampilkan Semua AST Node (Banyak)' : 'Sembunyikan 640+ Code AST (Khusus Core)'}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hideCodeAst ? 'Core Only' : 'All + AST (700+)'}</span>
            </button>
          )}

          {/* Orbit Rotation Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setAutoRotate(!autoRotate);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer leading-none ${
              autoRotate && !drawerOpen
                ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title={autoRotate ? 'Pause Orbit' : 'Resume Orbit'}
          >
            {autoRotate && !drawerOpen ? <Pause className="w-3.5 h-3.5 text-indigo-400" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoRotate && !drawerOpen ? 'Orbit' : 'Paused'}</span>
          </button>

          {/* Settings & Optimization Modal Toggle Button ⚙️ */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowSettingsModal(!showSettingsModal);
            }}
            className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer leading-none ${
              showSettingsModal
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="Pengaturan Kualitas & Performa Grafis 3D (Anti-Lag)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Controls */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center leading-none"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center leading-none"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center leading-none"
            title="Reset Perspective & Spotlight"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center leading-none"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3D GRAPH SETTINGS & PERFORMANCE OPTIMIZATION MODAL (HUD POPUP)           */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="absolute top-16 right-4 z-40 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.8)] p-4 flex flex-col gap-3.5 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                3D Graph Performance & Tuning
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
              Preset Performa & Kualitas:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'eco', label: '⚡ Eco (Fast)', desc: 'Max FPS' },
                { id: 'balanced', label: '🚀 Balanced', desc: 'Optimal' },
                { id: 'cinematic', label: '✨ Ultra', desc: 'Full FX' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSetPreset(p.id)}
                  className={`p-2 rounded-xl text-center font-mono transition-all border ${
                    perfPreset === p.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[11px]">{p.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60 text-xs font-mono text-slate-300">
            {/* Filter Graphify / Code AST */}
            {totalAstCount > 0 && (
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold block text-white">Filter Node Code AST</span>
                  <span className="text-[10px] text-slate-400 block">Sembunyikan {totalAstCount} node Graphify</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideCodeAst}
                  onChange={(e) => setHideCodeAst(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>
            )}

            {/* Wireframe Rings */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span>Cincin Latitude / Longitude 3D</span>
              <input
                type="checkbox"
                checked={showGlobeRings}
                onChange={(e) => setShowGlobeRings(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Synaptic Pulses */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span>Efek Pulsa Aliran Neural (Pulses)</span>
              <input
                type="checkbox"
                checked={showPulses}
                onChange={(e) => setShowPulses(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Glowing Halos */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span>Aura & Glow Halos Simpul</span>
              <input
                type="checkbox"
                checked={showHalos}
                onChange={(e) => setShowHalos(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Label Mode */}
          <div className="pt-1 border-t border-slate-800/60">
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
              Tampilan Label Teks Dokumen:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'hover', label: 'Hover Saja' },
                { id: 'hubs', label: 'Hubs Utama' },
                { id: 'all', label: 'Semua Depan' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setLabelMode(m.id);
                  }}
                  className={`py-1 px-2 rounded-lg text-[10px] font-mono transition-all border ${
                    labelMode === m.id
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Category Filter Pills (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 flex-wrap max-w-[80%] bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto">
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
          All Domains ({filteredNodes.length})
        </button>

        {graphData.categories?.filter(c => hideCodeAst ? c.name !== 'Clippings' || filteredNodes.some(n => n.folder === c.name) : true).map(cat => {
          const isSelected = selectedFolder === cat.name;
          const count = filteredNodes.filter(n => n.folder === cat.name).length;
          if (count === 0 && selectedFolder !== cat.name) return null;

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
              <span className="opacity-60 text-[9px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Hovered Node Glass Card (Bottom Right - Hidden if drawer is open) */}
      {hoveredNode && !drawerOpen && (
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

          {hoveredNode.tags && hoveredNode.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800/80">
              {hoveredNode.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] font-mono text-purple-400/80">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="text-[9px] font-mono pt-1 flex items-center gap-1 justify-end text-indigo-300">
            <span>Klik untuk inspeksi simpul</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER GLASS DRAWER (Cluster Spotlight & Quick Preview)                */}
      {/* ========================================================================= */}
      {drawerOpen && selectedDrawerNode && (
        <div className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[380px] md:w-[420px] max-w-full bg-slate-950/92 backdrop-blur-2xl border-l border-slate-800/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-slideLeft pointer-events-auto">
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-start justify-between gap-3 bg-slate-900/40">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase inline-flex items-center justify-center leading-none border"
                  style={{
                    backgroundColor: hexToRgba(selectedDrawerNode.color, 0.15),
                    color: selectedDrawerNode.color,
                    borderColor: hexToRgba(selectedDrawerNode.color, 0.35)
                  }}
                >
                  {selectedDrawerNode.folder}
                </span>
                <span className="text-[10px] font-mono text-purple-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Spotlight Active</span>
                </span>
              </div>
              <h3 className="text-sm font-mono font-bold text-white leading-snug break-words">
                {selectedDrawerNode.label}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                {selectedDrawerNode.path || selectedDrawerNode.id}
              </p>
            </div>

            {/* Close Drawer Button */}
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Tutup Panel & Reset Spotlight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-indigo-300 font-semibold">
                {selectedDrawerNode.degree} Total Wikilinks
              </span>
              {drawerNoteDetail?.word_count && (
                <span className="text-slate-400">
                  {drawerNoteDetail.word_count} words
                </span>
              )}
            </div>
            {selectedDrawerNode.tags && selectedDrawerNode.tags.length > 0 && (
              <div className="flex items-center gap-1 truncate max-w-[150px]">
                {selectedDrawerNode.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-purple-400">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            {/* Quick Content Preview */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cuplikan Catatan</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyWikilink(selectedDrawerNode.label)}
                  className="text-[10px] font-mono text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Salin Wikilink"
                >
                  {copiedWikilink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWikilink ? 'Tersalin' : 'Copy Wikilink'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs font-mono leading-relaxed text-slate-300 max-h-48 overflow-y-auto custom-scrollbar">
                {drawerLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span className="text-[10px]">Memuat isi dokumen...</span>
                  </div>
                ) : drawerNoteDetail?.content ? (
                  <div className="whitespace-pre-wrap line-clamp-10 font-sans text-xs text-slate-300">
                    {drawerNoteDetail.content.slice(0, 700)}
                    {drawerNoteDetail.content.length > 700 && '...'}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">
                    {selectedDrawerNode.preview || 'Tidak ada preview teks untuk catatan ini.'}
                  </p>
                )}
              </div>
            </div>

            {/* Neighborhood Cluster Explorer: Connected Links */}
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Simpul Terhubung ({((selectedDrawerNode.connectedOutgoing?.length || 0) + (selectedDrawerNode.connectedIncoming?.length || 0))})</span>
                </span>
                <span className="text-[10px] font-mono text-purple-400 font-semibold">
                  Klik untuk Jelajah
                </span>
              </div>

              {/* Outgoing Wikilinks */}
              {selectedDrawerNode.connectedOutgoing && selectedDrawerNode.connectedOutgoing.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                    <span>Outgoing Links ({selectedDrawerNode.connectedOutgoing.length})</span>
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {selectedDrawerNode.connectedOutgoing.map((outNode) => (
                      <button
                        key={outNode.id}
                        type="button"
                        onClick={() => handleSelectNode(outNode)}
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800/80 hover:border-indigo-500/40 text-left flex items-center justify-between gap-2 group transition-all cursor-pointer"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: outNode.color || '#818cf8' }}
                          />
                          <span className="text-xs font-mono text-slate-200 group-hover:text-indigo-300 truncate">
                            {outNode.label}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Backlinks */}
              {selectedDrawerNode.connectedIncoming && selectedDrawerNode.connectedIncoming.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                    <CornerDownRight className="w-3 h-3 text-indigo-400" />
                    <span>Backlinks ({selectedDrawerNode.connectedIncoming.length})</span>
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {selectedDrawerNode.connectedIncoming.map((inNode) => (
                      <button
                        key={inNode.id}
                        type="button"
                        onClick={() => handleSelectNode(inNode)}
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800/80 hover:border-purple-500/40 text-left flex items-center justify-between gap-2 group transition-all cursor-pointer"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: inNode.color || '#c084fc' }}
                          />
                          <span className="text-xs font-mono text-slate-200 group-hover:text-purple-300 truncate">
                            {inNode.label}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedDrawerNode.connectedOutgoing || selectedDrawerNode.connectedOutgoing.length === 0) &&
                (!selectedDrawerNode.connectedIncoming || selectedDrawerNode.connectedIncoming.length === 0) && (
                  <p className="text-[11px] font-mono text-slate-500 italic p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
                    Simpul ini berdiri mandiri tanpa tautan ke catatan lain.
                  </p>
                )}
            </div>
          </div>

          {/* Drawer Bottom Action Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenInExplorer(selectedDrawerNode)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka di Vault Explorer</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {filteredNodes.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-slate-400 font-mono text-xs gap-3 bg-slate-950/60 backdrop-blur-sm">
          <Sparkles className="w-8 h-8 animate-spin text-purple-400 opacity-80" />
          <span>Memetakan Simpul 3D Knowledge Globe...</span>
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
