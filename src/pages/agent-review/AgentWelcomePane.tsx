import intuitAssistGif from '../../assets/intuit-assist-animation.gif'
import {
  STARTER_PROMPTS,
  WELCOME_GREETING_NAME,
  WELCOME_GREETING_PROMPT,
} from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentWelcomePane.module.css'

interface AgentWelcomePaneProps {
  preparerName?: string
  onPromptClick: (prompt: string) => void
}

export default function AgentWelcomePane({
  preparerName = WELCOME_GREETING_NAME,
  onPromptClick,
}: AgentWelcomePaneProps) {
  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src={intuitAssistGif} alt="" className={styles.logoGif} />
      </div>

      <div className={styles.greeting}>
        <span className={styles.greetingName}>Hi, {preparerName}</span>
        <span className={styles.greetingSubtitle}>{WELCOME_GREETING_PROMPT}</span>
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
