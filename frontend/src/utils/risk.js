export const TIER_ORDER = ['Critical', 'High', 'Medium', 'Low']

export const TIER_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 }

// Full class strings so Tailwind can detect them.
export const TIER_STYLES = {
  Critical: {
    color: '#ef4444',
    badge: 'border-red-500/40 bg-red-500/15 text-red-300',
    dot: 'bg-red-500',
    bar: 'border-l-red-500',
  },
  High: {
    color: '#f59e0b',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-500',
    bar: 'border-l-amber-500',
  },
  Medium: {
    color: '#3b82f6',
    badge: 'border-blue-500/40 bg-blue-500/15 text-blue-300',
    dot: 'bg-blue-500',
    bar: 'border-l-blue-500',
  },
  Low: {
    color: '#10b981',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'border-l-emerald-500',
  },
}

const FALLBACK = {
  color: '#64748b',
  badge: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
  dot: 'bg-slate-500',
  bar: 'border-l-slate-500',
}

export const getTierStyle = (tier) => TIER_STYLES[tier] ?? FALLBACK

/** Sort comparator: highest tier first, then highest YoY growth. */
export const compareByRisk = (a, b) =>
  (TIER_RANK[b.risk_tier] ?? 0) - (TIER_RANK[a.risk_tier] ?? 0) ||
  (Number(b.yoy_growth_percent) || 0) - (Number(a.yoy_growth_percent) || 0)
