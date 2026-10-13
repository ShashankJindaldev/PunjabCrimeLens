import { useEffect } from 'react'
import { X } from 'lucide-react'
import UploadDropzone from './UploadDropzone'

export default function UploadModal({ open, onClose, onUploaded }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="glass w-full max-w-xl p-6 shadow-[0_0_60px_-15px_rgba(34,211,238,0.35)]"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="upload-modal-title" className="text-lg font-semibold text-white">
              Upload crime data
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Replace the current dataset with your own CSV. Dashboards refresh automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close upload dialog"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <UploadDropzone onUploaded={onUploaded} />
      </div>
    </div>
  )
}
