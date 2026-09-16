import intuitAssistGif from '../../assets/intuit-assist-animation.gif'
import { STARTER_PROMPTS } from './agentReviewConstants'
import styles from '../../styles/agent-review/AgentWelcomePane.module.css'

interface AgentWelcomePaneProps {
  preparerName?: string
  onPromptClick: (prompt: string) => void
}

export default function AgentWelcomePane({
  preparerName = 'Jordan',
  onPromptClick,
}: AgentWelcomePaneProps) {
  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src={intuitAssistGif} alt="" className={styles.logoGif} />
      </div>

      <div className={styles.greeting}>
        <span className={styles.greetingName}>Hi, {preparerName}</span>
        <span className={styles.greetingSubtitle}>How may I help you?</span>
      </div>

      <div className={styles.promptsRow}>
        {STARTER_PROMPTS.map(prompt => (
          <button
            key={prompt}
            type="button"
            className={styles.prompt}
            onClick={() => onPromptClick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
