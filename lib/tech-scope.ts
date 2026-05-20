// lib/tech-scope.ts

export type PvMountingType = 'ROOFTOP' | 'GROUND_MOUNT' | 'CARPORT'
export type BessChemistry = 'LFP' | 'NMC' | 'VRLA'
export type WheelingAgreementType = 'VIRTUAL_NET_METERING' | 'OPEN_ACCESS' | 'BILATERAL'
export type DesignObjective = 'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP' | 'GRID_EXPORT'

export type TechScope = {
  // Technology flags — at least one must be true
  hasPv: boolean
  hasBess: boolean
  hasWind: boolean
  hasWheeling: boolean

  // PV details (present when hasPv)
  pvCapacityKwp?: number
  pvPanelBrand?: string
  pvInverterBrand?: string
  pvMountingType?: PvMountingType

  // BESS details (present when hasBess)
  bessCapacityKwh?: number
  bessPowerKw?: number
  bessChemistry?: BessChemistry
  bessBrandModel?: string
  bessAutonomyHours?: number

  // Wind details (present when hasWind)
  windCapacityKw?: number
  windTurbineModel?: string
  windHubHeightM?: number

  // Wheeling (present when hasWheeling)
  wheelingAgreementType?: WheelingAgreementType
  wheelingDistanceKm?: number
  wheelingTradingPartner?: string

  // Design philosophy (always)
  designObjectives: DesignObjective[]
  targetBackupHours?: number
  exportToGrid: boolean
}

export type DerivedTechnology = 'SOLAR_PV' | 'WIND' | 'BESS' | 'HYBRID'

export function deriveTechnology(scope: TechScope): DerivedTechnology {
  const primaryCount = [scope.hasPv, scope.hasBess, scope.hasWind].filter(Boolean).length
  if (primaryCount > 1) return 'HYBRID'
  if (scope.hasBess) return 'BESS'
  if (scope.hasWind) return 'WIND'
  return 'SOLAR_PV' // hasPv true or nothing selected (fallback)
}

export const DESIGN_OBJECTIVE_LABELS: Record<DesignObjective, string> = {
  SELF_CONSUMPTION: 'Self-consumption',
  PEAK_SHAVING: 'Peak shaving / demand management',
  BACKUP: 'Backup / load-shedding resilience',
  GRID_EXPORT: 'Grid export / revenue generation',
}

export const BESS_CHEMISTRY_LABELS: Record<BessChemistry, string> = {
  LFP: 'Lithium Iron Phosphate (LFP)',
  NMC: 'Lithium Nickel Manganese Cobalt (NMC)',
  VRLA: 'Lead-acid (VRLA)',
}

export const MOUNTING_TYPE_LABELS: Record<PvMountingType, string> = {
  ROOFTOP: 'Rooftop',
  GROUND_MOUNT: 'Ground mount',
  CARPORT: 'Carport / shade structure',
}

export const WHEELING_TYPE_LABELS: Record<WheelingAgreementType, string> = {
  VIRTUAL_NET_METERING: 'Virtual Net Metering (VNM)',
  OPEN_ACCESS: 'Open Access / Third-party access',
  BILATERAL: 'Bilateral Power Purchase Agreement',
}
