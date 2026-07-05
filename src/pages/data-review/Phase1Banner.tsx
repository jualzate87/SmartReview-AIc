import { ArrowRight, CircleCheck, Lock } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  resolved: number
  total: number
  remaining: number
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
export default function Phase1Banner({ resolved, total, remaining, complete, onContinue }: Phase1BannerProps) {
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
          <button className={styles.continueBtn} onClick={onContinue}>
            Continue to AI Diagnostics <ArrowRight size="small" />
          </button>
        ) : (
          <div className={styles.lockedWrap}>
            <button className={styles.continueBtnLocked} disabled>
              <Lock size="small" /> AI Diagnostics
            </button>
            <span className={styles.lockNote}>
              {remaining} {remaining === 1 ? 'flag' : 'flags'} remaining — diagnostics unlock once import is confirmed. This keeps flags accurate.
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
