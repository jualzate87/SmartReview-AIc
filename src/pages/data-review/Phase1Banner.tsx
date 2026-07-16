import { ArrowRight, CircleCheck, Lock } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  resolved: number
  total: number
  /** All import flags resolved — hard gate for AI diagnostics */
  flagsCleared: boolean
  /** Count of packet source docs (incl. Questionnaire) not yet mark-reviewed */
  unreviewedDocCount?: number
  /** Soft complete: flags cleared AND all packet docs reviewed */
  complete: boolean
  /** Continue to Phase 2 — AI Diagnostics (enabled when flags cleared). Omit in popout. */
  onContinue?: () => void
  /** Whether the CPA has started opening source docs for import review */
  importsStarted?: boolean
  /** Begin import review — reveals source documents on the right */
  onStartImports?: () => void
}

/**
 * ProtoC Phase 1 step header. Progress, start CTA, AI-diagnostics lock, and complete state.
 * Remaining-document attention (copy + CTA) lives on Phase1IssueBanner (documents mode).
 * Flags are the hard gate for Continue; document review is recommended only.
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
}: Phase1BannerProps) {
  const needsDocReview = flagsCleared && unreviewedDocCount > 0

  return (
    <div
      className={[styles.banner, flagsCleared ? styles.bannerComplete : ''].filter(Boolean).join(' ')}
    >
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {flagsCleared ? (
            <>
              <span className={styles.title}>Import accuracy confirmed</span>
              <span className={styles.subtitle}>
                {complete
                  ? onContinue
                    ? 'All flagged fields and source documents have been reviewed. Ready to move to Step 2?'
                    : 'All flagged fields and source documents have been reviewed. Dock back to continue to AI diagnostics.'
                  : onContinue
                    ? 'Flags are cleared. AI diagnostics are available. Reviewing remaining documents is recommended.'
                    : 'Flags are cleared. AI diagnostics are available in the main window. Reviewing remaining documents is recommended.'}
              </span>
            </>
          ) : (
            <>
              <span className={styles.title}>Step 1: Import accuracy</span>
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

        {flagsCleared && onContinue ? (
          <Button priority="primary" size="medium" onClick={onContinue}>
            Continue to AI diagnostics <ArrowRight size="small" />
          </Button>
        ) : flagsCleared && !onContinue ? (
          <span className={styles.lockNote}>
            {needsDocReview
              ? 'AI diagnostics available in the main window. Document review is recommended.'
              : 'Phase 1 complete. Continue to AI diagnostics in the main window.'}
          </span>
        ) : importsStarted ? (
          <div className={styles.lockedWrap}>
            <Button priority="secondary" size="medium" disabled>
              <Lock size="small" /> AI diagnostics locked
            </Button>
            <span className={styles.lockNote}>
              Diagnostics unlock once import flags are confirmed.
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
