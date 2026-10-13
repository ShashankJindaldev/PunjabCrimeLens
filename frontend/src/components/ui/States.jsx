import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'

export function LoadingBlock({ label = 'Loading…', className = 'h-48' }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 text-sm text-slate-400 ${className}`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-cyan-400" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:flex-row sm:items-center"
    >
      <AlertTriangle className="h-6 w-6 shrink-0 text-red-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-200">Couldn't load data</p>
        <p className="mt-0.5 break-words text-sm text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/10"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyBlock({ title, message, className = 'h-48' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${className}`}>
      <Inbox className="h-8 w-8 text-slate-600" aria-hidden />
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {message && <p className="max-w-sm text-sm text-slate-400">{message}</p>}
    </div>
  )
}
