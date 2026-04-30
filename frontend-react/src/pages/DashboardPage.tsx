import {
  type FormEvent,
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from 'react'
import { aiSuggestions } from '../data/dashboard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import {
  type AiAnalyzeResponse,
  type CreateInvestmentInput,
  type CreateTransactionInput,
  type Investment,
  type Transaction,
  analyzeFinances,
  createInvestment,
  createTransaction,
  getInvestments,
  getTransactions,
} from '../lib/api'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'
import {
  ensureInvestmentColors,
  getStoredInvestmentColors,
} from '../lib/investmentColors'
import type { ModuleId } from '../lib/modules'

type DashboardPageProps = {
  activeModule: ModuleId
  onNavigate: (module: ModuleId) => void
}

type SummaryTone = 'cream' | 'ink' | 'lagoon' | 'clay'
type ModalType = 'transaction' | 'investment' | null

const today = new Date().toISOString().slice(0, 10)

async function loadDashboardData() {
  const [transactionsResult, investmentsResult] = await Promise.all([
    getTransactions(),
    getInvestments(),
  ])

  return { investmentsResult, transactionsResult }
}

export function DashboardPage({ activeModule, onNavigate }: DashboardPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [investmentColors, setInvestmentColors] = useState(() => getStoredInvestmentColors())
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [transactionFilter, setTransactionFilter] = useState('')
  const [aiPrompt, setAiPrompt] = useState('Analyze my financial situation')
  const [aiResponse, setAiResponse] = useState<AiAnalyzeResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    amount: '',
    category: '',
    date: today,
    type: 'EXPENSE',
  })
  const [investmentForm, setInvestmentForm] = useState<CreateInvestmentInput>({
    asset: '',
    averagePrice: '',
    quantity: '',
  })

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
  const recentTransactions = [...transactions]
    .sort((first, second) => second.date.localeCompare(first.date) || second.id - first.id)
    .slice(0, 4)
  const largestExpense = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .sort((first, second) => Number(second.amount) - Number(first.amount))[0]
  const recentInvestments = investments.slice(0, 6)

  const summaryCards: Array<{
    detail: string
    label: string
    tone: SummaryTone
    value: string
  }> = [
    {
      label: 'Cash balance',
      value: formatCompactCurrency(incomeTotal - expenseTotal),
      detail: `${formatCurrency(incomeTotal)} in, ${formatCurrency(expenseTotal)} out`,
      tone: 'cream',
    },
    {
      label: 'Spending focus',
      value: largestExpense ? largestExpense.category : 'Clear',
      detail: largestExpense
        ? `${formatCurrency(Number(largestExpense.amount))} largest expense`
        : 'No expense registered yet',
      tone: 'clay',
    },
    {
      label: 'Portfolio base',
      value: formatCompactCurrency(investmentCostTotal),
      detail: `${investments.length} registered position${investments.length === 1 ? '' : 's'}`,
      tone: 'lagoon',
    },
  ]

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const { investmentsResult, transactionsResult } = await loadDashboardData()

        if (!ignore) {
          startTransition(() => {
            setTransactions(transactionsResult)
            setInvestments(investmentsResult)
            setInvestmentColors((current) => ensureInvestmentColors(investmentsResult, current))
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

    load()

    return () => {
      ignore = true
    }
  }, [])

  async function refreshDashboard() {
    setIsLoading(true)
    setLoadError(null)

    try {
      const { investmentsResult, transactionsResult } = await loadDashboardData()
      setTransactions(transactionsResult)
      setInvestments(investmentsResult)
      setInvestmentColors((current) => ensureInvestmentColors(investmentsResult, current))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      const created = await createTransaction(transactionForm)
      setTransactions((current) => [created, ...current])
      setTransactionForm({ amount: '', category: '', date: today, type: 'EXPENSE' })
      setActiveModal(null)
      onNavigate('transactions')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create transaction')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleInvestmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      const created = await createInvestment(investmentForm)
      setInvestments((current) => [created, ...current])
      setInvestmentColors((current) => ensureInvestmentColors([created], current))
      setInvestmentForm({ asset: '', averagePrice: '', quantity: '' })
      setActiveModal(null)
      onNavigate('investments')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create investment')
    } finally {
      setIsSaving(false)
    }
  }

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

  function askWithPrompt(question: string) {
    setAiPrompt(question)
    onNavigate('ai-desk')
  }

  function openModal(type: Exclude<ModalType, null>) {
    setFormError(null)
    setActiveModal(type)
  }

  return (
    <>
      <header className="card-hover rounded-[2rem] border border-white/70 bg-cream/82 p-4 shadow-xl shadow-moss/10 backdrop-blur md:p-6 2xl:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-clay">
              Personal finance cockpit
            </p>
            <h2 className="mt-3 max-w-5xl font-display text-4xl font-black leading-[0.95] tracking-[-0.08em] text-ink sm:text-6xl 2xl:text-7xl">
              A calmer home for decisions about money.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/60 sm:text-base 2xl:text-lg 2xl:leading-8">
              Follow your cash movement, portfolio base, and questions worth asking next.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[34rem]">
            <Button onClick={() => onNavigate('ai-desk')}>Ask AI</Button>
            <Button onClick={() => openModal('transaction')} variant="secondary">
              Add transaction
            </Button>
            <Button onClick={() => openModal('investment')} variant="secondary">
              Add investment
            </Button>
          </div>
        </div>
      </header>

      {loadError ? (
        <Card className="border-clay/30 bg-clay/12">
          <p className="font-black text-clay">Could not load dashboard data.</p>
          <p className="mt-2 text-sm text-ink/64">{loadError}</p>
        </Card>
      ) : null}

      {activeModule === 'overview' ? renderOverviewModule() : null}
      {activeModule === 'transactions' ? renderTransactionsModule() : null}
      {activeModule === 'investments' ? renderInvestmentsModule() : null}
      {activeModule === 'ai-desk' ? renderAiModule() : null}
      {activeModule === 'about' ? renderAboutModule() : null}

      <Modal
        description="Create a cash movement and keep the dashboard in sync."
        isOpen={activeModal === 'transaction'}
        onClose={() => setActiveModal(null)}
        title="New transaction"
      >
        <form className="grid gap-3" onSubmit={handleTransactionSubmit}>
          <label className="grid gap-2 text-sm font-black text-ink/70">
            Type
            <select
              className="input-field w-full rounded-2xl border border-ink/10 bg-white/72 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-moss/40 focus:ring-4 focus:ring-moss/10"
              onChange={(event) =>
                setTransactionForm((current) => ({
                  ...current,
                  type: event.target.value as CreateTransactionInput['type'],
                }))
              }
              value={transactionForm.type}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-ink/70">
            Category
            <Input
              onChange={(event) =>
                setTransactionForm((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="Groceries, Salary, Education..."
              required
              value={transactionForm.category}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-ink/70">
              Amount
              <Input
                min="0.01"
                onChange={(event) =>
                  setTransactionForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="125.75"
                required
                step="0.01"
                type="number"
                value={transactionForm.amount}
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-ink/70">
              Date
              <Input
                onChange={(event) =>
                  setTransactionForm((current) => ({ ...current, date: event.target.value }))
                }
                required
                type="date"
                value={transactionForm.date}
              />
            </label>
          </div>
          {formError ? <p className="text-sm font-bold text-clay">{formError}</p> : null}
          <Button disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Create transaction'}
          </Button>
        </form>
      </Modal>

      <Modal
        description="Create a portfolio position and update the investment snapshot."
        isOpen={activeModal === 'investment'}
        onClose={() => setActiveModal(null)}
        title="New investment"
      >
        <form className="grid gap-3" onSubmit={handleInvestmentSubmit}>
          <label className="grid gap-2 text-sm font-black text-ink/70">
            Asset
            <Input
              onChange={(event) =>
                setInvestmentForm((current) => ({
                  ...current,
                  asset: event.target.value.toUpperCase(),
                }))
              }
              placeholder="VALE3"
              required
              value={investmentForm.asset}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-ink/70">
              Quantity
              <Input
                min="0.0001"
                onChange={(event) =>
                  setInvestmentForm((current) => ({ ...current, quantity: event.target.value }))
                }
                placeholder="900.0000"
                required
                step="0.0001"
                type="number"
                value={investmentForm.quantity}
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-ink/70">
              Average price
              <Input
                min="0.01"
                onChange={(event) =>
                  setInvestmentForm((current) => ({
                    ...current,
                    averagePrice: event.target.value,
                  }))
                }
                placeholder="84.32"
                required
                step="0.01"
                type="number"
                value={investmentForm.averagePrice}
              />
            </label>
          </div>
          {formError ? <p className="text-sm font-bold text-clay">{formError}</p> : null}
          <Button disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Create investment'}
          </Button>
        </form>
      </Modal>
    </>
  )

  function renderOverviewModule() {
    return (
      <>
        <section className="grid auto-rows-fr items-stretch gap-4 md:grid-cols-3 2xl:gap-6">
          {summaryCards.map((card) => (
            <Card className="min-h-44 justify-between 2xl:min-h-48" key={card.label} tone={card.tone}>
              <p className="text-sm font-bold opacity-75">{card.label}</p>
              <div>
                <p className="mt-5 font-display text-4xl font-black tracking-[-0.07em] 2xl:text-5xl">
                  {isLoading ? 'Loading' : card.value}
                </p>
                <p className="mt-3 text-sm leading-6 opacity-70">{card.detail}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid auto-rows-fr items-stretch gap-4 xl:grid-cols-3 2xl:gap-6">
          <Card className="min-h-[34rem]">
            <div className="flex min-h-24 items-start justify-between gap-4">
              <div>
                <Badge>Recent activity</Badge>
                <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em]">
                  Latest movements
                </h3>
              </div>
              <Button onClick={() => onNavigate('transactions')} variant="secondary">
                View all
              </Button>
            </div>
            <div className="mt-5 flex flex-1 flex-col gap-3">
              {recentTransactions.map((transaction) => (
                <div
                  className="interactive-surface flex min-h-[4.75rem] items-center justify-between gap-4 rounded-[1.25rem] bg-white/58 p-4 hover:bg-white/80"
                  key={transaction.id}
                >
                  <div>
                    <p className="font-black text-ink">{transaction.category}</p>
                    <p className="text-sm text-ink/48">{formatDate(transaction.date)}</p>
                  </div>
                  <p
                    className={`font-display text-xl font-black tracking-[-0.05em] ${
                      transaction.type === 'INCOME' ? 'text-moss' : 'text-clay'
                    }`}
                  >
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              ))}
              {!isLoading && recentTransactions.length === 0 ? (
                <p className="rounded-[1.25rem] bg-white/58 p-4 text-sm font-semibold text-ink/58">
                  No transactions yet.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="min-h-[34rem]" tone="ink">
            <div className="min-h-24">
              <Badge tone="cream">Portfolio pulse</Badge>
              <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em]">
                Position snapshot
              </h3>
            </div>
            <div className="mt-5 flex flex-1 flex-col gap-3">
              {recentInvestments.slice(0, 3).map((investment) => (
                <div
                  className="interactive-surface flex min-h-[4.75rem] items-center justify-between gap-4 rounded-[1.25rem] border border-cream/10 bg-cream/8 p-4 hover:bg-cream/14"
                  key={investment.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-full shadow-lg shadow-black/20"
                      style={{
                        backgroundColor:
                          investmentColors[String(investment.id)] ?? 'hsl(182 60% 36%)',
                      }}
                    />
                    <div>
                      <p className="font-display text-xl font-black tracking-[-0.05em]">
                        {investment.asset}
                      </p>
                      <p className="text-sm text-cream/54">
                        {Number(investment.quantity).toLocaleString('en-US')} units
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-cream">
                    {formatCurrency(Number(investment.averagePrice))}
                  </p>
                </div>
              ))}
              {!isLoading && recentInvestments.length === 0 ? (
                <p className="rounded-[1.25rem] border border-cream/10 bg-cream/8 p-4 text-sm text-cream/62">
                  No investments yet.
                </p>
              ) : null}
            </div>
            <Button className="mt-auto" onClick={() => onNavigate('investments')} variant="ghost">
              Open portfolio
            </Button>
          </Card>

          <Card className="min-h-[34rem]" tone="clay">
            <div className="min-h-24">
              <Badge tone="cream">Ask next</Badge>
              <h3 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.08em]">
                Questions ready for the assistant.
              </h3>
            </div>
            <div className="mt-5 grid flex-1 content-start gap-3">
              {aiSuggestions.map((suggestion) => (
                <button
                  className="interactive-surface min-h-[4.75rem] rounded-[1.25rem] border border-white/16 bg-white/14 p-4 text-left text-sm font-bold leading-6 text-cream hover:bg-white/22"
                  key={suggestion}
                  onClick={() => askWithPrompt(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        </section>
      </>
    )
  }

  function renderTransactionsModule() {
    return (
      <section className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-6">
        <Card id="transactions">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge>Transactions</Badge>
              <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em] 2xl:text-4xl">
                Transactions
              </h3>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[16rem_auto_auto]">
              <Input
                aria-label="Filter transactions"
                onChange={(event) => setTransactionFilter(event.target.value)}
                placeholder="Filter entries"
                value={transactionFilter}
              />
              <Button onClick={() => openModal('transaction')} variant="secondary">
                New
              </Button>
              <Button onClick={refreshDashboard} variant="secondary">
                Refresh
              </Button>
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

        <Card tone="clay">
          <Badge tone="cream">Quick insight</Badge>
          <p className="mt-5 font-display text-4xl font-black tracking-[-0.08em]">
            {formatCurrency(incomeTotal - expenseTotal)}
          </p>
          <p className="mt-3 text-sm leading-6 text-cream/76">
            Net cash flow from the current records.
          </p>
          <Button
            className="mt-6"
            onClick={() => askWithPrompt('What should I notice about my cash flow?')}
            variant="ghost"
          >
            Ask about cash flow
          </Button>
        </Card>
      </section>
    )
  }

  function renderInvestmentsModule() {
    return (
      <section className="grid gap-4 2xl:grid-cols-[0.8fr_1.2fr] 2xl:gap-6">
        <Card tone="ink">
          <Badge tone="cream">Investments</Badge>
          <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.07em] 2xl:text-4xl">
            Portfolio
          </h3>
          <p className="mt-5 font-display text-5xl font-black tracking-[-0.08em]">
            {formatCompactCurrency(investmentCostTotal)}
          </p>
          <p className="mt-3 text-sm leading-6 text-cream/66">
            Registered position cost calculated from quantity times average price.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button onClick={() => openModal('investment')} variant="ghost">
              New investment
            </Button>
            <Button onClick={refreshDashboard} variant="ghost">
              Refresh
            </Button>
          </div>
        </Card>

        <Card>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {investments.map((investment) => (
              <article
                className="interactive-surface rounded-[1.5rem] border border-ink/8 bg-white/58 p-4 hover:bg-white/80"
                key={investment.id}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-full shadow-lg shadow-ink/15"
                    style={{
                      backgroundColor:
                        investmentColors[String(investment.id)] ?? 'hsl(182 60% 36%)',
                    }}
                  />
                  <div>
                    <p className="font-display text-xl font-black tracking-[-0.05em]">
                      {investment.asset}
                    </p>
                    <p className="text-sm text-ink/52">
                      {Number(investment.quantity).toLocaleString('en-US')} units
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-sm font-black text-ink/52">Average price</p>
                <p className="mt-1 font-display text-3xl font-black tracking-[-0.07em]">
                  {formatCurrency(Number(investment.averagePrice))}
                </p>
              </article>
            ))}
            {!isLoading && investments.length === 0 ? (
              <p className="rounded-[1.5rem] border border-ink/8 bg-white/58 p-4 text-sm text-ink/62">
                No investments registered yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    )
  }

  function renderAiModule() {
    return (
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] 2xl:gap-6" id="ai-desk">
        <Card tone="clay">
          <Badge tone="cream">AI desk</Badge>
          <h3 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.08em] 2xl:text-5xl">
            Ask for patterns, risks, and next moves.
          </h3>
          <p className="mt-4 text-sm leading-6 text-cream/76 2xl:text-base 2xl:leading-7">
            Use natural language to explore your cash movement and portfolio context.
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
          <Badge tone="clay">Assistant response</Badge>
          <div className="mt-5 rounded-[1.5rem] border border-ink/8 bg-white/58 p-4 2xl:p-6">
            {aiResponse ? (
              <>
                <p className="text-sm font-black text-moss">
                  Routed to {aiResponse.routedTo}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/70 2xl:text-base 2xl:leading-7">
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
                  Start with one of these prompts.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      className="interactive-surface rounded-[1.25rem] border border-ink/8 bg-white/64 p-4 text-left text-sm font-bold leading-6 text-ink/70 hover:bg-white"
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
    )
  }

  function renderAboutModule() {
    const macroFlow = [
      {
        chip: 'React',
        description: 'Dashboard modules, forms, theme, and AI prompt entry points.',
        label: 'Frontend SPA',
      },
      {
        chip: 'Kotlin',
        description: 'Spring Boot REST APIs for finance CRUD, AI bridge, and Spring AI summary.',
        label: 'Backend API',
      },
      {
        chip: 'Python',
        description: 'Orchestrator routes questions to financial and investment agents.',
        label: 'Agent layer',
      },
      {
        chip: 'MCP',
        description: 'Controlled tool boundary: get_transactions, add_transaction, get_investments.',
        label: 'Tool server',
      },
      {
        chip: 'Data',
        description: 'Shared persistence used by the backend APIs and by MCP tools.',
        label: 'PostgreSQL',
      },
      {
        chip: 'LLM',
        description: 'Groq-backed model receives context and returns the final explanation.',
        label: 'LLM provider',
      },
    ]

    return <AboutMacroFlow macroFlow={macroFlow} />
  }
}

type FlowNodeProps = {
  chip: string
  description: string
  label: string
}

type AboutMacroFlowProps = {
  macroFlow: FlowNodeProps[]
}

function AboutMacroFlow({ macroFlow }: AboutMacroFlowProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr] 2xl:gap-6">
      <Card tone="ink">
        <Badge tone="cream">About</Badge>
        <h3 className="mt-3 font-display text-4xl font-black leading-none tracking-[-0.08em]">
          How this lab is wired.
        </h3>
        <p className="mt-5 text-sm leading-7 text-cream/70">
          A macro view of how the product UI, backend APIs, agents, MCP tools,
          database, and LLM work together without crowding the main dashboard.
        </p>
      </Card>

      <Card>
        <Badge tone="clay">System flow</Badge>
        <div className="mt-6 rounded-[1.75rem] border border-ink/8 bg-[radial-gradient(circle_at_top_left,rgba(198,111,69,0.14),transparent_30%),linear-gradient(135deg,rgba(255,250,240,0.62),rgba(255,255,255,0.2))] p-4 2xl:p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <FlowNode {...macroFlow[0]} />
            <FlowNode {...macroFlow[1]} />
            <FlowNode {...macroFlow[4]} />
          </div>

          <div className="my-4 grid gap-3 lg:grid-cols-3">
            <FlowConnection label="Frontend calls backend APIs" />
            <FlowConnection label="Backend reads and writes PostgreSQL" />
            <FlowConnection label="Backend can call Python agents" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <FlowNode {...macroFlow[2]} />
            <FlowNode {...macroFlow[3]} />
            <FlowNode {...macroFlow[5]} />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <FlowConnection label="Agents request MCP tools" />
            <FlowConnection label="MCP tools also access PostgreSQL" />
            <FlowConnection label="LLM turns context into an answer" />
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(31,77,56,0.12),rgba(198,111,69,0.12))] p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-moss">
            Real flow
          </p>
          <p className="mt-3 text-sm leading-7 text-ink/68">
            Finance CRUD goes from frontend to Kotlin APIs and then directly to
            PostgreSQL. AI analysis goes from Kotlin to Python agents; agents use
            MCP tools, and those tools also read or write PostgreSQL before the
            LLM produces a contextual answer.
          </p>
        </div>
      </Card>
    </section>
  )
}

function FlowNode({ chip, description, label }: FlowNodeProps) {
  return (
    <article className="interactive-surface group relative min-h-36 rounded-[1.25rem] border border-ink/8 bg-white/62 p-4 shadow-lg shadow-moss/5 hover:bg-white/78">
      <span className="absolute -left-1 top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-cream bg-clay lg:block" />
      <span className="absolute -right-1 top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-cream bg-lagoon lg:block" />
      <span className="rounded-full bg-ink px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cream">
        {chip}
      </span>
      <h4 className="mt-4 font-display text-xl font-black tracking-[-0.07em] text-ink">
        {label}
      </h4>
      <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
    </article>
  )
}

function FlowConnection({ label }: { label: string }) {
  return (
    <div className="interactive-surface rounded-2xl border border-ink/8 bg-white/50 px-4 py-3 text-sm font-black text-ink/64">
      {label}
    </div>
  )
}
