import { useMemo, useState } from 'react'
import { ChevronDown, CircleCheck, Document } from '@design-systems/icons'
import intuitAssistSparkle from '../../assets/icons/intuit-assist-sparkle.svg'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import {
  CTA_SHOW_THINKING,
  getActiveIntelligenceIssues,
  INTELLIGENCE_NEED_ACTION_COPY,
  INTELLIGENCE_PROGRESS_ITEMS,
  INTELLIGENCE_REASONING_STEPS,
  INTELLIGENCE_REASONING_TITLE,
  INTELLIGENCE_SHELL_TITLE,
  INTELLIGENCE_SUMMARY_SECTIONS,
  intelligenceBadge,
  intelligenceCardTitle,
  intelligenceProcessingIntro,
  intelligenceResultsLead,
  LABEL_NEED_ACTION,
} from './agentIntelligenceCopy'
import { useAgentProcessingAnimation } from './useAgentProcessingAnimation'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

interface AgentReviewProcessingPaneProps {
  onViewUpdatedReturn: () => void
  onViewSourceDocuments: () => void
  onViewReturnSummary: () => void
  onGetCaughtUp: () => void
}

export default function AgentReviewProcessingPane({
  onViewUpdatedReturn,
  onViewSourceDocuments,
  onViewReturnSummary,
  onGetCaughtUp,
}: AgentReviewProcessingPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const { issues, issueCount, totalWithholding } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
  )

  const {
    phase,
    reasoningHeaderVisible,
    visibleSteps,
    reasoningExiting,
    resultsVisible,
    resultsSectionsVisible,
    activeProgressIndex,
    completedProgress,
    showSuggestionChips,
  } = useAgentProcessingAnimation()

  const showSummaryFooter = resultsSectionsVisible >= 6

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <div className={styles.lockup}>
              <img src={intuitAssistSparkle} alt="" className={styles.sparkleIcon} />
              <h1 className={styles.title}>{INTELLIGENCE_SHELL_TITLE}</h1>
            </div>

            <p className={styles.intro}>{intelligenceProcessingIntro(issueCount)}</p>

            <div className={styles.cardList}>
              {issues.map(issue => {
                const badge = intelligenceBadge(issue)
                return (
                  <article key={issue.issueKey} className={styles.card}>
                    <div className={styles.cardHeaderStatic}>
                      <span className={styles.cardTitle}>
                        {intelligenceCardTitle(issue, totalWithholding)}
                      </span>
                      <span className={`${styles.badge} ${styles[`badge_${badge.tone}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            {phase === 'reasoning' && (
              <div
                className={`${styles.reasoningBlock} ${reasoningExiting ? styles.revealOut : ''}`}
              >
                <div
                  className={`${styles.reasoningHeader} ${reasoningHeaderVisible ? styles.revealIn : styles.revealHidden}`}
                >
                  <img src={intuitAssistSparkle} alt="" className={styles.reasoningSparkle} />
                  <span className={styles.reasoningTitle}>{INTELLIGENCE_REASONING_TITLE}</span>
                </div>
                <ol className={styles.reasoningSteps}>
                  {INTELLIGENCE_REASONING_STEPS.map((step, index) => (
                    <li
                      key={step.title}
                      className={`${styles.reasoningStep} ${index < visibleSteps ? styles.revealIn : styles.revealHidden}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <span className={styles.reasoningStepTitle}>{step.title}</span>
                      <p className={styles.reasoningStepBody}>{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {resultsVisible && (
              <div className={`${styles.resultsBlock} ${styles.revealIn}`}>
                <button
                  type="button"
                  className={styles.showThinkingBtn}
                  aria-expanded={thinkingExpanded}
                  onClick={() => setThinkingExpanded(v => !v)}
                >
                  {CTA_SHOW_THINKING}
                  <ChevronDown
                    size="small"
                    className={`${styles.chevron} ${thinkingExpanded ? styles.chevronUp : ''}`}
                  />
                </button>

                {thinkingExpanded && (
                  <ol className={styles.reasoningSteps}>
                    {INTELLIGENCE_REASONING_STEPS.map((step, index) => (
                      <li
                        key={step.title}
                        className={`${styles.reasoningStep} ${styles.revealIn}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className={styles.reasoningStepTitle}>{step.title}</span>
                        <p className={styles.reasoningStepBody}>{step.body}</p>
                      </li>
                    ))}
                  </ol>
                )}

                {resultsSectionsVisible >= 1 && (
                  <p className={`${styles.resultsLead} ${styles.revealIn}`}>
                    {intelligenceResultsLead(INTELLIGENCE_SUMMARY_SECTIONS.length)}
                  </p>
                )}

                <div className={styles.summaryBox}>
                  {INTELLIGENCE_SUMMARY_SECTIONS.map((section, sectionIndex) => (
                    resultsSectionsVisible >= sectionIndex + 2 ? (
                      <div
                        key={section.title}
                        className={`${styles.summarySection} ${styles.revealIn}`}
                        style={{ animationDelay: `${sectionIndex * 100}ms` }}
                      >
                        <div className={styles.summarySectionHeader}>
                          <CircleCheck size="small" className={styles.summaryCheck} />
                          <span className={styles.summarySectionTitle}>{section.title}</span>
                        </div>
                        <ul className={styles.summaryList}>
                          {section.items.map(item => (
                            <li key={item.doc} className={styles.summaryItem}>
                              <Document size="small" className={styles.docIcon} />
                              <span className={styles.docLink}>{item.doc}</span>
                              <span className={styles.docDetail}>{item.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  ))}

                  {resultsSectionsVisible >= 5 && (
                    <div className={`${styles.needActionBox} ${styles.revealIn}`}>
                      <span className={styles.needActionBadge}>{LABEL_NEED_ACTION}</span>
                      <p className={styles.needActionText}>{INTELLIGENCE_NEED_ACTION_COPY}</p>
                    </div>
                  )}

                  {showSummaryFooter && (
                    <div className={styles.revealIn}>
                      <AgentReviewSummaryFooter
                        onViewUpdatedReturn={onViewUpdatedReturn}
                        onViewSourceDocuments={onViewSourceDocuments}
                        onPrimaryAction={onGetCaughtUp}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.progressRail} aria-label="Run progress">
            <span className={styles.progressLabel}>
              PROGRESS {completedProgress}/{INTELLIGENCE_PROGRESS_ITEMS.length}
            </span>
            <ol className={styles.progressList}>
              {INTELLIGENCE_PROGRESS_ITEMS.map((item, index) => {
                const done = index < completedProgress
                const active = index === activeProgressIndex
                return (
                  <li
                    key={item.id}
                    className={`${styles.progressItem} ${active ? styles.progressItemActive : ''}`}
                  >
                    <span
                      className={`${styles.progressDot} ${done ? styles.progressDotDone : ''} ${active ? styles.progressDotActive : ''}`}
                      aria-hidden
                    >
                      {done && <CircleCheck size="x-small" />}
                    </span>
                    <span className={done ? styles.progressItemDone : undefined}>{item.label}</span>
                  </li>
                )
              })}
            </ol>
          </aside>
        </div>
      </div>

      {showSuggestionChips && !showSummaryFooter && (
        <div className={`${styles.suggestionRow} ${styles.revealIn}`}>
          <button type="button" className={styles.suggestionChip} onClick={onGetCaughtUp}>
            Get review summary
          </button>
        </div>
      )}
    </div>
  )
}
