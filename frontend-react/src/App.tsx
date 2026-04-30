import { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { type ModuleId, parseModuleHash } from './lib/modules'
import { applyTheme, getInitialTheme, type ThemeMode } from './lib/theme'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>(() =>
    parseModuleHash(window.location.hash),
  )
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    function syncHash() {
      setActiveModule(parseModuleHash(window.location.hash))
    }

    window.addEventListener('hashchange', syncHash)
    syncHash()

    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function navigate(module: ModuleId) {
    if (window.location.hash === `#${module}`) {
      setActiveModule(module)
      return
    }

    window.location.hash = module
  }

  return (
    <AppShell
      activeModule={activeModule}
      onNavigate={navigate}
      onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      theme={theme}
    >
      <DashboardPage activeModule={activeModule} onNavigate={navigate} />
    </AppShell>
  )
}

export default App
