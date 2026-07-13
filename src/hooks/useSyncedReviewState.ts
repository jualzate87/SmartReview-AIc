import { useEffect, useRef, useState } from 'react'
import { SEED_AMOUNTS, type LiveAmounts } from '../data/liveReturn'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { TopTab } from '../pages/data-review/ReviewTab'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'
import { PHASE1_TO_PHASE2_ISSUES } from '../pages/data-review/phase2FlagSync'

// ProtoC: the source-doc review state (flags, reviewed fields, active tab, field
// values) is shared live between the main window and the pop-out window via
// BroadcastChannel, so the pop-out is genuinely the same view — not a separate
// copy that can drift. Every field here mirrors what DataReviewPage previously
// held as local useState; the pop-out consumes the identical hook.

/** @deprecated Prefer LiveAmounts — kept for DetailFields prop shims. */
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
  /** All editable return amounts — single source of truth for 1040 recalculation */
  amounts: LiveAmounts
  reviewedFieldsList: [string, ReviewedEntry][]
  /** Field keys the preparer has edited+saved this session (audit trail) */
  editedFieldsList: string[]
  verifiedDocsList: string[]
  activeDivPayer: DivPayer
  activeIntPayer: IntPayer
}

const CHANNEL_NAME = 'protoc-data-review-sync'
// Bump whenever DEFAULT_STATE shape or seed values change so stale sessions reset.
const STATE_VERSION = 10
const STORAGE_KEY = 'protoc-data-review-state-v' + STATE_VERSION
const PREPARER_NAME = 'Juan Alzate'

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

const DEFAULT_STATE: SyncedState = {
  activeTopTab: 'w2s',
  activeSubTab: 'techCircle',
  selectedField: null,
  amounts: { ...SEED_AMOUNTS },
  reviewedFieldsList: [],
  editedFieldsList: [],
  verifiedDocsList: [],
  activeDivPayer: 'tokenFinancial',
  activeIntPayer: 'unwaverIngFinancial',
}

function loadInitialState(): SyncedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncedState>
      return {
        ...DEFAULT_STATE,
        ...parsed,
        amounts: { ...SEED_AMOUNTS, ...(parsed.amounts ?? {}) },
        editedFieldsList: parsed.editedFieldsList ?? [],
      }
    }
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
  const editedFields = new Set(state.editedFieldsList)

  const markEdited = (fieldKey: string) => {
    if (stateRef.current.editedFieldsList.includes(fieldKey)) return
    update({ editedFieldsList: [...stateRef.current.editedFieldsList, fieldKey] })
  }

  const markEditedBulk = (fieldKeys: string[]) => {
    const next = new Set(stateRef.current.editedFieldsList)
    fieldKeys.forEach(k => next.add(k))
    update({ editedFieldsList: Array.from(next) })
  }

  const markReviewed = (fieldName: string) => {
    const at = formatTimestamp(new Date())
    const next = new Map(stateRef.current.reviewedFieldsList)
    next.set(fieldName, { by: PREPARER_NAME, at })
    // Auto-dismiss linked Phase 2 insights when a Phase 1 flag is resolved
    const linked = PHASE1_TO_PHASE2_ISSUES[fieldName]
    if (linked) {
      linked.forEach(issueKey => {
        if (!next.has(issueKey)) next.set(issueKey, { by: PREPARER_NAME, at })
      })
    }
    update({ reviewedFieldsList: Array.from(next.entries()) })
  }

  const markReviewedBulk = (fieldNames: string[]) => {
    const at = formatTimestamp(new Date())
    const next = new Map(stateRef.current.reviewedFieldsList)
    fieldNames.forEach(f => {
      if (!next.has(f)) next.set(f, { by: PREPARER_NAME, at })
      const linked = PHASE1_TO_PHASE2_ISSUES[f]
      if (linked) {
        linked.forEach(issueKey => {
          if (!next.has(issueKey)) next.set(issueKey, { by: PREPARER_NAME, at })
        })
      }
    })
    update({ reviewedFieldsList: Array.from(next.entries()) })
  }

  const verifiedDocs = new Set(state.verifiedDocsList)

  const toggleVerifiedDoc = (docKey: string) => {
    const next = new Set(stateRef.current.verifiedDocsList)
    if (next.has(docKey)) next.delete(docKey)
    else next.add(docKey)
    update({ verifiedDocsList: Array.from(next) })
  }

  const updateAmounts = (patch: Partial<LiveAmounts>) => {
    update({ amounts: { ...stateRef.current.amounts, ...patch } })
  }

  /** Convenience — update W-2 wages object shape used by DetailFields. */
  const setWages = (wages: { techCircle: number }) => {
    updateAmounts({ wages: wages.techCircle })
  }

  /**
   * Legacy FieldValues shim for DetailFields that still call onFieldValueChange
   * with withholding / taxableInterest / qualifiedDivs / box12.
   */
  const updateFieldValue = (
    key: keyof FieldValues,
    value: number | { techCircle: number },
  ) => {
    const a = stateRef.current.amounts
    if (key === 'withholding' && typeof value === 'object') {
      updateAmounts({ w2Withholding: value.techCircle })
      return
    }
    if (typeof value !== 'number') return
    if (key === 'box12') updateAmounts({ box12: value })
    else if (key === 'taxableInterest') updateAmounts({ interestUnwavering: value })
    else if (key === 'qualifiedDivs') updateAmounts({ qualifiedDivsToken: value })
    else if (key === 'withholding') {
      // flat number — treat as W-2 Box 2
      updateAmounts({ w2Withholding: value })
    }
    void a
  }

  const amounts = state.amounts
  const wages = { techCircle: amounts.wages }
  const fieldValues: FieldValues = {
    withholding: { techCircle: amounts.w2Withholding },
    box12: amounts.box12,
    taxableInterest: amounts.interestUnwavering,
    qualifiedDivs: amounts.qualifiedDivsToken,
  }

  return {
    activeTopTab: state.activeTopTab,
    setActiveTopTab: (tab: TopTab) => update({ activeTopTab: tab }),
    activeSubTab: state.activeSubTab,
    setActiveSubTab: (tab: W2Employer) => update({ activeSubTab: tab }),
    selectedField: state.selectedField,
    setSelectedField: (field: string | null) => update({ selectedField: field }),
    amounts,
    updateAmounts,
    wages,
    setWages,
    fieldValues,
    updateFieldValue,
    reviewedFields,
    editedFields,
    markEdited,
    markEditedBulk,
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
