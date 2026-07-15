/**
 * Phase 2 diagnostic dismiss rules — Critical / Compliance / Opportunities.
 *
 * Quality over count: only high-value filing / compliance / opportunity cards.
 * Pure YoY curiosity cards are removed from the catalog.
 */
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { PHASE1_FLAG_KEYS, isPhase1FlagResolved, type Phase1FlagKey } from './phase1FieldSync'

const PHASE1_FLAG_KEY_SET = new Set<string>(PHASE1_FLAG_KEYS)

/** Phase 2 issue keys — must match AgentReportPane GUIDED_ORDER. */
export type Phase2IssueKey =
  | 'confirmPriorAgi'
  | 'niitForm8960'
  | 'underpaymentRisk'
  | 'necScheduleC'
  | 'optItemize'

/** Canonical Phase 2 order — Critical → Compliance → Opportunities. */
export const PHASE2_DIAGNOSTIC_ORDER: readonly Phase2IssueKey[] = [
  'confirmPriorAgi',
  'niitForm8960',
  'underpaymentRisk',
  'necScheduleC',
  'optItemize',
] as const

/** 110% of 2024 total tax ($102,754) — Form 2210 safe harbor used in card copy. */
export const SAFE_HARBOR_2024 = 113_029

/** Prior-year amount owed (line 37) — supporting math only. */
export const PRIOR_YEAR_OWE = 26_654

/** Source-document amounts that invalidate import-related diagnostics when restored. */
export const SOURCE_AMOUNTS = {
  wages: 148_940,
  divWithholding: 26_363,
  rWithholding: 30_000,
  priorOrdinaryDivs: 219_850,
} as const

/** Single-filer NIIT AGI threshold (Form 8960). */
export const NIIT_AGI_THRESHOLD_SINGLE = 200_000

export type DiagnosticSyncContext = {
  reviewedFields: Map<string, unknown>
  live: LiveReturnTotals
  amounts: LiveAmounts
}

export type DiagnosticDismissRule = {
  dismissWhenReviewed: ReadonlyArray<Phase1FlagKey | string>
  dismissWhenAmounts?: (ctx: DiagnosticSyncContext) => boolean
  notes?: string
}

/**
 * | Diagnostic        | Dismiss when reviewed   | Dismiss when amounts        |
 * |-------------------|-------------------------|-----------------------------|
 * | confirmPriorAgi   | — (study-static)        | —                           |
 * | niitForm8960      | —                       | AGI < $200k                 |
 * | underpaymentRisk  | fedTaxWithheld          | total WH ≥ safe harbor      |
 * | necScheduleC      | — (study-static)        | —                           |
 * | optItemize        | — (study-static)        | —                           |
 */
export const DIAGNOSTIC_DISMISS_RULES: Record<Phase2IssueKey, DiagnosticDismissRule> = {
  confirmPriorAgi: {
    dismissWhenReviewed: [],
    notes:
      'Study-static verify step: prior-year AGI confirmation has no editable invalidation path; stays until marked reviewed.',
  },
  niitForm8960: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.totalIncome < NIIT_AGI_THRESHOLD_SINGLE,
    notes: 'Form 8960 — dismissed if AGI falls below the $200k single-filer NIIT threshold.',
  },
  underpaymentRisk: {
    dismissWhenReviewed: ['fedTaxWithheld'],
    dismissWhenAmounts: ({ live, amounts }) =>
      live.totalWithholding >= SAFE_HARBOR_2024 ||
      amounts.divWithholding >= SOURCE_AMOUNTS.divWithholding ||
      amounts.rWithholding >= SOURCE_AMOUNTS.rWithholding,
    notes:
      'Merged WH + no-ES underpayment card — dismissed when withholding is restored or meets safe harbor.',
  },
  necScheduleC: {
    dismissWhenReviewed: [],
    notes:
      'Study-static compliance: Schedule C / expense completeness stays until marked reviewed.',
  },
  optItemize: {
    dismissWhenReviewed: [],
    notes:
      'Study-static opportunity: std deduction vs itemize (mortgage / 1098) stays until marked reviewed.',
  },
}

export const PHASE1_TO_PHASE2_ISSUES: Partial<Record<string, Phase2IssueKey[]>> = (() => {
  const map: Partial<Record<string, Phase2IssueKey[]>> = {}
  for (const [issueKey, rule] of Object.entries(DIAGNOSTIC_DISMISS_RULES) as Array<
    [Phase2IssueKey, DiagnosticDismissRule]
  >) {
    for (const flagKey of rule.dismissWhenReviewed) {
      const list = map[flagKey] ?? []
      if (!list.includes(issueKey)) list.push(issueKey)
      map[flagKey] = list
    }
  }
  return map
})()

export function phase2IssuesForFlag(flagKey: Phase1FlagKey | string): Phase2IssueKey[] {
  return PHASE1_TO_PHASE2_ISSUES[flagKey] ?? []
}

export function isDiagnosticAutoDismissed(
  issueKey: Phase2IssueKey,
  ctx: DiagnosticSyncContext,
): boolean {
  const rule = DIAGNOSTIC_DISMISS_RULES[issueKey]
  if (!rule) return false

  for (const flagKey of rule.dismissWhenReviewed) {
    if (PHASE1_FLAG_KEY_SET.has(flagKey)) {
      if (isPhase1FlagResolved(flagKey as Phase1FlagKey, ctx.reviewedFields)) return true
    } else if (ctx.reviewedFields.has(flagKey)) {
      return true
    }
  }

  if (rule.dismissWhenAmounts?.(ctx)) return true
  return false
}

export function getActiveDiagnosticKeys(ctx: DiagnosticSyncContext): Phase2IssueKey[] {
  return PHASE2_DIAGNOSTIC_ORDER.filter(k => !isDiagnosticAutoDismissed(k, ctx))
}

export function getPhase2Progress(ctx: DiagnosticSyncContext): {
  activeKeys: Phase2IssueKey[]
  total: number
  reviewed: number
  remaining: number
  complete: boolean
} {
  const activeKeys = getActiveDiagnosticKeys(ctx)
  const reviewed = activeKeys.filter(k => ctx.reviewedFields.has(k)).length
  const remaining = activeKeys.length - reviewed
  return {
    activeKeys,
    total: activeKeys.length,
    reviewed,
    remaining,
    complete: remaining === 0,
  }
}
