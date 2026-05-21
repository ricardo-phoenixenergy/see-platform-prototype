// lib/savings-calculator.ts

import { getTariffRate, type TariffRate } from './tariff-rates'

export type SavingsReading = {
  productionKwh: number
  consumptionKwh: number | null
  gridImportKwh: number | null
}

export type SavingsInput = {
  readings: SavingsReading[]
  tariffName: string | undefined
  nmdKva: number
  hasBess: boolean
}

export type SavingsResult = {
  preSolarEnergyRands: number
  postSolarEnergyRands: number
  preSolarDemandRands: number
  postSolarDemandRands: number
  preSolarTotalRands: number
  postSolarTotalRands: number
  savedRands: number
  savedPercent: number
  totalConsumptionKwh: number
  solarUsedKwh: number
  gridImportKwh: number
  rate: TariffRate
}

export type DailySaving = {
  date: string
  savedRands: number
}

// TOU split: typical C&I profile — 40% peak, 60% off-peak
const PEAK_FRACTION = 0.4
const OFF_PEAK_FRACTION = 0.6

// Demand reduction factors from solar + BESS peak shaving
const DEMAND_REDUCTION_BESS = 0.35
const DEMAND_REDUCTION_PV_ONLY = 0.15

function energyCost(kwh: number, rate: TariffRate): number {
  if (!rate.isTOU) return (kwh * rate.energyCentsKwh) / 100
  return (
    (kwh * PEAK_FRACTION * rate.peakCentsKwh) +
    (kwh * OFF_PEAK_FRACTION * rate.offPeakCentsKwh)
  ) / 100
}

function estimateGridImport(r: SavingsReading): number {
  if (r.gridImportKwh != null) return r.gridImportKwh
  return Math.max(0, (r.consumptionKwh ?? 0) - r.productionKwh)
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const { readings, tariffName, nmdKva, hasBess } = input
  const rate = getTariffRate(tariffName)

  const totalConsumptionKwh = Math.round(readings.reduce((s, r) => s + (r.consumptionKwh ?? 0), 0))
  const gridImportKwh = Math.round(readings.reduce((s, r) => s + estimateGridImport(r), 0))
  const solarUsedKwh = Math.max(0, totalConsumptionKwh - gridImportKwh)

  const preSolarEnergyRands = Math.round(energyCost(totalConsumptionKwh, rate))
  const postSolarEnergyRands = Math.round(energyCost(gridImportKwh, rate))

  const preSolarDemandRands = Math.round((nmdKva * rate.demandCentsKva) / 100)
  const demandFactor = hasBess ? DEMAND_REDUCTION_BESS : DEMAND_REDUCTION_PV_ONLY
  const postSolarDemandRands = Math.round(preSolarDemandRands * (1 - demandFactor))

  const preSolarTotalRands = preSolarEnergyRands + preSolarDemandRands
  const postSolarTotalRands = postSolarEnergyRands + postSolarDemandRands
  const savedRands = preSolarTotalRands - postSolarTotalRands
  const savedPercent = preSolarTotalRands > 0
    ? Math.round((savedRands / preSolarTotalRands) * 100)
    : 0

  return {
    preSolarEnergyRands,
    postSolarEnergyRands,
    preSolarDemandRands,
    postSolarDemandRands,
    preSolarTotalRands,
    postSolarTotalRands,
    savedRands,
    savedPercent,
    totalConsumptionKwh,
    solarUsedKwh,
    gridImportKwh,
    rate,
  }
}

function fmtDate(date: string | Date): string {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function calculateDailySavings(
  readings: (SavingsReading & { recordedAt: string | Date })[],
  tariffName: string | undefined
): DailySaving[] {
  const rate = getTariffRate(tariffName)
  return readings.map(r => {
    const consumed = r.consumptionKwh ?? 0
    const imported = estimateGridImport(r)
    const solarUsed = Math.max(0, consumed - imported)
    const savedRands = Math.round(energyCost(solarUsed, rate))
    return { date: fmtDate(r.recordedAt), savedRands }
  })
}
