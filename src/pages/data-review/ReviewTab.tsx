import { PopOut, PopIn } from '@design-systems/icons'
import sparklesIcon from '../../assets/icons/sparkles.svg'
import styles from '../../styles/data-review/ReviewTab.module.css'

const TABS = [
  { label: 'Prior Year 1040', key: 'prior-1040' as const },
  { label: 'W-2s', key: 'w2s' as const },
  { label: '1099-DIVs', key: '1099-divs' as const },
  { label: '1099-INTs', key: '1099-ints' as const },
]

export type TopTab = 'w2s' | '1099-divs' | '1099-ints' | 'prior-1040'

interface ReviewTabProps {
  activeTopTab?: string
  onTopTabChange?: (tab: TopTab) => void
  onTabChange?: (tab: string) => void
  onPopOut?: () => void
  isPopout?: boolean
}

export default function ReviewTab({ activeTopTab = 'w2s', onTopTabChange, onTabChange, onPopOut, isPopout = false }: ReviewTabProps) {

  const handleTabClick = (key: string, label: string) => {
    if (key === 'w2s' || key === '1099-divs' || key === '1099-ints' || key === 'prior-1040') {
      onTopTabChange?.(key as TopTab)
    }
    onTabChange?.(label)
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={styles.tab}
            onClick={() => handleTabClick(tab.key, tab.label)}
          >
            <div className={styles.tabContent}>
              <img src={sparklesIcon} alt="" className={`${styles.tabIcon} ${tab.key !== activeTopTab ? styles.tabIconInactive : ''}`} />
              <span className={`${styles.tabLabel} ${tab.key === activeTopTab ? styles.tabLabelActive : styles.tabLabelInactive}`}>
                {tab.label}
              </span>
            </div>
            <div className={styles.tabUnderline}>
              <div className={tab.key === activeTopTab ? styles.tabUnderlineActive : styles.tabUnderlineInactive} />
            </div>
          </button>
        ))}
      </div>

      {/* Dock-back button — only shown in the popout window */}
      {isPopout && (
        <button
          className={styles.dockBackBtn}
          aria-label="Dock back to main window"
          onClick={() => window.close()}
        >
          <PopIn size="small" />
          Dock back
        </button>
      )}
    </div>
  )
}
