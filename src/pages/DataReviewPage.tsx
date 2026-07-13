import { useState, useCallback, useRef, useEffect } from 'react'
import { ArrowLeft, DotsSix, Panel, ChevronLeft, ChevronRight, Comment, PopOut } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import NotesPane from './data-review/NotesPane'
import Tooltip from './data-review/Tooltip'
import type { Note } from './data-review/NotesPane'

function VerticalGripIcon() {
  return (
    <svg width="4" height="20" viewBox="0 0 4 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2" cy="4"  r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="10" r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="16" r="1.5" fill="#93A3AB"/>
    </svg>
  )
}
import intuitAssistIcon from '../assets/icons/intuit-assist.svg'
import LeftPanel1040 from './data-review/LeftPanel1040'
import ReviewTab from './data-review/ReviewTab'
import DocumentPreview from './data-review/DocumentPreview'
import W2FormPreview from './data-review/W2FormPreview'
import SourceDocumentList, { getActiveDocId } from './data-review/SourceDocumentList'
import type { SourceDocument } from '../data/sourceDocuments'
import SourcePanelLoader from './data-review/SourcePanelLoader'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
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
import TaxControlUnlockModal, {
  dismissTaxControlModalForSession,
  readTaxControlModalDismissed,
  resetTaxControlModalDismiss,
} from './data-review/TaxControlUnlockModal'
import {
  PHASE1_FLAG_KEYS,
  countPhase1Remaining,
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForW2Payer,
  detailTo1040Field,
  field1040ToDetail,
  get1040HighlightField,
  getNextVerifyItem,
  getTabFlagCounts,
  isPhase1FlagResolved,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import { GUIDED_ORDER, TOTAL_REVIEW_ITEMS } from './data-review/AgentReportPane'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import img1099Int from '../assets/jessica-1099-int.jpg'
import img1099R from '../assets/jessica-1099-r.png'
import img1099Nec from '../assets/jessica-1099-nec.png'
import img1099DivToken from '../assets/jessica-1099-div-token.png'
import img1099DivNorthmark from '../assets/jessica-1099-div-northmark.png'
import img1099DivBeacon from '../assets/jessica-1099-div-beacon.png'
import img1099IntHarborline from '../assets/jessica-1099-int-harborline.png'
import img1099IntCascade from '../assets/jessica-1099-int-cascade.png'
import styles from '../styles/data-review/DataReviewPage.module.css'
import dragStyles from '../styles/data-review/DragHandle.module.css'

export default function DataReviewPage() {
  // Source-doc review state — flags, reviewed fields, active tab, editable field
  // values — is shared live with the pop-out window via BroadcastChannel so the
  // two views never drift apart. See useSyncedReviewState for the sync mechanism.
  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    fieldValues, updateFieldValue,
    reviewedFields,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    toggleVerifiedDoc,
  } = useSyncedReviewState()
  const total1a = wages.techCircle
  // W-2 Box 2 is blank for Tech Circle — all federal withholding on this return
  // comes from the 1099-DIV (Box 4, Token Financial), which flows to 1040 line 25b.
  const DIV_WITHHOLDING = 24925
  const totalWithholding = fieldValues.withholding.techCircle + DIV_WITHHOLDING
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)
  // Left panel width in px when idle (950px default); as % when agent open
  const [leftWidth, setLeftWidth] = useState(50)
  // Agent panel width in px when open (default 588px, user-resizable)
  const [agentPanelWidth, setAgentPanelWidth] = useState(588)
  // Right panel width in px (default 700px, user-resizable)
  const [rightPanelWidth, setRightPanelWidth] = useState(920)
  // Top/bottom section height ratio in right panel (0-100, where value = preview percentage)
  const [previewHeight, setPreviewHeight] = useState(40)
  // Whether right panel is popped out
  const [poppedOut, setPoppedOut] = useState(false)
  // Whether the right document panel is visible (toggle with Panel button)
  const [rightPanelVisible, setRightPanelVisible] = useState(true)
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
  // Set of 1040 field names manually checked off by the preparer (independent of AI review)
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set())
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
  // Phase 1: whether the 1040 panel is expanded (minimized by default in import phase)
  const [show1040, setShow1040] = useState(false)
  // Tax control unlock modal — page-level so it fires even when 1040 is collapsed
  const [showTaxControlModal, setShowTaxControlModal] = useState(false)
  const [taxModalDismissed, setTaxModalDismissed] = useState(readTaxControlModalDismissed)
  const [taxControlViewRequest, setTaxControlViewRequest] = useState(0)
  const prevPhase1Complete = useRef(false)

  // The import/OCR flags owned by Phase 1. Each key matches the reviewed-field key
  // emitted by the DetailFields "Edit+Save" / "Mark as correct" controls.
  const phase1Total = PHASE1_FLAG_KEYS.length
  const phase1Resolved = PHASE1_FLAG_KEYS.filter(k => isPhase1FlagResolved(k, reviewedFields)).length
  // Counter of unresolved import flags — never below 0
  const phase1Remaining = countPhase1Remaining(reviewedFields)
  const phase1Complete = phase1Remaining === 0
  // Per-document unresolved counts for dynamic tab badges
  const tabFlagCounts = getTabFlagCounts(reviewedFields)
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
  // Phase 2 diagnostics progress — same GUIDED_ORDER/TOTAL_REVIEW_ITEMS AgentReportPane uses,
  // imported rather than duplicated so the two banners can't drift out of sync.
  const phase2Reviewed = GUIDED_ORDER.filter(k => reviewedFields.has(k)).length
  const phase2Complete = phase2Reviewed >= TOTAL_REVIEW_ITEMS
  // ---------------------------------------------------------------------------

  const handleToggleChecked = (fieldName: string) => {
    setCheckedFields(prev => {
      const next = new Set(prev)
      if (next.has(fieldName)) next.delete(fieldName)
      else next.add(fieldName)
      return next
    })
  }
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
    if (detailTo1040Field(field)) setShow1040(true)
  }, [setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField])

  const handleVerifyNext = useCallback(() => {
    const next = getNextVerifyItem(reviewedFields, selectedField)
    if (!next) return
    applyVerifyNavigation(next.field)
  }, [reviewedFields, selectedField, applyVerifyNavigation])

  const handleFieldSelect = useCallback((field: string | null) => {
    setSelectedField(field)
    if (phase === 'import' && field && detailTo1040Field(field)) {
      setShow1040(true)
    }
  }, [phase, setSelectedField])

  const handleOpenTaxControl = useCallback(() => {
    setShow1040(true)
    setTaxControlViewRequest(n => n + 1)
  }, [])

  const dismissTaxControlModal = useCallback(() => {
    setShowTaxControlModal(false)
    setTaxModalDismissed(true)
    dismissTaxControlModalForSession()
  }, [])

  // Show tax control unlock modal the instant Phase 1 flags hit zero (false → true).
  useEffect(() => {
    if (phase !== 'import') {
      setShowTaxControlModal(false)
      return
    }

    if (!phase1Complete) {
      prevPhase1Complete.current = false
      setTaxModalDismissed(false)
      setShowTaxControlModal(false)
      resetTaxControlModalDismiss()
      return
    }

    const justCompleted = !prevPhase1Complete.current
    prevPhase1Complete.current = true
    if (justCompleted && !taxModalDismissed) {
      setShowTaxControlModal(true)
    }
  }, [phase, phase1Complete, taxModalDismissed])

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

  const sourcePanelLoadKey = `${activeTopTab}-${activeSubTab}-${activeDivPayer}-${activeIntPayer}-${rightPanelVisible}`

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
    setShow1040(false)
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
          setTimeout(() => setRightPanelAnimating(false), 420)
        })
      })
    }, 350)
  }

  const PREPARER_NAME = 'Juan Alzate'

  const handleOpenNotes = () => setNotesOpen(true)
  const handleCloseNotes = () => {
    setNotesClosing(true)
    setTimeout(() => { setNotesOpen(false); setNotesClosing(false) }, 200)
  }
  const handleAddNote = (text: string, context?: string) => {
    const now = new Date()
    const at = now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    setNotes(prev => [...prev, { id: `note-${Date.now()}`, text, author: PREPARER_NAME, at, context }])
    setNotesOpen(true)
  }

  const bodyRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Horizontal drag (left/right resize)
  const handleHorizontalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const body = bodyRef.current
    if (!body) return

    const startX = e.clientX
    const startWidth = leftWidth

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const bodyWidth = body.getBoundingClientRect().width
      const newWidth = startWidth + (delta / bodyWidth) * 100
      setLeftWidth(Math.max(20, Math.min(80, newWidth)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [leftWidth])

  // Horizontal drag between left panel and agent panel (resizes agent panel px width)
  const handleAgentDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = agentPanelWidth
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX // dragging left = wider agent panel
      const bodyWidth = body.getBoundingClientRect().width
      const newWidth = Math.max(360, Math.min(bodyWidth * 0.7, startPanelWidth + delta))
      setAgentPanelWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [agentPanelWidth])

  // Horizontal drag between left panel and right panel (resizes rightPanelWidth)
  const handleRightPanelDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = rightPanelWidth
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX // dragging left = wider right panel
      const bodyWidth = body.getBoundingClientRect().width
      const newWidth = Math.max(400, Math.min(bodyWidth * 0.75, startPanelWidth + delta))
      setRightPanelWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [rightPanelWidth])

  // Resize drag between the document preview and detail fields. Side by side
  // (like the pop-out window) when the 1040 is collapsed and there's room; when
  // the 1040 is expanded, the pair stacks vertically instead so the source
  // document isn't squeezed into a narrow column — same drag handle, same
  // previewHeight value, just measuring along the other axis.
  const handlePreviewDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const right = rightRef.current
    if (!right) return

    const stacked = show1040
    const startPos = stacked ? e.clientY : e.clientX
    const startSize = previewHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      const pos = stacked ? moveEvent.clientY : moveEvent.clientX
      const delta = pos - startPos
      const rect = right.getBoundingClientRect()
      const rightSize = stacked ? rect.height : rect.width
      const newSize = startSize + (delta / rightSize) * 100
      setPreviewHeight(Math.max(20, Math.min(75, newSize)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = stacked ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [previewHeight, show1040])

  // ProtoC: welcome/orientation screen is the entry point (no header chrome)
  if (phase === 'welcome') {
    return (
      <div className={styles.page}>
        <WelcomePane
          clientName="Jessica Drake"
          flagCount={phase1Total}
          onBegin={() => setPhase('import')}
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
                // Slide out first, then hide
                setRightPanelExiting(true)
                setTimeout(() => {
                  setRightPanelExiting(false)
                  setRightPanelVisible(false)
                }, 280)
              } else {
                // Show with slide-in
                setRightPanelVisible(true)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  setRightPanelAnimating(true)
                  setTimeout(() => setRightPanelAnimating(false), 350)
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
        />
      )}

      {/* ProtoC Phase 2 — AI Diagnostics banner. Shares Phase1Banner's visual language
          (Intuit Assist icon, title/subtitle, progress) so both phases feel like one
          continuous guided experience rather than two disconnected screens. */}
      {!inImportPhase && (
        <Phase2Banner
          reviewed={phase2Reviewed}
          total={TOTAL_REVIEW_ITEMS}
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
              <span className={styles.form1040HandleLabel}>Show 1040</span>
            </button>
          </div>
        )}
        <div
          className={styles.leftPanel}
          style={{
            flex: (inImportPhase && !show1040) ? '0 0 0px' : 1,
            width: (inImportPhase && !show1040) ? 0 : undefined,
            opacity: (inImportPhase && !show1040) ? 0 : 1,
            minWidth: 0,
          }}
        >
          {inImportPhase && (
            <button className={styles.form1040HideBtn} onClick={() => setShow1040(false)} aria-label="Hide 1040">
              <ChevronLeft size="small" /> <span>Hide 1040</span>
            </button>
          )}
          <LeftPanel1040
            selectedField={selectedField}
            highlightField={highlightField1040}
            onFieldClick={inImportPhase ? handle1040FieldClick : setSelectedField}
            total1a={total1a}
            wages={wages}
            yoyExpanded={yoyExpanded || agentSubView === 'yoyDetail' || activeTopTab === 'prior-1040' || phase === 'diagnostics'}
            reviewedFields={reviewedFields}
            checkedFields={checkedFields}
            onToggleChecked={handleToggleChecked}
            issueField={issueField}
            fieldValues={{ ...fieldValues, withholding: totalWithholding }}
            allFlagsCleared={phase1Complete}
            taxControlViewRequest={taxControlViewRequest}
            onAddFieldNote={(text, context) => handleAddNote(text, context)}
            onViewSource={(fieldName, sourceLabel) => {
              // Map field → document tab
              const tabMap: Record<string, typeof activeTopTab> = {
                wages:           'w2s',
                w2Withholding:   'w2s',
                withholding:     'w2s',
                taxableInterest: '1099-ints',
                qualifiedDivs:   '1099-divs',
                ordinaryDivs:    '1099-divs',
                withholding1099: '1099-divs',
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

              if (agentView !== 'idle') {
                // Agent is open — close it preserving the field selection
                setFromAgent(true)
                setAgentSubView('overview')
                handleAgentClose(true)
              } else if (!rightPanelVisible) {
                // Agent idle, panel hidden — slide it in
                setRightPanelVisible(true)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  setRightPanelAnimating(true)
                  setTimeout(() => setRightPanelAnimating(false), 350)
                }))
              }
            }}
          />
        </div>

        {!poppedOut && (
          <>
            {/* Left/right drag handle — hidden when the 1040 is collapsed (nothing to drag
                against) or when the right panel/agent isn't visible */}
            {agentView === 'idle' && rightPanelVisible && !rightPanelExiting && !(inImportPhase && !show1040) && (
              <div className={dragStyles.handleVertical} onMouseDown={handleRightPanelDrag}>
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
                flex: (inImportPhase && !show1040 && rightPanelVisible) ? '1 1 0%' : '0 0 auto',
                overflow: 'hidden',
                opacity: (agentView === 'loading' || agentView === 'report' || agentView === 'closing' || (!rightPanelVisible && !rightPanelExiting)) ? 0 : 1,
              }}
            >
              {/* Source panel header — always visible, pop-out on right */}
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
                <Tooltip text="Open in new window" placement="bottom">
                  <button
                    className={styles.agentPopOutBtn}
                    aria-label="Open in new window"
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
                    <PopOut size="medium" />
                  </button>
                </Tooltip>
              </div>
              {inImportPhase && phase1Remaining > 0 && (
                <Phase1IssueBanner unresolvedCount={phase1Remaining} onVerify={handleVerifyNext} />
              )}
              <ReviewTab
                activeTopTab={activeTopTab}
                flagCounts={inImportPhase ? tabFlagCounts : undefined}
                onTopTabChange={(tab) => {
                  setActiveTopTab(tab)
                  setFromAgent(false)
                  setSelectedField(null)
                  setActiveIssueField(null)
                }}
              />

              <SourceDocumentList
                activeDocId={getActiveDocId(activeTopTab, activeSubTab, activeDivPayer, activeIntPayer)}
                onSelectDoc={(doc: SourceDocument) => {
                  setActiveTopTab(doc.tab)
                  if (doc.tab === 'w2s' && doc.subTab) setActiveSubTab(doc.subTab as W2Employer)
                  if (doc.tab === '1099-divs' && doc.subTab) setActiveDivPayer(doc.subTab as DivPayer)
                  if (doc.tab === '1099-ints' && doc.subTab) setActiveIntPayer(doc.subTab as IntPayer)
                  setFromAgent(false)
                  setSelectedField(null)
                  setActiveIssueField(null)
                }}
              />

              {/* Peel tabs — payer switcher for multi-payer doc types */}
              {activeTopTab === '1099-divs' && (
                <PeelTab
                  tabs={DIV_PAYER_TABS.map(t => ({ ...t, badge: divPayerFieldCounts[t.key] }))}
                  activeKey={activeDivPayer}
                  onChange={key => setActiveDivPayer(key as DivPayer)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <PeelTab
                  tabs={INT_PAYER_TABS.map(t => ({ ...t, badge: intPayerFieldCounts[t.key] }))}
                  activeKey={activeIntPayer}
                  onChange={key => setActiveIntPayer(key as IntPayer)}
                />
              )}
              {activeTopTab === 'w2s' && (
                <PeelTab
                  tabs={W2_PAYER_TABS.map(t => ({ ...t, badge: w2PayerFieldCounts[t.key] }))}
                  activeKey={activeSubTab}
                  onChange={key => setActiveSubTab(key as W2Employer)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <PeelTab
                  tabs={R_PAYER_TABS.map(t => ({ ...t, badge: 0 }))}
                  activeKey="meridian"
                  onChange={() => {}}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <PeelTab
                  tabs={NEC_PAYER_TABS.map(t => ({ ...t, badge: 0 }))}
                  activeKey="summit"
                  onChange={() => {}}
                />
              )}

              {/* Document preview (left) + detail fields (right) — same side-by-side
                 layout as the pop-out window, so docking back and forth doesn't
                 reflow the content the CPA is looking at. */}
              <SourcePanelLoader loadKey={sourcePanelLoadKey} layout={show1040 ? 'column' : 'row'}>
              <div style={show1040
                ? { height: `${previewHeight}%`, flexShrink: 0, overflow: 'hidden', borderBottom: '1px solid #D5DEE3', display: 'flex', flexDirection: 'column', minHeight: 0 }
                : { width: `${previewHeight}%`, flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #D5DEE3', display: 'flex', flexDirection: 'column', minHeight: 0 }
              }>
                <DocumentPreview
                  customContent={
                    activeTopTab === 'w2s' && activeSubTab === 'techCircle'
                      ? <W2FormPreview />
                      : undefined
                  }
                  imageSrc={
                    activeTopTab === 'w2s' && activeSubTab === 'techCircle' ? undefined :
                    activeTopTab === 'prior-1040' ? [img1040PriorPage1, img1040PriorPage2] :
                    activeTopTab === '1099-ints'  ? (
                      activeIntPayer === 'harborlineCredit' ? img1099IntHarborline :
                      activeIntPayer === 'cascadeFederal'   ? img1099IntCascade :
                      img1099Int
                    ) :
                    activeTopTab === '1099-divs'  ? (
                      activeDivPayer === 'northmarkIndex' ? img1099DivNorthmark :
                      activeDivPayer === 'beaconDividend' ? img1099DivBeacon :
                      img1099DivToken
                    ) :
                    activeTopTab === '1099-rs'    ? img1099R :
                    activeTopTab === '1099-necs'  ? img1099Nec :
                    w2TechCircle
                  }
                  alt={
                    activeTopTab === 'prior-1040' ? 'Form 1040 (2024) — Jessica Drake' :
                    activeTopTab === '1099-ints'  ? `1099-INT ${activeIntPayer}` :
                    activeTopTab === '1099-divs'  ? `1099-DIV ${activeDivPayer}` :
                    activeTopTab === '1099-rs'    ? '1099-R Meridian Retirement Trust' :
                    activeTopTab === '1099-necs'  ? '1099-NEC Summit Advisory Partners' :
                    activeTopTab === 'w2s'        ? `W-2 ${W2_PAYER_TABS.find(t => t.key === activeSubTab)?.label ?? 'Tech Circle'}` :
                    'W-2 Tech Circle'
                  }
                />
              </div>

              {/* Drag handle — vertical (col-resize) side by side, horizontal (row-resize) stacked */}
              <div className={show1040 ? dragStyles.handleHorizontal : dragStyles.handleVertical} onMouseDown={handlePreviewDrag}>
                <DotsSix size="small" className={`${dragStyles.handleIcon} ${show1040 ? dragStyles.rotated90 : ''}`} />
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
                  onWageChange={(employer, value) => setWages({ ...wages, [employer]: value })}
                  fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                  onFieldValueChange={(key, value) => {
                    if (key === 'withholding' && typeof value === 'number') {
                      updateField('withholding', { techCircle: value })
                    } else {
                      updateField(key as keyof typeof fieldValues, value as number)
                    }
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={{
                    ssn: 'Employee SSN not imported — required for e-filing. Enter manually.',
                    wages: 'Low confidence (72%): wages may be misread. Source W-2 Box 1 shows $148,940 but return has $118,940.',
                    sswages: 'Medium confidence (82%): social security wages differ from Box 1. Source W-2 shows $148,940 in Box 3 vs. $118,940 on the return.',
                    box12: 'Box 12 not imported — enter code and amount manually from source W-2.',
                    ein:   'Employer EIN not found in document — required for e-filing. Enter manually.',
                  }}
                />
              )}
              {activeTopTab === '1099-divs' && <DetailFieldsDiv activePayer={activeDivPayer} selectedField={selectedField} highlightMode={highlightMode} onFieldSelect={handleFieldSelect} fieldValues={{ ...fieldValues, withholding: totalWithholding }} onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} verifiedDocs={verifiedDocs} onVerifyDoc={toggleVerifiedDoc} flaggedFields={{ divCollectibles: 'Collectibles (28%) gain not imported. Review source document and enter if applicable.', divNonDiv: 'Nondividend distributions not imported. Review source document and enter if applicable.', fedTaxWithheld: 'Low confidence (68%): federal withholding may be misread. Source shows $26,363 but return has $24,925. Verify Box 4 against source 1099-DIV.' }} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === '1099-ints' && <DetailFields1099 activePayer={activeIntPayer} selectedField={selectedField} highlightMode={highlightMode} onFieldSelect={handleFieldSelect} fieldValues={{ ...fieldValues, withholding: totalWithholding }} onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} verifiedDocs={verifiedDocs} onVerifyDoc={toggleVerifiedDoc} flaggedFields={{ taxableInterest: 'Low confidence (72%) — interest income may be misread. Verify Box 1 against source 1099-INT.' }} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === '1099-rs' && <DetailFields1099R selectedField={selectedField} highlightMode={highlightMode} onFieldSelect={handleFieldSelect} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} verifiedDocs={verifiedDocs} onVerifyDoc={toggleVerifiedDoc} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === '1099-necs' && <DetailFieldsNec selectedField={selectedField} onFieldSelect={handleFieldSelect} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} verifiedDocs={verifiedDocs} onVerifyDoc={toggleVerifiedDoc} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              </div>
              </SourcePanelLoader>
            </div>

            {/* Drag handle between left panel and agent panel — only when agent open */}
            {agentView !== 'idle' && (
              <div className={dragStyles.handleVertical} onMouseDown={handleAgentDrag}>
                <VerticalGripIcon />
              </div>
            )}

            {/* Agent panel — always mounted, width animates between 0 and agentPanelWidth */}
            <div
              className={styles.agentPanelWrapper}
              style={{
                width: agentView === 'idle' ? 0 : agentPanelWidth,
              }}
            >
                <AgentLoadingPane
                  onClose={handleAgentClose}
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
          onClose={handleCloseNotes}
          closing={notesClosing}
        />
      )}

      {/* Tax control unlock — page-level so it appears even when 1040 is collapsed */}
      {inImportPhase && (
        <TaxControlUnlockModal
          open={showTaxControlModal}
          onClose={dismissTaxControlModal}
          onCheckTotals={handleOpenTaxControl}
        />
      )}
    </div>
  )
}
