import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, Panel, Document } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import brandBallsIcon from '../../assets/icons/brand-balls.svg'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/YoYDetailPane.module.css'

export type IssueAction = {
  type: 'goToInput' | 'reviewSource' | 'viewClientResponse' | 'openForm'
  label: string
  /** Short note for form placeholders (e.g. not in prototype) */
  note?: string
  /** Optional per-action navigation overrides */
  tab?: string
  field?: string
  questionnaireResponseId?: string
}

/** IRS law / guidance card for See details Sources section */
export type IssueSourceCard = {
  id: string
  /** Top chip label, e.g. "IRS.gov" or "Form 8960" */
  sourceName: string
  /** Title of the law / topic */
  title: string
  /** Plain-language description of what the rule covers */
  description?: string
  /** Footer meta (e.g. "IRS.gov", "Tax Topic 501") */
  meta?: string
  /** Official IRS URL — opens in a new tab when set */
  href?: string
  /** When true: non-navigating placeholder */
  placeholder?: boolean
}

interface IssueDetailPaneProps {
  issueKey: string
  dotColor: 'red' | 'blue' | 'orange'
  title: string
  summary: string
  taxImpact: string
  rootCause: string
  tableRows: { label: string; cols: string[]; total?: boolean; badge?: 'red' | 'orange' | 'grey' | 'green' | 'blue' }[]
  tableHeaders: string[]
  suggestedActions: string[]
  /** @deprecated prefer `actions` - kept for label fallback */
  viewSourceLabel?: string
  actions?: IssueAction[]
  sources?: IssueSourceCard[]
  /** Shown when a diagnostic is based on Tax Organizer Q&A */
  clientResponseNote?: string
  reviewedCount?: number
  totalItems?: number
  closing?: boolean
  reviewedFields?: Map<string, { by: string; at: string }>
  issueNumber?: number
  category?: string
  onClose?: () => void
  onBack?: () => void
  onViewSource?: (action?: IssueAction) => void
  onGoToInput?: (action?: IssueAction) => void
  onViewClientResponse?: (action?: IssueAction) => void
  onOpenForm?: (action?: IssueAction) => void
  onSourceClick?: (source: IssueSourceCard) => void
  onMarkReviewed?: (fieldName: string) => void
  onPrev?: () => void
  onNext?: () => void
  totalIssues?: number
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
  viewSourceLabel = 'Review source',
  actions,
  sources,
  clientResponseNote,
  reviewedCount = 0,
  totalItems = 5,
  closing = false,
  reviewedFields,
  issueNumber,
  category,
  onClose: _onClose,
  onBack,
  onViewSource,
  onGoToInput,
  onViewClientResponse,
  onOpenForm,
  onSourceClick,
  onMarkReviewed,
  onPrev,
  onNext,
  totalIssues = 6,
}: IssueDetailPaneProps) {
  const [formNote, setFormNote] = useState<string | null>(null)
  const signOff = reviewedFields?.get(issueKey)
  const isReviewed = !!signOff

  const handleMarkReviewed = () => {
    if (!isReviewed) onMarkReviewed?.(issueKey)
  }

  useEffect(() => {
    document.querySelectorAll(':hover').forEach(el =>
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    )
  }, [])

  useEffect(() => {
    if (!formNote) return
    const t = setTimeout(() => setFormNote(null), 4000)
    return () => clearTimeout(t)
  }, [formNote])

  const dotStyle = dotColor === 'blue' ? { background: '#205ea3' } : dotColor === 'orange' ? { background: '#d68000' } : {}

  const resolvedActions: IssueAction[] = actions?.length
    ? actions
    : [{ type: 'reviewSource', label: viewSourceLabel }]

  const runAction = (action: IssueAction) => {
    switch (action.type) {
      case 'goToInput':
        onGoToInput?.(action)
        break
      case 'reviewSource':
        onViewSource?.(action)
        break
      case 'viewClientResponse':
        onViewClientResponse?.(action)
        break
      case 'openForm':
        setFormNote(action.note ?? 'Not available in this prototype.')
        onOpenForm?.(action)
        break
    }
  }

  return (
    <div className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}>

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

      <div className={styles.pane}>
        <div className={styles.chat}>

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

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Root cause</p>
            <p className={styles.sectionBody}>{rootCause}</p>
          </div>

          {clientResponseNote && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>Based on Tax Organizer response</p>
              <p className={styles.sectionBody}>{clientResponseNote}</p>
            </div>
          )}

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Impact</p>
            <p className={styles.sectionBody}>{taxImpact}</p>
          </div>

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

          {sources && sources.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>Sources</p>
              <div className={styles.sourcesGrid}>
                {sources.map(source => {
                  const isPlaceholder = !!source.placeholder
                  const cardClass = [
                    styles.sourceCard,
                    isPlaceholder ? styles.sourceCardPlaceholder : '',
                  ].filter(Boolean).join(' ')
                  const content = (
                    <>
                      <div className={styles.sourceCardHeader}>
                        <img src={brandBallsIcon} alt="" className={styles.sourceCardIcon} width={16} height={16} />
                        <span className={styles.sourceCardName}>{source.sourceName}</span>
                      </div>
                      <div className={styles.sourceCardCopy}>
                        <p className={styles.sourceCardTitle}>{source.title}</p>
                        {source.description && (
                          <p className={styles.sourceCardDesc}>{source.description}</p>
                        )}
                      </div>
                      {source.meta && (
                        <p className={styles.sourceCardMeta}>{source.meta}</p>
                      )}
                    </>
                  )
                  if (isPlaceholder) {
                    return (
                      <div
                        key={source.id}
                        className={cardClass}
                        role="group"
                        aria-label={`${source.sourceName}: ${source.title}. Not available in this prototype.`}
                      >
                        {content}
                      </div>
                    )
                  }
                      if (source.href) {
                    return (
                      <a
                        key={source.id}
                        className={cardClass}
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open IRS guidance: ${source.title}`}
                      >
                        {content}
                      </a>
                    )
                  }
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className={cardClass}
                      onClick={() => onSourceClick?.(source)}
                      aria-label={`Open ${source.sourceName}: ${source.title}`}
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Suggested action</p>
            <ul className={styles.actionList}>
              {suggestedActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>

          <div className={styles.actionButtonsWrap}>
            <div className={styles.actionButtons}>
              {resolvedActions.map((action, i) => {
                const primary = i === 0
                const icon =
                  action.type === 'viewClientResponse' || action.type === 'openForm'
                    ? <Document size="small" />
                    : <Panel size="small" />
                return (
                  <Tooltip key={`${action.type}-${action.label}`} text={action.note ?? action.label}>
                    <Button
                      priority={primary ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => runAction(action)}
                    >
                      {icon} {action.label}
                    </Button>
                  </Tooltip>
                )
              })}
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
            {formNote && <span className={styles.signOffStamp}>{formNote}</span>}
            {signOff && (
              <span className={styles.signOffStamp}>{signOff.by} · {signOff.at}</span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
