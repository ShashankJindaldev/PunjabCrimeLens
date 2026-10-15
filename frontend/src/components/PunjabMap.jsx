import { useCallback, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Pane,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { AlertTriangle } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from './ui/States'
import punjabDistricts from '../data/punjab-districts.json'
import { districtKey, getDistrictCoords, getLabelName } from '../utils/districts'
import { getGeoBounds, getGeometryArea, getLabelPoint } from '../utils/geo'
import { TIER_ORDER, getTierStyle } from '../utils/risk'
import { formatNumber, formatPercent } from '../utils/format'

const NO_DATA_COLOR = '#475569'

/* ---------- Static boundary data (computed once at module load) ---------- */

const PUNJAB_BOUNDS = getGeoBounds(punjabDistricts)

const BOUNDARIES = punjabDistricts.features
  .filter((feature) => feature.geometry)
  .map((feature) => {
    const name = feature.properties.district
    return {
      key: districtKey(name),
      name,
      feature,
      area: getGeometryArea(feature.geometry),
      labelPoint: getLabelPoint(feature.geometry),
    }
  })

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function buildLabelIcon(text, below = false) {
  return L.divIcon({
    className: below ? 'district-label district-label--below' : 'district-label',
    html: `<span>${escapeHtml(text)}</span>`,
    iconSize: [0, 0],
  })
}

// Largest districts first, so they win when labels collide.
const POLYGON_LABELS = BOUNDARIES.filter((b) => b.labelPoint)
  .sort((a, b) => b.area - a.area)
  .map((b) => {
    const text = getLabelName(b.name)
    return { id: b.key, text, position: b.labelPoint, offsetY: 0, icon: buildLabelIcon(text) }
  })

/* ---------- Styling ---------- */

function polygonStyle(tier, hovered = false) {
  const hasData = Boolean(tier)
  return {
    color: '#e2e8f0',
    weight: hovered ? 2.5 : 1,
    opacity: hovered ? 0.95 : 0.45,
    fillColor: hasData ? getTierStyle(tier).color : NO_DATA_COLOR,
    fillOpacity: hasData ? (hovered ? 0.82 : 0.65) : 0.3,
    lineJoin: 'round',
  }
}

/* ---------- Shared popup body ---------- */

function DistrictPopup({ row, onViewForecast }) {
  const style = getTierStyle(row.risk_tier)
  return (
    <div className="min-w-44 space-y-1.5 text-sm">
      <div className="text-base font-semibold tracking-tight text-white">{row.district}</div>
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {row.risk_tier}
        </span>
      </div>
      <div className="mt-2 text-xs text-slate-300">
        Latest-year cases:{' '}
        <span className="font-semibold text-white">{formatNumber(row.latest_year_cases)}</span>
      </div>
      <div className="text-xs text-slate-300">
        YoY growth:{' '}
        <span className="font-semibold text-white">{formatPercent(row.yoy_growth_percent)}</span>
      </div>
      <button
        type="button"
        onClick={() => onViewForecast(row.district)}
        className="mt-2 w-full rounded border border-cyan-500/50 bg-cyan-500/10 px-2 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/20"
      >
        View forecast
      </button>
    </div>
  )
}

/* ---------- One district polygon ---------- */

function DistrictPolygon({ boundary, row, onViewForecast }) {
  const tier = row?.risk_tier
  const baseStyle = useMemo(() => polygonStyle(tier), [tier])
  const hoverStyle = useMemo(() => polygonStyle(tier, true), [tier])
  const handlers = useMemo(
    () => ({
      mouseover: (e) => {
        e.target.setStyle(hoverStyle)
        e.target.bringToFront?.()
      },
      mouseout: (e) => e.target.setStyle(baseStyle),
    }),
    [baseStyle, hoverStyle],
  )

  return (
    <GeoJSON data={boundary.feature} style={baseStyle} eventHandlers={handlers}>
      <Tooltip sticky direction="top" offset={[0, -6]}>
        {row ? `${row.district} · ${row.risk_tier}` : `${boundary.name} · No data`}
      </Tooltip>
      {row && (
        <Popup>
          <DistrictPopup row={row} onViewForecast={onViewForecast} />
        </Popup>
      )}
    </GeoJSON>
  )
}

/* ---------- Collision-aware district labels ---------- */

function DistrictLabels({ labels }) {
  const map = useMap()
  const [visible, setVisible] = useState(() => new Set())

  // Greedy placement in priority order: skip any label whose box overlaps one already placed.
  const recompute = useCallback(() => {
    const placed = []
    const next = new Set()
    labels.forEach((label) => {
      const p = map.latLngToContainerPoint(label.position)
      const w = label.text.length * 6.2 + 20
      const h = 22
      const cy = p.y + label.offsetY
      const box = { x1: p.x - w / 2, x2: p.x + w / 2, y1: cy - h / 2, y2: cy + h / 2 }
      const clash = placed.some(
        (b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1,
      )
      if (!clash) {
        placed.push(box)
        next.add(label.id)
      }
    })
    setVisible(next)
  }, [map, labels])

  useEffect(() => {
    recompute()
  }, [recompute])

  useMapEvents({ zoomend: recompute, resize: recompute })

  return (
    <>
      {labels
        .filter((label) => visible.has(label.id))
        .map((label) => (
          <Marker
            key={label.id}
            position={label.position}
            icon={label.icon}
            interactive={false}
            keyboard={false}
          />
        ))}
    </>
  )
}

/* ---------- Main component ---------- */

export default function PunjabMap({ risk, loading, error, onRetry, onViewForecast }) {
  const { rowByKey, markers, unplaceable, noDataCount, counts } = useMemo(() => {
    const rows = new Map()
    const tally = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    risk.forEach((row) => {
      rows.set(districtKey(row.district), row)
      if (tally[row.risk_tier] !== undefined) tally[row.risk_tier] += 1
    })

    const polygonKeys = new Set(BOUNDARIES.map((b) => b.key))
    const fallback = [] // API districts without a polygon -> small marker at district centre
    const missing = [] // no polygon AND no coordinates
    risk.forEach((row) => {
      if (polygonKeys.has(districtKey(row.district))) return
      const coords = getDistrictCoords(row.district)
      if (coords) fallback.push({ ...row, coords })
      else missing.push(row.district)
    })

    return {
      rowByKey: rows,
      markers: fallback,
      unplaceable: missing,
      noDataCount: BOUNDARIES.filter((b) => !rows.has(b.key)).length,
      counts: tally,
    }
  }, [risk])

  const labels = useMemo(
    () => [
      ...POLYGON_LABELS,
      ...markers.map((m) => {
        const text = getLabelName(m.district)
        return {
          id: `marker-${districtKey(m.district)}`,
          text,
          position: m.coords,
          offsetY: 18,
          icon: buildLabelIcon(text, true),
        }
      }),
    ],
    [markers],
  )

  return (
    <GlassCard className="border-slate-700/50 bg-slate-800/40 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">District risk map</h2>
        <p className="mt-1 text-xs text-slate-400">
          Districts are shaded by risk tier. Hover for a summary, click for details and the forecast.
        </p>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorBlock message={error} onRetry={onRetry} />
        ) : loading ? (
          <LoadingBlock label="Loading risk data..." className="h-[540px]" />
        ) : !risk.length ? (
          <EmptyBlock
            title="No risk data yet"
            message="Upload a dataset to see districts on the map."
            className="h-[540px]"
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="relative isolate overflow-hidden rounded-xl border border-slate-800/50 lg:col-span-2">
              <MapContainer
                bounds={PUNJAB_BOUNDS}
                boundsOptions={{ padding: [12, 12] }}
                zoomSnap={0.25}
                minZoom={7}
                scrollWheelZoom
                className="h-[540px] w-full"
>
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                  maxZoom={16}
                />

                {BOUNDARIES.map((boundary) => {
                  const row = rowByKey.get(boundary.key)
                  return (
                    <DistrictPolygon
                      // Key includes the data so polygons restyle and popups refresh after an upload.
                      key={`${boundary.key}-${row?.risk_tier ?? 'none'}-${row?.latest_year_cases ?? ''}-${row?.yoy_growth_percent ?? ''}`}
                      boundary={boundary}
                      row={row}
                      onViewForecast={onViewForecast}
                    />
                  )
                })}

                {/* Districts that have no polygon in the boundary file */}
                <Pane name="fallback-markers" style={{ zIndex: 450 }}>
                  {markers.map((m) => {
                    const style = getTierStyle(m.risk_tier)
                    return (
                      <CircleMarker
                        key={m.district}
                        center={m.coords}
                        radius={7}
                        pathOptions={{
                          color: '#f8fafc',
                          weight: 2,
                          fillColor: style.color,
                          fillOpacity: 0.95,
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -6]} sticky>
                          {m.district} · {m.risk_tier}
                        </Tooltip>
                        <Popup>
                          <DistrictPopup row={m} onViewForecast={onViewForecast} />
                        </Popup>
                      </CircleMarker>
                    )
                  })}
                </Pane>

                <DistrictLabels labels={labels} />
              </MapContainer>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-4">
                <h3 className="text-sm font-semibold tracking-tight text-white">Risk tiers</h3>
                <ul className="mt-3 space-y-2.5">
                  {TIER_ORDER.map((tier) => {
                    const style = getTierStyle(tier)
                    return (
                      <li key={tier} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2.5 text-slate-300">
                          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                          {tier}
                        </span>
                        <span className="font-mono text-slate-400">{counts[tier]}</span>
                      </li>
                    )
                  })}
                  {noDataCount > 0 && (
                    <li className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2.5 text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                        No data
                      </span>
                      <span className="font-mono text-slate-400">{noDataCount}</span>
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                Tiers compare districts on recorded-case counts and year-over-year growth. They are not a
                statement about the safety of an area or the people who live there.
              </p>

              {unplaceable.length > 0 && (
                <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  <p>
                    {unplaceable.join(', ')} couldn&apos;t be placed on the map. Add{' '}
                    {unplaceable.length > 1 ? 'them' : 'it'} to <code>utils/districts.js</code>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}