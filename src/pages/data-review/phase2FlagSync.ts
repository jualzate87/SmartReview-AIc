/**
 * Phase 2 diagnostic dismiss rules.
 *
 * Each Phase 2 insight is valid only while related Phase 1 flags remain open
 * and/or live figures still support the claim. When the preparer marks a linked
 * flag reviewed, or edits+saves amounts that fix the underlying issue, the
 * diagnostic is auto-dismissed so AgentReportPane never shows a ghost card.
 *
 * Study-static insights (no amount/flag invalidation path) stay until the
 * preparer marks them reviewed in Phase 2.
 */
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { PHASE1_FLAG_KEYS, isPhase1FlagResolved, type Phase1FlagKey } from './phase1FieldSync'

const PHASE1_FLAG_KEY_SET = new Set<string>(PHASE1_FLAG_KEYS)

/** Phase 2 issue keys from GUIDED_ORDER in AgentReportPane. */
export type Phase2IssueKey =
  | 'balanceDueJump'
  | 'totalTaxRise'
  | 'withholdingDrop'
  | 'estTaxPenalty'
  | 'ordinaryDivSurge'
  | 'confirmPriorAgi'
  | 'missingEstPayments'
  | 'niitForm8960'
  | 'optW4Adjustment'
  | 'optIra'

/** Canonical Phase 2 order — must match AgentReportPane GUIDED_ORDER. */
export const PHASE2_DIAGNOSTIC_ORDER: readonly Phase2IssueKey[] = [
  'balanceDueJump',
  'totalTaxRise',
  'withholdingDrop',
  'estTaxPenalty',
  'ordinaryDivSurge',
  'confirmPriorAgi',
  'missingEstPayments',
  'niitForm8960',
  'optW4Adjustment',
  'optIra',
] as const

/** 110% of 2024 total tax ($102,754) — Form 2210 safe harbor used in card copy. */
export const SAFE_HARBOR_2024 = 113_029

/** Prior-year amount owed (line 37) referenced by balanceDueJump. */
export const PRIOR_YEAR_OWE = 26_654

/** Source-document amounts that invalidate import-related diagnostics when restored. */
export const SOURCE_AMOUNTS = {
  wages: 148_940,
  divWithholding: 26_363,
  rWithholding: 30_000,
  /** Prior-year ordinary dividends — surge dismissed when current line falls near this. */
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
  /**
   * Phase 1 flag keys — when any is resolved (mark reviewed / edit+save clears
   * the flag), this diagnostic is auto-dismissed.
   */
  dismissWhenReviewed: ReadonlyArray<Phase1FlagKey | string>
  /**
   * Return true when live amounts no longer support the diagnostic claim.
   * Optional — omit for study-static insights.
   */
  dismissWhenAmounts?: (ctx: DiagnosticSyncContext) => boolean
  /** Human-readable note for study-static / always-applicable insights. */
  notes?: string
}

/**
 * Declarative dismiss map — single source of truth for Phase 2 sync.
 *
 * | Diagnostic        | Dismiss when reviewed          | Dismiss when amounts                          |
 * |-------------------|--------------------------------|-----------------------------------------------|
 * | balanceDueJump    | —                              | owe ≤ prior-year $26,654                      |
 * | totalTaxRise      | — (study-static; tax frozen)   | —                                             |
 * | withholdingDrop   | fedTaxWithheld                 | DIV Box 4 ≥ source, OR 1099-R WH restored, OR |
 * |                   |                                | total WH ≥ safe harbor                        |
 * | estTaxPenalty     | —                              | total WH ≥ safe harbor (Form 2210)            |
 * | ordinaryDivSurge  | —                              | ordinary divs ≤ 1.2× prior-year               |
 * | confirmPriorAgi   | — (study-static verify step)   | —                                             |
 * | missingEstPayments| —                              | total WH ≥ safe harbor                        |
 * | niitForm8960      | —                              | AGI < $200k NIIT threshold                    |
 * | optW4Adjustment   | wages-techCircle               | wages ≥ source $148,940                       |
 * | optIra            | — (study-static opportunity)   | —                                             |
 *
 * SSN / EIN Phase 1 flags have no Phase 2 cards (import-only in ProtoC).
 */
export const DIAGNOSTIC_DISMISS_RULES: Record<Phase2IssueKey, DiagnosticDismissRule> = {
  balanceDueJump: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.oweAmount <= PRIOR_YEAR_OWE,
  },
  totalTaxRise: {
    dismissWhenReviewed: [],
    notes:
      'Study-static: totalTax is frozen in the prototype (no live tax-table recalc), so this YoY insight stays until marked reviewed.',
  },
  withholdingDrop: {
    dismissWhenReviewed: ['fedTaxWithheld'],
    dismissWhenAmounts: ({ live, amounts }) =>
      live.totalWithholding >= SAFE_HARBOR_2024 ||
      amounts.divWithholding >= SOURCE_AMOUNTS.divWithholding ||
      amounts.rWithholding >= SOURCE_AMOUNTS.rWithholding,
  },
  estTaxPenalty: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.totalWithholding >= SAFE_HARBOR_2024,
    notes: 'Form 2210 — dismissed only when live payments meet the prior-year safe harbor.',
  },
  ordinaryDivSurge: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) =>
      live.ordinaryDivs <= SOURCE_AMOUNTS.priorOrdinaryDivs * 1.2,
  },
  confirmPriorAgi: {
    dismissWhenReviewed: [],
    notes:
      'Study-static verify step: prior-year AGI confirmation has no editable invalidation path; stays until marked reviewed.',
  },
  missingEstPayments: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.totalWithholding >= SAFE_HARBOR_2024,
  },
  niitForm8960: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.totalIncome < NIIT_AGI_THRESHOLD_SINGLE,
    notes: 'Form 8960 — dismissed if AGI falls below the $200k single-filer NIIT threshold.',
  },
  optW4Adjustment: {
    dismissWhenReviewed: ['wages-techCircle'],
    dismissWhenAmounts: ({ amounts }) => amounts.wages >= SOURCE_AMOUNTS.wages,
  },
  optIra: {
    dismissWhenReviewed: [],
    notes:
      'Study-static opportunity: workplace-plan coverage is unconfirmed; stays until marked reviewed.',
  },
}

/**
 * Phase 1 flag → Phase 2 insights dismissed when that flag is resolved.
 * Derived from DIAGNOSTIC_DISMISS_RULES so auto-mark in useSyncedReviewState
 * stays aligned with the declarative map.
 */
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

/** Type-safe helper for known Phase 1 keys. */
export function phase2IssuesForFlag(flagKey: Phase1FlagKey | string): Phase2IssueKey[] {
  return PHASE1_TO_PHASE2_ISSUES[flagKey] ?? []
}

/** True when linked Phase 1 flags or live amounts invalidate this diagnostic. */
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

/**
 * Diagnostics that should still appear in Phase 2 (not auto-dismissed by
 * Phase 1 resolution or amount edits). Manually reviewed items remain in this
 * list so they can show a Reviewed state unless callers filter them out.
 */
export function getActiveDiagnosticKeys(ctx: DiagnosticSyncContext): Phase2IssueKey[] {
  return PHASE2_DIAGNOSTIC_ORDER.filter(k => !isDiagnosticAutoDismissed(k, ctx))
}

/** Progress counters for AgentReportPane + Phase2Banner. */
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
