import { CircleCheckFill } from '@design-systems/icons'
import aiSparkleIcon from '../../assets/icons/ai-sparkle-blue.svg'
import styles from '../../styles/import/SuccessStep.module.css'

export default function SuccessStep() {
  return (
    <div className={styles.container}>
      <CircleCheckFill size="xlarge" className={styles.successIcon} />
      <h2 className={styles.heading}>Client and return created</h2>
      <p className={styles.body}>
        Jessica Drake's 1040 return for Tax Year 2025 is set up and ready to go.
      </p>
      <button className={styles.ctaButton}>
        <img src={aiSparkleIcon} alt="" className={styles.ctaIcon} />
        Start automated onboarding
      </button>
      <p className={styles.subCopy}>
        Intuit AI is ready to draft a client data request and return summary using last year's info.
      </p>
    </div>
  )
}
