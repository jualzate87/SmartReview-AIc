import { useMemo, useState } from 'react'
import { ChevronDown } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistSparkle from '../../assets/icons/intuit-assist-sparkle.svg'
import { SEED_AMOUNTS } from '../../data/liveReturn'
import type { IssueCard } from '../data-review/AgentReportPane'
import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import {
  CTA_ACCEPT_ALL_FIXES,
  CTA_FIX_ISSUE,
  CTA_FIX_ONE_BY_ONE,
  CTA_VIEW_SOURCE,
  getActiveIntelligenceIssues,
  INTELLIGENCE_SHELL_TITLE,
  intelligenceBadge,
  intelligenceCardTitle,
  intelligenceIntro,
  intelligenceSuggestedFixes,
  intelligenceSummary,
  intelligenceTableHeaders,
  intelligenceTableRows,
  LABEL_SUGGESTED_NEXT_STEPS,
} from './agentIntelligenceCopy'
import tableStyles from '../../styles/data-review/YoYDetailPane.module.css'
import styles from '../../styles/agent-review/AgentReviewDiagnosticsPane.module.css'

export type DiagnosticCardId = Phase2IssueKey

interface AgentReviewDiagnosticsPaneProps {
  onFixIssue: (issueId: DiagnosticCardId) => void
  onFixIndividually: () => void
  onAcceptAll: () => void
}

function DiagnosticTable({
  issue,
  tableHeaders,
  tableRows,
}: {
  issue: IssueCard
  tableHeaders: string[]
  tableRows: IssueCard['tableRows']
}) {
  const hasBadge = tableRows.some(r => r.badge)
  const colCount = tableHeaders.length - 1
  const gridCols = hasBadge
    ? `1fr repeat(${colCount - 1}, minmax(64px, auto)) minmax(56px, auto)`
    : `1fr repeat(${colCount}, minmax(72px, auto))`

  return (
    <div className={tableStyles.tableCard}>
      <div
        className={`${tableStyles.tableRow} ${tableStyles.tableHeaderRow}`}
        style={{ gridTemplateColumns: gridCols }}
      >
        {tableHeaders.map((h, i) => (
          <span key={h} className={i === 0 ? tableStyles.cellLabel : tableStyles.cellValue}>
            {h}
          </span>
        ))}
      </div>
      {tableRows.map((row, i) => (
        <div
          key={row.label}
          className={`${tableStyles.tableRow} ${i < tableRows.length - 1 ? tableStyles.tableRowBorder : ''} ${row.total ? tableStyles.tableRowTotal : ''}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          <span className={tableStyles.cellLabel}>{row.label}</span>
          {row.cols.map((val, ci) => (
            <span key={`${row.label}-${ci}`} className={tableStyles.cellValue}>
              {row.badge && ci === row.cols.length - 1 ? (
                <span
                  className={`${tableStyles.deltaBadge} ${tableStyles[`deltaBadge${row.badge.charAt(0).toUpperCase()}${row.badge.slice(1)}`]}`}
                >
                  {val}
                </span>
              ) : val === CTA_VIEW_SOURCE ? (
                <span className={styles.viewSourceLink}>{val}</span>
              ) : (
                val
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function AgentReviewDiagnosticsPane({
  onFixIssue,
  onFixIndividually,
  onAcceptAll,
}: AgentReviewDiagnosticsPaneProps) {
  const [expandedId, setExpandedId] = useState<DiagnosticCardId | null>(null)

  const { issues, issueCount, totalWithholding, live } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
  )

  const toggleCard = (id: DiagnosticCardId) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.content}>
          <div className={styles.lockup}>
            <img src={intuitAssistSparkle} alt="" className={styles.sparkleIcon} />
            <h1 className={styles.title}>{INTELLIGENCE_SHELL_TITLE}</h1>
          </div>

          <p className={styles.intro}>{intelligenceIntro(issueCount)}</p>

          <div className={styles.cardList}>
            {issues.map(issue => {
              const isExpanded = expandedId === issue.issueKey
              const badge = intelligenceBadge(issue)
              return (
                <article
                  key={issue.issueKey}
                  className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''}`}
                >
                  <button
                    type="button"
                    className={styles.cardHeader}
                    aria-expanded={isExpanded}
                    onClick={() => toggleCard(issue.issueKey)}
                  >
                    <div className={styles.cardHeaderMain}>
                      <span className={styles.cardTitle}>
                        {intelligenceCardTitle(issue, totalWithholding)}
                      </span>
                      <span className={`${styles.badge} ${styles[`badge_${badge.tone}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <ChevronDown
                      size="small"
                      className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ''}`}
                    />
                  </button>

                  <p className={styles.cardSummary}>
                    {intelligenceSummary(issue.issueKey, live, SEED_AMOUNTS)}
                  </p>

                  {isExpanded && (
                    <div className={styles.expandedBody}>
                      <DiagnosticTable
                        issue={issue}
                        tableHeaders={intelligenceTableHeaders(issue)}
                        tableRows={intelligenceTableRows(issue)}
                      />
                      {intelligenceSuggestedFixes(issue.issueKey).length > 0 && (
                        <div className={styles.suggestedFix}>
                          <div className={styles.suggestedFixHeader}>
                            <img src={intuitAssistSparkle} alt="" className={styles.suggestedFixIcon} />
                            <span className={styles.suggestedFixTitle}>{LABEL_SUGGESTED_NEXT_STEPS}</span>
                          </div>
                          <ul className={styles.suggestedFixList}>
                            {intelligenceSuggestedFixes(issue.issueKey).map(action => (
                              <li key={action}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <Button
                      priority="primary"
                      size="small"
                      onClick={() => onFixIssue(issue.issueKey)}
                    >
                      {CTA_FIX_ISSUE}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.suggestionRow}>
        <button type="button" className={styles.suggestionChip} onClick={onAcceptAll}>
          {CTA_ACCEPT_ALL_FIXES}
        </button>
        <button type="button" className={styles.suggestionChip} onClick={onFixIndividually}>
          {CTA_FIX_ONE_BY_ONE}
        </button>
      </div>
    </div>
  )
}
