import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/data-review/DataReviewPage.module.css'

interface Phase1IssueBannerProps {
  /** Unresolved Phase 1 flags — when > 0, shows flag attention CTA */
  unresolvedCount?: number
  onVerify?: () => void
  /** After flags clear: remaining source docs that still need mark-reviewed */
  unreviewedDocCount?: number
  /** Total packet source docs (for “X of Y reviewed” progress) */
  totalDocCount?: number
  onReviewNextDocument?: () => void
}

/**
 * Yellow issue banner for open flags.
 * After flags clear, swaps to a calm info bar for remaining document review —
 * intentionally not orange/flag chrome.
 */
export default function Phase1IssueBanner({
  unresolvedCount = 0,
  onVerify,
  unreviewedDocCount = 0,
  totalDocCount = 0,
  onReviewNextDocument,
}: Phase1IssueBannerProps) {
  if (unresolvedCount > 0 && onVerify) {
    return (
      <div className={styles.issueBanner}>
        <svg className={styles.issueBannerIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 2L18.66 17H1.34L10 2Z" fill="rgba(255,187,0,0.6)" stroke="#ff6a00" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 8v4" stroke="#cc5500" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="10" cy="14.5" r="0.9" fill="#cc5500"/>
        </svg>
        <span className={styles.issueBannerText}>
          {unresolvedCount} {unresolvedCount === 1 ? 'field needs' : 'fields need'} your attention
        </span>
        <button type="button" className={styles.issueBannerPill} onClick={onVerify}>
          Review next issue
        </button>
      </div>
    )
  }

  if (unreviewedDocCount > 0 && onReviewNextDocument) {
    const total = totalDocCount > 0 ? totalDocCount : unreviewedDocCount
    const reviewed = Math.max(0, total - unreviewedDocCount)
    const progressLabel =
      totalDocCount > 0
        ? `${reviewed} of ${total} documents reviewed`
        : `${unreviewedDocCount} ${unreviewedDocCount === 1 ? 'document' : 'documents'} left to review`

    return (
      <div className={styles.docReviewBar} role="status">
        <span className={styles.docReviewBarText}>{progressLabel}</span>
        <Button priority="secondary" size="small" onClick={onReviewNextDocument}>
          Review next document
        </Button>
      </div>
    )
  }

  return null
}
