import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, CircleCheck, Panel } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import sendArrow from '../../assets/send-arrow.svg'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/YoYDetailPane.module.css'
interface IssueDetailPaneProps {
  issueKey: string
  dotColor: 'red' | 'blue'
  title: string
  summary: string
  taxImpact: string
  rootCause: string
  tableRows: { label: string; cols: string[]; total?: boolean; badge?: 'red' | 'orange' | 'grey' | 'green' }[]
  tableHeaders: string[]
  suggestedActions: string[]
  viewSourceLabel: string
  reviewedCount?: number
  totalItems?: number
  closing?: boolean
  reviewedFields?: Map<string, { by: string; at: string }>
  issueNumber?: number
  category?: string
  onClose?: () => void
  onBack?: () => void
  onViewSource?: () => void
  onMarkReviewed?: (fieldName: string) => void
  onPrev?: () => void
  onNext?: () => void
  totalIssues?: number
  onOpenQuestionnaire?: () => void
}

// Mock client Q&A keyed by issueKey
const CLIENT_QA: Record<string, { question: string; answer: string; date: string }> = {
  w2Box12: {
    question: 'Box 12 on your Tech Circle W-2 was not captured during import. Do you recall the code and amount?',
    answer: 'I believe it was a 401k deferral, code D. I can check my year-end pay stub for the exact amount.',
    date: 'Mar 15, 2025',
  },
  w2Ein: {
    question: 'The Employer Identification Number (EIN) on your Tech Circle W-2 was not found. Can you locate it on your physical W-2?',
    answer: 'Sure — it\'s printed in Box b on the form. I\'ll send you a clearer scan.',
    date: 'Mar 15, 2025',
  },
  divCollectibles: {
    question: 'Box 2d (collectibles gain) on your Unwavering Financial 1099-DIV appears blank. Did you sell any collectibles in 2024?',
    answer: 'No, I don\'t believe so. That box should be zero.',
    date: 'Mar 16, 2025',
  },
  divNonDiv: {
    question: 'Box 3 (nondividend distributions) on your Unwavering Financial 1099-DIV was not imported. Do you have the source document handy?',
    answer: 'I can pull it up. Give me a moment to check the original statement.',
    date: 'Mar 16, 2025',
  },
  wagesConfidence: {
    question: 'The scan of your Tech Circle W-2 Box 1 returned a lower-than-normal confidence score. Can you confirm your wages were $118,940?',
    answer: 'Yes, that\'s correct — $118,940 matches my final pay stub for the year.',
    date: 'Mar 15, 2025',
  },
  capitalGainNew: {
    question: 'You have a $194,600 capital gain this year that didn\'t appear on your prior-year return. Can you describe the asset sale?',
    answer: 'I sold some stock I\'d held for several years. Most should be long-term. I have the 1099-B from my brokerage.',
    date: 'Mar 16, 2025',
  },
}

export default function IssueDetailPane({
  issueKey,
  dotColor,
  title,
  summary,
  taxImpact,
  rootCause,
  tableRows,
  tableHeaders,
  suggestedActions,
  viewSourceLabel,
  reviewedCount = 0,
  totalItems = 5,
  closing = false,
  reviewedFields,
  issueNumber,
  category,
  onClose,
  onBack,
  onViewSource,
  onMarkReviewed,
  onPrev,
  onNext,
  totalIssues = 6,
  onOpenQuestionnaire,
}: IssueDetailPaneProps) {
  const [inputValue, setInputValue] = useState('')
  const signOff = reviewedFields?.get(issueKey)
  const isReviewed = !!signOff

  const handleMarkReviewed = () => {
    if (!isReviewed) onMarkReviewed?.(issueKey)
  }

  // Dismiss any lingering tooltips from the pane that just slid out
  useEffect(() => {
    document.querySelectorAll(':hover').forEach(el =>
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    )
  }, [])

  const dotStyle = dotColor === 'blue' ? { background: '#205ea3' } : {}

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
            <span className={styles.counter}>
              <strong className={styles.counterNum}>{reviewedCount}</strong> of {totalItems} reviewed
            </span>
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
              <span className={styles.dot} style={dotStyle} />
              <span className={styles.issueTitle} style={{ flex: 1 }}>
                {issueNumber != null && (
                  <span className={styles.issueNum}>{String(issueNumber).padStart(2, '0')} </span>
                )}
                {title}
              </span>
            </div>
            <p className={styles.summary}>{summary}</p>
          </div>

          {/* Root cause */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Root cause</p>
            <p className={styles.sectionBody}>{rootCause}</p>
          </div>

          {/* Client response */}
          {CLIENT_QA[issueKey] && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>Client response</p>
              <div className={styles.qaBlock}>
                <p className={styles.qaQuestion}>
                  <strong>Preparer asked</strong>
                  {CLIENT_QA[issueKey].question}
                </p>
                <div className={styles.qaBubble}>
                  <span className={styles.qaAvatar}>JD</span>
                  <div className={styles.qaText}>
                    <span className={styles.qaName}>Jessica Drake · {CLIENT_QA[issueKey].date}</span>
                    <p className={styles.qaAnswer}>{CLIENT_QA[issueKey].answer}</p>
                  </div>
                </div>
                <button className={styles.qaSourceLink} onClick={onOpenQuestionnaire}>
                  From Tax Organizer · <span>View all responses</span>
                </button>
              </div>
            </div>
          )}

          {/* Calculations */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Calculations</p>
            {(() => {
              const hasBadge = tableRows.some(r => r.badge)
              const colCount = tableHeaders.length - 1
              const gridCols = hasBadge
                ? `1fr repeat(${colCount - 1}, 72px) 52px`
                : `1fr repeat(${colCount}, 80px)`
              return (
                <div className={styles.tableCard}>
                  <div className={`${styles.tableRow} ${styles.tableHeaderRow}`} style={{ gridTemplateColumns: gridCols }}>
                    {tableHeaders.map((h, i) => (
                      <span key={i} className={i === 0 ? styles.cellLabel : styles.cellValue}>{h}</span>
                    ))}
                  </div>
                  {tableRows.map((row, i) => (
                    <div
                      key={row.label}
                      className={`${styles.tableRow} ${i < tableRows.length - 1 ? styles.tableRowBorder : ''} ${row.total ? styles.tableRowTotal : ''}`}
                      style={{ gridTemplateColumns: gridCols }}
                    >
                      <span className={styles.cellLabel}>{row.label}</span>
                      {row.cols.map((val, ci) => (
                        <span key={ci} className={styles.cellValue}>
                          {row.badge && ci === row.cols.length - 1
                            ? <span className={`${styles.deltaBadge} ${styles[`deltaBadge${row.badge.charAt(0).toUpperCase()}${row.badge.slice(1)}`]}`}>{val}</span>
                            : val}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Suggested Action */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Suggested action</p>
            <ul className={styles.actionList}>
              {suggestedActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons + sign-off stamp */}
          <div className={styles.actionButtonsWrap}>
            <div className={styles.actionButtons}>
              <Tooltip text="Open the source document alongside the 1040 to verify or correct this value">
                <Button priority="primary" size="small" onClick={onViewSource}>
                  <Panel size="small" /> {viewSourceLabel}
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

      {/* ── Input area ── */}
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
