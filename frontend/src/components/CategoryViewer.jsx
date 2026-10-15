import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from './ui/States'
import { getErrorMessage, getCategories, isCancel } from '../api/client'
import { compareByRisk } from '../utils/risk'
import { formatNumber } from '../utils/format'

const ACCENT = '#f4a03a'

const SELECT_CLASS =
  'rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3.5 py-2.5 text-sm shadow-2xl backdrop-blur-xl">
      <p className="font-semibold text-white">{row.category}</p>
      <p className="mt-1 text-slate-300">
        Cases: <span className="font-semibold text-cyan-300">{formatNumber(row.cases)}</span>
      </p>
    </div>
  )
}

export default function CategoryViewer({ risk, riskLoading, district, onDistrictChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const districts = useMemo(
    () => [...new Set(risk.map((r) => r.district))].sort((a, b) => a.localeCompare(b)),
    [risk],
  )

  const defaultDistrict = useMemo(() => [...risk].sort(compareByRisk)[0]?.district ?? null, [risk])
  const active = district && districts.includes(district) ? district : defaultDistrict

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    getCategories(active, controller.signal)
      .then(setData)
      .catch((err) => {
        if (isCancel(err)) return
        setData(null)
        setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [active, retryKey])

  const chartData = data?.breakdown || []

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Categorical Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Total recorded volume distributed by specific crime classification.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category-district" className="text-xs font-medium text-slate-400">
            District
          </label>
          <select
            id="category-district"
            className={`${SELECT_CLASS} min-w-44`}
            value={active ?? ''}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={!districts.length}
          >
            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {riskLoading && !active ? (
          <LoadingBlock label="Loading districts..." className="h-[450px]" />
        ) : !active ? (
          <EmptyBlock
            title="No districts available yet"
            message="Upload a dataset (or start the backend) to generate analysis."
            className="h-[450px]"
          />
        ) : error ? (
          <ErrorBlock message={error} onRetry={() => setRetryKey((k) => k + 1)} />
        ) : !data ? (
          <LoadingBlock label={`Loading categories for ${active}...`} className="h-[450px]" />
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-950/50">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-label="Updating data" />
              </div>
            )}
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  stroke="#64748b" 
                  tick={{ fontSize: 11, fill: '#cbd5e1' }} 
                  width={140}
                />
                <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<ChartTooltip />} />
                <Bar dataKey="cases" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </GlassCard>
  )
}