import styles from '../../styles/data-review/PeelTab.module.css'

interface PeelTabProps {
  tabs: { key: string; label: string; badge?: number }[]
  activeKey: string
  onChange: (key: string) => void
}

export default function PeelTab({ tabs, activeKey, onChange }: PeelTabProps) {
  return (
    <div className={styles.container}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
