// Small, dependency-free geometry helpers for GeoJSON Polygon / MultiPolygon.

// Longitude degrees are shorter than latitude degrees at Punjab's latitude (~31°N).
const KX = Math.cos((31 * Math.PI) / 180)

function polygonsOf(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates
  return []
}

function ringArea(ring) {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return Math.abs(sum / 2) * KX
}

function inRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPolygon(x, y, rings) {
  if (!inRing(x, y, rings[0])) return false
  for (let k = 1; k < rings.length; k++) if (inRing(x, y, rings[k])) return false
  return true
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = (bx - ax) * KX
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : (((px - ax) * KX) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax * KX + dx * t
  const cy = ay + dy * t
  return Math.hypot(px * KX - cx, py - cy)
}

function distToRings(x, y, rings) {
  let min = Infinity
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const d = distToSegment(x, y, ring[j][0], ring[j][1], ring[i][0], ring[i][1])
      if (d < min) min = d
    }
  }
  return min
}

/** Total polygon area in (roughly) square degrees, used to prioritise labels. */
export function getGeometryArea(geometry) {
  return polygonsOf(geometry).reduce((total, rings) => {
    const holes = rings.slice(1).reduce((s, r) => s + ringArea(r), 0)
    return total + ringArea(rings[0]) - holes
  }, 0)
}

/**
 * Finds a label position that is guaranteed to sit inside the polygon, as far from its
 * edges as possible (a lightweight "pole of inaccessibility" via iterative grid search).
 * Returns [lat, lng] for Leaflet, or null.
 */
export function getLabelPoint(geometry) {
  const polys = polygonsOf(geometry)
  if (!polys.length) return null
  const rings = polys.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best))
  const outer = rings[0]

  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  outer.forEach(([x, y]) => {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  })

  let best = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, d: -1 }
  const N = 16
  for (let pass = 0; pass < 4; pass++) {
    const dx = (x1 - x0) / N
    const dy = (y1 - y0) / N
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const x = x0 + i * dx
        const y = y0 + j * dy
        if (!inPolygon(x, y, rings)) continue
        const d = distToRings(x, y, rings)
        if (d > best.d) best = { x, y, d }
      }
    }
    const halfX = (x1 - x0) / 4
    const halfY = (y1 - y0) / 4
    x0 = best.x - halfX
    x1 = best.x + halfX
    y0 = best.y - halfY
    y1 = best.y + halfY
  }
  return [best.y, best.x]
}

/** [[south, west], [north, east]] bounds of a FeatureCollection, for map.fitBounds. */
export function getGeoBounds(collection) {
  let s = Infinity
  let w = Infinity
  let n = -Infinity
  let e = -Infinity
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      if (c[1] < s) s = c[1]
      if (c[1] > n) n = c[1]
      if (c[0] < w) w = c[0]
      if (c[0] > e) e = c[0]
    } else c.forEach(walk)
  }
  collection.features.forEach((f) => f.geometry && walk(f.geometry.coordinates))
  return [
    [s, w],
    [n, e],
  ]
}