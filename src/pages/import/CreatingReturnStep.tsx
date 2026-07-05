import { useEffect } from 'react'
import styles from '../../styles/import/LoadingStep.module.css'

interface CreatingReturnStepProps {
  onComplete: () => void
}

export default function CreatingReturnStep({ onComplete }: CreatingReturnStepProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span className={styles.loadingText}>Creating new return...</span>
    </div>
  )
}
