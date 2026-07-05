import { useState } from 'react'
import { Plus } from '@design-systems/icons'
import intuitBrandBalls from '../../assets/icons/brand-balls.svg'
import sendArrow from '../../assets/send-arrow.svg'
import styles from '../../styles/automated/ChatInput.module.css'

interface ChatInputProps {
  onSend: (text: string) => void
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault()
      onSend(value.trim())
      setValue('')
    }
  }

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim())
      setValue('')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.fade} />

      <div className={styles.inputBox}>
        {/* Text area */}
        <div className={styles.textArea}>
          <textarea
            className={styles.textAreaInput}
            placeholder="Ask {Agent / product name}"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        {/* Actions row */}
        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            {/* + attach button */}
            <button className={styles.pillBtn} aria-label="Attach">
              <span className={styles.pillBtnIcon}>
                <Plus size="medium" />
              </span>
            </button>

            {/* Intuit chip */}
            <button className={`${styles.pillBtn} ${styles.pillBtnIntuit}`} aria-label="Intuit">
              <img src={intuitBrandBalls} alt="" className={styles.intuitBrandIcon} />
              <span className={styles.pillBtnLabel}>Intuit</span>
            </button>
          </div>

          <div className={styles.actionsRight}>
            {/* Send button */}
            <button
              className={`${styles.sendBtn} ${value.trim() ? styles.active : ''}`}
              aria-label="Send"
              onClick={handleSend}
            >
              <img src={sendArrow} alt="" className={styles.sendBtnIcon} />
            </button>
          </div>
        </div>
      </div>

      <span className={styles.legal}>
        Important information about how we use generative AI
      </span>
    </div>
  )
}
