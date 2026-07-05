import intuitAssistGif from '../../assets/intuit-assist-animation.gif'
import styles from '../../styles/automated/WelcomePane.module.css'

interface WelcomePaneProps {
  onPromptClick: (prompt: string) => void
}

const STARTER_PROMPTS = [
  'Create questionnaire and document checklist',
  "Summarize last year's tax return",
]

export default function WelcomePane({ onPromptClick }: WelcomePaneProps) {
  return (
    <div className={styles.container}>
      {/* Intuit Assist animated logo */}
      <div className={styles.logoWrapper}>
        <img
          src={intuitAssistGif}
          alt="Intuit Assist"
          className={styles.logoGif}
        />
      </div>

      {/* Hi Amanda + How can I help you */}
      <div className={styles.greeting}>
        <span className={styles.greetingName}>Hi, Amanda</span>
        <span className={styles.greetingSubtitle}>How can I help you?</span>
      </div>

      {/* Starter prompt chips */}
      <div className={styles.promptsRow}>
        {STARTER_PROMPTS.map((prompt, i) => (
          <button
            key={i}
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
