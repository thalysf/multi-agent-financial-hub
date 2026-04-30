import type { ReactNode } from 'react'
import { Badge } from '../ui/Badge'

const navigationItems = ['Overview', 'Transactions', 'Investments', 'AI desk']

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-sand text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,111,69,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(29,111,115,0.24),transparent_30%),linear-gradient(135deg,rgba(255,250,240,0.92),rgba(244,234,215,0.72))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:p-6">
        <aside className="rounded-[2rem] border border-white/70 bg-ink p-4 text-cream shadow-2xl shadow-moss/20 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
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
            {navigationItems.map((item, index) => (
              <a
                className={`whitespace-nowrap rounded-full px-4 py-3 text-sm font-bold transition hover:bg-cream/15 ${
                  index === 0 ? 'bg-cream text-ink' : 'bg-cream/5 text-cream/72'
                }`}
                href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-[1.5rem] border border-cream/10 bg-cream/8 p-4 lg:block">
            <p className="text-sm font-semibold text-cream">System map</p>
            <div className="mt-4 space-y-3 text-sm text-cream/66">
              <p>Kotlin API handles CRUD and Spring AI.</p>
              <p>Python agents talk to MCP for tool-backed analysis.</p>
              <p>React becomes the calm cockpit on top.</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">{children}</section>
      </div>
    </main>
  )
}
