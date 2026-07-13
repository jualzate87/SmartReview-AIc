/**
 * Phase 1 import-flag keys → Phase 2 AgentReportPane issue IDs.
 *
 * When a linked Phase 1 flag is resolved (mark reviewed / edit+save), the
 * corresponding Phase 2 insight is auto-dismissed so the AI Review panel
 * never shows a stale open card for a flag the preparer already cleared.
 *
 * Only flags that directly map to a Phase 2 diagnostic are listed. Silent
 * Build Spec errors (6–10) have no Phase 1 flags and stay unaided in Phase 2.
 */
import type { Phase1FlagKey } from './phase1FieldSync'

/** Phase 2 issue keys from GUIDED_ORDER in AgentReportPane. */
export type Phase2IssueKey =
  | 'balanceDueJump'
  | 'totalTaxRise'
  | 'withholdingDrop'
  | 'estTaxPenalty'
  | 'qualDivDrop'
  | 'ordinaryDivSurge'
  | 'qualDivRatio'
  | 'confirmPriorAgi'
  | 'missingEstPayments'
  | 'niitForm8960'
  | 'optW4Adjustment'
  | 'optIra'

/**
 * Phase 1 flag → Phase 2 insights dismissed when that flag is resolved.
 *
 * - fedTaxWithheld (DIV Box 4 low-confidence) ↔ withholdingDrop (mentions DIV Box 4)
 * - wages-techCircle ↔ optW4Adjustment (W-2 wage withholding guidance)
 */
export const PHASE1_TO_PHASE2_ISSUES: Partial<Record<string, Phase2IssueKey[]>> = {
  fedTaxWithheld: ['withholdingDrop'],
  'wages-techCircle': ['optW4Adjustment'],
}

/** Type-safe helper for known Phase 1 keys. */
export function phase2IssuesForFlag(flagKey: Phase1FlagKey | string): Phase2IssueKey[] {
  return PHASE1_TO_PHASE2_ISSUES[flagKey] ?? []
}
