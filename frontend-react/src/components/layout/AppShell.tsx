import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import type { ModuleId } from '../../lib/modules'
import { aboutModule, modules } from '../../lib/modules'
import type { ThemeMode } from '../../lib/theme'
import { Badge } from '../ui/Badge'

type AppShellProps = {
  activeModule: ModuleId
  children: ReactNode
  onNavigate: (module: ModuleId) => void
  onToggleTheme: () => void
  theme: ThemeMode
}

export function AppShell({
  activeModule,
  children,
  onNavigate,
  onToggleTheme,
  theme,
}: AppShellProps) {
  const contentRef = useRef<HTMLElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const content = contentRef.current
    const sidebar = sidebarRef.current

    if (!content || !sidebar) {
      return
    }

    const largeScreen = window.matchMedia('(min-width: 1024px)')
    let frameId = 0

    const syncSidebarHeight = () => {
      window.cancelAnimationFrame(frameId)

      frameId = window.requestAnimationFrame(() => {
        if (!largeScreen.matches) {
          sidebar.style.removeProperty('height')
          sidebar.style.removeProperty('min-height')
          return
        }

        const contentHeight = Math.ceil(content.getBoundingClientRect().height)

        sidebar.style.removeProperty('height')
        sidebar.style.removeProperty('min-height')
        sidebar.style.height = `${contentHeight}px`
      })
    }

    const observer = new ResizeObserver(syncSidebarHeight)
    observer.observe(content)
    largeScreen.addEventListener('change', syncSidebarHeight)
    window.addEventListener('resize', syncSidebarHeight)
    syncSidebarHeight()

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      largeScreen.removeEventListener('change', syncSidebarHeight)
      window.removeEventListener('resize', syncSidebarHeight)
      sidebar.style.removeProperty('height')
      sidebar.style.removeProperty('min-height')
    }
  }, [activeModule])

  return (
    <main
      className="app-shell relative min-h-screen overflow-hidden bg-sand text-ink"
      onPointerMove={handleShellPointerMove}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,111,69,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(29,111,115,0.24),transparent_30%),linear-gradient(135deg,color-mix(in_srgb,var(--app-cream)_88%,transparent),color-mix(in_srgb,var(--app-sand)_76%,transparent))]" />
      <button
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className="theme-toggle interactive-surface fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-white/60 bg-cream/88 px-3 py-2 text-sm font-black text-ink shadow-xl shadow-moss/10 backdrop-blur sm:right-6 sm:top-6"
        onClick={onToggleTheme}
        type="button"
      >
        <span
          className={`relative h-5 w-10 rounded-full p-0.5 transition ${
            theme === 'dark' ? 'bg-lagoon' : 'bg-clay'
          }`}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-cream shadow transition ${
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
        <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
          {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
      <div
        className="relative mx-auto grid w-full max-w-[118rem] grid-cols-1 items-start gap-4 p-3 sm:p-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:p-6 2xl:max-w-none 2xl:grid-cols-[20rem_minmax(0,1fr)] 2xl:gap-6 2xl:p-8"
      >
        <aside
          className="sidebar-rail rounded-[2rem] border border-white/70 bg-ink p-4 text-cream shadow-2xl shadow-moss/20"
          ref={sidebarRef}
        >
          <div className="lg:sticky lg:top-6 2xl:top-8">
            <div className="flex items-center justify-between gap-3 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cream/55">
                  Financial
                </p>
                <h1 className="mt-2 font-display text-3xl font-black tracking-[-0.08em] text-cream">
                  Hub
                </h1>
              </div>
              <Badge className="border border-cream/10 normal-case tracking-normal" tone="cream">
                Local lab
              </Badge>
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {modules.map((item) => (
                <button
                  className={`nav-pill interactive-surface group whitespace-nowrap rounded-full px-4 py-3 text-left text-sm font-bold ${
                    activeModule === item.id
                      ? 'nav-pill-active bg-cream text-ink'
                      : 'bg-cream/5 text-cream/72'
                  }`}
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                >
                  <span className="block">{item.label}</span>
                  <span className="mt-0.5 hidden text-xs font-semibold opacity-50 xl:block">
                    {item.helper}
                  </span>
                </button>
              ))}
            </nav>

            <button
              className={`nav-card interactive-surface mt-6 hidden w-full rounded-[1.5rem] border border-cream/10 p-4 text-left lg:block ${
                activeModule === aboutModule.id ? 'nav-card-active bg-cream/14' : 'bg-cream/6'
              }`}
              onClick={() => onNavigate(aboutModule.id)}
              type="button"
            >
              <p className="text-sm font-semibold text-cream">{aboutModule.label}</p>
              <p className="mt-2 text-sm leading-6 text-cream/52">{aboutModule.helper}</p>
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4 2xl:gap-6" ref={contentRef}>
          {children}
        </section>
      </div>
    </main>
  )
}

function handleShellPointerMove(event: PointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect()

  event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`)
  event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`)
}

function SunIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20.99 12.55A8.9 8.9 0 0 1 11.45 3a7 7 0 1 0 9.54 9.55Z" />
    </svg>
  )
}
