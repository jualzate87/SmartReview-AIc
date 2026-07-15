import { useState, useCallback, useRef, useEffect } from 'react'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { ArrowLeft, DotsSix, Panel, ChevronLeft, ChevronRight, Comment, PopOut, Close } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import NotesPane from './data-review/NotesPane'
import type { Note } from './data-review/NotesPane'
import intuitAssistIcon from '../assets/icons/intuit-assist.svg'
import LeftPanel1040 from './data-review/LeftPanel1040'
import ReviewTab from './data-review/ReviewTab'
import DocumentPreview from './data-review/DocumentPreview'
import Int1099FormPreview from './data-review/Int1099FormPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS, intVerifiedDocKey } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS, divVerifiedDocKey } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import {
  buildTabVerifiedKeys,
  buildTypeReviewed,
  isDocReviewed,
} from './data-review/docReviewStatus'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import AgentReportPane from './data-review/AgentReportPane'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import WelcomePane from './data-review/WelcomePane'
import Phase1Banner from './data-review/Phase1Banner'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import Phase2Banner from './data-review/Phase2Banner'
import {
  PHASE1_FLAG_KEYS,
  countPhase1Remaining,
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForW2Payer,
  field1040ToDetail,
  get1040HighlightField,
  getNextVerifyItem,
  getTabFlagCounts,
  getTabInitialFlagCounts,
  getInitialW2PayerFlagCount,
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  isPhase1FlagResolved,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import { getPhase2Progress } from './data-review/phase2FlagSync'
import { PHASE1_FLAG_MESSAGES } from './data-review/phase1FlagMessages'
import { computeLiveReturn } from '../data/liveReturn'
import { navigationForSourceDoc } from '../data/sourceDocuments'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import styles from '../styles/data-review/DataReviewPage.module.css'
import dragStyles from '../styles/data-review/DragHandle.module.css'

function VerticalGripIcon() {
  return (
    <svg width="4" height="20" viewBox="0 0 4 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2" cy="4"  r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="10" r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="16" r="1.5" fill="#93A3AB"/>
    </svg>
  )
}

/** Source-doc panel slide timing — matches --duration-appear/disappear-emphasize-fast */
const SOURCE_PANEL_ENTER_MS = 500
const SOURCE_PANEL_EXIT_MS = 500
/** Summary / left 1040 panel — prevents value columns from cropping */
const LEFT_PANEL_MIN_WIDTH = 956.4
/** Matches DragHandle.module.css .handleVertical width */
const PANEL_DRAG_HANDLE_WIDTH = 16

export default function DataReviewPage() {
  // Source-doc review state — flags, reviewed fields, active tab, editable field
  // values — is shared live with the pop-out window via BroadcastChannel so the
  // two views never drift apart. See useSyncedReviewState for the sync mechanism.
  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    amounts, updateAmounts,
    fieldValues, updateFieldValue,
    reviewedFields,
    editedFields,
    markEdited,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    verifiedDocsMeta,
    toggleVerifiedDoc,
    summaryCheckedFields,
    summaryCheckedMeta,
    toggleSummaryChecked,
    summaryFlaggedFields,
    summaryFlaggedMeta,
    toggleSummaryFlagged,
    summaryFlagNotes,
    summaryFlagActivity,
    setSummaryFlagNote,
    editedFieldsMeta,
  } = useSyncedReviewState()
  const liveTotals = computeLiveReturn(amounts)
  const total1a = liveTotals.wages
  const totalWithholding = liveTotals.totalWithholding
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)
  // Agent panel width in px when open (default 588px, user-resizable)
  const [agentPanelWidth, setAgentPanelWidth] = useState(588)
  // Right panel width in px (default ~65% viewport once imports start)
  const [rightPanelWidth, setRightPanelWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.65) : 920,
  )
  // Body width for Sources-panel share of the row (drives auto side-by-side).
  const [bodyWidth, setBodyWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1400,
  )
  // Suppress panel width CSS transitions while the user is dragging a resize handle
  const [panelResizing, setPanelResizing] = useState(false)
  // Top/bottom section height ratio in right panel (0-100, where value = preview percentage)
  const [previewHeight, setPreviewHeight] = useState(40)
  // Whether right panel is popped out
  const [poppedOut, setPoppedOut] = useState(false)
  // Whether the right document panel is visible — hidden until "Start reviewing imports"
  const [rightPanelVisible, setRightPanelVisible] = useState(false)
  // Whether the right panel is animating out (slide-out before display:none)
  const [rightPanelExiting, setRightPanelExiting] = useState(false)
  // Agent panel view state: idle → loading → report → closing → idle
  const [agentView, setAgentView] = useState<'idle' | 'loading' | 'report' | 'closing'>('idle')
  // Right panel animating-in: true during the 'closing' state so enter CSS fires
  const [rightPanelAnimating, setRightPanelAnimating] = useState(false)
  // Whether YoY analysis is expanded (screen 4) — drives -15% badge on 1040
  const [yoyExpanded, setYoyExpanded] = useState(false)
  // Whether user navigated to source docs from the agent panel — shows back link
  const [fromAgent, setFromAgent] = useState(false)
  // Which agent subview to restore when going back to agent insights
  // 'overview' = report overview, 'yoyDetail' = YoY detail pane open
  const [agentSubView, setAgentSubView] = useState<'overview' | 'yoyDetail'>('overview')
  // Notes / comments
  const [notes, setNotes] = useState<Note[]>([])
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesClosing, setNotesClosing] = useState(false)

  // --- ProtoC: two-phase sequential review ------------------------------------
  // 'welcome'     → Intuit Assist orientation screen
  // 'import'      → Phase 1: Import Accuracy (source-doc experience)
  // 'diagnostics' → Phase 2: AI Diagnostics (agent panel primary)
  type ReviewPhase = 'welcome' | 'import' | 'diagnostics'
  const [phase, setPhase] = useState<ReviewPhase>('welcome')
  // Phase 1: Summary visible by default; sources hidden until Start reviewing imports
  const [show1040, setShow1040] = useState(true)
  const [importsStarted, setImportsStarted] = useState(false)

  // The import/OCR flags owned by Phase 1. Each key matches the reviewed-field key
  // emitted by the DetailFields "Edit+Save" / "Mark as correct" controls.
  const phase1Total = PHASE1_FLAG_KEYS.length
  const phase1Resolved = PHASE1_FLAG_KEYS.filter(k => isPhase1FlagResolved(k, reviewedFields)).length
  // Counter of unresolved import flags — never below 0
  const phase1Remaining = countPhase1Remaining(reviewedFields)
  const phase1Complete = phase1Remaining === 0
  // Per-document unresolved counts for dynamic tab badges
  const tabFlagCounts = getTabFlagCounts(reviewedFields)
  const tabInitialFlagCounts = getTabInitialFlagCounts()
  // PeelTab per-payer badges — unresolved Phase 1 import flags only (mirrors tabFlagCounts)
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, reviewedFields)])
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, reviewedFields)])
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, reviewedFields)])
  ) as Record<W2Employer, number>
  const tabVerifiedKeys = buildTabVerifiedKeys()
  const typeReviewed = buildTypeReviewed({
    verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  // Phase 2 diagnostics progress — same dismiss rules AgentReportPane uses, so
  // resolving Phase 1 flags / editing amounts that fix an insight keeps the banner in sync.
  const phase2Progress = getPhase2Progress({
    reviewedFields,
    live: liveTotals,
    amounts,
  })
  const phase2Reviewed = phase2Progress.reviewed
  const phase2Total = phase2Progress.total
  const phase2Complete = phase2Progress.complete
  // ---------------------------------------------------------------------------

  const bodyRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  /** Split container for document preview ↔ Details (not the whole right panel). */
  const splitPaneRef = useRef<HTMLDivElement>(null)

  const ensureSourcePanelVisible = useCallback(() => {
    if (!rightPanelVisible) {
      setRightPanelVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setRightPanelAnimating(true)
        setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
      }))
    }
  }, [rightPanelVisible])

  /** Hide the imported-documents panel with the same slide-out used by the toolbar toggle */
  const handleCloseSourcePanel = useCallback(() => {
    if (!rightPanelVisible || rightPanelExiting) return
    setRightPanelExiting(true)
    setTimeout(() => {
      setRightPanelExiting(false)
      setRightPanelVisible(false)
    }, SOURCE_PANEL_EXIT_MS)
  }, [rightPanelVisible, rightPanelExiting])

  const startReviewingImports = useCallback(() => {
    setImportsStarted(true)
    setShow1040(true)
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    setBodyWidth(bodyW)
    // ~65% of body → sourcesPanelWide (>0.6) → auto side-by-side on open
    setRightPanelWidth(Math.max(480, Math.round(bodyW * 0.65)))
    setRightPanelVisible(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setRightPanelAnimating(true)
      setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
    }))
  }, [])

  // Field that the agent flagged as an issue — drives orange highlight mode
  // Set when navigating to source docs from any issue detail pane
  const [activeIssueField, setActiveIssueField] = useState<string | null>(null)

  // Maps doc-overlay field keys → 1040 field keys (when they differ)
  const DOC_FIELD_TO_1040: Record<string, string> = {
    earlyWithdrawal: 'taxableInterest', // Box 2 flows to same 1040 line 2b
  }

  // issueField: the 1040 field currently flagged by the active agent issue
  const issueField = (() => {
    if (activeIssueField && (agentView === 'report' || agentView === 'closing' || fromAgent)) {
      return DOC_FIELD_TO_1040[activeIssueField] ?? activeIssueField
    }
    if (agentSubView === 'yoyDetail' && (agentView === 'report' || agentView === 'closing')) return 'wages'
    return null
  })()
  const highlightMode: 'orange' | 'blue' = phase === 'import'
    ? 'blue'
    : (selectedField && (selectedField === issueField || DOC_FIELD_TO_1040[selectedField] === issueField)) ? 'orange' : 'blue'

  const applyVerifyNavigation = useCallback((field: string) => {
    const nav = navigationForDetailField(field)
    if (nav) {
      setActiveTopTab(nav.tab)
      if (nav.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav.intPayer) setActiveIntPayer(nav.intPayer)
    }
    setSelectedField(field)
    if (!importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
  }, [
    setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField,
    importsStarted, startReviewingImports, ensureSourcePanelVisible,
  ])

  const handleVerifyNext = useCallback(() => {
    if (!importsStarted) startReviewingImports()
    const next = getNextVerifyItem(reviewedFields, selectedField)
    if (!next) return
    applyVerifyNavigation(next.field)
  }, [importsStarted, startReviewingImports, reviewedFields, selectedField, applyVerifyNavigation])

  const handleFieldSelect = useCallback((field: string | null) => {
    setSelectedField(field)
    if (phase === 'import' && field) {
      if (!importsStarted) startReviewingImports()
      else ensureSourcePanelVisible()
    }
  }, [phase, setSelectedField, importsStarted, startReviewingImports, ensureSourcePanelVisible])

  const handleNavigateToSourceDoc = useCallback((docId: string) => {
    const nav = navigationForSourceDoc(docId)
    if (!nav) return
    setActiveTopTab(nav.tab)
    if (nav.subTab) setActiveSubTab(nav.subTab)
    if (nav.divPayer) setActiveDivPayer(nav.divPayer)
    if (nav.intPayer) setActiveIntPayer(nav.intPayer)

    if (!importsStarted) {
      startReviewingImports()
    } else if (agentView !== 'idle') {
      setFromAgent(true)
      setAgentSubView('overview')
      setAgentView('closing')
      setYoyExpanded(false)
      setTimeout(() => setAgentView('idle'), 350)
    } else {
      ensureSourcePanelVisible()
    }
  }, [
    agentView,
    importsStarted,
    startReviewingImports,
    ensureSourcePanelVisible,
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setActiveIntPayer,
  ])

  /** From FieldPopover source row — jump to doc + highlight the matching detail field. */
  const handleNavigateSource = useCallback((source: {
    docId: string
    detailFieldId: string
    label: string
  }) => {
    handleNavigateToSourceDoc(source.docId)
    setSelectedField(source.detailFieldId)
  }, [handleNavigateToSourceDoc, setSelectedField])

  const handle1040FieldClick = useCallback((field1040: string | null) => {
    if (!field1040) {
      setSelectedField(null)
      return
    }
    const mapped = field1040ToDetail(field1040)
    if (mapped) {
      applyVerifyNavigation(mapped.field)
    } else {
      setSelectedField(field1040)
    }
  }, [applyVerifyNavigation, setSelectedField])

  const highlightField1040 = get1040HighlightField(selectedField)

  const sourceDocPreview = getSourceDocPreview({
    activeTopTab,
    activeSubTab,
    activeIntPayer,
    activeDivPayer,
    prior1040Images: [img1040PriorPage1, img1040PriorPage2],
  })

  // Reset field selection on mount
  useEffect(() => {
    setSelectedField(null)
  }, [])

  // ProtoC: the agent panel is driven by the phase model (opens on entering Phase 2),
  // not by the ?agent=true entry param. See handleBeginDiagnostics below.

  const handleAgentOpen = (subView?: 'overview' | 'yoyDetail') => {
    setSelectedField(null)
    if (subView) setAgentSubView(subView)
    const alreadyLoaded = sessionStorage.getItem('agentLoaded')
    if (alreadyLoaded) {
      setAgentView('report')
    } else {
      setAgentView('loading')
      setTimeout(() => {
        setAgentView('report')
        sessionStorage.setItem('agentLoaded', '1')
      }, 3200)
    }
  }

  // ProtoC: Phase 1 → Phase 2 transition. Switches layout to agent-primary and
  // opens the AI diagnostics panel (plays the loading animation once).
  const handleBeginDiagnostics = () => {
    setPhase('diagnostics')
    setShow1040(true)          // 1040 visible by default in Phase 2 (context for diagnostics)
    setSelectedField(null)
    handleAgentOpen()
  }

  // ProtoC: return to Phase 1 (source docs) from the completion banner
  const handleReturnToImport = () => {
    if (agentView !== 'idle') handleAgentClose()
    setPhase('import')
    setShow1040(true)
    setSelectedField(null)
  }

  const handleAgentClose = (preserveSelection = false) => {
    setAgentView('closing')
    setYoyExpanded(false)
    if (!preserveSelection) {
      setSelectedField(null)
      setActiveIssueField(null)
    }
    // Step 1: agent plays panelSlideOut (350ms)
    // Step 2: switch to idle (display:flex appears on right panel)
    // Step 3: one rAF later, add the enter animation class (browser has painted display:flex)
    setTimeout(() => {
      setAgentView('idle')          // right panel: display:flex now
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { // second rAF: browser has rendered the flex layout
          setRightPanelAnimating(true)
          setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
        })
      })
    }, 350)
  }

  const PREPARER_NAME = 'Sara Chen'

  const handleOpenNotes = () => setNotesOpen(true)
  const handleCloseNotes = () => {
    setNotesClosing(true)
    setTimeout(() => { setNotesOpen(false); setNotesClosing(false) }, 200)
  }
  const formatNoteAt = () =>
    new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  const handleAddNote = (text: string, context?: string) => {
    setNotes(prev => [...prev, { id: `note-${Date.now()}`, text, author: PREPARER_NAME, at: formatNoteAt(), context }])
    setNotesOpen(true)
  }

  const handleEditNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text, at: formatNoteAt() } : n))
  }

  /**
   * Shared drag bootstrap: pointer events + document-level move/up while dragging.
   * Falls back cleanly if the gesture was not a primary button press.
   */
  const beginPanelDrag = useCallback((
    e: React.PointerEvent,
    cursor: string,
    onMove: (clientX: number, clientY: number) => void,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    setPanelResizing(true)
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'

    const onPointerMove = (moveEvent: PointerEvent) => {
      onMove(moveEvent.clientX, moveEvent.clientY)
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture?.(upEvent.pointerId) } catch { /* already released */ }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setPanelResizing(false)
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [])

  // Horizontal drag between left panel and agent panel (resizes agent panel px width).
  // Cap max so Summary (left) never shrinks below LEFT_PANEL_MIN_WIDTH when space allows.
  const handleAgentDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = agentPanelWidth
    beginPanelDrag(e, 'col-resize', (clientX) => {
      const delta = startX - clientX // dragging left = wider agent panel
      const bodyWidth = body.getBoundingClientRect().width
      const maxByLeftMin = bodyWidth - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH
      const upper = maxByLeftMin >= 360
        ? Math.min(bodyWidth * 0.7, maxByLeftMin)
        : bodyWidth * 0.7
      const next = startPanelWidth + delta
      setAgentPanelWidth(Math.max(360, Math.min(upper, next)))
    })
  }, [agentPanelWidth, beginPanelDrag])

  // Horizontal drag between left panel and right panel (resizes rightPanelWidth).
  // Cap max so Summary (left) never shrinks below LEFT_PANEL_MIN_WIDTH when space allows;
  // on narrow viewports CSS min-width + body overflow-x handles the rest.
  const handleRightPanelDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = rightPanelWidth
    beginPanelDrag(e, 'col-resize', (clientX) => {
      const delta = startX - clientX // dragging left = wider right panel
      const bodyWidth = body.getBoundingClientRect().width
      const maxByLeftMin = bodyWidth - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH
      const upper = maxByLeftMin >= 400
        ? Math.min(bodyWidth * 0.75, maxByLeftMin)
        : bodyWidth * 0.75
      const next = startPanelWidth + delta
      setRightPanelWidth(Math.max(400, Math.min(upper, next)))
    })
  }, [rightPanelWidth, beginPanelDrag])

  // Keep bodyWidth in sync (Sources share of row uses rightPanelWidth / bodyWidth).
  // Prefer clientWidth (scrollport) so overflowed content min-sizes don't inflate the ratio.
  // Re-bind when phase changes so ProtoC attaches after leaving welcome (body mounts).
  useEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === 'undefined') return
    const update = () => setBodyWidth(body.clientWidth || body.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(body)
    return () => ro.disconnect()
  }, [phase])

  // Side-by-side (doc LEFT / Details RIGHT) when:
  //   1. Hide Summary (!show1040), OR
  //   2. Sources (right) panel is >60% of review body width
  // Stacked (preview TOP / Details BOTTOM) when Summary is visible AND
  // Sources panel is ≤60% of body. Uses measured body.clientWidth so Summary
  // min-width (956.4) doesn't distort the ratio. Do NOT use previewHeight.
  // Equivalent: sideBySide = !show1040 || (sourcesOpen && rightPanelWidth / bodyClientWidth > 0.6)
  const sourcesPanelWide =
    rightPanelVisible &&
    !rightPanelExiting &&
    bodyWidth > 0 &&
    rightPanelWidth / bodyWidth > 0.6
  const previewSideBySide = !show1040 || sourcesPanelWide

  // Resize drag between the document preview and detail fields. Axis is frozen
  // for the gesture (matches flexDirection at pointer-down). previewHeight
  // only controls the split ratio — never orientation.
  const handlePreviewDrag = useCallback((e: React.PointerEvent) => {
    const split = splitPaneRef.current ?? rightRef.current
    if (!split) return

    // Freeze axis to the layout at pointer-down (matches flexDirection).
    const stacked = !previewSideBySide
    const startPos = stacked ? e.clientY : e.clientX
    const startSize = previewHeight
    beginPanelDrag(e, stacked ? 'row-resize' : 'col-resize', (clientX, clientY) => {
      const pos = stacked ? clientY : clientX
      const delta = pos - startPos
      const rect = split.getBoundingClientRect()
      const splitSize = stacked ? rect.height : rect.width
      if (splitSize <= 0) return
      setPreviewHeight(Math.max(20, Math.min(75, startSize + (delta / splitSize) * 100)))
    })
  }, [previewHeight, previewSideBySide, beginPanelDrag])

  // ProtoC: welcome/orientation screen is the entry point (no header chrome)
  if (phase === 'welcome') {
    return (
      <div className={styles.page}>
        <WelcomePane
          clientName="Jessica Drake"
          flagCount={phase1Total}
          onBegin={() => {
            setPhase('import')
            setShow1040(true)
            setRightPanelVisible(false)
            setImportsStarted(false)
          }}
        />
      </div>
    )
  }

  const inImportPhase = phase === 'import'

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.backDivider}>
            <button className={styles.backButton} aria-label="Back">
              <ArrowLeft size="medium" />
            </button>
          </div>
          <span className={styles.headerTitle}>Data Review - Form 1040</span>
        </div>
        <div className={styles.headerRight}>

          <button
            className={`${styles.intuitIntelBtn} ${notesOpen ? styles.intuitIntelBtnActive : ''}`}
            aria-label="Comments"
            style={{ position: 'relative' }}
            onClick={notesOpen ? handleCloseNotes : handleOpenNotes}
          >
            <Comment size="medium" />
            <span className={styles.intuitIntelLabel}>Comments</span>
            {notes.length > 0 && (
              <span className={styles.notesBadge}>{notes.length}</span>
            )}
          </button>
          <button
            className={`${styles.intuitIntelBtn} ${rightPanelVisible && agentView === 'idle' ? styles.intuitIntelBtnActive : ''}`}
            aria-label="Toggle panel"
            onClick={() => {
              if (agentView !== 'idle') {
                handleAgentClose()
              } else if (rightPanelVisible) {
                handleCloseSourcePanel()
              } else {
                // Show with slide-in
                setRightPanelVisible(true)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  setRightPanelAnimating(true)
                  setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
                }))
              }
            }}
          >
            <Panel size="medium" />
            <span className={styles.intuitIntelLabel}>Source Documents</span>
          </button>
          {/* ProtoC: AI Review is Phase 2 only — hidden during Phase 1 (import accuracy) */}
          {!inImportPhase && (
            <button
              className={`${styles.intuitIntelBtn} ${agentView !== 'idle' ? styles.intuitIntelBtnActive : ''}`}
              aria-label="Intuit Intelligence"
              onClick={() => handleAgentOpen()}
            >
              <img src={intuitAssistIcon} alt="" className={styles.intuitIntelIcon} />
              <span className={styles.intuitIntelLabel}>AI Review</span>
            </button>
          )}
        </div>
      </div>

      {/* ProtoC Phase 1 — Import Accuracy banner (dynamic progress + gated Phase 2 CTA) */}
      {inImportPhase && (
        <Phase1Banner
          resolved={phase1Resolved}
          total={phase1Total}
          complete={phase1Complete}
          onContinue={handleBeginDiagnostics}
          importsStarted={importsStarted}
          onStartImports={startReviewingImports}
        />
      )}

      {/* ProtoC Phase 2 — AI Diagnostics banner. Shares Phase1Banner's visual language
          (Intuit Assist icon, title/subtitle, progress) so both phases feel like one
          continuous guided experience rather than two disconnected screens. */}
      {!inImportPhase && (
        <Phase2Banner
          reviewed={phase2Reviewed}
          total={phase2Total}
          complete={phase2Complete}
        />
      )}

      {/* Body — left panel + drag handle + right panel + agent panel */}
      <div className={styles.body} ref={bodyRef}>
        {/* ProtoC Phase 1: 1040 is minimized by default — collapsed to a compact button
            pinned near the top of the column. Expanding grows the panel horizontally, so
            the chevron points right (expand) / left (collapse) rather than up/down. Left
            panel stays mounted and animates width/opacity (same pattern as .rightPanel)
            so the transition is smooth. */}
        {inImportPhase && (
          <div
            className={styles.form1040HandleWrap}
            style={{ width: show1040 ? 0 : 44, opacity: show1040 ? 0 : 1, pointerEvents: show1040 ? 'none' : 'auto' }}
          >
            <button
              className={styles.form1040Handle}
              onClick={() => setShow1040(true)}
              aria-label="Show 1040"
            >
              <ChevronRight size="small" className={styles.form1040HandleIcon} />
              <span className={styles.form1040HandleLabel}>Show Summary</span>
            </button>
          </div>
        )}
        <div
          className={styles.leftPanel}
          style={{
            /* Grow into remaining space; right panel keeps a draggable pixel width
               (percentage flex locks were ignoring handleRightPanelDrag). */
            flex: (inImportPhase && !show1040) ? '0 0 0px' : 1,
            width: (inImportPhase && !show1040) ? 0 : undefined,
            opacity: (inImportPhase && !show1040) ? 0 : 1,
            minWidth: (inImportPhase && !show1040) ? 0 : LEFT_PANEL_MIN_WIDTH,
            transition: panelResizing ? 'none' : undefined,
          }}
        >
          {inImportPhase && show1040 && (rightPanelVisible || notesOpen) && (
            <Button
              priority="secondary"
              size="small"
              className={styles.form1040HideBtn}
              onClick={() => setShow1040(false)}
              aria-label="Hide Summary"
            >
              <ChevronLeft size="small" /> Hide Summary
            </Button>
          )}
          <LeftPanel1040
            selectedField={selectedField}
            highlightField={highlightField1040}
            onFieldClick={inImportPhase ? handle1040FieldClick : setSelectedField}
            total1a={total1a}
            wages={wages}
            yoyExpanded={yoyExpanded || agentSubView === 'yoyDetail' || activeTopTab === 'prior-1040' || phase === 'diagnostics'}
            reviewedFields={reviewedFields}
            checkedFields={summaryCheckedFields}
            checkedMeta={summaryCheckedMeta}
            onToggleChecked={toggleSummaryChecked}
            flaggedFields={summaryFlaggedFields}
            flaggedMeta={summaryFlaggedMeta}
            onToggleFlagged={toggleSummaryFlagged}
            flagNotes={summaryFlagNotes}
            flagActivity={summaryFlagActivity}
            onSetFlagNote={setSummaryFlagNote}
            issueField={issueField}
            liveTotals={liveTotals}
            liveAmounts={amounts}
            editedFields={editedFields}
            onAddFieldNote={(text, context) => handleAddNote(text, context)}
            onNavigateToSourceDoc={handleNavigateToSourceDoc}
            onNavigateSource={handleNavigateSource}
            onViewSource={(fieldName, sourceLabel) => {
              // Map field → document tab
              const tabMap: Record<string, typeof activeTopTab> = {
                wages:           'w2s',
                w2Withholding:   'w2s',
                withholding:     '1099-divs',
                taxableInterest: '1099-ints',
                qualifiedDivs:   '1099-divs',
                ordinaryDivs:    '1099-divs',
                withholding1099: '1099-rs',
                iraDistrib:      '1099-rs',
                otherIncome:     '1099-necs',
                capitalGain:     'w2s',
                stdDeduction:    'w2s',
                agi:             'prior-1040',
                totalTax:        'prior-1040',
                amountOwed:      'prior-1040',
                totalPayments:   'prior-1040',
              }
              const tab = tabMap[fieldName] ?? 'w2s'
              setActiveTopTab(tab)

              // Navigate to the correct W-2 sub-tab based on source label
              if (tab === 'w2s' && sourceLabel) {
                const lc = sourceLabel.toLowerCase()
                if (lc.includes('tech circle')) setActiveSubTab('techCircle')
              }

              if (!importsStarted) {
                startReviewingImports()
              } else if (agentView !== 'idle') {
                // Agent is open — close it preserving the field selection
                setFromAgent(true)
                setAgentSubView('overview')
                handleAgentClose(true)
              } else {
                ensureSourcePanelVisible()
              }
            }}
          />
        </div>

        {!poppedOut && (
          <>
            {/* Left/right drag handle — hidden when the 1040 is collapsed (nothing to drag
                against) or when the right panel/agent isn't visible */}
            {agentView === 'idle' && rightPanelVisible && !rightPanelExiting && !(inImportPhase && !show1040) && (
              <div
                className={dragStyles.handleVertical}
                onPointerDown={handleRightPanelDrag}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize Summary and Source Documents"
              >
                <VerticalGripIcon />
              </div>
            )}

            {/* Right panel — always in DOM, width animates to 0 when hidden. When the 1040
                is collapsed in Phase 1, it switches from a fixed pixel width to flex:1 so it
                fills the space the 1040 gave up instead of leaving a dead gap on wide screens. */}
            <div
              className={`${styles.rightPanel} ${rightPanelAnimating ? styles.rightPanelEntering : ''} ${rightPanelExiting ? styles.rightPanelExiting : ''}`}
              ref={rightRef}
              style={{
                width: (agentView === 'loading' || agentView === 'report' || agentView === 'closing' || (!rightPanelVisible && !rightPanelExiting))
                  ? 0
                  : (inImportPhase && !show1040) ? undefined : rightPanelWidth,
                /* When Summary is collapsed, fill; otherwise fixed px width so the
                   vertical drag handle can resize via rightPanelWidth. */
                flex: (inImportPhase && !show1040 && rightPanelVisible)
                  ? '1 1 0%'
                  : '0 0 auto',
                overflow: 'hidden',
                opacity: (agentView === 'loading' || agentView === 'report' || agentView === 'closing' || (!rightPanelVisible && !rightPanelExiting)) ? 0 : 1,
                transition: panelResizing ? 'none' : undefined,
              }}
            >
              {/* Source panel header — title left; Detach + Close on right */}
              <div className={styles.sourcePanelHeader}>
                {/* "Back to agent insights" only makes sense in Phase 2, after navigating from the agent */}
                {!inImportPhase && fromAgent && agentView === 'idle' && rightPanelVisible ? (
                  <button
                    className={styles.agentBackBtn}
                    onClick={() => { setFromAgent(false); setActiveIssueField(null); handleAgentOpen(agentSubView) }}
                  >
                    <ChevronLeft size="small" /> Back to agent insights
                  </button>
                ) : (
                  <span className={styles.sourcePanelTitle}>Imported documents</span>
                )}
                <div className={styles.sourcePanelActions}>
                  <IconControl
                    label="Detach"
                    labelAlignment="right"
                    size="small"
                    aria-label="Detach"
                    onClick={() => {
                      setPoppedOut(true)
                      const popoutWindow = window.open(
                        `${window.location.origin}${window.location.pathname}#/data-review-popout`,
                        '_blank',
                        'width=950,height=900'
                      )
                      if (popoutWindow) {
                        const checkClosed = setInterval(() => {
                          if (popoutWindow.closed) {
                            clearInterval(checkClosed)
                            setPoppedOut(false)
                          }
                        }, 500)
                      }
                    }}
                  >
                    <PopOut size="small" />
                  </IconControl>
                  <IconControl
                    size="small"
                    aria-label="Close"
                    onClick={handleCloseSourcePanel}
                  >
                    <Close size="small" />
                  </IconControl>
                </div>
              </div>
              {inImportPhase && phase1Remaining > 0 && (
                <Phase1IssueBanner unresolvedCount={phase1Remaining} onVerify={handleVerifyNext} />
              )}
              <ReviewTab
                activeTopTab={activeTopTab}
                flagCounts={inImportPhase ? tabFlagCounts : undefined}
                initialFlagCounts={inImportPhase ? tabInitialFlagCounts : undefined}
                verifiedDocs={verifiedDocs}
                tabVerifiedKeys={tabVerifiedKeys}
                typeReviewed={inImportPhase ? typeReviewed : undefined}
                onTopTabChange={(tab) => {
                  setActiveTopTab(tab)
                  setFromAgent(false)
                  setSelectedField(null)
                  setActiveIssueField(null)
                }}
              />

              {/* Peel tabs — payer switcher for multi-payer doc types */}
              {activeTopTab === '1099-divs' && (
                <PeelTab
                  tabs={DIV_PAYER_TABS.map(t => ({
                    ...t,
                    badge: divPayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      divVerifiedDocKey(t.key),
                      divPayerFieldCounts[t.key],
                      getInitialDivPayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeDivPayer}
                  onChange={key => setActiveDivPayer(key as DivPayer)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <PeelTab
                  tabs={INT_PAYER_TABS.map(t => ({
                    ...t,
                    badge: intPayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      intVerifiedDocKey(t.key),
                      intPayerFieldCounts[t.key],
                      getInitialIntPayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeIntPayer}
                  onChange={key => setActiveIntPayer(key as IntPayer)}
                />
              )}
              {activeTopTab === 'w2s' && (
                <PeelTab
                  tabs={W2_PAYER_TABS.map(t => ({
                    ...t,
                    badge: w2PayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      t.key,
                      w2PayerFieldCounts[t.key],
                      getInitialW2PayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeSubTab}
                  onChange={key => setActiveSubTab(key as W2Employer)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <PeelTab
                  tabs={R_PAYER_TABS.map(t => ({
                    ...t,
                    badge: tabFlagCounts['1099-rs'],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      '1099-r',
                      tabFlagCounts['1099-rs'],
                      getInitialRPayerFlagCount(),
                    ),
                  }))}
                  activeKey="meridian"
                  onChange={() => {}}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <PeelTab
                  tabs={NEC_PAYER_TABS.map(t => ({
                    ...t,
                    badge: 0,
                    showClearedCheck: verifiedDocs.has('1099-nec'),
                  }))}
                  activeKey="summit"
                  onChange={() => {}}
                />
              )}

              {/* Document preview + detail fields. flex-basis % (not width/height alone)
                  so the six-dot handle can shrink the preview even when the document
                  image has a large intrinsic min-size. */}
              <div
                ref={splitPaneRef}
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                  flexDirection: previewSideBySide ? 'row' : 'column',
                }}
              >
              <div style={previewSideBySide
                ? {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderRight: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
                : {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderBottom: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
              }>
                <DocumentPreview
                  imageSrc={sourceDocPreview.imageSrc}
                  alt={sourceDocPreview.alt}
                  customContent={
                    sourceDocPreview.useInt1099UnwaveringHtml
                      ? <Int1099FormPreview />
                      : undefined
                  }
                />
              </div>

              {/* Drag handle — vertical (col-resize) side by side, horizontal (row-resize) stacked */}
              <div
                className={previewSideBySide ? dragStyles.handleVertical : dragStyles.handleHorizontal}
                onPointerDown={handlePreviewDrag}
                role="separator"
                aria-orientation={previewSideBySide ? 'vertical' : 'horizontal'}
                aria-label="Resize document preview and Details"
              >
                <DotsSix size="small" className={`${dragStyles.handleIcon} ${previewSideBySide ? '' : dragStyles.rotated90}`} />
              </div>

              {/* Detail fields — switches based on active tab */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTopTab === 'w2s' && (
                <DetailFields
                  formTitle="Details: Wages, Salaries, Tips (W-2)"
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  activeSubTab={activeSubTab}
                  onSubTabChange={(tab) => setActiveSubTab(tab as W2Employer)}
                  wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
                  onWageChange={(employer, value) => {
                    setWages({ ...wages, [employer]: value })
                    markEdited(`wages-${employer}`)
                  }}
                  fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                  onFieldValueChange={(key, value) => {
                    if (key === 'withholding' && typeof value === 'number') {
                      updateField('withholding', { techCircle: value })
                      markEdited('withholding')
                    } else {
                      updateField(key as keyof typeof fieldValues, value as number)
                      markEdited(String(key))
                    }
                  }}
                  box12Rows={amounts.box12Rows}
                  onBox12RowChange={(sub, patch) => {
                    updateAmounts({
                      box12Rows: {
                        ...amounts.box12Rows,
                        [sub]: { ...amounts.box12Rows[sub], ...patch },
                      },
                    })
                    markEdited(`box12${sub}-${activeSubTab}`)
                  }}
                  onIdentityChange={(kind, value) => {
                    if (kind === 'ssn') updateAmounts({ employeeSsn: value })
                    else updateAmounts({ employerEin: value })
                    markEdited(kind === 'ssn' ? 'ssn-techCircle' : 'ein-techCircle')
                  }}
                  identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={{
                    ssn: PHASE1_FLAG_MESSAGES.w2.ssn,
                    wages: PHASE1_FLAG_MESSAGES.w2.wages,
                    box12: PHASE1_FLAG_MESSAGES.w2.box12,
                    ein: PHASE1_FLAG_MESSAGES.w2.ein,
                  }}
                />
              )}
              {activeTopTab === '1099-divs' && (
                <DetailFieldsDiv
                  activePayer={activeDivPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={{
                    divCollectibles: PHASE1_FLAG_MESSAGES.div.divCollectibles,
                    divNonDiv: PHASE1_FLAG_MESSAGES.div.divNonDiv,
                    fedTaxWithheld: PHASE1_FLAG_MESSAGES.div.fedTaxWithheld,
                    ordinaryDivs: PHASE1_FLAG_MESSAGES.div.ordinaryDivs,
                  }}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <DetailFields1099
                  activePayer={activeIntPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={{ taxableInterest: PHASE1_FLAG_MESSAGES.int.taxableInterest }}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <DetailFields1099R
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={{ grossDistrib: PHASE1_FLAG_MESSAGES.r.grossDistrib }}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <DetailFieldsNec
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              </div>
              </div>
            </div>

            {/* Drag handle between left panel and agent panel — only when agent open */}
            {agentView !== 'idle' && (
              <div
                className={dragStyles.handleVertical}
                onPointerDown={handleAgentDrag}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize AI panel"
              >
                <VerticalGripIcon />
              </div>
            )}

            {/* Agent panel — always mounted, width animates between 0 and agentPanelWidth */}
            <div
              className={styles.agentPanelWrapper}
              style={{
                width: agentView === 'idle' ? 0 : agentPanelWidth,
                transition: panelResizing ? 'none' : undefined,
              }}
            >
                <AgentLoadingPane
                  onClose={handleAgentClose}
                  isLoading={agentView === 'loading'}
                  showReport={agentView === 'report' || agentView === 'closing'}
                  closing={agentView === 'closing'}
                  reportContent={
                    <AgentReportPane
                      embedded
                      closing={agentView === 'closing'}
                      onClose={handleAgentClose}
                      onYoyToggle={setYoyExpanded}
                      onMarkReviewed={handleMarkReviewed}
                      reviewedFields={reviewedFields}
                      initialSubView={agentSubView}
                      onSubViewChange={(subView) => {
                        setAgentSubView(subView)
                        // Auto-select the issue field when detail pane opens
                        if (subView === 'yoyDetail') {
                          setSelectedField('wages')
                        } else {
                          setSelectedField(null)
                        }
                      }}
                      onViewW2={(fromSubView) => {
                        // Keep agentSubView as-is (yoyDetail) so orange highlight persists in doc panel
                        // Only update if explicitly provided and different
                        if (fromSubView) setAgentSubView(fromSubView)
                        setFromAgent(true)
                        setActiveIssueField('wages')
                        setSelectedField('wages')
                        // Preserve wages selection so highlight carries through to document panel
                        handleAgentClose(true)
                        setActiveTopTab('w2s')
                      }}
                      onNavigateToTab={(tab, subTab, field) => {
                        if (tab) {
                          setActiveTopTab(tab)
                          if (subTab) setActiveSubTab(subTab)
                        }
                        if (field) {
                          setSelectedField(field)
                          setActiveIssueField(field)
                        } else if (!tab) {
                          setSelectedField(null)
                          setActiveIssueField(null)
                        }
                        setFromAgent(true)
                        handleAgentClose(true)
                      }}
                      onHighlightField={(field) => {
                        setSelectedField(field)
                        setActiveIssueField(field)
                      }}
                      fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                      liveTotals={liveTotals}
                      amounts={amounts}
                      onFieldValueChange={(key, value) => {
                        if (key === 'withholding' && typeof value === 'number') {
                          updateField('withholding', { techCircle: value })
                        } else {
                          updateField(key as keyof typeof fieldValues, value as number)
                        }
                      }}
                    />
                  }
                />
            </div>
          </>
        )}
      </div>

      {/* Notes / Comments pane — page-level overlay */}
      {(notesOpen || notesClosing) && (
        <NotesPane
          notes={notes}
          onAdd={(text) => handleAddNote(text)}
          onEdit={handleEditNote}
          onClose={handleCloseNotes}
          closing={notesClosing}
        />
      )}
    </div>
  )
}
