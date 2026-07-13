import { describe, expect, it } from 'vitest'
import { getFieldLiveCurrent, getFieldOrigin } from '../src/data/fieldOrigins'
import { computeLiveReturn, SEED_AMOUNTS } from '../src/data/liveReturn'

describe('fieldOrigins', () => {
  const totals = computeLiveReturn(SEED_AMOUNTS)

  it('maps tax-exempt interest to Unwavering Box 8 with highlight field', () => {
    const origin = getFieldOrigin('taxExemptInterest', totals, SEED_AMOUNTS)
    expect(origin?.kind).toBe('source')
    expect(origin?.sources).toHaveLength(1)
    expect(origin?.sources?.[0].box).toBe('Box 8')
    expect(origin?.sources?.[0].amount).toBe(180)
    expect(origin?.sources?.[0].detailFieldId).toBe('taxExempt-unwaverIngFinancial')
    expect(origin?.sources?.[0].docId).toBe('1099-int-unwavering')
  })

  it('lists three INT sources for taxable interest with live amounts', () => {
    const origin = getFieldOrigin('taxableInterest', totals, SEED_AMOUNTS)
    expect(origin?.kind).toBe('source')
    expect(origin?.sources).toHaveLength(3)
    expect(origin?.sources?.map(s => s.amount)).toEqual([1986, 3200, 1150])
  })

  it('explains total income as a calc of live component lines', () => {
    const origin = getFieldOrigin('totalIncome', totals, SEED_AMOUNTS)
    expect(origin?.kind).toBe('calc')
    expect(origin?.calc?.total).toBe(totals.totalIncome)
    expect(origin?.calc?.components.some(c => c.lineFieldId === 'taxableInterest')).toBe(true)
  })

  it('returns live current amounts for YoY card', () => {
    expect(getFieldLiveCurrent('wages', totals)).toBe(totals.wages)
    expect(getFieldLiveCurrent('amountOwed', totals)).toBe(totals.oweAmount)
    expect(getFieldLiveCurrent('taxExemptInterest', totals)).toBe(180)
  })

  it('covers every Form-view 1040 field id', () => {
    const fields = [
      'wages', 'wagesTotal', 'taxExemptInterest', 'taxableInterest',
      'qualifiedDivs', 'ordinaryDivs', 'iraDistrib', 'capitalGain',
      'otherIncome', 'totalIncome', 'agi', 'stdDeduction', 'deductionSum',
      'taxableIncome', 'incomeTax', 'totalTax', 'w2Withholding', 'withholding',
      'totalWithholding', 'totalPayments', 'amountOwed',
    ]
    for (const id of fields) {
      expect(getFieldOrigin(id, totals, SEED_AMOUNTS), id).not.toBeNull()
    }
  })
})
