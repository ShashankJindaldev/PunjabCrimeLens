import { ShieldAlert } from 'lucide-react'

export default function ResponsibleUseBanner() {
  return (
    <aside
      role="note"
      aria-label="Responsible use notice"
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-slate-900/60 to-slate-900/60 p-4 backdrop-blur-xl sm:p-5"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-amber-400/80" aria-hidden />
      <div className="flex gap-4 pl-1">
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-amber-200">Responsible use of these insights</h2>
          <p>
            Forecasts are <strong className="font-semibold text-white">statistical estimates</strong>{' '}
            built from aggregated district-level counts using Ridge Regression. They describe trends in
            recorded cases, not individual behaviour or intent, and they carry real uncertainty,
            especially when only a few years of data exist. Recorded crime also reflects reporting and
            policing patterns, not just underlying crime.
          </p>
          <p>
            <strong className="font-semibold text-white">Do not</strong> use this tool to profile, label
            or target communities, neighbourhoods, religions, castes or any group of people. Use the
            outputs to support, never replace, human judgment, resource planning and prevention work.
          </p>
        </div>
      </div>
    </aside>
  )
}
