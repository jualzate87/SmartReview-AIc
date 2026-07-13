import { describe, expect, it } from 'vitest'
import { getTaxControlBreakdown } from '../src/data/taxControlBreakdowns'
import { FROZEN_RETURN } from '../src/data/frozenReturn'
import { getControlSystemValues } from '../src/data/sourceDocuments'

const systemVals = getControlSystemValues({
  total1a: FROZEN_RETURN.wages,
  taxableInterest: FROZEN_RETURN.taxableInterest,
  ordinaryDivs: FROZEN_RETURN.ordinaryDivs,
  qualifiedDivs: FROZEN_RETURN.qualifiedDivs,
  totalIncome: FROZEN_RETURN.totalIncome,
  stdDeduction: FROZEN_RETURN.stdDeduction,
  taxableIncome: FROZEN_RETURN.totalIncome - FROZEN_RETURN.stdDeduction,
  totalTax: FROZEN_RETURN.totalTax,
  w2Withholding: FROZEN_RETURN.w2Withholding,
  divWithholding: FROZEN_RETURN.divWithholding,
  totalWithholding: FROZEN_RETURN.totalWithholding,
  oweAmount: FROZEN_RETURN.totalTax - FROZEN_RETURN.totalWithholding,
  taxablePension: FROZEN_RETURN.taxablePension,
})

describe('getTaxControlBreakdown', () => {
  it('returns breakdowns for all tax control rows', () => {
    const rowIds = [
      'wages', 'interest', 'dividends', 'qualDivs', 'ira',
      'totalIncome', 'stdDeduction', 'taxableIncome', 'totalTax',
      'withholdingW2', 'withholding99', 'totalPayments', 'amountOwed',
    ]
    for (const id of rowIds) {
      expect(getTaxControlBreakdown(id, systemVals)).not.toBeNull()
    }
  })

  it('total income sums component lines from frozen return', () => {
    const b = getTaxControlBreakdown('totalIncome', systemVals)!
    expect(b.total).toBe(575_676)
    expect(b.components.find(c => c.label.includes('2b'))?.value).toBe(6_336)
    expect(b.components.find(c => c.label.includes('3b'))?.value).toBe(350_400)
  })

  it('amount owed equals total tax minus payments', () => {
    const b = getTaxControlBreakdown('amountOwed', systemVals)!
    expect(b.total).toBe(109_065)
  })
})
