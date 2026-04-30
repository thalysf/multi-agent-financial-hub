export type Transaction = {
  id: number
  type: 'INCOME' | 'EXPENSE'
  amount: number
  category: string
  date: string
}

export type Investment = {
  id: number
  asset: string
  quantity: number
  averagePrice: number
}

export type CreateTransactionInput = {
  type: 'INCOME' | 'EXPENSE'
  amount: string
  category: string
  date: string
}

export type CreateInvestmentInput = {
  asset: string
  quantity: string
  averagePrice: string
}

export type AiAnalyzeResponse = {
  agent: string
  routedTo: string
  routingReason: string
  response: string
  toolsUsed: string[]
  data: Record<string, unknown>
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getTransactions() {
  return request<Transaction[]>('/transactions')
}

export function createTransaction(input: CreateTransactionInput) {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getInvestments() {
  return request<Investment[]>('/investments')
}

export function createInvestment(input: CreateInvestmentInput) {
  return request<Investment>('/investments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function analyzeFinances(message: string) {
  return request<AiAnalyzeResponse>('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
