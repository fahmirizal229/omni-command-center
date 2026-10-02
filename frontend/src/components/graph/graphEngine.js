/**
 * @file graphEngine.js
 * @description Pure Math, 3D Spherical Fibonacci Projection, Spatial Grid Hash Indexing,
 * Raycasting and Geometry Algorithms for 3D Knowledge Graph Visualization.
 */

/**
 * Fast Hex to RGBA conversion with memory-safe cache.
 * @param {string} hex - Hex color string (#fff, #ffffff)
 * @param {number} alpha - Alpha transparency 0-1
 * @param {Map<string, string>} [cache] - Optional cache instance
 * @returns {string} RGBA CSS color string
 */
export function hexToRgba(hex, alpha = 1, cache = null) {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  const key = `${hex}_${alpha.toFixed(2)}`;
  if (cache && cache.has(key)) return cache.get(key);

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
  if (cache && cache.size < 600) {
    cache.set(key, res);
  }
  return res;
}

/**
 * Builds 3D coordinates on a Fibonacci Sphere with folder cluster orientation.
 * @param {Array<object>} nodes - Filtered knowledge nodes
 * @param {Function} getNodeColor - Color resolution callback
 * @returns {{ nodes3D: Array<object>, globeRadius: number }}
 */
export function calculateFibonacciSphereLayout(nodes, getNodeColor) {
  if (!nodes || nodes.length === 0) {
    return { nodes3D: [], globeRadius: 320 };
  }

  const N = nodes.length;
  const nodes3D = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
  const globeRadius = Math.min(420, Math.max(260, 220 + Math.sqrt(N) * 9.5));

  const folderAngles = {};
  const uniqueFolders = [...new Set(nodes.map(n => n.folder))];
  uniqueFolders.forEach((fld, idx) => {
    folderAngles[fld] = (idx / uniqueFolders.length) * Math.PI * 2;
  });

  nodes.forEach((node, i) => {
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

  return { nodes3D, globeRadius };
}

/**
 * Projects a 3D coordinate point to 2D Canvas viewport space with perspective scale.
 * @param {number} x3d - Origin X
 * @param {number} y3d - Origin Y
 * @param {number} z3d - Origin Z
 * @param {object} transform - Transform state (rotX, rotY, zoom)
 * @param {number} cx - Center X of canvas
 * @param {number} cy - Center Y of canvas
 * @param {number} [fov=540] - Field of view
 * @param {number} [cameraDistance=700] - Distance of camera from origin
 * @returns {{ sx: number, sy: number, sz: number, scale: number, depth: number }}
 */
export function project3DPoint(x3d, y3d, z3d, transform, cx, cy, fov = 540, cameraDistance = 700) {
  const cosX = Math.cos(transform.rotX);
  const sinX = Math.sin(transform.rotX);
  const cosY = Math.cos(transform.rotY);
  const sinY = Math.sin(transform.rotY);

  const x1 = x3d * cosY + z3d * sinY;
  const z1 = -x3d * sinY + z3d * cosY;
  const y2 = y3d * cosX - z1 * sinX;
  const z2 = y3d * sinX + z1 * cosX;

  const depth = cameraDistance + z2 * transform.zoom;
  const scale = depth > 10 ? (fov / depth) * transform.zoom : 0.01;
  return {
    sx: cx + x1 * scale,
    sy: cy + y2 * scale,
    sz: z2,
    scale,
    depth
  };
}

/**
 * Rebuilds Spatial Hash Grid for O(1) Raycasting & Mouse Hit Testing.
 * @param {Array<object>} nodes3D - Projected 3D nodes
 * @param {number} cellSize - Spatial grid cell width & height (standard: 45px)
 * @returns {Map<string, Array<object>>}
 */
export function buildSpatialGrid(nodes3D, cellSize = 45) {
  const grid = new Map();
  nodes3D.forEach(node => {
    const cellX = Math.floor(node.screenX / cellSize);
    const cellY = Math.floor(node.screenY / cellSize);
    const cellKey = `${cellX}_${cellY}`;
    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey).push(node);
  });
  return grid;
}

/**
 * Finds the nearest node under the cursor using 2D Spatial Hash Grid raycasting.
 * @param {number} mouseX - Relative mouse X coordinate
 * @param {number} mouseY - Relative mouse Y coordinate
 * @param {Map<string, Array<object>>} spatialGrid - Spatial Hash Grid
 * @param {number} cellSize - Grid cell size
 * @returns {object|null} Clicked or hovered node, or null
 */
export function raycastNodeAtScreen(mouseX, mouseY, spatialGrid, cellSize = 45) {
  if (!spatialGrid || spatialGrid.size === 0) return null;
  const cellX = Math.floor(mouseX / cellSize);
  const cellY = Math.floor(mouseY / cellSize);

  let closest = null;
  let minDistance = Infinity;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx}_${cellY + dy}`;
      const cellNodes = spatialGrid.get(key);
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
}
