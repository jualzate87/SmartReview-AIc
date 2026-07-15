import { CircleCheck } from '@design-systems/icons'
import styles from '../../styles/data-review/PeelTab.module.css'

interface PeelTabProps {
  tabs: {
    key: string
    label: string
    badge?: number
    /** True when this payer originally had flags (or is verified) and count is 0 */
    showClearedCheck?: boolean
  }[]
  activeKey: string
  onChange: (key: string) => void
}

export default function PeelTab({ tabs, activeKey, onChange }: PeelTabProps) {
  return (
    <div className={styles.container}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey
        const count = tab.badge ?? 0
        return (
          <button
            key={tab.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {count > 0 && !tab.showClearedCheck && (
              <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}>
                {count}
              </span>
            )}
            {tab.showClearedCheck && (
              <span
                className={`${styles.clearedCheck} ${isActive ? styles.clearedCheckActive : ''}`}
                aria-label="Document reviewed"
              >
                <CircleCheck size="small" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
