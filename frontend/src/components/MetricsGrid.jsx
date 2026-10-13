import { useMemo } from 'react'
import { Activity, Database, MapPin, Minus, ShieldAlert, Siren, TrendingDown, TrendingUp } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { formatNumber, formatPercent } from '../utils/format'
import { getTierStyle } from '../utils/risk'

const ACCENTS = {
  cyan: { icon: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', glow: 'from-cyan-400/15' },
  indigo: { icon: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300', glow: 'from-indigo-400/15' },
  red: { icon: 'border-red-500/30 bg-red-500/10 text-red-300', glow: 'from-red-400/15' },
  amber: { icon: 'border-amber-500/30 bg-amber-500/10 text-amber-300', glow: 'from-amber-400/15' },
  emerald: { icon: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', glow: 'from-emerald-400/15' },
}

function TrendBadge({ value }) {
  const n = Number(value)
  if (value === null || value === undefined || !Number.isFinite(n)) return null
  const flat = Math.abs(n) < 0.05
  const up = n > 0
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown
  // For crime counts, rising is bad (red) and falling is good (green).
  const tone = flat
    ? 'border-slate-500/30 bg-slate-500/10 text-slate-300'
    : up
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {formatPercent(n)}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, trend, accent = 'cyan', loading, className = '', children }) {
  const a = ACCENTS[accent]
  return (
    <GlassCard as="article" className={`relative overflow-hidden p-5 ${className}`}>
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${a.glow} to-transparent opacity-70`}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className={`grid h-10 w-10 place-items-center rounded-xl border ${a.icon}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          {!loading && <TrendBadge value={trend} />}
        </div>
        <p className="mt-4 text-sm text-slate-400">{label}</p>
        {loading ? (
          <div className="mt-2 space-y-2">
            <div className="h-8 w-3/4 animate-pulse rounded-md bg-slate-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/70" />
          </div>
        ) : (
          <>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-white" title={String(value)}>
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
            {children}
          </>
        )}
      </div>
    </GlassCard>
  )
}

export default function MetricsGrid({ summary, risk, loading }) {
  const stats = useMemo(() => {
    let latestTotal = 0
    let latestWithGrowth = 0
    let previousWithGrowth = 0
    let atRisk = 0

    risk.forEach((row) => {
      const cases = Number(row.latest_year_cases) || 0
      latestTotal += cases
      const growth = Number(row.yoy_growth_percent)
      if (Number.isFinite(growth) && growth > -100) {
        latestWithGrowth += cases
        previousWithGrowth += cases / (1 + growth / 100)
      }
      if (row.risk_tier === 'Critical' || row.risk_tier === 'High') atRisk += 1
    })

    const statewideYoy =
      previousWithGrowth > 0 ? ((latestWithGrowth - previousWithGrowth) / previousWithGrowth) * 100 : null

    const topName = summary?.highest_risk_district?.toLowerCase()
    const topRow = topName ? risk.find((r) => r.district?.toLowerCase() === topName) : null

    return { latestTotal, statewideYoy, atRisk, topRow }
  }, [risk, summary])

  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        icon={Database}
        label="Total recorded cases"
        value={formatNumber(summary?.total_cases)}
        sub="Across all years in the dataset"
        accent="cyan"
        loading={loading}
      />
      <KpiCard
        icon={Activity}
        label="Latest-year cases"
        value={formatNumber(stats.latestTotal)}
        sub="Statewide, vs. previous year"
        trend={stats.statewideYoy}
        accent="indigo"
        loading={loading}
      />
      <KpiCard
        icon={MapPin}
        label="Highest-risk district"
        value={summary?.highest_risk_district ?? '—'}
        trend={stats.topRow?.yoy_growth_percent}
        accent="red"
        loading={loading}
      >
        {stats.topRow && (
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
              getTierStyle(stats.topRow.risk_tier).badge
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${getTierStyle(stats.topRow.risk_tier).dot}`} />
            {stats.topRow.risk_tier}
          </span>
        )}
      </KpiCard>
      <KpiCard
        icon={ShieldAlert}
        label="Districts at High / Critical"
        value={formatNumber(stats.atRisk)}
        sub={`of ${formatNumber(risk.length)} assessed`}
        accent="amber"
        loading={loading}
      />
      <KpiCard
        icon={Siren}
        label="Most common crime"
        value={summary?.most_common_crime ?? '—'}
        sub="By recorded case count"
        accent="emerald"
        loading={loading}
        className="sm:col-span-2 xl:col-span-1"
      />
    </section>
  )
}
