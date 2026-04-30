import {
  type FormEvent,
  type ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  deleteInvestment,
  deleteTransaction,
  getInvestments,
  getTransactions,
  updateInvestment,
  updateTransaction,
} from '../lib/api'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'
import {
  ensureInvestmentColors,
  getStoredInvestmentColors,
  saveInvestmentColors,
} from '../lib/investmentColors'
import type { ModuleId } from '../lib/modules'

type DashboardPageProps = {
  activeModule: ModuleId
  onNavigate: (module: ModuleId) => void
}

type SummaryTone = 'cream' | 'ink' | 'lagoon' | 'clay'
type ModalType = 'transaction' | 'investment' | null
type DeleteTarget =
  | { item: Transaction; kind: 'transaction' }
  | { item: Investment; kind: 'investment' }

const today = new Date().toISOString().slice(0, 10)
const motionEaseOut = [0.16, 1, 0.3, 1] as const
const motionEaseIn = [0.7, 0, 0.84, 0] as const
const moduleMotionTransition = {
  duration: 0.92,
  ease: motionEaseOut,
} as const
const moduleMotionVariants = {
  initial: {
    clipPath: 'inset(0 3.5rem 2.5rem 0 round 2rem)',
    filter: 'blur(14px) saturate(0.92)',
    opacity: 0,
    scale: 0.975,
    y: 34,
  },
  animate: {
    clipPath: 'inset(0 0 0 0 round 0rem)',
    filter: 'blur(0px) saturate(1)',
    opacity: 1,
    scale: 1,
    transition: {
      ...moduleMotionTransition,
      opacity: { duration: 0.62, ease: motionEaseOut },
    },
    y: 0,
  },
  exit: {
    clipPath: 'inset(1rem 0 0 2rem round 2rem)',
    filter: 'blur(8px) saturate(0.96)',
    opacity: 0,
    scale: 0.985,
    transition: {
      duration: 0.42,
      ease: motionEaseIn,
    },
    y: -18,
  },
}

async function loadDashboardData() {
  const [transactionsResult, investmentsResult] = await Promise.all([
    getTransactions(),
    getInvestments(),
  ])

  return { investmentsResult, transactionsResult }
}

function createEmptyTransactionForm(): CreateTransactionInput {
  return {
    amount: '',
    category: '',
    date: today,
    type: 'EXPENSE',
  }
}

function createEmptyInvestmentForm(): CreateInvestmentInput {
  return {
    asset: '',
    averagePrice: '',
    quantity: '',
  }
}

function transactionToForm(transaction: Transaction): CreateTransactionInput {
  return {
    amount: String(transaction.amount),
    category: transaction.category,
    date: transaction.date,
    type: transaction.type,
  }
}

function investmentToForm(investment: Investment): CreateInvestmentInput {
  return {
    asset: investment.asset,
    averagePrice: String(investment.averagePrice),
    quantity: String(investment.quantity),
  }
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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>(
    createEmptyTransactionForm,
  )
  const [investmentForm, setInvestmentForm] = useState<CreateInvestmentInput>(
    createEmptyInvestmentForm,
  )

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
  const transactionModalIsEditing = editingTransaction !== null
  const investmentModalIsEditing = editingInvestment !== null
  const deleteModalTitle = deleteTarget
    ? `Delete ${deleteTarget.kind === 'transaction' ? 'transaction' : 'investment'}?`
    : 'Delete record?'
  const deleteModalDescription =
    deleteTarget?.kind === 'transaction'
      ? 'This permanently removes the cash movement from the dashboard.'
      : 'This permanently removes the portfolio position from the dashboard.'

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
    const transactionBeingEdited = editingTransaction

    try {
      if (transactionBeingEdited) {
        const updated = await updateTransaction(transactionBeingEdited.id, transactionForm)
        setTransactions((current) =>
          current.map((transaction) => (transaction.id === updated.id ? updated : transaction)),
        )
      } else {
        const created = await createTransaction(transactionForm)
        setTransactions((current) => [created, ...current])
      }

      setEditingTransaction(null)
      setTransactionForm(createEmptyTransactionForm())
      setActiveModal(null)
      onNavigate('transactions')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save transaction')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleInvestmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const investmentBeingEdited = editingInvestment

    try {
      if (investmentBeingEdited) {
        const updated = await updateInvestment(investmentBeingEdited.id, investmentForm)
        setInvestments((current) =>
          current.map((investment) => (investment.id === updated.id ? updated : investment)),
        )
      } else {
        const created = await createInvestment(investmentForm)
        setInvestments((current) => [created, ...current])
        setInvestmentColors((current) => ensureInvestmentColors([created], current))
      }

      setEditingInvestment(null)
      setInvestmentForm(createEmptyInvestmentForm())
      setActiveModal(null)
      onNavigate('investments')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save investment')
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
    if (type === 'transaction') {
      setEditingTransaction(null)
      setTransactionForm(createEmptyTransactionForm())
    } else {
      setEditingInvestment(null)
      setInvestmentForm(createEmptyInvestmentForm())
    }
    setActiveModal(type)
  }

  function closeEditorModal() {
    if (isSaving) {
      return
    }

    setActiveModal(null)
    setEditingTransaction(null)
    setEditingInvestment(null)
    setFormError(null)
  }

  function openTransactionEditor(transaction: Transaction) {
    setFormError(null)
    setEditingInvestment(null)
    setEditingTransaction(transaction)
    setTransactionForm(transactionToForm(transaction))
    setActiveModal('transaction')
  }

  function openInvestmentEditor(investment: Investment) {
    setFormError(null)
    setEditingTransaction(null)
    setEditingInvestment(investment)
    setInvestmentForm(investmentToForm(investment))
    setActiveModal('investment')
  }

  function requestDeleteTransaction(transaction: Transaction) {
    setFormError(null)
    setDeleteTarget({ item: transaction, kind: 'transaction' })
  }

  function requestDeleteInvestment(investment: Investment) {
    setFormError(null)
    setDeleteTarget({ item: investment, kind: 'investment' })
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return
    }

    setDeleteTarget(null)
    setFormError(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return
    }

    const target = deleteTarget
    setIsDeleting(true)
    setFormError(null)

    try {
      if (target.kind === 'transaction') {
        await deleteTransaction(target.item.id)
        setTransactions((current) =>
          current.filter((transaction) => transaction.id !== target.item.id),
        )
        if (editingTransaction?.id === target.item.id) {
          closeEditorModal()
        }
      } else {
        await deleteInvestment(target.item.id)
        setInvestments((current) =>
          current.filter((investment) => investment.id !== target.item.id),
        )
        setInvestmentColors((current) => {
          const nextColors = { ...current }
          delete nextColors[String(target.item.id)]
          saveInvestmentColors(nextColors)
          return nextColors
        })

        if (editingInvestment?.id === target.item.id) {
          closeEditorModal()
        }
      }

      setDeleteTarget(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not delete record')
    } finally {
      setIsDeleting(false)
    }
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

      <div className="module-transition-shell">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate="animate"
            className="module-transition"
            exit="exit"
            initial="initial"
            key={activeModule}
            variants={moduleMotionVariants}
          >
            {activeModule === 'overview' ? renderOverviewModule() : null}
            {activeModule === 'transactions' ? renderTransactionsModule() : null}
            {activeModule === 'investments' ? renderInvestmentsModule() : null}
            {activeModule === 'ai-desk' ? renderAiModule() : null}
            {activeModule === 'about' ? renderAboutModule() : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <Modal
        description={
          transactionModalIsEditing
            ? 'Adjust this cash movement and keep every summary in sync.'
            : 'Create a cash movement and keep the dashboard in sync.'
        }
        isOpen={activeModal === 'transaction'}
        onClose={closeEditorModal}
        title={transactionModalIsEditing ? 'Edit transaction' : 'New transaction'}
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
            {isSaving
              ? 'Saving...'
              : transactionModalIsEditing
                ? 'Save transaction'
                : 'Create transaction'}
          </Button>
        </form>
      </Modal>

      <Modal
        description={
          investmentModalIsEditing
            ? 'Adjust this portfolio position without changing its visual identity.'
            : 'Create a portfolio position and update the investment snapshot.'
        }
        isOpen={activeModal === 'investment'}
        onClose={closeEditorModal}
        title={investmentModalIsEditing ? 'Edit investment' : 'New investment'}
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
            {isSaving
              ? 'Saving...'
              : investmentModalIsEditing
                ? 'Save investment'
                : 'Create investment'}
          </Button>
        </form>
      </Modal>

      <Modal
        description={deleteModalDescription}
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title={deleteModalTitle}
      >
        {deleteTarget ? (
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-clay/20 bg-clay/10 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-clay">
                Permanent action
              </p>
              <p className="mt-3 text-sm leading-6 text-ink/68">
                {deleteTarget.kind === 'transaction'
                  ? `${deleteTarget.item.category} - ${formatCurrency(Number(deleteTarget.item.amount))}`
                  : `${deleteTarget.item.asset} - ${Number(deleteTarget.item.quantity).toLocaleString('en-US')} units`}
              </p>
            </div>
            {formError ? <p className="text-sm font-bold text-clay">{formError}</p> : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={isDeleting} onClick={closeDeleteModal} variant="secondary">
                Keep record
              </Button>
              <Button disabled={isDeleting} onClick={handleConfirmDelete} variant="danger">
                {isDeleting ? 'Deleting...' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )

  function renderOverviewModule() {
    return (
      <>
        <section className="grid auto-rows-fr items-stretch gap-x-4 gap-y-5 md:grid-cols-3 2xl:gap-x-6 2xl:gap-y-6">
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

        <section className="mt-5 grid auto-rows-fr items-stretch gap-x-4 gap-y-5 xl:grid-cols-3 2xl:mt-6 2xl:gap-x-6 2xl:gap-y-6">
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
      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] 2xl:grid-cols-[minmax(0,1.3fr)_minmax(28rem,0.7fr)] 2xl:gap-6">
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
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <ActionIconButton
                        aria-label={`Edit transaction ${row.category}`}
                        onClick={() => openTransactionEditor(row)}
                        title="Edit transaction"
                        tone="edit"
                      >
                        <PencilIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        aria-label={`Delete transaction ${row.category}`}
                        onClick={() => requestDeleteTransaction(row)}
                        title="Delete transaction"
                        tone="delete"
                      >
                        <TrashIcon />
                      </ActionIconButton>
                    </div>
                  ),
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

        <Card className="min-h-[24rem] justify-between xl:min-h-full" tone="clay">
          <div>
            <Badge tone="cream">Quick insight</Badge>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-cream/62">
              Net cash flow
            </p>
            <p className="mt-3 font-display text-5xl font-black tracking-[-0.09em] 2xl:text-6xl">
              {formatCurrency(incomeTotal - expenseTotal)}
            </p>
            <p className="mt-4 text-sm leading-7 text-cream/76">
              Income minus expenses from the current transaction records.
            </p>
          </div>
          <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-white/14 bg-white/12 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-cream/64">Income</span>
              <span className="font-display text-2xl font-black tracking-[-0.06em]">
                {formatCurrency(incomeTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-cream/64">Expenses</span>
              <span className="font-display text-2xl font-black tracking-[-0.06em]">
                {formatCurrency(expenseTotal)}
              </span>
            </div>
          </div>
          <Button
            className="mt-6 w-full"
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
                <div className="mt-5 flex flex-wrap gap-2">
                  <ActionIconButton
                    aria-label={`Edit investment ${investment.asset}`}
                    onClick={() => openInvestmentEditor(investment)}
                    title="Edit investment"
                    tone="edit"
                  >
                    <PencilIcon />
                  </ActionIconButton>
                  <ActionIconButton
                    aria-label={`Delete investment ${investment.asset}`}
                    onClick={() => requestDeleteInvestment(investment)}
                    title="Delete investment"
                    tone="delete"
                  >
                    <TrashIcon />
                  </ActionIconButton>
                </div>
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

type ActionIconButtonProps = {
  'aria-label': string
  children: ReactNode
  onClick: () => void
  title: string
  tone: 'delete' | 'edit'
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

function ActionIconButton({
  'aria-label': ariaLabel,
  children,
  onClick,
  title,
  tone,
}: ActionIconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`action-icon-button interactive-surface ${
        tone === 'edit' ? 'action-icon-button-edit' : 'action-icon-button-delete'
      }`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
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

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="action-icon"
      fill="none"
      height="19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
      width="19"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="action-icon"
      fill="none"
      height="19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
      width="19"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}
