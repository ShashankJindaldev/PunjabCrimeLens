import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import { resetData } from './api/client';
import CategoryViewer from './components/CategoryViewer'
import PunjabLogo from './components/PunjabLogo'
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

const PAGE_META = {
  overview: {
    title: 'Overview',
    subtitle: 'District crime trends, forecasts and risk at a glance.',
  },
  map: {
    title: 'Map',
    subtitle: 'Where recorded cases and risk tiers concentrate across districts.',
  },
  forecasts: {
    title: 'Forecasts',
    subtitle: 'Historical counts against Ridge Regression projections.',
  },
  risk: {
    title: 'Risk Matrix',
    subtitle: 'Every district ranked by tier and year-over-year growth.',
  },
  categories: {
    title: 'Crime Categories',
    subtitle: 'Breakdown of recorded cases by specific crime types.',
  },
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dataset, setDataset] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const mainRef = useRef(null)

  const { summary, risk, loading, error, refresh } = useDashboardData()

  // The scroll container is <main>, not the window, so reset it on every tab change.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [activeTab])

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
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const { title, subtitle } = PAGE_META[activeTab]

  const handleResetClick = async () => {
    if (window.confirm("Are you sure you want to clear the active dataset from the server?")) {
      await resetData();
      window.location.reload();
    }
  };

  const forecastViewer = (
    <ForecastViewer
      risk={risk}
      riskLoading={loading}
      district={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
    />
  )

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataset={dataset}
        onUploadClick={() => setModalOpen(true)}
        onResetClick={handleResetClick}
        open={sidebarOpen}
        onClose={closeSidebar}
/>

      {/* Content column: offset by the fixed sidebar width on desktop */}
      <div className="flex h-full flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <PunjabLogo className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight text-white">PunjabCrimeLens</span>
        </header>

        {/* Scrollable dashboard area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="mt-1 text-sm tracking-tight text-slate-500">{subtitle}</p>
            </div>

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

            {activeTab === 'categories' && (
          <CategoryViewer
            risk={risk}
            loading={loading}
            district={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
               />
            )}

            {activeTab === 'forecasts' &&
              (error ? <ErrorBlock message={error} onRetry={refresh} /> : forecastViewer)}

            {activeTab === 'risk' && (
              <RiskMatrix
                risk={risk}
                loading={loading}
                error={error}
                onRetry={refresh}
                onViewForecast={viewForecast}
              />
            )}

            <footer className="border-t border-white/5 pt-6 text-center text-xs tracking-tight text-slate-600">
              PunjabCrimeLens · Statistical decision-support only. Not for profiling individuals or communities.
            </footer>
          </div>
        </main>
      </div>

      <UploadModal open={modalOpen} onClose={closeModal} onUploaded={handleUploaded} />
    </div>
  )
}
