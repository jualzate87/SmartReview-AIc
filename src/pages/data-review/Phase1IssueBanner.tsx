import styles from '../../styles/data-review/DataReviewPage.module.css'

interface Phase1IssueBannerProps {
  /** Unresolved Phase 1 flags — when > 0, shows flag attention CTA */
  unresolvedCount?: number
  onVerify?: () => void
  /** After flags clear: remaining source docs that still need mark-reviewed */
  unreviewedDocCount?: number
  onReviewNextDocument?: () => void
}

/** Yellow issue banner — flags first; then remaining unreviewed documents. */
export default function Phase1IssueBanner({
  unresolvedCount = 0,
  onVerify,
  unreviewedDocCount = 0,
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
    return (
      <div className={styles.issueBanner}>
        <svg className={styles.issueBannerIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 2L18.66 17H1.34L10 2Z" fill="rgba(255,187,0,0.6)" stroke="#ff6a00" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 8v4" stroke="#cc5500" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="10" cy="14.5" r="0.9" fill="#cc5500"/>
        </svg>
        <span className={styles.issueBannerText}>
          Flags cleared — {unreviewedDocCount}{' '}
          {unreviewedDocCount === 1 ? 'document still needs' : 'documents still need'} a review
        </span>
        <button type="button" className={styles.issueBannerPill} onClick={onReviewNextDocument}>
          Review next document
        </button>
      </div>
    )
  }

  return null
}
