import type { W2Employer } from './DetailFields'
import { W2_PAYER_TABS } from './DetailFields'
import type { DivPayer } from './DetailFieldsDiv'
import { DIV_PAYER_TABS, divVerifiedDocKey } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import { INT_PAYER_TABS, intVerifiedDocKey } from './DetailFields1099'
import { R_PAYER_TABS } from './DetailFields1099R'
import { NEC_PAYER_TABS } from './DetailFieldsNec'
import {
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  getInitialW2PayerFlagCount,
} from './phase1FieldSync'
import type { TopTab } from './ReviewTab'
import { QUESTIONNAIRE_DOC_KEY } from './questionnaireData'

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
    'prior-1040': ['prior-1040'],
    questionnaire: [QUESTIONNAIRE_DOC_KEY],
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
    'prior-1040': verifiedDocs.has('prior-1040'),
    questionnaire: verifiedDocs.has(QUESTIONNAIRE_DOC_KEY),
  }
}

/** Navigation target for one packet source document (incl. Questionnaire). */
export type PacketSourceDoc = {
  key: string
  label: string
  tab: TopTab
  w2SubTab?: W2Employer
  divPayer?: DivPayer
  intPayer?: IntPayer
}

/** Canonical packet inventory used for “review remaining documents” after flags clear. */
export function listPacketSourceDocs(): PacketSourceDoc[] {
  return [
    ...W2_PAYER_TABS.map(t => ({
      key: t.key,
      label: `W-2 · ${t.label}`,
      tab: 'w2s' as const,
      w2SubTab: t.key,
    })),
    ...DIV_PAYER_TABS.map(t => ({
      key: divVerifiedDocKey(t.key),
      label: `1099-DIV · ${t.label}`,
      tab: '1099-divs' as const,
      divPayer: t.key,
    })),
    ...INT_PAYER_TABS.map(t => ({
      key: intVerifiedDocKey(t.key),
      label: `1099-INT · ${t.label}`,
      tab: '1099-ints' as const,
      intPayer: t.key,
    })),
    ...R_PAYER_TABS.map(t => ({
      key: '1099-r',
      label: `1099-R · ${t.label}`,
      tab: '1099-rs' as const,
    })),
    ...NEC_PAYER_TABS.map(t => ({
      key: '1099-nec',
      label: `1099-NEC · ${t.label}`,
      tab: '1099-necs' as const,
    })),
    {
      key: 'prior-1040',
      label: 'Prior Year 1040',
      tab: 'prior-1040',
    },
    {
      key: QUESTIONNAIRE_DOC_KEY,
      label: 'Questionnaire',
      tab: 'questionnaire',
    },
  ]
}

export function getUnreviewedSourceDocs(args: {
  verifiedDocs: Set<string>
  w2Counts: Record<W2Employer, number>
  divCounts: Record<DivPayer, number>
  intCounts: Record<IntPayer, number>
  rRemaining: number
}): PacketSourceDoc[] {
  const { verifiedDocs, w2Counts, divCounts, intCounts, rRemaining } = args

  return listPacketSourceDocs().filter((doc) => {
    if (doc.tab === 'w2s' && doc.w2SubTab) {
      return !isDocReviewed(
        verifiedDocs,
        doc.key,
        w2Counts[doc.w2SubTab] ?? 0,
        getInitialW2PayerFlagCount(doc.w2SubTab),
      )
    }
    if (doc.tab === '1099-divs' && doc.divPayer) {
      return !isDocReviewed(
        verifiedDocs,
        doc.key,
        divCounts[doc.divPayer] ?? 0,
        getInitialDivPayerFlagCount(doc.divPayer),
      )
    }
    if (doc.tab === '1099-ints' && doc.intPayer) {
      return !isDocReviewed(
        verifiedDocs,
        doc.key,
        intCounts[doc.intPayer] ?? 0,
        getInitialIntPayerFlagCount(doc.intPayer),
      )
    }
    if (doc.tab === '1099-rs') {
      return !isDocReviewed(
        verifiedDocs,
        doc.key,
        rRemaining,
        getInitialRPayerFlagCount(),
      )
    }
    // NEC, Prior Year 1040, Questionnaire — verified flag only
    return !verifiedDocs.has(doc.key)
  })
}

/** Cycle to the next unreviewed packet doc after the one matching current tab/payer. */
export function getNextUnreviewedSourceDoc(
  unreviewed: PacketSourceDoc[],
  current: { tab: TopTab; w2SubTab?: W2Employer; divPayer?: DivPayer; intPayer?: IntPayer },
): PacketSourceDoc | null {
  if (unreviewed.length === 0) return null

  const matchesCurrent = (doc: PacketSourceDoc) => {
    if (doc.tab !== current.tab) return false
    if (doc.w2SubTab) return doc.w2SubTab === current.w2SubTab
    if (doc.divPayer) return doc.divPayer === current.divPayer
    if (doc.intPayer) return doc.intPayer === current.intPayer
    return true
  }

  const idx = unreviewed.findIndex(matchesCurrent)
  if (idx === -1) return unreviewed[0]
  return unreviewed[(idx + 1) % unreviewed.length]
}
