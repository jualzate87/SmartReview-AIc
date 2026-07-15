import type { W2Employer } from './DetailFields'
import { W2_PAYER_TABS } from './DetailFields'
import type { DivPayer } from './DetailFieldsDiv'
import { DIV_PAYER_TABS, divVerifiedDocKey } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import { INT_PAYER_TABS, intVerifiedDocKey } from './DetailFields1099'
import {
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  getInitialW2PayerFlagCount,
} from './phase1FieldSync'

/**
 * A document shows a green check when marked verified, OR when it originally
 * had import flags and those are all cleared (legacy “cleared” signal).
 */
export function isDocReviewed(
  verifiedDocs: Set<string>,
  docKey: string,
  remainingFlagCount: number,
  initialFlagCount: number,
): boolean {
  if (verifiedDocs.has(docKey)) return true
  return initialFlagCount > 0 && remainingFlagCount === 0
}

export function buildTabVerifiedKeys(): Record<string, string[]> {
  return {
    w2s: W2_PAYER_TABS.map(t => t.key),
    '1099-divs': DIV_PAYER_TABS.map(t => divVerifiedDocKey(t.key)),
    '1099-ints': INT_PAYER_TABS.map(t => intVerifiedDocKey(t.key)),
    '1099-rs': ['1099-r'],
    '1099-necs': ['1099-nec'],
  }
}

/** True when every L2 doc under a type tab is reviewed/verified. */
export function buildTypeReviewed(args: {
  verifiedDocs: Set<string>
  w2Counts: Record<W2Employer, number>
  divCounts: Record<DivPayer, number>
  intCounts: Record<IntPayer, number>
  rRemaining: number
}): Record<string, boolean> {
  const { verifiedDocs, w2Counts, divCounts, intCounts, rRemaining } = args

  const w2s = W2_PAYER_TABS.every(t =>
    isDocReviewed(
      verifiedDocs,
      t.key,
      w2Counts[t.key] ?? 0,
      getInitialW2PayerFlagCount(t.key),
    ),
  )

  const divs = DIV_PAYER_TABS.every(t =>
    isDocReviewed(
      verifiedDocs,
      divVerifiedDocKey(t.key),
      divCounts[t.key] ?? 0,
      getInitialDivPayerFlagCount(t.key),
    ),
  )

  const ints = INT_PAYER_TABS.every(t =>
    isDocReviewed(
      verifiedDocs,
      intVerifiedDocKey(t.key),
      intCounts[t.key] ?? 0,
      getInitialIntPayerFlagCount(t.key),
    ),
  )

  const rs = isDocReviewed(
    verifiedDocs,
    '1099-r',
    rRemaining,
    getInitialRPayerFlagCount(),
  )

  const necs = verifiedDocs.has('1099-nec')

  return {
    w2s,
    '1099-divs': divs,
    '1099-ints': ints,
    '1099-rs': rs,
    '1099-necs': necs,
    'prior-1040': false,
  }
}
