import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Search } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from './ui/States'
import { TIER_ORDER, TIER_RANK, getTierStyle } from '../utils/risk'
import { formatNumber, formatPercent } from '../utils/format'

function SortHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white ${
          active ? 'text-cyan-300' : 'text-slate-400'
        }`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </button>
    </th>
  )
}

export default function RiskMatrix({ risk, loading, error, onRetry, onViewForecast }) {
  const [sort, setSort] = useState({ key: 'risk_tier', dir: 'desc' })
  const [tierFilter, setTierFilter] = useState('All')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const tally = { All: risk.length, Critical: 0, High: 0, Medium: 0, Low: 0 }
    risk.forEach((r) => {
      if (tally[r.risk_tier] !== undefined) tally[r.risk_tier] += 1
    })
    return tally
  }, [risk])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mul = sort.dir === 'asc' ? 1 : -1
    return risk
      .filter((r) => (tierFilter === 'All' || r.risk_tier === tierFilter) && (!q || r.district.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort.key === 'district') return a.district.localeCompare(b.district) * mul
        const av = sort.key === 'risk_tier' ? TIER_RANK[a.risk_tier] ?? 0 : Number(a[sort.key]) || 0
        const bv = sort.key === 'risk_tier' ? TIER_RANK[b.risk_tier] ?? 0 : Number(b[sort.key]) || 0
        if (av !== bv) return (av - bv) * mul
        return a.district.localeCompare(b.district)
      })
  }, [risk, sort, tierFilter, query])

  const handleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'district' ? 'asc' : 'desc' },
    )
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Risk matrix</h2>
          <p className="mt-1 text-sm text-slate-400">
            Districts ranked by risk tier and year-over-year growth. Click a column to sort.
          </p>
        </div>
        <div className="relative">
          <label htmlFor="risk-search" className="sr-only">
            Search districts
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            id="risk-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search district…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 lg:w-64"
          />
        </div>
      </div>

      {/* Tier filters */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by risk tier">
        {['All', ...TIER_ORDER].map((tier) => {
          const active = tierFilter === tier
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={active}
              onClick={() => setTierFilter(tier)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {tier !== 'All' && <span className={`h-2 w-2 rounded-full ${getTierStyle(tier).dot}`} />}
              {tier}
              <span className="font-mono text-slate-500">{counts[tier]}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorBlock message={error} onRetry={onRetry} />
        ) : loading ? (
          <LoadingBlock label="Loading risk assessment…" className="h-64" />
        ) : !risk.length ? (
          <EmptyBlock title="No risk data yet" message="Upload a dataset to populate the matrix." className="h-64" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <SortHeader label="District" sortKey="district" sort={sort} onSort={handleSort} />
                  <SortHeader label="Latest-year cases" sortKey="latest_year_cases" sort={sort} onSort={handleSort} align="right" />
                  <SortHeader label="YoY growth" sortKey="yoy_growth_percent" sort={sort} onSort={handleSort} align="right" />
                  <SortHeader label="Risk tier" sortKey="risk_tier" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No districts match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const style = getTierStyle(row.risk_tier)
                  const growth = Number(row.yoy_growth_percent)
                  const growthTone = growth > 0 ? 'text-red-300' : growth < 0 ? 'text-emerald-300' : 'text-slate-300'
                  return (
                    <tr key={row.district} className="transition-colors hover:bg-slate-800/40">
                      <td className={`border-l-4 px-4 py-3 font-medium text-white ${style.bar}`}>{row.district}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        {formatNumber(row.latest_year_cases)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${growthTone}`}>
                        {formatPercent(row.yoy_growth_percent)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {row.risk_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewForecast(row.district)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/10"
                        >
                          Forecast
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Tiers are relative classifications of recorded-case counts and growth. They are not a judgment of
        how safe an area is or of the people who live there.
      </p>
    </GlassCard>
  )
}
