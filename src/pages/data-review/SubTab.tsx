import styles from '../../styles/data-review/SubTab.module.css'

interface SubTabItem {
  label: string
}

interface SubTabProps {
  tabs: SubTabItem[]
  activeIndex?: number
  onTabChange?: (index: number) => void
}

export default function SubTab({ tabs, activeIndex = 0, onTabChange }: SubTabProps) {
  return (
    <div className={styles.container}>
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          className={`${styles.tab} ${i === activeIndex ? styles.tabActive : styles.tabInactive}`}
          onClick={() => onTabChange?.(i)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
