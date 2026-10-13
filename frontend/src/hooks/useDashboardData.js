import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, getRiskAssessment, getSummary, isCancel } from '../api/client'

/** Loads /api/summary and /api/risk-assessment; call refresh() after an upload. */
export function useDashboardData() {
  const [summary, setSummary] = useState(null)
  const [risk, setRisk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    Promise.all([getSummary(controller.signal), getRiskAssessment(controller.signal)])
      .then(([summaryData, riskData]) => {
        setSummary(summaryData)
        setRisk(Array.isArray(riskData) ? riskData : [])
      })
      .catch((err) => {
        if (isCancel(err)) return
        setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [version])

  return { summary, risk, loading, error, refresh }
}
