import { useEffect, useState, ReactNode } from 'react'
import { Close } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/AgentLoadingPane.module.css'

interface AgentLoadingPaneProps {
  onClose: () => void
  /** True only while agentView === 'loading' — timers start here, not on mount */
  isLoading?: boolean
  /** When true the body crossfades from loading content → report content */
  showReport?: boolean
  /** Whether the whole panel is closing (drives slide-out) */
  closing?: boolean
  /** The report pane to fade in once loading is done */
  reportContent?: ReactNode
}

// Loading phases (timers only run while isLoading — not while idle/mounted):
//   'spinning'  0–700ms    — centered rotating Intuit Assist icon
//   'greeting'  700–2400ms — icon + "Assessing the return…" + subtext
//   'exiting'   2400ms+    — message fades out
// Parent keeps isLoading ~3200ms then sets showReport=true
export default function AgentLoadingPane({
  onClose,
  isLoading = false,
  showReport = false,
  closing = false,
  reportContent,
}: AgentLoadingPaneProps) {
  const [phase, setPhase] = useState<'spinning' | 'greeting' | 'exiting'>('spinning')

  useEffect(() => {
    if (!isLoading || showReport) return
    setPhase('spinning')
    const greetTimer = setTimeout(() => setPhase('greeting'), 700)
    const exitTimer = setTimeout(() => setPhase('exiting'), 2400)
    return () => {
      clearTimeout(greetTimer)
      clearTimeout(exitTimer)
    }
  }, [isLoading, showReport])

  const showLoader = isLoading && !showReport

  return (
    <div className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}>

      {/* ── Header — always static, never re-animates ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft} />
        <div className={styles.headerTitle}>
          <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
          <span className={styles.titleText}>Review AI</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} aria-label="Close" onClick={onClose}>
            <Close size="small" />
          </button>
        </div>
      </div>

      {/* ── Body — loading content crossfades to report content ── */}
      <div className={styles.body}>

        {/* Loading — only while first-open loading (never when idle/closed) */}
        {showLoader && (
          <div className={styles.pane} aria-live="polite" aria-busy="true">
            {phase === 'spinning' && (
              <div className={styles.spinOnlyPhase}>
                <div className={styles.spinningIcon}>
                  <img
                    src={intuitAssistIcon}
                    alt="Review AI is assessing the return"
                    className={styles.greetingIconImg}
                  />
                </div>
              </div>
            )}

            {(phase === 'greeting' || phase === 'exiting') && (
              <div className={phase === 'exiting' ? styles.greetingExiting : styles.greetingPhase}>
                <div className={styles.spinningIcon}>
                  <img src={intuitAssistIcon} alt="" className={styles.greetingIconImg} />
                </div>
                <div className={styles.greetingText}>
                  <h2 className={styles.greetingTitle}>Assessing the return…</h2>
                  <p className={styles.greetingSubtext}>
                    Preparing diagnostics…
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report content — fades in when showReport becomes true */}
        {showReport && (
          <div className={styles.reportFadeIn}>
            {reportContent}
          </div>
        )}

      </div>
    </div>
  )
}
