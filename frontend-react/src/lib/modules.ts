export type ModuleId = 'overview' | 'transactions' | 'investments' | 'ai-desk'

export type ModuleItem = {
  id: ModuleId
  label: string
  helper: string
}

export const modules: ModuleItem[] = [
  { id: 'overview', label: 'Overview', helper: 'Signal board' },
  { id: 'transactions', label: 'Transactions', helper: 'Cash movement' },
  { id: 'investments', label: 'Investments', helper: 'Portfolio base' },
  { id: 'ai-desk', label: 'AI desk', helper: 'Agent analysis' },
]

export function parseModuleHash(hash: string): ModuleId {
  const normalized = hash.replace('#', '') as ModuleId
  return modules.some((module) => module.id === normalized) ? normalized : 'overview'
}
