import { useMemo, useState } from 'react'
import { ChevronDown } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistSparkle from '../../assets/icons/intuit-assist-sparkle.svg'
import { computeLiveReturn, SEED_AMOUNTS } from '../../data/liveReturn'
import {
  getOutstandingImportMismatches,
  SAFE_HARBOR_2024,
} from '../data-review/phase2FlagSync'
import styles from '../../styles/agent-review/AgentReviewDiagnosticsPane.module.css'

export type DiagnosticCardId =
  | 'importMismatches'
  | 'underpaymentRisk'
  | 'necScheduleC'
  | 'niitForm8960'

interface DiagnosticCard {
  id: DiagnosticCardId
  title: string
  badge: string
  badgeTone: 'orange' | 'green' | 'blue'
  body: string
}

interface AgentReviewDiagnosticsPaneProps {
  onFixIssue: (issueId: DiagnosticCardId) => void
  onFixIndividually: () => void
  onAcceptAll: () => void
}

export default function AgentReviewDiagnosticsPane({
  onFixIssue,
  onFixIndividually,
  onAcceptAll,
}: AgentReviewDiagnosticsPaneProps) {
  const [expandedId, setExpandedId] = useState<DiagnosticCardId | null>(null)

  const cards = useMemo((): DiagnosticCard[] => {
    const live = computeLiveReturn(SEED_AMOUNTS)
    const gapCount = getOutstandingImportMismatches(SEED_AMOUNTS).length
    const shortfall = Math.max(0, SAFE_HARBOR_2024 - live.totalWithholding)

    return [
      {
        id: 'importMismatches',
        title: 'Import mismatches detected',
        badge: 'IMPORT MISMATCHES',
        badgeTone: 'orange',
        body: `${gapCount} fields don't match source documents. Some were marked correct during import without fixing amounts, and I found gaps the import missed.`,
      },
      {
        id: 'underpaymentRisk',
        title: `Withholding falls $${shortfall.toLocaleString()} short of safe harbor`,
        badge: 'DEDUCTIONS',
        badgeTone: 'green',
        body: `Combined federal withholding is $${live.totalWithholding.toLocaleString()} against $${live.totalTax.toLocaleString()} total tax. Line 26 shows $0 estimated payments.`,
      },
      {
        id: 'necScheduleC',
        title: '1099-NEC income without Schedule C or expenses',
        badge: 'COMPLIANCE',
        badgeTone: 'orange',
        body: 'Summit Advisory Partners 1099-NEC is on the return, but no Schedule C or business expenses are applied. Jessica reported deductible expenses for that work.',
      },
      {
        id: 'niitForm8960',
        title: 'Review Form 8960 — Net Investment Income Tax',
        badge: 'COMPLIANCE',
        badgeTone: 'blue',
        body: 'Investment income is substantial. Form 8960 is on the return — verify the NIIT computation matches interest and dividends.',
      },
    ]
  }, [])

  const toggleCard = (id: DiagnosticCardId) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.content}>
          <div className={styles.lockup}>
            <img src={intuitAssistSparkle} alt="" className={styles.sparkleIcon} />
            <h1 className={styles.title}>Return review by Intuit Intelligence</h1>
          </div>

          <p className={styles.intro}>
            I&apos;ve analyzed Jordan&apos;s 2025 return and found {cards.length} issues to resolve.
            I compared source documents, questionnaire answers, and return inputs. Review each
            diagnostic below, then tell me how you&apos;d like to proceed.
          </p>

          <div className={styles.cardList}>
            {cards.map(card => {
              const isExpanded = expandedId === card.id
              return (
                <article key={card.id} className={styles.card}>
                  <button
                    type="button"
                    className={styles.cardHeader}
                    aria-expanded={isExpanded}
                    onClick={() => toggleCard(card.id)}
                  >
                    <span className={styles.cardTitle}>{card.title}</span>
                    <span className={styles.cardHeaderRight}>
                      <span className={`${styles.badge} ${styles[`badge_${card.badgeTone}`]}`}>
                        {card.badge}
                      </span>
                      <ChevronDown
                        size="small"
                        className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ''}`}
                      />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={styles.cardBody}>
                      <p className={styles.cardBodyText}>{card.body}</p>
                      <div className={styles.cardActions}>
                        <Button
                          priority="primary"
                          size="small"
                          onClick={() => onFixIssue(card.id)}
                        >
                          Fix this
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.suggestionRow}>
        <button type="button" className={styles.suggestionChip} onClick={onAcceptAll}>
          Accept all four
        </button>
        <button type="button" className={styles.suggestionChip} onClick={onFixIndividually}>
          Fix each issue individually
        </button>
      </div>
    </div>
  )
}
