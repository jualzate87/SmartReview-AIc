import { CircleCheck } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase2BannerProps {
  reviewed: number
  total: number
  complete: boolean
}

/**
 * ProtoC Phase 2 banner. Reuses Phase1Banner's visual language (Intuit Assist icon,
 * title/subtitle, right-aligned progress) so the two phases read as one continuous
 * guided experience rather than two disconnected screens.
 */
export default function Phase2Banner({ reviewed, total, complete }: Phase2BannerProps) {
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
              <span className={styles.title}>Step 2 — AI diagnostics</span>
              <span className={styles.subtitle}>
                Review compliance flags, year-over-year changes, and planning opportunities.
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {!complete && (
          <span className={styles.counter}>
            <strong className={styles.counterNum}>{reviewed}</strong> of {total} diagnostics reviewed
          </span>
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
