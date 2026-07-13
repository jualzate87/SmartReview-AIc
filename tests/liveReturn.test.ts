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

  it('updates DIV withholding when corrected to source', () => {
    const live = computeLiveReturn({ ...SEED_AMOUNTS, divWithholding: 26_363 })
    expect(live.withholding1099).toBe(26_363)
    expect(live.totalWithholding).toBe(FROZEN_RETURN.w2Withholding + 26_363)
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
