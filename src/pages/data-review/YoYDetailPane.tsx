import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, CircleCheck, Panel } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import sendArrow from '../../assets/send-arrow.svg'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/YoYDetailPane.module.css'

interface YoYDetailPaneProps {
  onClose?: () => void
  onBack?: () => void
  onViewW2?: () => void
  onReviewSource?: () => void
  onMarkReviewed?: (fieldName: string) => void
  reviewedCount?: number
  totalItems?: number
  closing?: boolean
  /** Set of reviewed field names — used to persist reviewed state across remounts */
  reviewedFields?: Map<string, { by: string; at: string }>
  issueNumber?: number
  category?: string
  onPrev?: () => void
  onNext?: () => void
  totalIssues?: number
  onOpenQuestionnaire?: () => void
}

const TABLE_ROWS = [
  { label: 'Tech Circle',    y2024: '$118,940', y2023: '$105,000', diff: '+$13,940', pct: '+13%', badge: 'orange' as const, total: false },
  { label: 'Wages total',    y2024: '$118,940', y2023: '$105,000', diff: '+$13,940', pct: '+13%', badge: 'orange' as const, total: true  },
]

// The 1040 field this finding maps to
const FINDING_FIELD = 'wages'

// Client Q&A for the wages YoY finding
const WAGES_QA = {
  question: 'Your W-2 wages were $118,940 this year vs. $105,000 last year. Can you confirm this reflects a full year at Tech Circle?',
  answer: 'Yes — I was at Tech Circle all year. The increase reflects my annual raise. I\'ve uploaded the W-2.',
  date: 'Mar 15, 2025',
}

export default function YoYDetailPane({ onClose, onBack, onViewW2, onReviewSource, onMarkReviewed, reviewedCount = 0, totalItems = 8, closing = false, reviewedFields, issueNumber, category, onPrev, onNext, totalIssues = 6, onOpenQuestionnaire }: YoYDetailPaneProps) {
  const [inputValue, setInputValue] = useState('')
  // Derive reviewed state from parent set so it survives remounts
  const signOff = reviewedFields?.get(FINDING_FIELD)
  const isReviewed = !!signOff

  const handleMarkReviewed = () => {
    if (!isReviewed) {
      onMarkReviewed?.(FINDING_FIELD)
    }
  }

  // Dismiss any lingering tooltips from the pane that just slid out
  useEffect(() => {
    document.querySelectorAll(':hover').forEach(el =>
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    )
  }, [])

  return (
    <div className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}>

      {/* ── Sticky nav (outside scroll area) ── */}
      <div className={styles.stickyNav}>
        <div className={styles.navRow}>
          <button className={styles.backLink} onClick={onBack}>
            <ChevronLeft size="small" />
            <span>Back to overview</span>
          </button>
          <div className={styles.navProgress}>
            <div className={styles.miniProgressTrack}>
              <div
                className={styles.miniProgressFill}
                style={{ width: `${Math.max(reviewedCount / totalItems * 100, reviewedCount > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className={styles.counter}><strong className={styles.counterNum}>{reviewedCount}</strong> of {totalItems} reviewed</span>
          </div>
        </div>
        {(onPrev !== undefined || onNext !== undefined || issueNumber != null) && (
          <div className={styles.issueNavBar}>
            <button className={styles.issueNavBtn} onClick={onPrev} disabled={!onPrev} aria-label="Previous issue">
              <ChevronLeft size="small" /> Previous issue
            </button>
            {issueNumber != null && (
              <span className={styles.issueNavCounter}>Issue {issueNumber} of {totalIssues}</span>
            )}
            <button className={styles.issueNavBtn} onClick={onNext} disabled={!onNext} aria-label="Next issue">
              Next issue <ChevronRight size="small" />
            </button>
          </div>
        )}
      </div>

      {/* ── Scrollable pane ── */}
      <div className={styles.pane}>
        <div className={styles.chat}>

          {/* Issue subheader */}
          <div className={styles.issueHero}>
            {category && <span className={styles.categoryChip}>{category}</span>}
            <div className={styles.titleRow}>
              <span className={styles.dot} />
              <span className={styles.issueTitle} style={{ flex: 1 }}>
                {issueNumber != null && (
                  <span className={styles.issueNum}>{String(issueNumber).padStart(2, '0')} </span>
                )}
                W-2 wages up 13% year-over-year
              </span>
            </div>
            <p className={styles.summary}>Tech Circle wages are $118,940 — up $13,940 (+13%) vs. prior year ($105,000).</p>
          </div>

          {/* Root cause */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Root cause</p>
            <p className={styles.sectionBody}>
              Tech Circle wages increased by $13,940 (+13%) year-over-year, reflecting a full year of employment and an annual raise.
            </p>
          </div>

          {/* Client response */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Client response</p>
            <div className={styles.qaBlock}>
              <p className={styles.qaQuestion}>
                <strong>Preparer asked</strong>
                {WAGES_QA.question}
              </p>
              <div className={styles.qaBubble}>
                <span className={styles.qaAvatar}>JD</span>
                <div className={styles.qaText}>
                  <span className={styles.qaName}>Jessica Drake · {WAGES_QA.date}</span>
                  <p className={styles.qaAnswer}>{WAGES_QA.answer}</p>
                </div>
              </div>
              <button className={styles.qaSourceLink} onClick={onOpenQuestionnaire}>
                From Tax Organizer · <span>View all responses</span>
              </button>
            </div>
          </div>

          {/* Calculations */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Calculations</p>
            <div className={styles.tableCard}>
              {/* Header row */}
              <div className={`${styles.tableRow} ${styles.tableHeaderRow}`}>
                <span className={styles.cellLabel} />
                <span className={styles.cellValue}>2024</span>
                <span className={styles.cellValue}>2023</span>
                <span className={styles.cellValue}>Change</span>
                <span className={styles.cellValue} />
              </div>
              {/* Data rows */}
              {TABLE_ROWS.map((row, i) => (
                <div key={row.label} className={`${styles.tableRow} ${i < TABLE_ROWS.length - 1 ? styles.tableRowBorder : ''} ${row.total ? styles.tableRowTotal : ''}`}>
                  <span className={styles.cellLabel}>{row.label}</span>
                  <span className={styles.cellValue}>{row.y2024}</span>
                  <span className={styles.cellValue}>{row.y2023}</span>
                  <span className={styles.cellValue}>{row.diff}</span>
                  <span className={styles.cellValue}>
                    <span className={`${styles.deltaBadge} ${styles[`deltaBadge${row.badge.charAt(0).toUpperCase()}${row.badge.slice(1)}`]}`}>{row.pct}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Action */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Suggested action</p>
            <ul className={styles.actionList}>
              <li>Confirm Tech Circle W-2 Box 1 shows $118,940 against the source document.</li>
              <li>Confirm with Jessica that the wage increase reflects her annual compensation.</li>
              <li>Verify no additional W-2s are missing from the import.</li>
            </ul>
          </div>

          {/* Action buttons + sign-off stamp */}
          <div className={styles.actionButtonsWrap}>
            <div className={styles.actionButtons}>
              <Tooltip text="Open the W-2 source documents to compare wages side-by-side and update any values">
                <Button priority="primary" size="small" onClick={onReviewSource ?? onViewW2}>
                  <Panel size="small" /> View source
                </Button>
              </Tooltip>
              {isReviewed ? (
                <Tooltip text="You've already marked this finding as reviewed">
                  <button className={styles.reviewedBtn} disabled>
                    <CircleCheck size="small" />
                    <span>Reviewed</span>
                  </button>
                </Tooltip>
              ) : (
                <Tooltip text="Confirm you've checked this finding. Progress is tracked automatically.">
                  <Button priority="secondary" size="small" onClick={handleMarkReviewed}>
                    <CircleCheck size="small" /> Mark as reviewed
                  </Button>
                </Tooltip>
              )}
            </div>
            {signOff && (
              <span className={styles.signOffStamp}>{signOff.by} · {signOff.at}</span>
            )}
          </div>


        </div>
      </div>

      {/* ── Input area (reused from AgentReportPane) ── */}
      <div className={styles.inputArea}>
        <div className={styles.inputFade} />
        <div className={styles.inputBox}>
          <div className={styles.inputTextField}>
            <textarea
              className={styles.textarea}
              placeholder="Ask anything"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <div className={styles.inputActionsLeft}>
              <button className={styles.attachBtn} aria-label="Attach">
                <Plus size="medium" />
              </button>
            </div>
            <div className={styles.inputActionsRight}>
              <button
                className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
                aria-label="Send"
              >
                <img src={sendArrow} alt="" className={styles.sendIcon} />
              </button>
            </div>
          </div>
        </div>
        <span className={styles.legal}>How we use generative AI</span>
      </div>

    </div>
  )
}
