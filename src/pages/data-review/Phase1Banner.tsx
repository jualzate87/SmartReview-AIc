import { ArrowRight, CircleCheck, Lock } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  resolved: number
  total: number
  complete: boolean
  /** Continue to Phase 2 — AI Diagnostics (only enabled when complete) */
  onContinue: () => void
}

/**
 * ProtoC Phase 1 banner. Reflects live import-flag progress and, once every flag
 * is resolved, invites the CPA to Phase 2. The "Continue to AI Diagnostics" CTA is
 * hard-locked (visible + explained) until the counter reaches 0 — this keeps the
 * diagnostics accurate rather than hand-holding.
 */
export default function Phase1Banner({ resolved, total, complete, onContinue }: Phase1BannerProps) {
  return (
    <div className={`${styles.banner} ${complete ? styles.bannerComplete : ''}`}>
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {complete ? (
            <>
              <span className={styles.title}>Import accuracy confirmed</span>
              <span className={styles.subtitle}>All flagged fields have been reviewed. Ready to move to Step 2?</span>
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
        {!complete && (
          <span className={styles.counter}>
            <strong className={styles.counterNum}>{resolved}</strong> of {total} flags resolved
          </span>
        )}

        {complete ? (
          <Button priority="primary" size="medium" onClick={onContinue}>
            Continue to AI diagnostics <ArrowRight size="small" />
          </Button>
        ) : (
          <div className={styles.lockedWrap}>
            <Button priority="secondary" size="medium" disabled>
              <Lock size="small" /> AI diagnostics locked
            </Button>
            <span className={styles.lockNote}>
              Diagnostics unlock once import is confirmed.
            </span>
          </div>
        )}
      </div>

      {complete && (
        <span className={styles.completeBadge}>
          <CircleCheck size="small" /> All flags resolved
        </span>
      )}
    </div>
  )
}
