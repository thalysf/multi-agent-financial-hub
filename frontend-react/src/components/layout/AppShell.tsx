import type { ReactNode } from 'react'
import type { ModuleId } from '../../lib/modules'
import { aboutModule, modules } from '../../lib/modules'
import { Badge } from '../ui/Badge'

type AppShellProps = {
  activeModule: ModuleId
  children: ReactNode
  onNavigate: (module: ModuleId) => void
}

export function AppShell({ activeModule, children, onNavigate }: AppShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-sand text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,111,69,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(29,111,115,0.24),transparent_30%),linear-gradient(135deg,rgba(255,250,240,0.92),rgba(244,234,215,0.72))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[118rem] flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:p-6 2xl:max-w-none 2xl:gap-6 2xl:p-8">
        <aside className="rounded-[2rem] border border-white/70 bg-ink p-4 text-cream shadow-2xl shadow-moss/20 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0 2xl:top-8 2xl:h-[calc(100vh-4rem)] 2xl:w-80">
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
                className={`whitespace-nowrap rounded-full px-4 py-3 text-sm font-bold transition hover:bg-cream/15 ${
                  activeModule === item.id ? 'bg-cream text-ink' : 'bg-cream/5 text-cream/72'
                }`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="block text-left">{item.label}</span>
                <span className="mt-0.5 hidden text-left text-xs font-semibold opacity-50 xl:block">
                  {item.helper}
                </span>
              </button>
            ))}
          </nav>

          <button
            className={`mt-6 hidden w-full rounded-[1.5rem] border border-cream/10 p-4 text-left transition hover:bg-cream/10 lg:block ${
              activeModule === aboutModule.id ? 'bg-cream/14' : 'bg-cream/6'
            }`}
            onClick={() => onNavigate(aboutModule.id)}
            type="button"
          >
            <p className="text-sm font-semibold text-cream">{aboutModule.label}</p>
            <p className="mt-2 text-sm leading-6 text-cream/52">{aboutModule.helper}</p>
          </button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4 2xl:gap-6">{children}</section>
      </div>
    </main>
  )
}
