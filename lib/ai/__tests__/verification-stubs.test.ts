import { describe, it, expect } from 'vitest'
import { generateVerificationResult } from '../verification-stubs'

describe('generateVerificationResult', () => {
  it('returns FAIL for EIA v1 with confidence 0.87', () => {
    const result = generateVerificationResult('Environmental Impact Assessment', 1)
    expect(result.status).toBe('FAIL')
    expect(result.confidence).toBe(0.87)
    expect(result.findings.some(f => f.type === 'missing')).toBe(true)
  })

  it('returns PASS for EIA v2 with confidence 0.94', () => {
    const result = generateVerificationResult('Environmental Impact Assessment', 2)
    expect(result.status).toBe('PASS')
    expect(result.confidence).toBe(0.94)
    expect(result.findings.every(f => f.type !== 'missing')).toBe(true)
  })

  it('returns PASS for unknown milestones', () => {
    const result = generateVerificationResult('Unknown Milestone', 1)
    expect(result.status).toBe('PASS')
  })

  it('returns PASS for Site Assessment Report', () => {
    const result = generateVerificationResult('Site Assessment Report', 1)
    expect(result.status).toBe('PASS')
    expect(result.confidence).toBeGreaterThan(0.9)
  })
})
