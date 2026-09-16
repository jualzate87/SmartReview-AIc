import { useState } from 'react'
import { ChevronDown, CircleCheck, Document } from '@design-systems/icons'
import intuitAssistSparkle from '../../assets/icons/intuit-assist-sparkle.svg'
import { STARTER_PROMPT_CATCH_UP } from './agentReviewConstants'
import { useAgentProcessingAnimation } from './useAgentProcessingAnimation'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

const PROGRESS_ITEMS = [
  { id: 'import', label: 'Import mismatches' },
  { id: 'withholding', label: 'Withholding gap' },
  { id: 'mortgage', label: 'Mortgage interest added' },
  { id: 'final', label: 'Final review items' },
] as const

const REASONING_STEPS = [
  {
    title: 'Context assessment',
    body: 'Confirming the return topics, client context, and which diagnostics need automated fixes versus CPA sign-off.',
  },
  {
    title: 'Content planning',
    body: 'Mapping each diagnostic to source documents, questionnaire answers, and the forms that need updates.',
  },
  {
    title: 'Response generation',
    body: 'Applying fixes, drafting the progress summary, and flagging anything that still needs your confirmation.',
  },
] as const

const SUMMARY_SECTIONS = [
  {
    title: 'Import mismatches fixed',
    items: [
      { doc: 'W-2 Tech Circle.pdf', detail: 'Wages $118,542 → $148,940' },
      { doc: '1099-DIV Token.pdf', detail: 'Qualified dividends corrected to match source' },
      { doc: '1099-R Meridian.pdf', detail: 'Federal withholding $0 → $30,000' },
    ],
  },
  {
    title: 'Withholding gap resolved',
    items: [
      { doc: '1099-R Meridian.pdf', detail: 'Withholding posted to return' },
      { doc: 'Form 2210', detail: 'Safe harbor recalculated' },
    ],
  },
  {
    title: 'Form 1098 mortgage interest added',
    items: [
      { doc: 'Form 1098', detail: 'Mortgage interest deduction applied to Schedule A' },
    ],
  },
] as const

const CATCH_UP_SUMMARY =
  'Since your last session: import fixes were applied on W-2 and 1099 sources, withholding was restored on the 1099-R, and Schedule A now includes estimated Form 1098 mortgage interest. One item still needs your sign-off before filing.'

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
  const [catchUpVisible, setCatchUpVisible] = useState(false)

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

  const handleGetCaughtUp = () => {
    setCatchUpVisible(true)
    onGetCaughtUp()
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <div className={styles.lockup}>
              <img src={intuitAssistSparkle} alt="" className={styles.sparkleIcon} />
              <h1 className={styles.title}>Return review by Intuit Intelligence</h1>
            </div>

            <p className={styles.intro}>
              We analyzed Jordan&apos;s 2025 return and found 4 issues to resolve. We compared
              source documents, questionnaire answers, and return inputs. Review each diagnostic
              below, then tell me how you&apos;d like to proceed.
            </p>

            <div className={styles.cardList}>
              <article className={styles.card}>
                <div className={styles.cardHeaderStatic}>
                  <span className={styles.cardTitle}>Import mismatches detected</span>
                  <span className={`${styles.badge} ${styles.badge_orange}`}>IMPORT MISMATCHES</span>
                </div>
              </article>
              <article className={styles.card}>
                <div className={styles.cardHeaderStatic}>
                  <span className={styles.cardTitle}>Import mismatches detected</span>
                  <span className={`${styles.badge} ${styles.badge_orange}`}>IMPORT MISMATCHES</span>
                </div>
              </article>
              <article className={styles.card}>
                <div className={styles.cardHeaderStatic}>
                  <span className={styles.cardTitle}>Withholding falls $72,264 short of safe harbor</span>
                  <span className={`${styles.badge} ${styles.badge_green}`}>DEDUCTIONS</span>
                </div>
              </article>
            </div>

            {phase === 'reasoning' && (
              <div
                className={`${styles.reasoningBlock} ${reasoningExiting ? styles.revealOut : ''}`}
              >
                <div
                  className={`${styles.reasoningHeader} ${reasoningHeaderVisible ? styles.revealIn : styles.revealHidden}`}
                >
                  <img src={intuitAssistSparkle} alt="" className={styles.reasoningSparkle} />
                  <span className={styles.reasoningTitle}>Response generation</span>
                </div>
                <ol className={styles.reasoningSteps}>
                  {REASONING_STEPS.map((step, index) => (
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
                  Show thinking
                  <ChevronDown
                    size="small"
                    className={`${styles.chevron} ${thinkingExpanded ? styles.chevronUp : ''}`}
                  />
                </button>

                {thinkingExpanded && (
                  <ol className={styles.reasoningSteps}>
                    {REASONING_STEPS.map((step, index) => (
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
                    I&apos;ve resolved all 3 diagnostics; here is the progress summary.
                  </p>
                )}

                <div className={styles.summaryBox}>
                  {SUMMARY_SECTIONS.map((section, sectionIndex) => (
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
                      <span className={styles.needActionBadge}>NEED ACTION</span>
                      <p className={styles.needActionText}>
                        Confirm the estimated Form 1098 mortgage interest amount against Jessica&apos;s
                        actual source certificate before filing.
                      </p>
                    </div>
                  )}

                  {resultsSectionsVisible >= 6 && (
                    <div className={`${styles.footerLinks} ${styles.revealIn}`}>
                      <button type="button" className={styles.footerLink} onClick={onViewUpdatedReturn}>
                        View updated return
                      </button>
                      <button type="button" className={styles.footerLink} onClick={onViewSourceDocuments}>
                        View source documents
                      </button>
                      <button type="button" className={styles.footerLink} onClick={onViewReturnSummary}>
                        View return summary
                      </button>
                    </div>
                  )}
                </div>

                {catchUpVisible && (
                  <div className={`${styles.catchUpCard} ${styles.revealIn}`}>
                    <p className={styles.catchUpText}>{CATCH_UP_SUMMARY}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className={styles.progressRail} aria-label="Run progress">
            <span className={styles.progressLabel}>
              PROGRESS {completedProgress}/{PROGRESS_ITEMS.length}
            </span>
            <ol className={styles.progressList}>
              {PROGRESS_ITEMS.map((item, index) => {
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

      {showSuggestionChips && (
        <div className={`${styles.suggestionRow} ${styles.revealIn}`}>
          <button type="button" className={styles.suggestionChip} onClick={handleGetCaughtUp}>
            {STARTER_PROMPT_CATCH_UP}
          </button>
        </div>
      )}
    </div>
  )
}
