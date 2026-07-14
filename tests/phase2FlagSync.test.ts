import { describe, expect, it } from 'vitest'
import { computeLiveReturn, SEED_AMOUNTS } from '../src/data/liveReturn'
import {
  DIAGNOSTIC_DISMISS_RULES,
  getActiveDiagnosticKeys,
  getPhase2Progress,
  isDiagnosticAutoDismissed,
  PHASE1_TO_PHASE2_ISSUES,
  PHASE2_DIAGNOSTIC_ORDER,
  PRIOR_YEAR_OWE,
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

  it('derives PHASE1_TO_PHASE2_ISSUES from dismissWhenReviewed', () => {
    expect(PHASE1_TO_PHASE2_ISSUES.fedTaxWithheld).toContain('withholdingDrop')
    expect(PHASE1_TO_PHASE2_ISSUES['wages-techCircle']).toContain('optW4Adjustment')
  })
})

describe('isDiagnosticAutoDismissed — flag resolution', () => {
  it('dismisses withholdingDrop when fedTaxWithheld is reviewed', () => {
    expect(isDiagnosticAutoDismissed('withholdingDrop', ctx({ reviewed: ['fedTaxWithheld'] }))).toBe(true)
    expect(isDiagnosticAutoDismissed('withholdingDrop', ctx())).toBe(false)
  })

  it('dismisses optW4Adjustment when wages-techCircle is reviewed', () => {
    expect(
      isDiagnosticAutoDismissed('optW4Adjustment', ctx({ reviewed: ['wages-techCircle'] })),
    ).toBe(true)
    expect(isDiagnosticAutoDismissed('optW4Adjustment', ctx())).toBe(false)
  })
})

describe('isDiagnosticAutoDismissed — amount edits', () => {
  it('dismisses optW4Adjustment when wages corrected to source', () => {
    expect(
      isDiagnosticAutoDismissed(
        'optW4Adjustment',
        ctx({ amounts: { wages: SOURCE_AMOUNTS.wages } }),
      ),
    ).toBe(true)
  })

  it('dismisses withholdingDrop when DIV Box 4 restored to source', () => {
    expect(
      isDiagnosticAutoDismissed(
        'withholdingDrop',
        ctx({ amounts: { divWithholding: SOURCE_AMOUNTS.divWithholding } }),
      ),
    ).toBe(true)
  })

  it('dismisses withholdingDrop when 1099-R withholding restored', () => {
    expect(
      isDiagnosticAutoDismissed(
        'withholdingDrop',
        ctx({ amounts: { rWithholding: SOURCE_AMOUNTS.rWithholding } }),
      ),
    ).toBe(true)
  })

  it('dismisses withholdingDrop / estTaxPenalty / missingEstPayments when safe harbor met', () => {
    const base = SEED_AMOUNTS.w2Withholding + SEED_AMOUNTS.divWithholding
    const need = SAFE_HARBOR_2024 - base
    const c = ctx({ amounts: { rWithholding: need } })
    expect(c.live.totalWithholding).toBeGreaterThanOrEqual(SAFE_HARBOR_2024)
    expect(isDiagnosticAutoDismissed('withholdingDrop', c)).toBe(true)
    expect(isDiagnosticAutoDismissed('estTaxPenalty', c)).toBe(true)
    expect(isDiagnosticAutoDismissed('missingEstPayments', c)).toBe(true)
  })

  it('dismisses balanceDueJump when owed falls to prior-year level', () => {
    const totalTax = computeLiveReturn(SEED_AMOUNTS).totalTax
    const targetWh = totalTax - PRIOR_YEAR_OWE
    const rBoost = targetWh - SEED_AMOUNTS.w2Withholding - SEED_AMOUNTS.divWithholding
    const c = ctx({ amounts: { rWithholding: rBoost } })
    expect(c.live.oweAmount).toBeLessThanOrEqual(PRIOR_YEAR_OWE)
    expect(isDiagnosticAutoDismissed('balanceDueJump', c)).toBe(true)
  })

  it('dismisses ordinaryDivSurge when ordinary dividends drop near prior year', () => {
    const c = ctx({
      amounts: {
        ordinaryDivsToken: 100_000,
        ordinaryDivsNorthmark: 10_000,
        ordinaryDivsBeacon: 5_000,
      },
    })
    expect(c.live.ordinaryDivs).toBeLessThanOrEqual(SOURCE_AMOUNTS.priorOrdinaryDivs * 1.2)
    expect(isDiagnosticAutoDismissed('ordinaryDivSurge', c)).toBe(true)
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
})

describe('study-static diagnostics remain until Phase 2 review', () => {
  it('keeps totalTaxRise, confirmPriorAgi, and optIra active at seed', () => {
    const c = ctx()
    expect(isDiagnosticAutoDismissed('totalTaxRise', c)).toBe(false)
    expect(isDiagnosticAutoDismissed('confirmPriorAgi', c)).toBe(false)
    expect(isDiagnosticAutoDismissed('optIra', c)).toBe(false)
    expect(DIAGNOSTIC_DISMISS_RULES.totalTaxRise.notes).toMatch(/Study-static/)
    expect(DIAGNOSTIC_DISMISS_RULES.confirmPriorAgi.notes).toMatch(/Study-static/)
    expect(DIAGNOSTIC_DISMISS_RULES.optIra.notes).toMatch(/Study-static/)
  })
})

describe('getActiveDiagnosticKeys / getPhase2Progress', () => {
  it('starts with the full diagnostic catalog', () => {
    const progress = getPhase2Progress(ctx())
    expect(progress.total).toBe(PHASE2_DIAGNOSTIC_ORDER.length)
    expect(progress.remaining).toBe(PHASE2_DIAGNOSTIC_ORDER.length)
    expect(progress.complete).toBe(false)
  })

  it('drops wage + withholding cards from the active list after Phase 1 fixes', () => {
    const c = ctx({
      reviewed: ['wages-techCircle', 'fedTaxWithheld'],
      amounts: { wages: SOURCE_AMOUNTS.wages, divWithholding: SOURCE_AMOUNTS.divWithholding },
    })
    const active = getActiveDiagnosticKeys(c)
    expect(active).not.toContain('optW4Adjustment')
    expect(active).not.toContain('withholdingDrop')
    const progress = getPhase2Progress(c)
    expect(progress.total).toBe(PHASE2_DIAGNOSTIC_ORDER.length - 2)
    expect(progress.remaining).toBe(progress.total)
  })

  it('counts manually reviewed active diagnostics toward complete', () => {
    const active = getActiveDiagnosticKeys(ctx())
    const progress = getPhase2Progress(ctx({ reviewed: [...active] }))
    expect(progress.reviewed).toBe(active.length)
    expect(progress.remaining).toBe(0)
    expect(progress.complete).toBe(true)
  })
})
