import { Close } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/SourcesToast.module.css'

interface Source {
  label: string
  value: string
}

interface SourcesToastProps {
  sources: Source[]
  style?: React.CSSProperties
  onClose: () => void
}

export default function SourcesToast({ sources, style, onClose }: SourcesToastProps) {
  return (
    <div className={styles.toast} style={style}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={intuitAssistIcon} alt="" className={styles.intelligenceIcon} />
          <span className={styles.title}>Sources</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>
      <div className={styles.body}>
        {sources.map(s => (
          <div key={s.label} className={styles.row}>
            <span className={styles.rowLabel}>{s.label}</span>
            <span className={styles.rowValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
