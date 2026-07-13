import type { TopTab } from './ReviewTab'
import type { DivPayer } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import type { W2Employer } from './DetailFields'

/** Import-flag keys emitted by DetailFields mark-reviewed controls. */
export const PHASE1_FLAG_KEYS = [
  'ssn-techCircle',
  'wages-techCircle',
  'sswages-techCircle',
  'box12',
  'ein-techCircle',
  'divCollectibles',
  'divNonDiv',
  'fedTaxWithheld',
  'taxableInterest',
] as const

export type Phase1FlagKey = (typeof PHASE1_FLAG_KEYS)[number]

export type Phase1VerifyItem = {
  flagKey: Phase1FlagKey
  /** Detail-fields selection key (canonical selectedField value) */
  field: string
  tab: TopTab
  divPayer?: DivPayer
  intPayer?: IntPayer
}

/** Ordered Verify queue — W-2 flags first, then DIV, then INT. */
export const PHASE1_VERIFY_QUEUE: Phase1VerifyItem[] = [
  { flagKey: 'ssn-techCircle',      field: 'ssn',             tab: 'w2s' },
  { flagKey: 'wages-techCircle',    field: 'wages',           tab: 'w2s' },
  { flagKey: 'sswages-techCircle',  field: 'sswages',         tab: 'w2s' },
  { flagKey: 'box12',               field: 'box12',           tab: 'w2s' },
  { flagKey: 'ein-techCircle',      field: 'ein',             tab: 'w2s' },
  { flagKey: 'divCollectibles',     field: 'divCollectibles', tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'divNonDiv',           field: 'divNonDiv',       tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'fedTaxWithheld',      field: 'fedTaxWithheld',  tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'taxableInterest',     field: 'taxableInterest', tab: '1099-ints', intPayer: 'unwaverIngFinancial' },
]

/** Detail field key → 1040 row field (when a 1040 line exists). */
const DETAIL_TO_1040: Record<string, string> = {
  wages: 'wages',
  taxableInterest: 'taxableInterest',
  qualifiedDivs: 'qualifiedDivs',
  fedTaxWithheld: 'withholding',
}

/** 1040 row field → detail field key + navigation. */
const FIELD_1040_TO_DETAIL: Record<string, Pick<Phase1VerifyItem, 'field' | 'tab' | 'divPayer' | 'intPayer'>> = {
  wages: { field: 'wages', tab: 'w2s' },
  taxableInterest: { field: 'taxableInterest', tab: '1099-ints', intPayer: 'unwaverIngFinancial' },
  qualifiedDivs: { field: 'qualifiedDivs', tab: '1099-divs', divPayer: 'tokenFinancial' },
  withholding: { field: 'fedTaxWithheld', tab: '1099-divs', divPayer: 'tokenFinancial' },
  withholding1099: { field: 'fedTaxWithheld', tab: '1099-divs', divPayer: 'tokenFinancial' },
}

export function detailTo1040Field(detailField: string | null): string | null {
  if (!detailField) return null
  return DETAIL_TO_1040[detailField] ?? null
}

export function field1040ToDetail(field1040: string): Phase1VerifyItem | null {
  const nav = FIELD_1040_TO_DETAIL[field1040]
  if (!nav) return null
  const queueItem = PHASE1_VERIFY_QUEUE.find(q => q.field === nav.field)
  return queueItem ?? { flagKey: 'wages-techCircle', ...nav } as Phase1VerifyItem
}

export function get1040HighlightField(selectedField: string | null): string | null {
  if (!selectedField) return null
  return detailTo1040Field(selectedField) ?? selectedField
}

/** Box 12 sub-row reviewed keys for Tech Circle (multi-code W-2 layout). */
export function getBox12SubRowKeys(employer: W2Employer): string[] {
  if (employer === 'techCircle') {
    return ['box12a-techCircle', 'box12b-techCircle', 'box12c-techCircle', 'box12d-techCircle']
  }
  return []
}

/** True when the single Phase 1 `box12` flag is cleared — directly or via all sub-rows. */
export function isBox12FlagResolved(
  reviewedFields: Map<string, unknown>,
  employer: W2Employer = 'techCircle',
): boolean {
  if (reviewedFields.has('box12')) return true
  const subRows = getBox12SubRowKeys(employer)
  return subRows.length > 0 && subRows.every(k => reviewedFields.has(k))
}

export function isPhase1FlagResolved(
  flagKey: Phase1FlagKey,
  reviewedFields: Map<string, unknown>,
): boolean {
  if (flagKey === 'box12') return isBox12FlagResolved(reviewedFields)
  return reviewedFields.has(flagKey)
}

export function countPhase1Remaining(reviewedFields: Map<string, unknown>): number {
  return PHASE1_FLAG_KEYS.filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

export function getUnresolvedVerifyQueue(reviewedFields: Map<string, unknown>): Phase1VerifyItem[] {
  return PHASE1_VERIFY_QUEUE.filter(q => !isPhase1FlagResolved(q.flagKey, reviewedFields))
}

export function getNextVerifyItem(
  reviewedFields: Map<string, unknown>,
  selectedField: string | null,
): Phase1VerifyItem | null {
  const unresolved = getUnresolvedVerifyQueue(reviewedFields)
  if (!unresolved.length) return null
  const currentIdx = unresolved.findIndex(q => q.field === selectedField)
  return unresolved[(currentIdx + 1) % unresolved.length]
}

export function navigationForDetailField(field: string): Pick<Phase1VerifyItem, 'tab' | 'divPayer' | 'intPayer'> | null {
  const fromQueue = PHASE1_VERIFY_QUEUE.find(q => q.field === field)
  if (fromQueue) return { tab: fromQueue.tab, divPayer: fromQueue.divPayer, intPayer: fromQueue.intPayer }
  const from1040 = Object.values(FIELD_1040_TO_DETAIL).find(n => n.field === field)
  return from1040 ?? null
}

/** Phase 1 import flags per W-2 employer — only Tech Circle carries flags. */
const W2_PAYER_FLAG_KEYS: Record<W2Employer, Phase1FlagKey[]> = {
  techCircle: ['ssn-techCircle', 'wages-techCircle', 'sswages-techCircle', 'box12', 'ein-techCircle'],
  bingEquipment: [],
}

/** Phase 1 import flags per 1099-DIV payer — only primary payer carries flags. */
const DIV_PAYER_FLAG_KEYS: Record<DivPayer, Phase1FlagKey[]> = {
  tokenFinancial: ['divCollectibles', 'divNonDiv', 'fedTaxWithheld'],
  northmarkIndex: [],
  beaconDividend: [],
}

/** Phase 1 import flags per 1099-INT payer — only primary payer carries flags. */
const INT_PAYER_FLAG_KEYS: Record<IntPayer, Phase1FlagKey[]> = {
  unwaverIngFinancial: ['taxableInterest'],
  harborlineCredit: [],
  cascadeFederal: [],
}

export function countPhase1FlagsForW2Payer(
  employer: W2Employer,
  reviewedFields: Map<string, unknown>,
): number {
  return W2_PAYER_FLAG_KEYS[employer].filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

/** Unresolved W-2 Phase 1 flags across all payers — used for the W-2s top tab badge. */
export function countPhase1FlagsForW2Tab(reviewedFields: Map<string, unknown>): number {
  return (Object.keys(W2_PAYER_FLAG_KEYS) as W2Employer[]).reduce(
    (sum, employer) => sum + countPhase1FlagsForW2Payer(employer, reviewedFields),
    0,
  )
}

/** Single source of truth for ReviewTab badge counts during Phase 1. */
export function getTabFlagCounts(reviewedFields: Map<string, unknown>): Record<string, number> {
  const divCount = (Object.keys(DIV_PAYER_FLAG_KEYS) as DivPayer[]).reduce(
    (sum, payer) => sum + countPhase1FlagsForDivPayer(payer, reviewedFields),
    0,
  )
  const intCount = (Object.keys(INT_PAYER_FLAG_KEYS) as IntPayer[]).reduce(
    (sum, payer) => sum + countPhase1FlagsForIntPayer(payer, reviewedFields),
    0,
  )
  return {
    w2s: countPhase1FlagsForW2Tab(reviewedFields),
    '1099-divs': divCount,
    '1099-ints': intCount,
    '1099-rs': 0,
    '1099-necs': 0,
    'prior-1040': 0,
  }
}

export function countPhase1FlagsForDivPayer(
  payer: DivPayer,
  reviewedFields: Map<string, unknown>,
): number {
  return DIV_PAYER_FLAG_KEYS[payer].filter(k => !reviewedFields.has(k)).length
}

export function countPhase1FlagsForIntPayer(
  payer: IntPayer,
  reviewedFields: Map<string, unknown>,
): number {
  return INT_PAYER_FLAG_KEYS[payer].filter(k => !reviewedFields.has(k)).length
}
