// lib/tariff-rates.ts

export type TariffRate = {
  label: string
  energyCentsKwh: number
  peakCentsKwh: number
  offPeakCentsKwh: number
  demandCentsKva: number   // per kVA of NMD, per month
  isTOU: boolean
}

const RATES: Record<string, TariffRate> = {
  // Eskom
  MEGAFLEX:        { label: 'Megaflex (TOU)',        isTOU: true,  energyCentsKwh: 202, peakCentsKwh: 320, offPeakCentsKwh: 105, demandCentsKva: 6000 },
  MINIFLEX:        { label: 'Miniflex',              isTOU: false, energyCentsKwh: 215, peakCentsKwh: 215, offPeakCentsKwh: 215, demandCentsKva: 5000 },
  RURAFLEX:        { label: 'Ruraflex',              isTOU: false, energyCentsKwh: 180, peakCentsKwh: 180, offPeakCentsKwh: 180, demandCentsKva: 3500 },
  NIGHTSAVE_URBAN: { label: 'Nightsave Urban (TOU)', isTOU: true,  energyCentsKwh: 166, peakCentsKwh: 280, offPeakCentsKwh: 85,  demandCentsKva: 5500 },
  BUSINESSRATE:    { label: 'Businessrate',          isTOU: false, energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 4500 },
  HOMEFLEX:        { label: 'Homeflex (TOU)',         isTOU: true,  energyCentsKwh: 198, peakCentsKwh: 290, offPeakCentsKwh: 120, demandCentsKva: 0    },
  ESKOM_OTHER:     { label: 'Eskom tariff',           isTOU: false, energyCentsKwh: 200, peakCentsKwh: 200, offPeakCentsKwh: 200, demandCentsKva: 4500 },
  // Municipal
  LPU_TOU:         { label: 'LPU (TOU)',              isTOU: true,  energyCentsKwh: 276, peakCentsKwh: 380, offPeakCentsKwh: 160, demandCentsKva: 12000 },
  LPU_FLAT:        { label: 'LPU (Flat)',             isTOU: false, energyCentsKwh: 260, peakCentsKwh: 260, offPeakCentsKwh: 260, demandCentsKva: 11000 },
  SPU:             { label: 'Small Power User',       isTOU: false, energyCentsKwh: 280, peakCentsKwh: 280, offPeakCentsKwh: 280, demandCentsKva: 8000  },
  COMMERCIAL_TOU:  { label: 'Commercial (TOU)',        isTOU: true,  energyCentsKwh: 312, peakCentsKwh: 420, offPeakCentsKwh: 180, demandCentsKva: 9000  },
  COMMERCIAL_FLAT: { label: 'Commercial (Flat)',       isTOU: false, energyCentsKwh: 290, peakCentsKwh: 290, offPeakCentsKwh: 290, demandCentsKva: 8500  },
  GENERAL_SUPPLY:  { label: 'General Supply',          isTOU: false, energyCentsKwh: 270, peakCentsKwh: 270, offPeakCentsKwh: 270, demandCentsKva: 7000  },
  MUNICIPAL_OTHER: { label: 'Municipal tariff',        isTOU: false, energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 7000  },
}

const FALLBACK: TariffRate = {
  label: 'Standard rate', isTOU: false,
  energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 6000,
}

export function getTariffRate(tariffName: string | undefined): TariffRate {
  if (!tariffName) return FALLBACK
  return RATES[tariffName] ?? FALLBACK
}
