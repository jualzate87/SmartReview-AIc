import { useEffect, useRef, useState } from 'react'
import { FROZEN_RETURN, TOKEN_QUALIFIED_DIVS_RETURN } from '../data/frozenReturn'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { TopTab } from '../pages/data-review/ReviewTab'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'

// ProtoC: the source-doc review state (flags, reviewed fields, active tab, field
// values) is shared live between the main window and the pop-out window via
// BroadcastChannel, so the pop-out is genuinely the same view — not a separate
// copy that can drift. Every field here mirrors what DataReviewPage previously
// held as local useState; the pop-out consumes the identical hook.

export interface FieldValues {
  withholding: { techCircle: number }
  box12: number
  taxableInterest: number
  qualifiedDivs: number
}

export interface ReviewedEntry { by: string; at: string }

interface SyncedState {
  activeTopTab: TopTab
  activeSubTab: W2Employer
  selectedField: string | null
  wages: { techCircle: number }
  fieldValues: FieldValues
  reviewedFieldsList: [string, ReviewedEntry][]
  verifiedDocsList: string[]
  activeDivPayer: DivPayer
  activeIntPayer: IntPayer
}

const CHANNEL_NAME = 'protoc-data-review-sync'
// Bump this whenever DEFAULT_STATE's seed values change — a mismatched version
// means the cached session predates the new numbers, so it's discarded instead
// of silently mixing old field values with the new defaults (which caused the
// 1040 to show stale withholding/amount-owed figures after a data fix).
const STATE_VERSION = 8
const STORAGE_KEY = 'protoc-data-review-state-v' + STATE_VERSION
const PREPARER_NAME = 'Juan Alzate'

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

const DEFAULT_STATE: SyncedState = {
  activeTopTab: 'w2s',
  activeSubTab: 'techCircle',
  selectedField: null,
  wages: { techCircle: FROZEN_RETURN.wages },
  fieldValues: {
    withholding: { techCircle: FROZEN_RETURN.w2Withholding },
    box12: 0,
    taxableInterest: 1986,
    qualifiedDivs: TOKEN_QUALIFIED_DIVS_RETURN,
  },
  reviewedFieldsList: [],
  verifiedDocsList: [],
  activeDivPayer: 'tokenFinancial',
  activeIntPayer: 'unwaverIngFinancial',
}

function loadInitialState(): SyncedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) as Partial<SyncedState> }
  } catch {
    // ignore malformed storage — fall through to defaults
  }
  return DEFAULT_STATE
}

/**
 * Shared source-doc review state, live-synced across windows (main + pop-out)
 * via BroadcastChannel. sessionStorage seeds the pop-out on open and survives
 * a channel message being missed during the brief window-open race.
 */
export function useSyncedReviewState() {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const [state, setState] = useState<SyncedState>(loadInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (e: MessageEvent<SyncedState>) => {
      setState(e.data)
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(e.data)) } catch { /* ignore */ }
    }
    return () => channel.close()
  }, [])

  const publish = (next: SyncedState) => {
    // Update the ref synchronously so back-to-back calls in the same tick (e.g.
    // fieldKeys.forEach(k => markReviewed(k))) each see the previous call's
    // write instead of all reading the same stale snapshot and clobbering
    // each other. setState is still what actually triggers the re-render.
    stateRef.current = next
    setState(next)
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    channelRef.current?.postMessage(next)
  }

  const update = (patch: Partial<SyncedState>) => {
    publish({ ...stateRef.current, ...patch })
  }

  const reviewedFields = new Map(state.reviewedFieldsList)

  const markReviewed = (fieldName: string) => {
    const at = formatTimestamp(new Date())
    const next = new Map(stateRef.current.reviewedFieldsList)
    next.set(fieldName, { by: PREPARER_NAME, at })
    update({ reviewedFieldsList: Array.from(next.entries()) })
  }

  const markReviewedBulk = (fieldNames: string[]) => {
    const at = formatTimestamp(new Date())
    const next = new Map(stateRef.current.reviewedFieldsList)
    fieldNames.forEach(f => { if (!next.has(f)) next.set(f, { by: PREPARER_NAME, at }) })
    update({ reviewedFieldsList: Array.from(next.entries()) })
  }

  const verifiedDocs = new Set(state.verifiedDocsList)

  const toggleVerifiedDoc = (docKey: string) => {
    const next = new Set(stateRef.current.verifiedDocsList)
    if (next.has(docKey)) next.delete(docKey)
    else next.add(docKey)
    update({ verifiedDocsList: Array.from(next) })
  }

  const updateFieldValue = (key: keyof FieldValues, value: number | { techCircle: number }) => {
    update({ fieldValues: { ...stateRef.current.fieldValues, [key]: value } as FieldValues })
  }

  return {
    activeTopTab: state.activeTopTab,
    setActiveTopTab: (tab: TopTab) => update({ activeTopTab: tab }),
    activeSubTab: state.activeSubTab,
    setActiveSubTab: (tab: W2Employer) => update({ activeSubTab: tab }),
    selectedField: state.selectedField,
    setSelectedField: (field: string | null) => update({ selectedField: field }),
    wages: state.wages,
    setWages: (wages: { techCircle: number }) => update({ wages }),
    fieldValues: state.fieldValues,
    updateFieldValue,
    reviewedFields,
    activeDivPayer: state.activeDivPayer,
    setActiveDivPayer: (payer: DivPayer) => update({ activeDivPayer: payer }),
    activeIntPayer: state.activeIntPayer,
    setActiveIntPayer: (payer: IntPayer) => update({ activeIntPayer: payer }),
    markReviewed,
    markReviewedBulk,
    verifiedDocs,
    toggleVerifiedDoc,
  }
}
