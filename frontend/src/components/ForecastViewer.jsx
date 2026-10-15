import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Info, Loader2, Download } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from './ui/States'
import { getErrorMessage, getForecast, isCancel, exportIntelligenceReport } from '../api/client'
import { compareByRisk } from '../utils/risk'
import { formatNumber, formatPercent } from '../utils/format'

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const ACCENT = '#f4a03a'

const SELECT_CLASS =
  'rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30'

function fitQuality(r2) {
  if (!Number.isFinite(r2)) return { label: 'Unknown', tone: 'border-slate-500/30 bg-slate-500/10 text-slate-300' }
  if (r2 >= 0.8) return { label: 'Strong fit', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' }
  if (r2 >= 0.5) return { label: 'Moderate fit', tone: 'border-blue-500/30 bg-blue-500/10 text-blue-300' }
  return { label: 'Weak fit', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300' }
}

/** Merge historical + forecast into one series; the last historical point seeds the forecast line. */
function buildChartData(data) {
  if (!data) return []
  const historical = (data.historical ?? []).map((p) => ({ 
      year: p.year, 
      historical: p.cases,
      is_anomaly: p.is_anomaly,
      z_score: p.z_score
  }))
  const forecast = (data.forecast ?? []).map((p) => ({
    year: p.year,
    forecast: p.cases,
    band: [p.ci_lower, p.ci_upper],
  }))
  if (historical.length && forecast.length) {
    const last = historical[historical.length - 1]
    last.forecast = last.historical
    last.band = [last.historical, last.historical]
  }
  return [...historical, ...forecast]
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const isRecorded = row.historical !== undefined
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3.5 py-2.5 text-sm shadow-2xl backdrop-blur-xl">
      <p className="font-semibold text-white">{label}</p>
      {isRecorded ? (
        <>
            <p className="mt-1 text-slate-300">
            Recorded: <span className="font-semibold text-white">{formatNumber(row.historical)}</span>
            </p>
            {row.is_anomaly && (
                <p className="mt-1 text-xs font-semibold text-red-400">
                    ⚠️ Anomaly Detected (Z: {row.z_score > 0 ? '+' : ''}{row.z_score})
                </p>
            )}
        </>
      ) : (
        <>
          <p className="mt-1 text-slate-300">
            Forecast: <span className="font-semibold text-cyan-300">{formatNumber(row.forecast)}</span>
          </p>
          {row.band && (
            <p className="text-xs text-slate-400">
              Range: {formatNumber(row.band[0])} - {formatNumber(row.band[1])}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function ForecastViewer({ risk, riskLoading, district, onDistrictChange }) {
  const [years, setYears] = useState(5)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

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

    getForecast(active, years, controller.signal)
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
  }, [active, years, retryKey])

  const chartData = useMemo(() => buildChartData(data), [data])
  const lastHistorical = data?.historical?.at(-1)
  const lastForecast = data?.forecast?.at(-1)
  const change =
    lastHistorical && lastForecast && lastHistorical.cases > 0
      ? ((lastForecast.cases - lastHistorical.cases) / lastHistorical.cases) * 100
      : null
  const r2 = Number(data?.r2_score)
  const fit = fitQuality(r2)

  const handleExport = async () => {
    if (!active) return;
    try {
      setIsExporting(true);
      await exportIntelligenceReport(active, years); // Updated to pass years
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">ML crime forecast</h2>
            {data?.selected_model && (
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                    Model: {data.selected_model}
                </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Historical recorded cases vs. {data?.selected_model || 'ML'} projection, with confidence bounds.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="forecast-district" className="text-xs font-medium text-slate-400">
              District
            </label>
            <select
              id="forecast-district"
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
          <div className="flex flex-col gap-1">
            <label htmlFor="forecast-years" className="text-xs font-medium text-slate-400">
              Horizon
            </label>
            <select
              id="forecast-years"
              className={SELECT_CLASS}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              disabled={!districts.length}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} {y === 1 ? 'year' : 'years'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || !data || loading}
            className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {riskLoading && !active ? (
          <LoadingBlock label="Loading districts..." className="h-[360px]" />
        ) : !active ? (
          <EmptyBlock
            title="No districts available yet"
            message="Upload a dataset (or start the backend) to generate forecasts."
            className="h-[360px]"
          />
        ) : error ? (
          <ErrorBlock message={error} onRetry={() => setRetryKey((k) => k + 1)} />
        ) : !data ? (
          <LoadingBlock label={`Forecasting ${active}...`} className="h-[360px]" />
        ) : (
          <>
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-950/50">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-label="Updating forecast" />
                </div>
              )}
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(v) => Number(v).toLocaleString('en-IN')}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  {lastHistorical && (
                    <ReferenceLine
                      x={lastHistorical.year}
                      stroke="#475569"
                      strokeDasharray="4 4"
                      label={{ value: 'Forecast →', position: 'insideTopRight', fill: '#64748b', fontSize: 11 }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="band"
                    name="Confidence band"
                    stroke="none"
                    fill="url(#bandFill)"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="Historical"
                    stroke="#e2e8f0"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#e2e8f0', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="ML forecast"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Last recorded ({lastHistorical?.year ?? '-'})</p>
                <p className="mt-1 text-xl font-semibold text-white">{formatNumber(lastHistorical?.cases)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Projected ({lastForecast?.year ?? '-'})</p>
                <p className="mt-1 flex items-baseline gap-2 text-xl font-semibold text-cyan-300">
                  {formatNumber(lastForecast?.cases)}
                  {change !== null && (
                    <span className={`text-xs font-medium ${change > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                      {formatPercent(change)}
                    </span>
                  )}
                </p>
                {lastForecast && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Range {formatNumber(lastForecast.ci_lower)} - {formatNumber(lastForecast.ci_upper)}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Model R² score</p>
                <p className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xl font-medium text-white">
                    {Number.isFinite(r2) ? r2.toFixed(3) : '-'}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${fit.tone}`}>
                    {fit.label}
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              R² describes how well the model fits past years, not how accurate future values will be. 
              Confidence bounds widen with the horizon, so treat long-range figures as indicative only.
            </p>
          </>
        )}
      </div>
    </GlassCard>
  )
}