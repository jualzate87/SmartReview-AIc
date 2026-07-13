import { describe, expect, it } from 'vitest'
import {
  computeLiveReturn,
  NEC_SOURCE_AMOUNT,
  SEED_AMOUNTS,
} from '../src/data/liveReturn'
import { FROZEN_RETURN } from '../src/data/frozenReturn'
import { PHASE1_TO_PHASE2_ISSUES } from '../src/pages/data-review/phase2FlagSync'
import { detailTo1040Field, field1040ToDetail } from '../src/pages/data-review/phase1FieldSync'

describe('computeLiveReturn — Build Spec seed anchors', () => {
  it('matches frozen verification anchors at session start', () => {
    const live = computeLiveReturn(SEED_AMOUNTS)
    expect(live.wages).toBe(FROZEN_RETURN.wages)
    expect(live.taxableInterest).toBe(FROZEN_RETURN.taxableInterest)
    expect(live.ordinaryDivs).toBe(FROZEN_RETURN.ordinaryDivs)
    expect(live.qualifiedDivs).toBe(FROZEN_RETURN.qualifiedDivs)
    expect(live.taxablePension).toBe(FROZEN_RETURN.taxablePension)
    expect(live.totalIncome).toBe(FROZEN_RETURN.totalIncome)
    expect(live.totalWithholding).toBe(FROZEN_RETURN.totalWithholding)
    expect(live.otherIncome).toBe(0)
    expect(live.necOnReturn).toBe(false)
    expect(live.rWithholding).toBe(0)
  })

  it('recalculates total income and owed when wages are corrected', () => {
    const live = computeLiveReturn({ ...SEED_AMOUNTS, wages: 148_940 })
    expect(live.totalIncome).toBe(FROZEN_RETURN.totalIncome + 30_000)
    expect(live.taxableIncome).toBe(live.totalIncome - FROZEN_RETURN.stdDeduction)
    // Tax table stays frozen in the prototype — amount owed still follows payments
    expect(live.oweAmount).toBe(FROZEN_RETURN.totalTax - live.totalWithholding)
  })

  it('includes NEC on line 8 only after confirmed onto the return', () => {
    const before = computeLiveReturn(SEED_AMOUNTS)
    expect(before.otherIncome).toBe(0)

    const after = computeLiveReturn({
      ...SEED_AMOUNTS,
      necIncome: NEC_SOURCE_AMOUNT,
      necOnReturn: true,
    })
    expect(after.otherIncome).toBe(NEC_SOURCE_AMOUNT)
    expect(after.totalIncome).toBe(FROZEN_RETURN.totalIncome + NEC_SOURCE_AMOUNT)
  })

  it('adds 1099-R withholding into line 25b / total payments after edit', () => {
    const live = computeLiveReturn({ ...SEED_AMOUNTS, rWithholding: 30_000 })
    expect(live.withholding1099).toBe(FROZEN_RETURN.divWithholding + 30_000)
    expect(live.totalWithholding).toBe(FROZEN_RETURN.w2Withholding + FROZEN_RETURN.divWithholding + 30_000)
    expect(live.oweAmount).toBe(FROZEN_RETURN.totalTax - live.totalWithholding)
  })

  it('sums interest across all payers into line 2b', () => {
    const live = computeLiveReturn({
      ...SEED_AMOUNTS,
      interestUnwavering: 2_000,
      interestHarborline: 4_000,
      interestCascade: 1_500,
    })
    expect(live.taxableInterest).toBe(7_500)
    expect(live.totalIncome).toBe(
      SEED_AMOUNTS.wages +
        7_500 +
        FROZEN_RETURN.ordinaryDivs +
        FROZEN_RETURN.taxablePension +
        FROZEN_RETURN.capitalGain,
    )
  })

  it('sums ordinary and qualified dividends across all payers', () => {
    const live = computeLiveReturn({
      ...SEED_AMOUNTS,
      ordinaryDivsToken: 300_000,
      ordinaryDivsNorthmark: 10_000,
      ordinaryDivsBeacon: 5_000,
      qualifiedDivsToken: 200_000,
      qualifiedDivsNorthmark: 7_000,
      qualifiedDivsBeacon: 3_000,
    })
    expect(live.ordinaryDivs).toBe(315_000)
    expect(live.qualifiedDivs).toBe(210_000)
    expect(live.totalIncome).toBe(
      SEED_AMOUNTS.wages +
        FROZEN_RETURN.taxableInterest +
        315_000 +
        FROZEN_RETURN.taxablePension +
        FROZEN_RETURN.capitalGain,
    )
  })

  it('recalculates when W-2 wages and withholding both change', () => {
    const live = computeLiveReturn({
      ...SEED_AMOUNTS,
      wages: 148_940,
      w2Withholding: 20_000,
    })
    expect(live.wages).toBe(148_940)
    expect(live.w2Withholding).toBe(20_000)
    expect(live.totalWithholding).toBe(20_000 + FROZEN_RETURN.divWithholding)
    expect(live.oweAmount).toBe(FROZEN_RETURN.totalTax - live.totalWithholding)
  })

  it('recalculates IRA taxable amount into total income', () => {
    const live = computeLiveReturn({ ...SEED_AMOUNTS, taxablePension: 150_000 })
    expect(live.taxablePension).toBe(150_000)
    expect(live.totalIncome).toBe(FROZEN_RETURN.totalIncome + 50_000)
  })
})

describe('Phase 1 ↔ Phase 2 flag sync map', () => {
  it('links DIV fedTaxWithheld to withholdingDrop insight', () => {
    expect(PHASE1_TO_PHASE2_ISSUES.fedTaxWithheld).toContain('withholdingDrop')
  })

  it('links wages-techCircle to optW4Adjustment insight', () => {
    expect(PHASE1_TO_PHASE2_ISSUES['wages-techCircle']).toContain('optW4Adjustment')
  })
})

describe('Bidirectional highlight — NEC and 1099-R withholding', () => {
  it('maps nec-box1 ↔ otherIncome', () => {
    expect(detailTo1040Field('nec-box1')).toBe('otherIncome')
    expect(field1040ToDetail('otherIncome')?.tab).toBe('1099-necs')
  })

  it('maps r-fedTaxWithheld / withholding1099 ↔ 1040 withholding', () => {
    expect(detailTo1040Field('r-fedTaxWithheld')).toBe('withholding')
    expect(detailTo1040Field('withholding1099')).toBe('withholding')
  })
})
