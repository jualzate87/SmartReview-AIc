import { useEffect, useRef } from 'react'
import DocVerifyHeaderActions from './DocVerifyHeaderActions'
import {
  QUESTIONNAIRE_DOC_KEY,
  QUESTIONNAIRE_RESPONSES,
  type QuestionnaireResponseId,
} from './questionnaireData'
import type { ActivityEntry } from '../../hooks/useSyncedReviewState'
import styles from '../../styles/data-review/QuestionnaireResponsesPanel.module.css'

interface QuestionnaireResponsesPanelProps {
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, ActivityEntry>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, ActivityEntry>
  onVerifyDoc?: (docKey: string) => void
  /** Scroll/highlight a seeded Q&A card (from Phase 2 View client response) */
  highlightResponseId?: QuestionnaireResponseId | null
}

export default function QuestionnaireResponsesPanel({
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  onVerifyDoc,
  highlightResponseId = null,
}: QuestionnaireResponsesPanelProps) {
  const cardRefs = useRef<Partial<Record<QuestionnaireResponseId, HTMLElement | null>>>({})

  useEffect(() => {
    if (!highlightResponseId) return
    const el = cardRefs.current[highlightResponseId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightResponseId])

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Questionnaire</h2>
          <p className={styles.subtitle}>
            Jessica Drake&apos;s Tax Organizer responses (read-only for this review).
          </p>
        </div>
        <DocVerifyHeaderActions
          docKey={QUESTIONNAIRE_DOC_KEY}
          verifiedDocs={verifiedDocs}
          verifiedDocsMeta={verifiedDocsMeta}
          reviewerConfirmedDocs={reviewerConfirmedDocs}
          reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
          onVerifyDoc={onVerifyDoc}
        />
      </div>

      <div className={styles.list}>
        {QUESTIONNAIRE_RESPONSES.map((qa) => (
          <article
            key={qa.id}
            id={`questionnaire-${qa.id}`}
            ref={(node) => { cardRefs.current[qa.id] = node }}
            className={`${styles.card} ${highlightResponseId === qa.id ? styles.cardHighlight : ''}`}
          >
            <p className={styles.topic}>{qa.topic}</p>
            <p className={styles.question}>
              <span className={styles.questionLabel}>Preparer asked</span>
              {qa.question}
            </p>
            <div className={styles.bubble}>
              <span className={styles.avatar} aria-hidden="true">JD</span>
              <div className={styles.qaText}>
                <span className={styles.qaName}>
                  {qa.clientName} · {qa.date}
                </span>
                <p className={styles.qaAnswer}>{qa.answer}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
