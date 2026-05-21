// lib/site-info.ts

export type ElectricitySupplier = 'ESKOM' | 'MUNICIPAL'
export type SupplyVoltage = 'LV' | 'MV' | 'HV'

export type SiteInfo = {
  supplier: ElectricitySupplier
  municipalityName?: string       // when supplier === 'MUNICIPAL'
  tariffName?: string             // value from ESKOM_TARIFFS or MUNICIPAL_TARIFFS
  isTOU: boolean                  // auto-derived from tariffName; affects BESS arbitrage indicator
  nmdKva: number                  // Notified Maximum Demand — gates embedded generation size
  supplyVoltage: SupplyVoltage
  transformerCapacityKva?: number // physical transformer limit; relevant for export scenarios
  accountNumber?: string          // utility account / meter reference (optional, for records)
}

// ── Tariff definitions ────────────────────────────────────────────────────────

type TariffOption = { value: string; label: string; isTOU: boolean }

export const ESKOM_TARIFFS: TariffOption[] = [
  { value: 'MEGAFLEX',        label: 'Megaflex (TOU)',         isTOU: true  },
  { value: 'MINIFLEX',        label: 'Miniflex',               isTOU: false },
  { value: 'RURAFLEX',        label: 'Ruraflex',               isTOU: false },
  { value: 'NIGHTSAVE_URBAN', label: 'Nightsave Urban (TOU)',  isTOU: true  },
  { value: 'BUSINESSRATE',    label: 'Businessrate',           isTOU: false },
  { value: 'HOMEFLEX',        label: 'Homeflex (TOU)',         isTOU: true  },
  { value: 'ESKOM_OTHER',     label: 'Other Eskom tariff',     isTOU: false },
]

export const MUNICIPAL_TARIFFS: TariffOption[] = [
  { value: 'LPU_TOU',         label: 'Large Power User (LPU) — TOU',       isTOU: true  },
  { value: 'LPU_FLAT',        label: 'Large Power User (LPU) — Flat rate', isTOU: false },
  { value: 'SPU',             label: 'Small Power User (SPU)',              isTOU: false },
  { value: 'COMMERCIAL_TOU',  label: 'Commercial — TOU',                   isTOU: true  },
  { value: 'COMMERCIAL_FLAT', label: 'Commercial — Flat rate',             isTOU: false },
  { value: 'GENERAL_SUPPLY',  label: 'General Supply',                     isTOU: false },
  { value: 'MUNICIPAL_OTHER', label: 'Other municipal tariff',             isTOU: false },
]

// ── Municipality list ─────────────────────────────────────────────────────────

export const SA_MUNICIPALITIES: string[] = [
  'City Power (Johannesburg)',
  'City of Tshwane',
  'Ekurhuleni',
  'eThekwini (Durban)',
  'City of Cape Town',
  'Mangaung (Bloemfontein)',
  'Nelson Mandela Bay (Gqeberha)',
  'Buffalo City (East London)',
  'Sol Plaatje (Kimberley)',
  'Msunduzi (Pietermaritzburg)',
  'Drakenstein (Paarl)',
  'Stellenbosch',
  'George',
  'Polokwane',
  'Emalahleni (Witbank)',
  'Steve Tshwete (Middelburg)',
  'Matlosana (Klerksdorp)',
  'Rustenburg',
  'Thulamela (Thohoyandou)',
  'Mbombela (Nelspruit)',
  'Other municipality',
]

// ── Supply voltage options ────────────────────────────────────────────────────

export const SUPPLY_VOLTAGE_OPTIONS: { value: SupplyVoltage; label: string; sub: string }[] = [
  { value: 'LV', label: 'Low Voltage (LV)',    sub: '< 1 kV — typical small to medium commercial' },
  { value: 'MV', label: 'Medium Voltage (MV)', sub: '1–33 kV — large commercial / industrial'     },
  { value: 'HV', label: 'High Voltage (HV)',   sub: '> 33 kV — very large industrial / transmission' },
]

// ── Utility functions ─────────────────────────────────────────────────────────

const ALL_TARIFFS: TariffOption[] = [...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS]

export function isTOUTariff(supplier: ElectricitySupplier, tariffValue: string): boolean {
  const match = ALL_TARIFFS.find(t => t.value === tariffValue)
  return match?.isTOU ?? false
}

export function getTariffsForSupplier(supplier: ElectricitySupplier): TariffOption[] {
  if (supplier === 'ESKOM') return ESKOM_TARIFFS
  return MUNICIPAL_TARIFFS
}

export function guidanceForSupplier(supplier: ElectricitySupplier): string {
  if (supplier === 'ESKOM') {
    return 'Eskom embedded generation: systems < 1 MW require Schedule 2 notification. ' +
      'Applications submitted via Eskom C&I online portal. MV/HV connections may require ' +
      'dedicated protection relay study and Eskom approval before commissioning.'
  }
  return 'Municipal embedded generation: approval required from the local utility in addition ' +
    'to any NERSA registration. Most municipalities require a formal application, technical ' +
    'review, and anti-islanding protection before grid connection is permitted.'
}
