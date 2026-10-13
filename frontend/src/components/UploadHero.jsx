import { BarChart3, MapPinned, ShieldCheck } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import UploadDropzone from './UploadDropzone'

const POINTS = [
  { icon: BarChart3, text: 'Ridge Regression forecasts with confidence bounds' },
  { icon: MapPinned, text: 'District map colour-coded by risk tier' },
  { icon: ShieldCheck, text: 'Year-over-year growth and a sortable risk matrix' },
]

export default function UploadHero({ onUploaded }) {
  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Bring your own data
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Understand district-level crime trends across{' '}
            <span className="bg-linear-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Punjab
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Upload a CSV of recorded cases. PunjabCrimeLens aggregates it by district, forecasts future
            counts and ranks districts by year-over-year risk tier.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900/70">
                  <Icon className="h-4 w-4 text-cyan-300" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <UploadDropzone onUploaded={onUploaded} />
      </div>
    </GlassCard>
  )
}
