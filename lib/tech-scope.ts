// lib/tech-scope.ts

export type PvMountingType = 'ROOFTOP' | 'GROUND_MOUNT' | 'CARPORT'
export type BessChemistry = 'LFP' | 'NMC' | 'VRLA'
export type WheelingAgreementType = 'VIRTUAL_NET_METERING' | 'OPEN_ACCESS' | 'BILATERAL'
export type DesignObjective = 'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP' | 'GRID_EXPORT' | 'ARBITRAGE'
export type InverterTopology = 'HYBRID' | 'SEPARATE_GTI_PCS'

export type TechScope = {
  // Technology flags — at least one must be true
  hasPv: boolean
  hasBess: boolean
  hasWheeling: boolean

  // Inverter topology (only when hasPv && hasBess)
  inverterTopology?: InverterTopology

  // Sizing
  pvInverterKw?: number   // AC rating: hybrid inverter size (HYBRID) or PV GTI size (SEPARATE_GTI_PCS)
  pvArrayKwp?: number     // DC array size (kWp)
  bessInverterKw?: number // BESS PCS AC rating (SEPARATE_GTI_PCS topology or BESS-only)

  // PV details
  pvMountingType?: PvMountingType[] // multi-select

  // BESS details
  bessCapacityKwh?: number
  bessChemistry?: BessChemistry

  // Wheeling details
  wheelingAgreementType?: WheelingAgreementType
  wheelingCapacityKw?: number
  wheelingDistanceKm?: number
  wheelingTradingPartner?: string

  // Design philosophy (always)
  designObjectives: DesignObjective[]
  exportToGrid: boolean
}

export type DerivedTechnology = 'SOLAR_PV' | 'BESS' | 'HYBRID'

export function deriveTechnology(scope: Pick<TechScope, 'hasPv' | 'hasBess' | 'hasWheeling'>): DerivedTechnology {
  const primaryCount = [scope.hasPv, scope.hasBess].filter(Boolean).length
  if (primaryCount > 1) return 'HYBRID'
  if (scope.hasBess) return 'BESS'
  if (scope.hasPv) return 'SOLAR_PV'
  if (scope.hasWheeling) return 'HYBRID'
  throw new Error('TechScope must have at least one technology flag set')
}

export const DESIGN_OBJECTIVE_LABELS: Record<DesignObjective, string> = {
  SELF_CONSUMPTION: 'Self-consumption',
  PEAK_SHAVING: 'Peak shaving / demand management',
  BACKUP: 'Backup / load-shedding resilience',
  GRID_EXPORT: 'Grid export / revenue generation',
  ARBITRAGE: 'Energy arbitrage / time-of-use optimisation',
}

export const BESS_CHEMISTRY_LABELS: Record<BessChemistry, string> = {
  LFP: 'Lithium Iron Phosphate (LFP)',
  NMC: 'Lithium Nickel Manganese Cobalt (NMC)',
  VRLA: 'Lead-acid (VRLA)',
}

export const MOUNTING_TYPE_LABELS: Record<PvMountingType, string> = {
  ROOFTOP: 'Rooftop',
  GROUND_MOUNT: 'Ground mount',
  CARPORT: 'Carport',
}

export const WHEELING_TYPE_LABELS: Record<WheelingAgreementType, string> = {
  VIRTUAL_NET_METERING: 'Virtual Net Metering (VNM)',
  OPEN_ACCESS: 'Open Access / Third-party access',
  BILATERAL: 'Bilateral Power Purchase Agreement',
}

export const INVERTER_TOPOLOGY_LABELS: Record<InverterTopology, { label: string; sub: string }> = {
  HYBRID: {
    label: 'Hybrid inverter',
    sub: 'Single unit handles PV input and BESS interface',
  },
  SEPARATE_GTI_PCS: {
    label: 'Separate GTI + PCS',
    sub: 'PV grid-tied inverter + dedicated BESS power conversion system',
  },
}
