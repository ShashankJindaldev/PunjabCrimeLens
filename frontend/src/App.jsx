import { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import ResponsibleUseBanner from './components/ResponsibleUseBanner'
import UploadHero from './components/UploadHero'
import UploadModal from './components/UploadModal'
import MetricsGrid from './components/MetricsGrid'
import ForecastViewer from './components/ForecastViewer'
import PunjabMap from './components/PunjabMap'
import RiskMatrix from './components/RiskMatrix'
import TopRiskList from './components/TopRiskList'
import { ErrorBlock } from './components/ui/States'
import { useDashboardData } from './hooks/useDashboardData'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dataset, setDataset] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState(null)

  const { summary, risk, loading, error, refresh } = useDashboardData()

  const handleUploaded = useCallback(
    (data) => {
      setDataset({ filename: data.filename, totalRecords: data.total_records })
      setSelectedDistrict(null)
      setModalOpen(false)
      refresh()
    },
    [refresh],
  )

  const viewForecast = useCallback((district) => {
    setSelectedDistrict(district)
    setActiveTab('forecasts')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  const forecastViewer = (
    <ForecastViewer
      risk={risk}
      riskLoading={loading}
      district={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
    />
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataset={dataset}
        onUploadClick={() => setModalOpen(true)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ResponsibleUseBanner />

        {activeTab === 'overview' && (
          <>
            <UploadHero onUploaded={handleUploaded} />
            {error ? (
              <ErrorBlock message={error} onRetry={refresh} />
            ) : (
              <MetricsGrid summary={summary} risk={risk} loading={loading} />
            )}
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">{forecastViewer}</div>
              <TopRiskList risk={risk} loading={loading} onSelect={viewForecast} />
            </div>
          </>
        )}

        {activeTab === 'map' && (
          <PunjabMap
            risk={risk}
            loading={loading}
            error={error}
            onRetry={refresh}
            onViewForecast={viewForecast}
          />
        )}

        {activeTab === 'forecasts' && (error ? <ErrorBlock message={error} onRetry={refresh} /> : forecastViewer)}

        {activeTab === 'risk' && (
          <RiskMatrix
            risk={risk}
            loading={loading}
            error={error}
            onRetry={refresh}
            onViewForecast={viewForecast}
          />
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        PunjabCrimeLens · Statistical decision-support only. Not for profiling individuals or communities.
      </footer>

      <UploadModal open={modalOpen} onClose={closeModal} onUploaded={handleUploaded} />
    </div>
  )
}
