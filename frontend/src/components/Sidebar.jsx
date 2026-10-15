import {
  LayoutDashboard,
  Map as MapIcon,
  Table2,
  TrendingUp,
  Upload,
  X,
  PieChart
} from 'lucide-react'
import PunjabLogo from './PunjabLogo'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'categories', label: 'Categories', icon: PieChart },
  { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { id: 'risk', label: 'Risk Matrix', icon: Table2 },
]

export default function Sidebar({
  activeTab,
  onTabChange,
  dataset,
  onUploadClick,
  open = false,
  onClose,
}) {
  const go = (id) => {
    onTabChange(id)
    onClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/80 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-slate-950 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <PunjabLogo className="h-9 w-9 shrink-0" />
            <div className="leading-none">
              <p className="text-[15px] font-semibold tracking-tight text-white">
                Punjab<span className="text-saffron-400">CrimeLens</span>
              </p>
              <p className="mt-1.5 text-[11px] tracking-tight text-slate-500">Crime analytics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-widest text-slate-600">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex w-full items-center gap-3 rounded-r-lg border-l-2 px-3 py-2.5 text-sm font-medium tracking-tight transition-colors ${
                      active
                        ? 'border-saffron-400 bg-saffron-400/[0.07] text-white'
                        : 'border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active ? 'text-saffron-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Actions */}
        <div className="space-y-3 border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-white/5 px-3 py-2.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${dataset ? 'bg-emerald-400' : 'bg-saffron-400'}`}
              aria-hidden
            />
            <div className="min-w-0 leading-tight">
              <p
                className="truncate text-xs font-medium tracking-tight text-slate-200"
                title={dataset?.filename}
              >
                {dataset ? dataset.filename : 'Synthetic Demo Mode'}
              </p>
              <p className="mt-0.5 text-[11px] tracking-tight text-slate-500">
                {dataset ? 'Custom dataset loaded' : 'Sample data, not real records'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onUploadClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-saffron-400 px-4 py-2.5 text-sm font-semibold tracking-tight text-slate-950 transition-colors hover:bg-saffron-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-300"
          >
            <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
            Upload CSV
          </button>
        </div>
      </aside>
    </>
  )
}
