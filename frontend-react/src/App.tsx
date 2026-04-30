import { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { type ModuleId, parseModuleHash } from './lib/modules'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>(() =>
    parseModuleHash(window.location.hash),
  )

  useEffect(() => {
    function syncHash() {
      setActiveModule(parseModuleHash(window.location.hash))
    }

    window.addEventListener('hashchange', syncHash)
    syncHash()

    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function navigate(module: ModuleId) {
    if (window.location.hash === `#${module}`) {
      setActiveModule(module)
      return
    }

    window.location.hash = module
  }

  return (
    <AppShell activeModule={activeModule} onNavigate={navigate}>
      <DashboardPage activeModule={activeModule} onNavigate={navigate} />
    </AppShell>
  )
}

export default App
