/**
 * Phase 2 diagnostic dismiss rules — Filing stoppers / Compliance / Opportunities.
 *
 * Outstanding input↔source mismatches from Phase 1 surface here when values
 * were marked correct without fixing (or silent import gaps remain).
 * Pure YoY curiosity cards are not in this catalog.
 */
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { TOKEN_QUALIFIED_DIVS_RETURN } from '../../data/frozenReturn'
import { PHASE1_FLAG_KEYS, isPhase1FlagResolved, type Phase1FlagKey } from './phase1FieldSync'

const PHASE1_FLAG_KEY_SET = new Set<string>(PHASE1_FLAG_KEYS)

/** Phase 2 issue keys — must match AgentReportPane GUIDED_ORDER. */
export type Phase2IssueKey =
  | 'importMismatches'
  | 'niitForm8960'
  | 'underpaymentRisk'
  | 'necScheduleC'
  | 'optItemize'

/** Canonical Phase 2 order — Filing stoppers → Compliance → Opportunities. */
export const PHASE2_DIAGNOSTIC_ORDER: readonly Phase2IssueKey[] = [
  'importMismatches',
  'underpaymentRisk',
  'necScheduleC',
  'niitForm8960',
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
  taxablePension: 150_000,
  /** Token 1099-DIV Box 1b on the PDF (return seeds silent error at TOKEN_QUALIFIED_DIVS_RETURN) */
  qualifiedDivsToken: 187_500,
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
  /** When true, diagnostic is ACTIVE only while the amount condition holds (inverse of dismiss). */
  activeWhenAmounts?: (ctx: DiagnosticSyncContext) => boolean
  notes?: string
}

/** Remaining input↔source gaps after Phase 1 (mark-correct without fixing, silent errors). */
export function getOutstandingImportMismatches(amounts: LiveAmounts): Array<{
  id: string
  label: string
  returnValue: string
  sourceValue: string
  field: string
  tab: string
}> {
  const rows: Array<{
    id: string
    label: string
    returnValue: string
    sourceValue: string
    field: string
    tab: string
  }> = []

  if (amounts.wages !== SOURCE_AMOUNTS.wages) {
    rows.push({
      id: 'wages',
      label: 'W-2 Box 1 wages (Tech Circle)',
      returnValue: `$${amounts.wages.toLocaleString()}`,
      sourceValue: `$${SOURCE_AMOUNTS.wages.toLocaleString()}`,
      field: 'wages',
      tab: 'w2s',
    })
  }
  if (amounts.qualifiedDivsToken === TOKEN_QUALIFIED_DIVS_RETURN
    || amounts.qualifiedDivsToken !== SOURCE_AMOUNTS.qualifiedDivsToken) {
    if (amounts.qualifiedDivsToken !== SOURCE_AMOUNTS.qualifiedDivsToken) {
      rows.push({
        id: 'qualifiedDivs',
        label: '1099-DIV Box 1b qualified dividends (Token)',
        returnValue: `$${amounts.qualifiedDivsToken.toLocaleString()}`,
        sourceValue: `$${SOURCE_AMOUNTS.qualifiedDivsToken.toLocaleString()}`,
        field: 'qualifiedDivs',
        tab: '1099-divs',
      })
    }
  }
  if (amounts.divWithholding !== SOURCE_AMOUNTS.divWithholding) {
    rows.push({
      id: 'divWithholding',
      label: '1099-DIV Box 4 federal withholding (Token)',
      returnValue: `$${amounts.divWithholding.toLocaleString()}`,
      sourceValue: `$${SOURCE_AMOUNTS.divWithholding.toLocaleString()}`,
      field: 'fedTaxWithheld',
      tab: '1099-divs',
    })
  }
  if (amounts.taxablePension !== SOURCE_AMOUNTS.taxablePension) {
    rows.push({
      id: 'taxablePension',
      label: '1099-R Box 2a taxable amount (Meridian)',
      returnValue: `$${amounts.taxablePension.toLocaleString()}`,
      sourceValue: `$${SOURCE_AMOUNTS.taxablePension.toLocaleString()}`,
      field: 'r-taxableAmt',
      tab: '1099-rs',
    })
  }
  if (amounts.rWithholding < SOURCE_AMOUNTS.rWithholding) {
    rows.push({
      id: 'rWithholding',
      label: '1099-R Box 4 federal withholding (Meridian)',
      returnValue: `$${amounts.rWithholding.toLocaleString()}`,
      sourceValue: `$${SOURCE_AMOUNTS.rWithholding.toLocaleString()}`,
      field: 'withholding1099',
      tab: '1099-rs',
    })
  }

  return rows
}

/**
 * | Diagnostic        | Active / dismiss rules                                      |
 * |-------------------|-------------------------------------------------------------|
 * | importMismatches  | Active while any input↔source gap remains                   |
 * | niitForm8960      | Dismiss when AGI < $200k                                    |
 * | underpaymentRisk  | Dismiss when WH restored or ≥ safe harbor                   |
 * | necScheduleC      | Study-static until marked reviewed                          |
 * | optItemize        | Study-static until marked reviewed                          |
 */
export const DIAGNOSTIC_DISMISS_RULES: Record<Phase2IssueKey, DiagnosticDismissRule> = {
  importMismatches: {
    dismissWhenReviewed: [],
    activeWhenAmounts: ({ amounts }) => getOutstandingImportMismatches(amounts).length > 0,
    notes:
      'Surfaces remaining input↔source mismatches (including silent errors) after Phase 1.',
  },
  niitForm8960: {
    dismissWhenReviewed: [],
    dismissWhenAmounts: ({ live }) => live.totalIncome < NIIT_AGI_THRESHOLD_SINGLE,
    notes: 'Form 8960: dismissed if AGI falls below the $200k single-filer NIIT threshold.',
  },
  underpaymentRisk: {
    dismissWhenReviewed: ['fedTaxWithheld'],
    dismissWhenAmounts: ({ live, amounts }) =>
      live.totalWithholding >= SAFE_HARBOR_2024 ||
      amounts.divWithholding >= SOURCE_AMOUNTS.divWithholding ||
      amounts.rWithholding >= SOURCE_AMOUNTS.rWithholding,
    notes:
      'Underpayment card: dismissed when withholding is restored or meets safe harbor.',
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

  // activeWhenAmounts: diagnostic only appears while condition is true
  if (rule.activeWhenAmounts) {
    return !rule.activeWhenAmounts(ctx)
  }

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
