import type { Investment } from './api'

export type InvestmentColorMap = Record<string, string>

const storageKey = 'financialHub.investmentColors'

export function getStoredInvestmentColors(): InvestmentColorMap {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    return rawValue ? (JSON.parse(rawValue) as InvestmentColorMap) : {}
  } catch {
    return {}
  }
}

export function saveInvestmentColors(colors: InvestmentColorMap) {
  window.localStorage.setItem(storageKey, JSON.stringify(colors))
}

export function ensureInvestmentColors(
  investments: Investment[],
  currentColors: InvestmentColorMap,
): InvestmentColorMap {
  const nextColors = { ...currentColors }
  let changed = false

  for (const investment of investments) {
    const key = String(investment.id)

    if (!nextColors[key]) {
      nextColors[key] = createStrongInvestmentColor(Object.values(nextColors))
      changed = true
    }
  }

  if (changed) {
    saveInvestmentColors(nextColors)
  }

  return nextColors
}

function createStrongInvestmentColor(existingColors: string[]) {
  const existingHues = existingColors
    .map((color) => Number(color.match(/hsl\((\d+)/)?.[1]))
    .filter(Number.isFinite)
  let hue = randomInt(0, 359)

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (existingHues.every((existingHue) => Math.abs(existingHue - hue) > 24)) {
      break
    }

    hue = randomInt(0, 359)
  }

  const saturation = randomInt(76, 92)
  const lightness = randomInt(40, 50)

  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
