import { useEffect, useState, ReactNode } from 'react'
import { Close } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import loadingGif from '../../assets/intuit-assist-loading.gif'
import styles from '../../styles/data-review/AgentLoadingPane.module.css'

interface AgentLoadingPaneProps {
  onClose: () => void
  /** When true the body crossfades from loading content → report content */
  showReport?: boolean
  /** Whether the whole panel is closing (drives slide-out) */
  closing?: boolean
  /** The report pane to fade in once loading is done */
  reportContent?: ReactNode
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="#393A3D" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Loading phases (within the body only — header never moves):
//   'gif-only'  0–800ms   — animated GIF centered
//   'greeting'  800–1800ms — spinning snowflake + "Hi, Jordan" + subtext fade in
//   'exiting'   1800ms+   — greeting fades out
//   then parent sets showReport=true → report fades in
export default function AgentLoadingPane({ onClose, showReport = false, closing = false, reportContent }: AgentLoadingPaneProps) {
  const [phase, setPhase] = useState<'gif-only' | 'greeting' | 'exiting'>('gif-only')

  useEffect(() => {
    if (showReport) return // already showing report, don't run timers
    const greetTimer = setTimeout(() => setPhase('greeting'),  800)
    const exitTimer  = setTimeout(() => setPhase('exiting'),  2800)
    return () => { clearTimeout(greetTimer); clearTimeout(exitTimer) }
  }, [showReport])

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

        {/* Loading content — fades out when showReport becomes true */}
        {!showReport && (
          <div className={styles.pane}>
            {/* Phase A: GIF only */}
            {phase === 'gif-only' && (
              <div className={styles.gifOnlyPhase}>
                <img src={loadingGif} alt="Review AI is analyzing your return" className={styles.logo} />
              </div>
            )}

            {/* Phase B + C: spinning snowflake + greeting text */}
            {(phase === 'greeting' || phase === 'exiting') && (
              <div className={phase === 'exiting' ? styles.greetingExiting : styles.greetingPhase}>
                <div className={styles.spinningIcon}>
                  <img src={intuitAssistIcon} alt="" className={styles.greetingIconImg} />
                </div>
                <div className={styles.greetingText}>
                  <h2 className={styles.greetingTitle}>Hi, Jessica</h2>
                  <p className={styles.greetingSubtext}>
                    We're checking the accuracy and integrity of your return.
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
