import {
  Database,
  FlaskConical,
  LayoutDashboard,
  Map as MapIcon,
  Radar,
  Table2,
  TrendingUp,
  Upload,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { id: 'risk', label: 'Risk Matrix', icon: Table2 },
]

export default function Navbar({ activeTab, onTabChange, dataset, onUploadClick }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-indigo-500 shadow-[0_0_24px_-4px_rgba(34,211,238,0.7)]">
            <Radar className="h-5 w-5 text-slate-950" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">
              Punjab<span className="text-cyan-400">CrimeLens</span>
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">
              District crime analytics &amp; ML forecasting
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav
          aria-label="Primary"
          className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_-6px_rgba(34,211,238,0.8)]'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Status + upload */}
        <div className="flex items-center gap-3">
          {dataset ? (
            <span
              title={dataset.filename}
              className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
            >
              <Database className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{dataset.filename}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              Synthetic Demo Mode
            </span>
          )}
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_20px_-6px_rgba(34,211,238,0.9)] transition-colors hover:bg-cyan-400"
          >
            <Upload className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  )
}
