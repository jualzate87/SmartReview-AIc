import { ArrowRight, CircleCheck, Document, Lock } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  resolved: number
  total: number
  /** All import flags resolved */
  flagsCleared: boolean
  /** Count of packet source docs (incl. Questionnaire) not yet mark-reviewed */
  unreviewedDocCount?: number
  /** Fully complete: flags cleared AND all packet docs reviewed */
  complete: boolean
  /** Continue to Phase 2 — AI Diagnostics (only enabled when complete). Omit in popout. */
  onContinue?: () => void
  /** Whether the CPA has started opening source docs for import review */
  importsStarted?: boolean
  /** Begin import review — reveals source documents on the right */
  onStartImports?: () => void
  /** Jump to next source document that still needs a review */
  onReviewNextDocument?: () => void
}

/**
 * ProtoC Phase 1 banner. Reflects live import-flag progress and, once every flag
 * is resolved, invites the CPA to review remaining (no-flag) docs before Phase 2.
 */
export default function Phase1Banner({
  resolved,
  total,
  flagsCleared,
  unreviewedDocCount = 0,
  complete,
  onContinue,
  importsStarted = false,
  onStartImports,
  onReviewNextDocument,
}: Phase1BannerProps) {
  const needsDocReview = flagsCleared && unreviewedDocCount > 0 && !complete

  return (
    <div
      className={[
        styles.banner,
        complete ? styles.bannerComplete : '',
        needsDocReview ? styles.bannerDocReview : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.left}>
        {needsDocReview ? (
          <Document size="medium" className={styles.docIcon} aria-hidden />
        ) : (
          <img src={intuitAssistIcon} alt="" className={styles.icon} />
        )}
        <div className={styles.text}>
          {complete ? (
            <>
              <span className={styles.title}>Import accuracy confirmed</span>
              <span className={styles.subtitle}>
                {onContinue
                  ? 'All flagged fields and source documents have been reviewed. Ready to move to Step 2?'
                  : 'All flagged fields and source documents have been reviewed. Dock back to continue to AI diagnostics.'}
              </span>
            </>
          ) : needsDocReview ? (
            <>
              <span className={styles.title}>
                {unreviewedDocCount}{' '}
                {unreviewedDocCount === 1 ? 'document left' : 'documents left'} to review
              </span>
              <span className={styles.subtitle}>
                Flags are cleared. Confirm each remaining source document before AI diagnostics unlock.
              </span>
            </>
          ) : (
            <>
              <span className={styles.title}>Step 1 — Import accuracy</span>
              <span className={styles.subtitle}>
                Verify the flagged fields against each source document, then continue to AI diagnostics.
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {!flagsCleared && (
          <span className={styles.counter}>
            <strong className={styles.counterNum}>{resolved}</strong> of {total} flags resolved
          </span>
        )}

        {!flagsCleared && !importsStarted && onStartImports && (
          <Button
            priority="primary"
            size="medium"
            onClick={onStartImports}
          >
            Start reviewing imports
          </Button>
        )}

        {needsDocReview && onReviewNextDocument && (
          <Button priority="secondary" size="medium" onClick={onReviewNextDocument}>
            Review next document
          </Button>
        )}

        {complete && onContinue ? (
          <Button priority="primary" size="medium" onClick={onContinue}>
            Continue to AI diagnostics <ArrowRight size="small" />
          </Button>
        ) : complete && !onContinue ? (
          <span className={styles.lockNote}>
            Phase 1 complete — continue to AI diagnostics in the main window.
          </span>
        ) : importsStarted || needsDocReview ? (
          <div className={styles.lockedWrap}>
            <Button priority="secondary" size="medium" disabled>
              <Lock size="small" /> AI diagnostics locked
            </Button>
            <span className={styles.lockNote}>
              {needsDocReview
                ? 'Mark remaining documents reviewed to unlock.'
                : 'Diagnostics unlock once import is confirmed.'}
            </span>
          </div>
        ) : null}
      </div>

      {complete && (
        <span className={styles.completeBadge}>
          <CircleCheck size="small" /> All documents reviewed
        </span>
      )}
    </div>
  )
}
