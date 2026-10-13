import { useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet'
import { AlertTriangle } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from './ui/States'
import { getDistrictCoords, PUNJAB_CENTER } from '../utils/districts'
import { TIER_ORDER, getTierStyle } from '../utils/risk'
import { formatNumber, formatPercent } from '../utils/format'

export default function PunjabMap({ risk, loading, error, onRetry, onViewForecast }) {
  const { markers, unmapped, counts } = useMemo(() => {
    const maxCases = Math.max(1, ...risk.map((r) => Number(r.latest_year_cases) || 0))
    const mapped = []
    const missing = []
    const tally = { Critical: 0, High: 0, Medium: 0, Low: 0 }

    risk.forEach((row) => {
      if (tally[row.risk_tier] !== undefined) tally[row.risk_tier] += 1
      const coords = getDistrictCoords(row.district)
      if (!coords) {
        missing.push(row.district)
        return
      }
      const cases = Number(row.latest_year_cases) || 0
      mapped.push({ ...row, coords, radius: 8 + Math.sqrt(cases / maxCases) * 20 })
    })

    // Draw large circles first so small ones stay clickable on top.
    mapped.sort((a, b) => b.radius - a.radius)
    return { markers: mapped, unmapped: missing, counts: tally }
  }, [risk])

  return (
    <GlassCard className="p-5 sm:p-6 bg-slate-800/40 border-slate-700/50">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">District risk map</h2>
        <p className="mt-1 text-xs text-slate-400">
          Circle colour shows risk tier; circle size reflects latest-year recorded cases. Positions are
          approximate district centres, not incident locations.
        </p>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorBlock message={error} onRetry={onRetry} />
        ) : loading ? (
          <LoadingBlock label="Loading risk data…" className="h-[540px]" />
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
                center={PUNJAB_CENTER}
                zoom={8}
                minZoom={6}
                scrollWheelZoom
                className="h-[540px] w-full"
              >
                {/* Free CARTO Dark Matter Tiles - No API Key Required */}
                <TileLayer
  		 url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
  		 attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
 	         maxZoom={16}
		  />
                {markers.map((m) => {
                  const style = getTierStyle(m.risk_tier)
                  return (
                    <CircleMarker
                      key={m.district}
                      center={m.coords}
                      radius={m.radius}
                      pathOptions={{
                        color: style.color,
                        fillColor: style.color,
                        fillOpacity: 0.4,
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -4]} sticky>
                        {m.district} · {m.risk_tier}
                      </Tooltip>
                      <Popup>
                        <div className="min-w-44 space-y-1.5 text-sm">
                          <div className="text-base font-semibold tracking-tight text-white">{m.district}</div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {m.risk_tier}
                          </span>
                          <div className="text-slate-300 text-xs mt-2">
                            Latest-year cases:{' '}
                            <span className="font-semibold text-white">{formatNumber(m.latest_year_cases)}</span>
                          </div>
                          <div className="text-slate-300 text-xs">
                            YoY growth:{' '}
                            <span className="font-semibold text-white">{formatPercent(m.yoy_growth_percent)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onViewForecast(m.district)}
                            className="mt-2 w-full rounded border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1.5 text-xs font-semibold text-cyan-400 transition-colors"
                          >
                            View forecast
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
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
                </ul>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                Tiers compare districts on recorded-case counts and year-over-year growth. They are not a
                statement about the safety of an area or the people who live there.
              </p>

              {unmapped.length > 0 && (
                <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  <p>
                    {unmapped.length} district name{unmapped.length > 1 ? 's' : ''} couldn&apos;t be placed
                    on the map: {unmapped.join(', ')}. Add them to <code>utils/districts.js</code>.
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
