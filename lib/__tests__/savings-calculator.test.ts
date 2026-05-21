import { describe, it, expect } from 'vitest'
import { calculateSavings } from '../savings-calculator'

const TWO_READINGS = [
  { productionKwh: 100, consumptionKwh: 80,  gridImportKwh: 0  },
  { productionKwh: 60,  consumptionKwh: 100, gridImportKwh: 40 },
]

describe('calculateSavings', () => {
  it('post-solar energy charge is less than pre-solar', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: 'BUSINESSRATE', nmdKva: 500, hasBess: false })
    expect(r.postSolarEnergyRands).toBeLessThan(r.preSolarEnergyRands)
  })

  it('solarUsedKwh + gridImportKwh equals totalConsumptionKwh', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: 'MEGAFLEX', nmdKva: 300, hasBess: true })
    expect(r.solarUsedKwh + r.gridImportKwh).toBe(r.totalConsumptionKwh)
  })

  it('BESS reduces demand more than PV-only on same inputs', () => {
    const withBess    = calculateSavings({ readings: TWO_READINGS, tariffName: 'LPU_TOU', nmdKva: 500, hasBess: true  })
    const withoutBess = calculateSavings({ readings: TWO_READINGS, tariffName: 'LPU_TOU', nmdKva: 500, hasBess: false })
    expect(withBess.postSolarDemandRands).toBeLessThan(withoutBess.postSolarDemandRands)
  })

  it('estimates grid import when gridImportKwh is null', () => {
    const readings = [{ productionKwh: 80, consumptionKwh: 100, gridImportKwh: null }]
    const r = calculateSavings({ readings, tariffName: 'BUSINESSRATE', nmdKva: 200, hasBess: false })
    expect(r.gridImportKwh).toBe(20)
  })

  it('falls back gracefully when tariffName is undefined', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: undefined, nmdKva: 200, hasBess: false })
    expect(r.savedRands).toBeGreaterThan(0)
    expect(r.rate.label).toBe('Standard rate')
  })

  it('zero consumption gives zero totalConsumptionKwh', () => {
    const readings = [{ productionKwh: 100, consumptionKwh: null, gridImportKwh: null }]
    const r = calculateSavings({ readings, tariffName: 'BUSINESSRATE', nmdKva: 0, hasBess: false })
    expect(r.totalConsumptionKwh).toBe(0)
  })

  it('savedRands is never negative', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: 'MEGAFLEX', nmdKva: 500, hasBess: false })
    expect(r.savedRands).toBeGreaterThanOrEqual(0)
  })
})
