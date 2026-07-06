import { ArrowRight } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/WelcomePane.module.css'

interface WelcomePaneProps {
  /** Client name for the return under review */
  clientName: string
  /** Number of import-accuracy flags found (Step 1) */
  flagCount: number
  /** Begin Phase 1 — Import Accuracy */
  onBegin: () => void
}

/**
 * ProtoC entry / orientation screen, styled after the IDS GenUX "Welcome" pattern
 * (Intuit Assist icon + heading + subheading). Introduces the two-step sequential
 * review (import accuracy → AI diagnostics) before the CPA starts. Brief by
 * design — no skip for this prototype.
 */
export default function WelcomePane({ clientName, flagCount, onBegin }: WelcomePaneProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.lockup}>
          <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
          <h1 className={styles.title}>Reviewing {clientName}&rsquo;s return</h1>
          <p className={styles.lede}>We&rsquo;ll guide you through two steps.</p>
        </div>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <div className={styles.stepBody}>
              <span className={styles.stepTitle}>Import accuracy</span>
              <span className={styles.stepDesc}>
                Verify that all documents were read and imported correctly.
                We found <strong>{flagCount} {flagCount === 1 ? 'field' : 'fields'}</strong> that need your attention.
              </span>
            </div>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div className={styles.stepBody}>
              <span className={styles.stepTitle}>AI diagnostics</span>
              <span className={styles.stepDesc}>
                Once import is confirmed, we&rsquo;ll walk you through compliance flags,
                year-over-year changes, and planning opportunities.
              </span>
            </div>
          </li>
        </ol>

        <Button priority="primary" size="medium" onClick={onBegin}>
          Start import review <ArrowRight size="small" />
        </Button>
      </div>
    </div>
  )
}
