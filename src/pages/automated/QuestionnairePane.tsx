import { Copy, Download, ThumbUp, ThumbDown } from '@design-systems/icons'
import QuestionnaireSection from './QuestionnaireSection'
import styles from '../../styles/automated/QuestionnairePane.module.css'

interface QuestionnairePaneProps {
  onDraftEmail: () => void
}

const QUESTIONNAIRE_ITEMS = [
  'Did your marital status change in 2024?',
  'In 2024, did you receive or sell any digital assets (like crypto or NFTs)?',
  'Do you want to review your 2025 estimated tax payments to help adjust your tax refund or amount due next year?',
  'Did you donate cash or non-cash items to charities in 2024?',
]

export default function QuestionnairePane({ onDraftEmail }: QuestionnairePaneProps) {
  return (
    <div className={styles.container}>
      {/* Action button top-right */}
      <div className={styles.actionButtonRow}>
        <button className={styles.actionButton}>
          Create client questionnaire &amp; checklist
        </button>
      </div>

      <div className={styles.chatContent}>
        {/* User speech bubble */}
        <div className={styles.userMessageRow}>
          <div className={styles.userBubble}>
            Create client questionnaire &amp; checklist
          </div>
        </div>

        {/* Agent response */}
        <div className={styles.agentResponse}>
          {/* Agent markdown text */}
          <p className={styles.agentText}>
            Your client documents are ready. You can add, edit, or remove items directly in the documents or request changes through the chat.
            <br /><br />
            Note: You can Send to client now, or click Save for later to keep this draft. Once saved, your request will be waiting for you in the Tax Organizer and Intuit Link.
          </p>

          {/* Accordion sections using custom component matching Figma */}
          <div className={styles.accordionStack}>
            <QuestionnaireSection
              title="Questionnaire"
              items={QUESTIONNAIRE_ITEMS}
              defaultExpanded
              showAddButton
              addButtonLabel="Add question"
            />
            <QuestionnaireSection
              title="Document checklist"
              items={[]}
              showAddButton={false}
            />
            <QuestionnaireSection
              title="Engagement letter"
              items={[]}
              showAddButton={false}
            />
          </div>

          {/* Card control bar */}
          <div className={styles.cardControlBar}>
            <button className={styles.iconBtn} aria-label="Copy"><Copy size="small" /></button>
            <button className={styles.iconBtn} aria-label="Download"><Download size="small" /></button>
            <button className={styles.iconBtn} aria-label="Like"><ThumbUp size="small" /></button>
            <button className={styles.iconBtn} aria-label="Dislike"><ThumbDown size="small" /></button>
          </div>

          {/* Suggestion chips */}
          <div className={styles.suggestionChipsRow}>
            <button className={styles.suggestionChip} onClick={onDraftEmail}>
              Draft email to client
            </button>
            <button className={styles.suggestionChip}>
              Save for later
            </button>
            <button className={styles.suggestionChip}>
              Get a summary of the prior year 1040
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
