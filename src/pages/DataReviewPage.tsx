import { useState, useCallback, useRef, useEffect } from 'react'
import { ArrowLeft, DotsSix, Panel, ChevronLeft, ChevronRight, Comment, PopOut } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import NotesPane from './data-review/NotesPane'
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
import DetailFields from './data-review/DetailFields'
import DetailFields1099 from './data-review/DetailFields1099'
import DetailFieldsDiv from './data-review/DetailFieldsDiv'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import AgentReportPane from './data-review/AgentReportPane'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import WelcomePane from './data-review/WelcomePane'
import Phase1Banner from './data-review/Phase1Banner'
import Phase2Banner from './data-review/Phase2Banner'
import QuestionnairePane from './data-review/QuestionnairePane'
import { GUIDED_ORDER, TOTAL_REVIEW_ITEMS } from './data-review/AgentReportPane'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1040Prior from '../assets/jessica-1040-2024.png'
import img1099Int from '../assets/jessica-1099-int.jpg'
import img1099Div from '../assets/jessica-1099-div.jpg'
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
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
  } = useSyncedReviewState()
  const total1a = wages.techCircle
  const totalWithholding = fieldValues.withholding.techCircle
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)
  // Left panel width in px when idle (950px default); as % when agent open
  const [leftWidth, setLeftWidth] = useState(50)
  // Agent panel width in px when open (default 588px, user-resizable)
  const [agentPanelWidth, setAgentPanelWidth] = useState(588)
  // Right panel width in px (default 700px, user-resizable)
  const [rightPanelWidth, setRightPanelWidth] = useState(700)
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

  // The import/OCR flags owned by Phase 1. Each key matches the reviewed-field key
  // emitted by the DetailFields "Edit+Save" / "Mark as correct" controls.
  // Federal withholding ($15,840 on $118,940 wages, ~13.3%) is not actually low —
  // it is not flagged.
  const PHASE1_FLAG_KEYS = ['wages-techCircle', 'box12', 'ein-techCircle', 'divCollectibles', 'divNonDiv'] as const
  const phase1Total = PHASE1_FLAG_KEYS.length
  const phase1Resolved = PHASE1_FLAG_KEYS.filter(k => reviewedFields.has(k)).length
  // Counter of unresolved import flags — never below 0
  const phase1Remaining = Math.max(0, phase1Total - phase1Resolved)
  const phase1Complete = phase1Remaining === 0
  // Per-document unresolved counts for dynamic tab badges
  const tabFlagCounts: Record<string, number> = {
    w2s:          ['wages-techCircle', 'box12', 'ein-techCircle'].filter(k => !reviewedFields.has(k)).length,
    '1099-divs':  ['divCollectibles', 'divNonDiv'].filter(k => !reviewedFields.has(k)).length,
    '1099-ints':  0,
    'prior-1040': 0,
  }
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
  // — set whenever an issue detail pane is open (in agent panel or after navigating away)
  const issueField = (() => {
    // Agent panel open and an issue was highlighted via onHighlightField
    if (activeIssueField && (agentView === 'report' || agentView === 'closing' || fromAgent)) {
      return DOC_FIELD_TO_1040[activeIssueField] ?? activeIssueField
    }
    // Agent is open and showing the YoY detail (wages issue)
    if (agentSubView === 'yoyDetail' && (agentView === 'report' || agentView === 'closing')) return 'wages'
    return null
  })()
  const highlightMode: 'orange' | 'blue' = (selectedField && (selectedField === issueField || DOC_FIELD_TO_1040[selectedField] === issueField)) ? 'orange' : 'blue'

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

  // Horizontal drag (left/right resize between the document preview and detail
  // fields, now that they sit side by side like the pop-out window)
  const handlePreviewDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const right = rightRef.current
    if (!right) return

    const startX = e.clientX
    const startWidth = previewHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const rightWidth = right.getBoundingClientRect().width
      const newWidth = startWidth + (delta / rightWidth) * 100
      setPreviewHeight(Math.max(20, Math.min(75, newWidth)))
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
  }, [previewHeight])

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
          remaining={phase1Remaining}
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
            onFieldClick={setSelectedField}
            total1a={total1a}
            wages={wages}
            yoyExpanded={yoyExpanded || agentSubView === 'yoyDetail' || activeTopTab === 'prior-1040'}
            reviewedFields={reviewedFields}
            checkedFields={checkedFields}
            onToggleChecked={handleToggleChecked}
            issueField={issueField}
            fieldValues={{ ...fieldValues, withholding: totalWithholding }}
            onAddFieldNote={(text, context) => handleAddNote(text, context)}
            onViewSource={(fieldName, sourceLabel) => {
              // Map field → document tab
              const tabMap: Record<string, typeof activeTopTab> = {
                wages:           'w2s',
                withholding:     'w2s',
                taxableInterest: '1099-ints',
                qualifiedDivs:   '1099-divs',
                ordinaryDivs:    '1099-divs',
                capitalGain:     'w2s',
                stdDeduction:    'w2s',
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
                <button
                  className={styles.agentPopOutBtn}
                  aria-label="Pop out to new window"
                  onClick={() => {
                    setPoppedOut(true)
                    const popoutWindow = window.open(
                      `${window.location.origin}${window.location.pathname}#/data-review-popout`,
                      '_blank',
                      'width=800,height=900'
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
              </div>
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

              {/* Questionnaire — Q&A organizer, no scanned document to preview.
                  Occupies the full right-panel body instead of the preview/detail-fields split. */}
              {activeTopTab === 'questionnaire' ? (
                <QuestionnairePane variant="tab" />
              ) : (
              /* Document preview (left) + detail fields (right) — same side-by-side
                 layout as the pop-out window, so docking back and forth doesn't
                 reflow the content the CPA is looking at. */
              <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ width: `${previewHeight}%`, flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #D5DEE3' }}>
                <DocumentPreview
                  imageSrc={
                    activeTopTab === 'prior-1040' ? img1040Prior :
                    activeTopTab === '1099-ints'  ? img1099Int :
                    activeTopTab === '1099-divs'  ? img1099Div :
                    w2TechCircle
                  }
                  alt={
                    activeTopTab === 'prior-1040' ? 'Form 1040 (2024) — Jessica Drake' :
                    activeTopTab === '1099-ints'  ? '1099-INT Unwavering Financial' :
                    activeTopTab === '1099-divs'  ? '1099-DIV Unwavering Financial' :
                    'W-2 Tech Circle'
                  }
                />
              </div>

              {/* Left/right drag handle */}
              <div className={dragStyles.handleVertical} onMouseDown={handlePreviewDrag}>
                <DotsSix size="small" className={dragStyles.handleIcon} />
              </div>

              {/* Detail fields — switches based on active tab */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {activeTopTab === 'w2s' && (
                <DetailFields
                  formTitle="Details: Wages, Salaries, Tips (W-2)"
                  tabs={[
                    { label: 'Tech Circle', active: true },
                  ]}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={setSelectedField}
                  activeSubTab={activeSubTab}
                  onSubTabChange={(tab) => setActiveSubTab(tab as 'techCircle')}
                  wages={{ techCircle: wages.techCircle }}
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
                  flaggedFields={{
                    wages: 'Wages may have been misread — verify Box 1 against the source W-2.',
                    box12: 'Box 12 was not imported — enter the code and amount manually from the source W-2.',
                    ein:   'Employer EIN was not found in the document — required for e-filing. Enter it manually.',
                  }}
                />
              )}
              {activeTopTab === '1099-divs' && <DetailFieldsDiv selectedField={selectedField} highlightMode={highlightMode} onFieldSelect={setSelectedField} fieldValues={{ ...fieldValues, withholding: totalWithholding }} onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} flaggedFields={{ 'divCollectibles': 'Collectibles (28%) gain not imported — review source document and enter if applicable.', 'divNonDiv': 'Nondividend distributions not imported — review source document and enter if applicable.' }} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === '1099-ints' && <DetailFields1099 selectedField={selectedField} highlightMode={highlightMode} onFieldSelect={setSelectedField} fieldValues={{ ...fieldValues, withholding: totalWithholding }} onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)} onMarkReviewed={handleMarkReviewed} onMarkReviewedBulk={handleMarkReviewedBulk} reviewedFields={reviewedFields} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} onAddFieldNote={(text, context) => handleAddNote(text, context)} />}
              </div>
              </div>
              )}
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
                        // Navigate to the source document, optionally highlighting a specific field
                        setActiveTopTab(tab)
                        if (subTab) setActiveSubTab(subTab)
                        if (field) {
                          setSelectedField(field)
                          setActiveIssueField(field)
                        } else {
                          setSelectedField(null)
                          setActiveIssueField(null)
                        }
                        setFromAgent(true)
                        handleAgentClose(true)
                      }}
                      onHighlightField={(field) => {
                        // Highlight the 1040 field without leaving the agent panel
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
    </div>
  )
}
