import { useEffect, useRef, useState } from 'react'
import { SEED_AMOUNTS, type LiveAmounts } from '../data/liveReturn'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { TopTab } from '../pages/data-review/ReviewTab'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'
import { PHASE1_TO_PHASE2_ISSUES } from '../pages/data-review/phase2FlagSync'
import { getPhase1FlagKeysForVerifiedDoc } from '../pages/data-review/phase1FieldSync'

// ProtoC: source-doc review state persisted in sessionStorage. BroadcastChannel
// remains available for cross-tab sync if a second view is added later.

/** @deprecated Prefer LiveAmounts — kept for DetailFields prop shims. */
export interface FieldValues {
  withholding: { techCircle: number }
  box12: number
  taxableInterest: number
  qualifiedDivs: number
}

export interface ReviewedEntry { by: string; at: string }
/** Who/when for last check, flag, edit, or doc verify — same shape as reviewed. */
export type ActivityEntry = ReviewedEntry

interface SyncedState {
  activeTopTab: TopTab
  activeSubTab: W2Employer
  selectedField: string | null
  /** All editable return amounts — single source of truth for 1040 recalculation */
  amounts: LiveAmounts
  reviewedFieldsList: [string, ReviewedEntry][]
  /** Field keys the preparer has edited+saved this session (with who/when) */
  editedFieldsList: [string, ActivityEntry][]
  /** Docs marked verified — with who/when */
  verifiedDocsList: [string, ActivityEntry][]
  /** Summary-row checks (preparer) — mutually exclusive with flags */
  summaryCheckedFieldsList: [string, ActivityEntry][]
  /**
   * Summary-row user flags (preparer attention markers).
   * Mutually exclusive with checks. Notes may remain when flag is off.
   */
  summaryFlaggedFieldsList: [string, ActivityEntry][]
  /** Optional short notes keyed by Summary field id — kept when flag is turned off */
  summaryFlagNotes: Record<string, string>
  /**
   * Last flag activity (set/note Done) even after flag is cleared —
   * used for lightweight meta display.
   */
  summaryFlagActivity: Record<string, ActivityEntry>
  /**
   * Free-text / static detail-field overrides (employer name, addresses, etc.).
   * Keys match DetailFields row keys (e.g. `employerName-techCircle`).
   * Persists across tabs and Phase 2 so edits never disappear.
   */
  fieldOverrides: Record<string, string>
  activeDivPayer: DivPayer
  activeIntPayer: IntPayer
}

const CHANNEL_NAME = 'protoc-data-review-sync'
// Bump whenever DEFAULT_STATE shape or seed values change so stale sessions reset.
const STATE_VERSION = 20
const STORAGE_KEY = 'protoc-data-review-state-v' + STATE_VERSION
export const PREPARER_NAME = 'Sara Chen'

export function formatActivityTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatActivityMeta(entry?: ActivityEntry | null): string {
  if (!entry) return ''
  return `${entry.by} · ${entry.at}`
}

function nowEntry(): ActivityEntry {
  return { by: PREPARER_NAME, at: formatActivityTimestamp() }
}

/** Migrate legacy string[] lists → [key, ActivityEntry][] */
function migrateActivityList(
  raw: unknown,
  fallbackAt = 'earlier',
): [string, ActivityEntry][] {
  if (!Array.isArray(raw)) return []
  return raw.map((item): [string, ActivityEntry] | null => {
    if (typeof item === 'string') {
      return [item, { by: PREPARER_NAME, at: fallbackAt }]
    }
    if (Array.isArray(item) && typeof item[0] === 'string') {
      const entry = item[1]
      if (entry && typeof entry === 'object' && 'by' in entry && 'at' in entry) {
        return [item[0], entry as ActivityEntry]
      }
      return [item[0], { by: PREPARER_NAME, at: fallbackAt }]
    }
    return null
  }).filter((x): x is [string, ActivityEntry] => x !== null)
}

const DEFAULT_STATE: SyncedState = {
  activeTopTab: 'w2s',
  activeSubTab: 'techCircle',
  selectedField: null,
  amounts: { ...SEED_AMOUNTS },
  reviewedFieldsList: [],
  editedFieldsList: [],
  verifiedDocsList: [],
  summaryCheckedFieldsList: [],
  summaryFlaggedFieldsList: [],
  summaryFlagNotes: {},
  summaryFlagActivity: {},
  fieldOverrides: {},
  activeDivPayer: 'tokenFinancial',
  activeIntPayer: 'unwaverIngFinancial',
}

/** Ensure check and flag never coexist for the same field (check wins if both present). */
function enforceMutualExclusion(state: SyncedState): SyncedState {
  const checked = new Set(state.summaryCheckedFieldsList.map(([k]) => k))
  const flagged = state.summaryFlaggedFieldsList.filter(([k]) => !checked.has(k))
  if (flagged.length === state.summaryFlaggedFieldsList.length) return state
  return { ...state, summaryFlaggedFieldsList: flagged }
}

function reconcileVerifiedDocFlags(state: SyncedState): SyncedState {
  // If a doc is Verified but its Phase 1 flags were never written (stale session /
  // older Mark as verified), clear those flags so tab badges match what the user sees.
  if (!state.verifiedDocsList.length) return state
  const nextReviewed = new Map(state.reviewedFieldsList)
  let changed = false
  const at = state.verifiedDocsList[0]?.[1]?.at ?? formatActivityTimestamp()
  const by = state.verifiedDocsList[0]?.[1]?.by ?? PREPARER_NAME
  for (const [docKey] of state.verifiedDocsList) {
    for (const flag of getPhase1FlagKeysForVerifiedDoc(docKey)) {
      if (!nextReviewed.has(flag)) {
        nextReviewed.set(flag, { by, at })
        changed = true
      }
    }
  }
  if (!changed) return state
  return { ...state, reviewedFieldsList: Array.from(nextReviewed.entries()) }
}

function loadInitialState(): SyncedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncedState> & {
        verifiedDocsList?: unknown
        editedFieldsList?: unknown
        summaryCheckedFieldsList?: unknown
        summaryFlaggedFieldsList?: unknown
      }
      const loaded: SyncedState = {
        ...DEFAULT_STATE,
        ...parsed,
        amounts: {
          ...SEED_AMOUNTS,
          ...(parsed.amounts ?? {}),
          box12Rows: {
            ...SEED_AMOUNTS.box12Rows,
            ...(parsed.amounts?.box12Rows ?? {}),
          },
        },
        editedFieldsList: migrateActivityList(parsed.editedFieldsList),
        verifiedDocsList: migrateActivityList(parsed.verifiedDocsList),
        summaryCheckedFieldsList: migrateActivityList(parsed.summaryCheckedFieldsList),
        summaryFlaggedFieldsList: migrateActivityList(parsed.summaryFlaggedFieldsList),
        summaryFlagNotes: parsed.summaryFlagNotes ?? {},
        summaryFlagActivity: parsed.summaryFlagActivity ?? {},
        fieldOverrides: parsed.fieldOverrides ?? {},
      }
      return reconcileVerifiedDocFlags(enforceMutualExclusion(loaded))
    }
  } catch {
    // ignore malformed storage — fall through to defaults
  }
  return DEFAULT_STATE
}

/**
 * Shared source-doc review state with sessionStorage persistence.
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
      const next = enforceMutualExclusion(e.data)
      setState(next)
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    }
    return () => channel.close()
  }, [])

  const publish = (next: SyncedState) => {
    // Update the ref synchronously so back-to-back calls in the same tick (e.g.
    // fieldKeys.forEach(k => markReviewed(k))) each see the previous call's
    // write instead of all reading the same stale snapshot and clobbering
    // each other. setState is still what actually triggers the re-render.
    const safe = reconcileVerifiedDocFlags(enforceMutualExclusion(next))
    stateRef.current = safe
    setState(safe)
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe)) } catch { /* ignore */ }
    channelRef.current?.postMessage(safe)
  }

  const update = (patch: Partial<SyncedState>) => {
    publish({ ...stateRef.current, ...patch })
  }

  const reviewedFields = new Map(state.reviewedFieldsList)
  const editedFields = new Map(state.editedFieldsList)
  const editedFieldKeys = new Set(state.editedFieldsList.map(([k]) => k))

  const markEdited = (fieldKey: string) => {
    const next = new Map(stateRef.current.editedFieldsList)
    next.set(fieldKey, nowEntry())
    update({ editedFieldsList: Array.from(next.entries()) })
  }

  const markEditedBulk = (fieldKeys: string[]) => {
    const next = new Map(stateRef.current.editedFieldsList)
    const entry = nowEntry()
    fieldKeys.forEach(k => next.set(k, entry))
    update({ editedFieldsList: Array.from(next.entries()) })
  }

  /** Persist a static/detail field value and stamp it as edited. */
  const setFieldOverride = (fieldKey: string, value: string) => {
    const nextEdited = new Map(stateRef.current.editedFieldsList)
    nextEdited.set(fieldKey, nowEntry())
    update({
      fieldOverrides: { ...stateRef.current.fieldOverrides, [fieldKey]: value },
      editedFieldsList: Array.from(nextEdited.entries()),
    })
  }

  const markReviewed = (fieldName: string) => {
    const at = formatActivityTimestamp()
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
    const at = formatActivityTimestamp()
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

  const verifiedDocs = new Map(state.verifiedDocsList)
  const verifiedDocKeys = new Set(state.verifiedDocsList.map(([k]) => k))
  const summaryCheckedFields = new Map(state.summaryCheckedFieldsList)
  const summaryCheckedKeys = new Set(state.summaryCheckedFieldsList.map(([k]) => k))
  const summaryFlaggedFields = new Map(state.summaryFlaggedFieldsList)
  const summaryFlaggedKeys = new Set(state.summaryFlaggedFieldsList.map(([k]) => k))
  const summaryFlagNotes = state.summaryFlagNotes
  const summaryFlagActivity = state.summaryFlagActivity

  const toggleVerifiedDoc = (docKey: string) => {
    const nextVerified = new Map(stateRef.current.verifiedDocsList)
    if (nextVerified.has(docKey)) {
      nextVerified.delete(docKey)
      update({ verifiedDocsList: Array.from(nextVerified.entries()) })
      return
    }

    // Marking verified also clears every Phase 1 flag tied to this document
    nextVerified.set(docKey, nowEntry())
    const at = formatActivityTimestamp()
    const nextReviewed = new Map(stateRef.current.reviewedFieldsList)
    getPhase1FlagKeysForVerifiedDoc(docKey).forEach(f => {
      if (!nextReviewed.has(f)) nextReviewed.set(f, { by: PREPARER_NAME, at })
      const linked = PHASE1_TO_PHASE2_ISSUES[f]
      if (linked) {
        linked.forEach(issueKey => {
          if (!nextReviewed.has(issueKey)) nextReviewed.set(issueKey, { by: PREPARER_NAME, at })
        })
      }
    })
    update({
      verifiedDocsList: Array.from(nextVerified.entries()),
      reviewedFieldsList: Array.from(nextReviewed.entries()),
    })
  }

  /** Toggle Summary check — clearing flag if turning check on. */
  const toggleSummaryChecked = (fieldName: string) => {
    const nextChecked = new Map(stateRef.current.summaryCheckedFieldsList)
    const nextFlagged = new Map(stateRef.current.summaryFlaggedFieldsList)
    if (nextChecked.has(fieldName)) {
      nextChecked.delete(fieldName)
    } else {
      nextChecked.set(fieldName, nowEntry())
      nextFlagged.delete(fieldName) // mutual exclusion: check supersedes flag
    }
    update({
      summaryCheckedFieldsList: Array.from(nextChecked.entries()),
      summaryFlaggedFieldsList: Array.from(nextFlagged.entries()),
    })
  }

  /**
   * Toggle Summary user flag — clearing check if turning flag on.
   * Notes are kept when flagging off so re-flagging can restore them.
   */
  const toggleSummaryFlagged = (fieldName: string) => {
    const nextFlagged = new Map(stateRef.current.summaryFlaggedFieldsList)
    const nextChecked = new Map(stateRef.current.summaryCheckedFieldsList)
    const nextActivity = { ...stateRef.current.summaryFlagActivity }
    if (nextFlagged.has(fieldName)) {
      nextFlagged.delete(fieldName)
    } else {
      const entry = nowEntry()
      nextFlagged.set(fieldName, entry)
      nextActivity[fieldName] = entry
      nextChecked.delete(fieldName) // mutual exclusion: flag supersedes check
    }
    update({
      summaryFlaggedFieldsList: Array.from(nextFlagged.entries()),
      summaryCheckedFieldsList: Array.from(nextChecked.entries()),
      summaryFlagActivity: nextActivity,
    })
  }

  const setSummaryFlagNote = (fieldName: string, note: string) => {
    const trimmed = note.trim()
    const next = { ...stateRef.current.summaryFlagNotes }
    if (trimmed) next[fieldName] = trimmed
    else delete next[fieldName]
    const entry = nowEntry()
    const nextActivity = { ...stateRef.current.summaryFlagActivity, [fieldName]: entry }
    // Refresh flag activity timestamp when note is saved (flag already on)
    const nextFlagged = new Map(stateRef.current.summaryFlaggedFieldsList)
    if (nextFlagged.has(fieldName)) nextFlagged.set(fieldName, entry)
    update({
      summaryFlagNotes: next,
      summaryFlagActivity: nextActivity,
      summaryFlaggedFieldsList: Array.from(nextFlagged.entries()),
    })
  }

  const updateAmounts = (patch: Partial<LiveAmounts>) => {
    const prev = stateRef.current.amounts
    const nextAmounts = { ...prev, ...patch }
    // Keep aggregate box12 in sync when rows are patched (deep-merge per letter)
    if (patch.box12Rows) {
      const rows = {
        a: { ...prev.box12Rows.a, ...patch.box12Rows.a },
        b: { ...prev.box12Rows.b, ...patch.box12Rows.b },
        c: { ...prev.box12Rows.c, ...patch.box12Rows.c },
        d: { ...prev.box12Rows.d, ...patch.box12Rows.d },
      }
      nextAmounts.box12Rows = rows
      nextAmounts.box12 =
        rows.a.amount + rows.b.amount + rows.c.amount + rows.d.amount
    }
    update({ amounts: nextAmounts })
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
    if (key === 'box12') {
      // Legacy single-amount shim — write into row a; aggregate recomputed in updateAmounts
      updateAmounts({
        box12Rows: {
          ...a.box12Rows,
          a: { ...a.box12Rows.a, amount: value },
        },
      })
    } else if (key === 'taxableInterest') updateAmounts({ interestUnwavering: value })
    else if (key === 'qualifiedDivs') updateAmounts({ qualifiedDivsToken: value })
    else if (key === 'withholding') {
      // flat number — treat as W-2 Box 2
      updateAmounts({ w2Withholding: value })
    }
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
    /** Set of field keys for components that only need presence */
    editedFields: editedFieldKeys,
    /** Full who/when map for edited fields */
    editedFieldsMeta: editedFields,
    markEdited,
    markEditedBulk,
    fieldOverrides: state.fieldOverrides,
    setFieldOverride,
    activeDivPayer: state.activeDivPayer,
    setActiveDivPayer: (payer: DivPayer) => update({ activeDivPayer: payer }),
    activeIntPayer: state.activeIntPayer,
    setActiveIntPayer: (payer: IntPayer) => update({ activeIntPayer: payer }),
    markReviewed,
    markReviewedBulk,
    /** Set of verified doc keys (presence) — matches prior API */
    verifiedDocs: verifiedDocKeys,
    verifiedDocsMeta: verifiedDocs,
    toggleVerifiedDoc,
    /** Set of checked summary field keys (presence) */
    summaryCheckedFields: summaryCheckedKeys,
    summaryCheckedMeta: summaryCheckedFields,
    toggleSummaryChecked,
    /** Set of flagged summary field keys (presence) */
    summaryFlaggedFields: summaryFlaggedKeys,
    summaryFlaggedMeta: summaryFlaggedFields,
    toggleSummaryFlagged,
    summaryFlagNotes,
    summaryFlagActivity,
    setSummaryFlagNote,
  }
}
