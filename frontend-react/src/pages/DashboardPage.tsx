import { type FormEvent, startTransition, useDeferredValue, useEffect, useState } from 'react'
import { aiSuggestions } from '../data/dashboard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table } from '../components/ui/Table'
import {
  type AiAnalyzeResponse,
  type Investment,
  type Transaction,
  analyzeFinances,
  getInvestments,
  getTransactions,
} from '../lib/api'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'

type SummaryTone = 'cream' | 'ink' | 'lagoon' | 'clay'

export function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [transactionFilter, setTransactionFilter] = useState('')
  const [aiPrompt, setAiPrompt] = useState('Analyze my financial situation')
  const [aiResponse, setAiResponse] = useState<AiAnalyzeResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const deferredFilter = useDeferredValue(transactionFilter)
  const normalizedFilter = deferredFilter.trim().toLowerCase()
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
  const investmentCostTotal = investments.reduce(
    (total, investment) => total + Number(investment.quantity) * Number(investment.averagePrice),
    0,
  )
  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.category} ${transaction.type} ${transaction.amount} ${transaction.date}`
      .toLowerCase()
      .includes(normalizedFilter),
  )

  const summaryCards: Array<{
    detail: string
    label: string
    tone: SummaryTone
    value: string
  }> = [
    {
      label: 'Net cash flow',
      value: formatCompactCurrency(incomeTotal - expenseTotal),
      detail: `${transactions.length} transactions loaded from Kotlin`,
      tone: 'cream',
    },
    {
      label: 'Portfolio cost',
      value: formatCompactCurrency(investmentCostTotal),
      detail: `${investments.length} investments from PostgreSQL`,
      tone: 'lagoon',
    },
    {
      label: 'AI readiness',
      value: aiResponse ? aiResponse.routedTo : 'Ready',
      detail: aiResponse ? aiResponse.routingReason : 'Python agents available through backend',
      tone: 'clay',
    },
  ]

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const [transactionsResult, investmentsResult] = await Promise.all([
          getTransactions(),
          getInvestments(),
        ])

        if (!ignore) {
          startTransition(() => {
            setTransactions(transactionsResult)
            setInvestments(investmentsResult)
            setLoadError(null)
          })
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : 'Could not load dashboard data')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [])

  async function handleAiSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!aiPrompt.trim()) {
      return
    }

    setIsAiLoading(true)
    setAiError(null)

    try {
      const response = await analyzeFinances(aiPrompt)
      setAiResponse(response)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not run AI analysis')
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <>
      <header className="rounded-[2rem] border border-white/70 bg-cream/82 p-4 shadow-xl shadow-moss/10 backdrop-blur md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-clay">
              Modular finance cockpit
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-black leading-[0.95] tracking-[-0.08em] text-ink sm:text-6xl">
              Finances, agents, and signals in one calm dashboard.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
              Live data from Kotlin, PostgreSQL, Python agents, MCP tools, Groq,
              and Spring AI.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-72 md:grid-cols-1">
            <a
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-black text-cream shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-moss"
              href="#ai-desk"
            >
              Ask AI
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-sm font-black text-ink shadow-md shadow-moss/10 transition hover:-translate-y-0.5 hover:bg-white"
              href="#transactions"
            >
              View transactions
            </a>
          </div>
        </div>
      </header>

      {loadError ? (
        <Card className="border-clay/30 bg-clay/12">
          <p className="font-black text-clay">Could not load live dashboard data.</p>
          <p className="mt-2 text-sm text-ink/64">{loadError}</p>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" id="overview">
        {summaryCards.map((card) => (
          <Card key={card.label} tone={card.tone}>
            <p className="text-sm font-bold opacity-75">{card.label}</p>
            <p className="mt-5 font-display text-4xl font-black tracking-[-0.07em]">
              {isLoading ? 'Loading' : card.value}
            </p>
            <p className="mt-3 text-sm leading-6 opacity-70">{card.detail}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card id="transactions">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge>Transactions</Badge>
              <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em]">
                Recent movement
              </h3>
            </div>
            <div className="w-full sm:w-60">
              <Input
                aria-label="Filter transactions"
                onChange={(event) => setTransactionFilter(event.target.value)}
                placeholder="Filter entries"
                value={transactionFilter}
              />
            </div>
          </div>
          <div className="mt-5">
            <Table
              columns={[
                { header: 'Category', key: 'category', render: (row) => row.category },
                { header: 'Date', key: 'date', render: (row) => formatDate(row.date) },
                {
                  header: 'Type',
                  key: 'type',
                  render: (row) => (
                    <span
                      className={
                        row.type === 'INCOME'
                          ? 'font-black text-moss'
                          : 'font-black text-clay'
                      }
                    >
                      {row.type === 'INCOME' ? 'Income' : 'Expense'}
                    </span>
                  ),
                },
                {
                  header: 'Amount',
                  key: 'amount',
                  render: (row) => formatCurrency(Number(row.amount)),
                },
              ]}
              rows={filteredTransactions}
            />
            {!isLoading && filteredTransactions.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white/54 p-4 text-sm font-semibold text-ink/58">
                No transactions match this filter.
              </p>
            ) : null}
          </div>
        </Card>

        <Card id="investments" tone="ink">
          <Badge tone="cream">Investments</Badge>
          <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em]">
            Portfolio cards
          </h3>
          <div className="mt-5 space-y-3">
            {investments.map((investment, index) => (
              <article
                className="rounded-[1.5rem] border border-cream/10 bg-cream/8 p-4"
                key={investment.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-10 w-10 rounded-full ${
                        index % 2 === 0 ? 'bg-lagoon' : 'bg-clay'
                      }`}
                    />
                    <div>
                      <p className="font-display text-xl font-black tracking-[-0.05em]">
                        {investment.asset}
                      </p>
                      <p className="text-sm text-cream/56">
                        {Number(investment.quantity).toLocaleString('en-US')} units
                      </p>
                    </div>
                  </div>
                  <p className="text-right text-sm font-black text-cream">
                    {formatCurrency(Number(investment.averagePrice))}
                  </p>
                </div>
              </article>
            ))}
            {!isLoading && investments.length === 0 ? (
              <p className="rounded-[1.5rem] border border-cream/10 bg-cream/8 p-4 text-sm text-cream/62">
                No investments registered yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" id="ai-desk">
        <Card tone="clay">
          <Badge tone="cream">AI desk</Badge>
          <h3 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.08em]">
            One entry point for agentic analysis.
          </h3>
          <p className="mt-4 text-sm leading-6 text-cream/76">
            This panel calls the Kotlin backend, which forwards the request to
            the Python orchestrator. The agent then uses MCP tools for real data.
          </p>
          <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={handleAiSubmit}>
            <Input
              className="border-white/20 bg-white/18 text-cream placeholder:text-cream/52 focus:bg-white/22"
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Ask about spending, risk, or next moves"
              value={aiPrompt}
            />
            <Button className="shrink-0" disabled={isAiLoading} type="submit" variant="ghost">
              {isAiLoading ? 'Thinking' : 'Send'}
            </Button>
          </form>
          {aiError ? <p className="mt-3 text-sm font-bold text-cream">{aiError}</p> : null}
        </Card>

        <Card>
          <Badge tone="clay">Agent response</Badge>
          <div className="mt-5 rounded-[1.5rem] border border-ink/8 bg-white/58 p-4">
            {aiResponse ? (
              <>
                <p className="text-sm font-black text-moss">
                  Routed to {aiResponse.routedTo} by {aiResponse.agent}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/70">
                  {aiResponse.response}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {aiResponse.toolsUsed.map((tool) => (
                    <Badge key={tool} tone="moss">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p className="font-display text-2xl font-black tracking-[-0.06em]">
                  Ask the system something useful.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      className="rounded-[1.25rem] border border-ink/8 bg-white/64 p-4 text-left text-sm font-bold leading-6 text-ink/70 transition hover:-translate-y-0.5 hover:bg-white"
                      key={suggestion}
                      onClick={() => setAiPrompt(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>
    </>
  )
}
