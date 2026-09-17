import { Copy, Download, NewWindow, ThumbDown, ThumbUp } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import {
  CTA_SOURCE_DOCUMENTS_SHORT,
  CTA_UPDATED_RETURN_SHORT,
  INTELLIGENCE_COMPLETION_FOOTER,
  STARTER_PROMPT_CATCH_UP,
} from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentReviewSummaryFooter.module.css'

interface AgentReviewSummaryFooterProps {
  onViewUpdatedReturn: () => void
  onViewSourceDocuments: () => void
  onPrimaryAction: () => void
  primaryLabel?: string
  showPrompt?: boolean
}

export default function AgentReviewSummaryFooter({
  onViewUpdatedReturn,
  onViewSourceDocuments,
  onPrimaryAction,
  primaryLabel = STARTER_PROMPT_CATCH_UP,
  showPrompt = true,
}: AgentReviewSummaryFooterProps) {
  return (
    <div className={styles.footer}>
      {showPrompt ? (
        <p className={styles.footerPrompt}>{INTELLIGENCE_COMPLETION_FOOTER}</p>
      ) : null}

      <div className={styles.controlBar}>
        <button type="button" className={styles.iconBtn} aria-label="Copy">
          <Copy size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Download">
          <Download size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Like">
          <ThumbUp size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Dislike">
          <ThumbDown size="small" />
        </button>
      </div>

      <div className={styles.docLinksRow}>
        <button
          type="button"
          className={styles.docLinkPill}
          onClick={onViewUpdatedReturn}
          aria-label={`${CTA_UPDATED_RETURN_SHORT} (opens in a new window)`}
        >
          {CTA_UPDATED_RETURN_SHORT}
          <NewWindow size="small" className={styles.docLinkIcon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.docLinkPill}
          onClick={onViewSourceDocuments}
          aria-label={`${CTA_SOURCE_DOCUMENTS_SHORT} (opens in a new window)`}
        >
          {CTA_SOURCE_DOCUMENTS_SHORT}
          <NewWindow size="small" className={styles.docLinkIcon} aria-hidden />
        </button>
      </div>

      <div className={styles.ctaRow}>
        <Button priority="secondary" size="medium" onClick={onPrimaryAction}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
