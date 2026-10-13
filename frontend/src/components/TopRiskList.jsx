import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { EmptyBlock, LoadingBlock } from './ui/States'
import { compareByRisk, getTierStyle } from '../utils/risk'
import { formatNumber, formatPercent } from '../utils/format'

export default function TopRiskList({ risk, loading, onSelect }) {
  const top = useMemo(() => [...risk].sort(compareByRisk).slice(0, 6), [risk])

  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Highest-risk districts</h2>
      <p className="mt-1 text-sm text-slate-400">Top 6 by tier, then YoY growth.</p>

      <div className="mt-4">
        {loading ? (
          <LoadingBlock className="h-56" />
        ) : !top.length ? (
          <EmptyBlock title="Nothing to show yet" message="Risk data will appear after upload." className="h-56" />
        ) : (
          <ul className="space-y-2">
            {top.map((row, index) => {
              const style = getTierStyle(row.risk_tier)
              const growth = Number(row.yoy_growth_percent)
              return (
                <li key={row.district}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.district)}
                    className={`group flex w-full items-center gap-3 rounded-xl border border-slate-800 border-l-4 bg-slate-900/50 px-3.5 py-3 text-left transition-colors hover:bg-slate-800/60 ${style.bar}`}
                  >
                    <span className="w-5 font-mono text-xs text-slate-500">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{row.district}</span>
                      <span className="text-xs text-slate-400">
                        {formatNumber(row.latest_year_cases)} cases ·{' '}
                        <span className={growth > 0 ? 'text-red-300' : growth < 0 ? 'text-emerald-300' : ''}>
                          {formatPercent(row.yoy_growth_percent)}
                        </span>
                      </span>
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                      {row.risk_tier}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300"
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  )
}
