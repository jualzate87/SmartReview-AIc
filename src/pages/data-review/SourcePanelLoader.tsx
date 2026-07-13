import { useEffect, useState, type ReactNode } from 'react'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/SourcePanelLoader.module.css'

const LOAD_MS = 500

interface SourcePanelLoaderProps {
  /** Changes when tab, payer, or document context switches */
  loadKey: string
  children: ReactNode
  /** flexDirection passed through to the content wrapper */
  layout?: 'row' | 'column'
}

export default function SourcePanelLoader({ loadKey, children, layout = 'row' }: SourcePanelLoaderProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), LOAD_MS)
    return () => clearTimeout(timer)
  }, [loadKey])

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.loaderOverlay} ${!loading ? styles.loaderOverlayHidden : ''}`} aria-hidden={!loading}>
        <img src={intuitAssistIcon} alt="" className={styles.spinningIcon} />
      </div>
      <div
        className={`${styles.content} ${!loading ? styles.contentVisible : ''}`}
        style={{ flexDirection: layout }}
      >
        {children}
      </div>
    </div>
  )
}
