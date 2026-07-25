import { CircleCheck } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase2BannerProps {
  reviewed: number
  total: number
  complete: boolean
  /** When agent is closed with work left — open AI Review from the counter link */
  onOpenDiagnostics?: () => void
  /** True while Review AI panel is open (counter stays plain text) */
  diagnosticsOpen?: boolean
}

export default function Phase2Banner({
  reviewed,
  total,
  complete,
  onOpenDiagnostics,
  diagnosticsOpen = false,
}: Phase2BannerProps) {
  const remaining = Math.max(0, total - reviewed)
  const showProgressLink = !complete && !!onOpenDiagnostics && !diagnosticsOpen && remaining > 0

  return (
    <div className={`${styles.banner} ${complete ? styles.bannerComplete : ''}`}>
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {complete ? (
            <>
              <span className={styles.title}>Review complete</span>
              <span className={styles.subtitle}>All diagnostics have been addressed. This return is ready for your sign-off.</span>
            </>
          ) : (
            <>
              <span className={styles.title}>Step 2: AI diagnostics</span>
              <span className={styles.subtitle}>
                Filing stoppers, compliance checks, and opportunities for this return.
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {!complete && (
          showProgressLink ? (
            <button
              type="button"
              className={styles.counterLink}
              onClick={onOpenDiagnostics}
              aria-label={`Open AI Review — ${reviewed} of ${total} diagnostics reviewed, ${remaining} remaining`}
            >
              <strong className={styles.counterNum}>{reviewed}</strong> of {total} diagnostics reviewed
            </button>
          ) : (
            <span className={styles.counter}>
              <strong className={styles.counterNum}>{reviewed}</strong> of {total} diagnostics reviewed
            </span>
          )
        )}
      </div>

      {complete && (
        <span className={styles.completeBadge}>
          <CircleCheck size="small" /> All diagnostics reviewed
        </span>
      )}
    </div>
  )
}
