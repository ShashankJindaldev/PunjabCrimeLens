import { useCallback, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { getErrorMessage, uploadCsv } from '../api/client'
import { useToast } from '../context/ToastContext'
import { formatNumber } from '../utils/format'

const MAX_BYTES = 25 * 1024 * 1024

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const STATUS_PILL = {
  ready: { label: 'Ready to upload', tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  uploading: { label: 'Uploading', tone: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  success: { label: 'Uploaded', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  error: { label: 'Failed', tone: 'border-red-500/30 bg-red-500/10 text-red-300' },
}

export default function UploadDropzone({ onUploaded }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | ready | uploading | success | error
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)

  const busy = status === 'uploading'

  const reset = useCallback(() => {
    setFile(null)
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const fail = useCallback(
    (title, message) => {
      setStatus('error')
      setErrorMsg(message)
      toast.error(title, message)
    },
    [toast],
  )

  const selectFile = useCallback(
    (candidate) => {
      if (!candidate) return
      if (!candidate.name.toLowerCase().endsWith('.csv')) {
        fail('Unsupported file', 'Please choose a .csv file.')
        return
      }
      if (candidate.size === 0) {
        fail('Empty file', `${candidate.name} has no content.`)
        return
      }
      if (candidate.size > MAX_BYTES) {
        fail('File too large', 'The maximum supported size is 25 MB.')
        return
      }
      setFile(candidate)
      setStatus('ready')
      setProgress(0)
      setResult(null)
      setErrorMsg('')
      toast.info('File selected', `${candidate.name} (${formatSize(candidate.size)})`)
    },
    [fail, toast],
  )

  const openPicker = () => {
    if (!busy) inputRef.current?.click()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (!busy) selectFile(event.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file || busy) return
    setStatus('uploading')
    setProgress(0)
    setErrorMsg('')
    try {
      const data = await uploadCsv(file, setProgress)
      setResult(data)
      setStatus('success')
      setProgress(100)
      toast.success('Upload complete', data?.message || `${data?.filename ?? file.name} processed.`)
      onUploaded?.(data)
    } catch (err) {
      fail('Upload failed', getErrorMessage(err, 'The file could not be uploaded.'))
    }
  }

  const pill = STATUS_PILL[status]

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => selectFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV file. Drag and drop or press Enter to browse."
        aria-disabled={busy}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
        }}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
          dragging
            ? 'scale-[1.01] border-cyan-400 bg-cyan-500/10 shadow-[0_0_32px_-8px_rgba(34,211,238,0.8)]'
            : 'border-slate-700 bg-slate-900/40 hover:border-cyan-500/60 hover:bg-slate-900/70'
        } ${busy ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
          <Upload className="h-6 w-6 text-cyan-300" aria-hidden />
        </div>
        <div>
          <p className="text-base font-semibold text-white">
            {dragging ? 'Drop your CSV to select it' : 'Drag & drop your CSV here'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            or <span className="font-medium text-cyan-300">click to browse</span> · .csv up to 25 MB
          </p>
        </div>
      </div>

      {/* File state indicator */}
      {file && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-800">
              <FileSpreadsheet className="h-5 w-5 text-emerald-300" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {formatSize(file.size)}
                {status === 'success' && result?.total_records != null
                  ? ` · ${formatNumber(result.total_records)} records`
                  : ''}
              </p>
            </div>
            {pill && (
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${pill.tone}`}
              >
                {status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                {status === 'success' && <CheckCircle2 className="h-3 w-3" aria-hidden />}
                {status === 'error' && <AlertCircle className="h-3 w-3" aria-hidden />}
                {pill.label}
                {status === 'uploading' ? ` ${progress}%` : ''}
              </span>
            )}
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              aria-label="Remove file"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {(busy || status === 'success') && (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  status === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {status === 'error' && errorMsg && (
            <p className="mt-3 break-words text-sm text-red-300">{errorMsg}</p>
          )}

          <div className="mt-4 flex justify-end">
            {status === 'success' ? (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Upload another file
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {busy ? 'Analysing…' : status === 'error' ? 'Retry upload' : 'Analyse dataset'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Validation error before any file was accepted */}
      {!file && status === 'error' && errorMsg && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {errorMsg}
        </p>
      )}
    </div>
  )
}
