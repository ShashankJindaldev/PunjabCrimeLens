export const formatNumber = (value) => {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '—'
}

export const formatPercent = (value, digits = 1) => {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`
}
