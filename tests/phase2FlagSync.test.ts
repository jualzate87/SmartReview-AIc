import { describe, expect, it } from 'vitest'
import { computeLiveReturn, SEED_AMOUNTS } from '../src/data/liveReturn'
import {
  DIAGNOSTIC_DISMISS_RULES,
  getActiveDiagnosticKeys,
  getOutstandingImportMismatches,
  getPhase2Progress,
  isDiagnosticAutoDismissed,
  PHASE1_TO_PHASE2_ISSUES,
  PHASE2_DIAGNOSTIC_ORDER,
  SAFE_HARBOR_2024,
  SOURCE_AMOUNTS,
  type DiagnosticSyncContext,
} from '../src/pages/data-review/phase2FlagSync'

function ctx(
  patch: {
    reviewed?: string[]
    amounts?: Partial<typeof SEED_AMOUNTS>
  } = {},
): DiagnosticSyncContext {
  const amounts = { ...SEED_AMOUNTS, ...patch.amounts }
  const reviewedFields = new Map(
    (patch.reviewed ?? []).map(k => [k, { by: 'Test', at: 'now' }]),
  )
  return {
    reviewedFields,
    amounts,
    live: computeLiveReturn(amounts),
  }
}

describe('DIAGNOSTIC_DISMISS_RULES — coverage', () => {
  it('defines a rule for every Phase 2 diagnostic', () => {
    for (const id of PHASE2_DIAGNOSTIC_ORDER) {
      expect(DIAGNOSTIC_DISMISS_RULES[id]).toBeDefined()
    }
  })

  it('keeps Filing stoppers / Compliance / Opportunities catalog at quality size', () => {
    expect(PHASE2_DIAGNOSTIC_ORDER).toEqual([
      'importMismatches',
      'niitForm8960',
      'underpaymentRisk',
      'necScheduleC',
      'optItemize',
    ])
  })

  it('derives PHASE1_TO_PHASE2_ISSUES from dismissWhenReviewed', () => {
    expect(PHASE1_TO_PHASE2_ISSUES.fedTaxWithheld).toContain('underpaymentRisk')
  })
})

describe('isDiagnosticAutoDismissed — flag resolution', () => {
  it('dismisses underpaymentRisk when fedTaxWithheld is reviewed', () => {
    expect(isDiagnosticAutoDismissed('underpaymentRisk', ctx({ reviewed: ['fedTaxWithheld'] }))).toBe(true)
    expect(isDiagnosticAutoDismissed('underpaymentRisk', ctx())).toBe(false)
  })
})

describe('isDiagnosticAutoDismissed — amount edits', () => {
  it('dismisses underpaymentRisk when DIV Box 4 restored to source', () => {
    expect(
      isDiagnosticAutoDismissed(
        'underpaymentRisk',
        ctx({ amounts: { divWithholding: SOURCE_AMOUNTS.divWithholding } }),
      ),
    ).toBe(true)
  })

  it('dismisses underpaymentRisk when safe harbor met', () => {
    const base = SEED_AMOUNTS.w2Withholding + SEED_AMOUNTS.divWithholding
    const need = SAFE_HARBOR_2024 - base
    const c = ctx({ amounts: { rWithholding: need } })
    expect(c.live.totalWithholding).toBeGreaterThanOrEqual(SAFE_HARBOR_2024)
    expect(isDiagnosticAutoDismissed('underpaymentRisk', c)).toBe(true)
  })

  it('dismisses niitForm8960 only when AGI falls below $200k', () => {
    expect(isDiagnosticAutoDismissed('niitForm8960', ctx())).toBe(false)
    const c = ctx({
      amounts: {
        wages: 50_000,
        taxablePension: 0,
        ordinaryDivsToken: 10_000,
        ordinaryDivsNorthmark: 0,
        ordinaryDivsBeacon: 0,
        interestUnwavering: 0,
        interestHarborline: 0,
        interestCascade: 0,
      },
    })
    expect(c.live.totalIncome).toBeLessThan(200_000)
    expect(isDiagnosticAutoDismissed('niitForm8960', c)).toBe(true)
  })

  it('dismisses importMismatches when all source gaps are cleared', () => {
    expect(isDiagnosticAutoDismissed('importMismatches', ctx())).toBe(false)
    const c = ctx({
      amounts: {
        wages: SOURCE_AMOUNTS.wages,
        qualifiedDivsToken: SOURCE_AMOUNTS.qualifiedDivsToken,
        divWithholding: SOURCE_AMOUNTS.divWithholding,
        taxablePension: SOURCE_AMOUNTS.taxablePension,
        rWithholding: SOURCE_AMOUNTS.rWithholding,
      },
    })
    expect(getOutstandingImportMismatches(c.amounts)).toHaveLength(0)
    expect(isDiagnosticAutoDismissed('importMismatches', c)).toBe(true)
  })
})

describe('study-static diagnostics remain until Phase 2 review', () => {
  it('keeps necScheduleC and optItemize active at seed', () => {
    const c = ctx()
    expect(isDiagnosticAutoDismissed('necScheduleC', c)).toBe(false)
    expect(isDiagnosticAutoDismissed('optItemize', c)).toBe(false)
    expect(DIAGNOSTIC_DISMISS_RULES.necScheduleC.notes).toMatch(/Study-static/)
    expect(DIAGNOSTIC_DISMISS_RULES.optItemize.notes).toMatch(/Study-static/)
  })
})

describe('getActiveDiagnosticKeys / getPhase2Progress', () => {
  it('starts with the full diagnostic catalog', () => {
    const progress = getPhase2Progress(ctx())
    expect(progress.total).toBe(PHASE2_DIAGNOSTIC_ORDER.length)
    expect(progress.remaining).toBe(PHASE2_DIAGNOSTIC_ORDER.length)
    expect(progress.complete).toBe(false)
  })

  it('drops underpaymentRisk after Phase 1 withholding fix', () => {
    const c = ctx({
      reviewed: ['fedTaxWithheld'],
    })
    expect(getActiveDiagnosticKeys(c)).not.toContain('underpaymentRisk')
  })
})
