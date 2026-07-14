import { CircleCheck, PopOut, PopIn } from '@design-systems/icons'
import sparklesIcon from '../../assets/icons/sparkles.svg'
import styles from '../../styles/data-review/ReviewTab.module.css'

// ProtoC: import docs first; Prior Year 1040 moved LAST (least relevant during import review)
const TABS = [
  { label: 'W-2s', key: 'w2s' as const },
  { label: '1099-DIVs', key: '1099-divs' as const },
  { label: '1099-INTs', key: '1099-ints' as const },
  { label: '1099-Rs', key: '1099-rs' as const },
  { label: '1099-NECs', key: '1099-necs' as const },
  { label: 'Prior Year 1040', key: 'prior-1040' as const },
]

export type TopTab = 'w2s' | '1099-divs' | '1099-ints' | '1099-rs' | '1099-necs' | 'prior-1040'

interface ReviewTabProps {
  activeTopTab?: string
  onTopTabChange?: (tab: TopTab) => void
  onTabChange?: (tab: string) => void
  onPopOut?: () => void
  isPopout?: boolean
  /** ProtoC: per-tab count of unresolved import flags — drives dynamic tab badges */
  flagCounts?: Record<string, number>
  /** Initial flag totals — used to show green check when a tab’s flags are cleared */
  initialFlagCounts?: Record<string, number>
  /** Docs the preparer marked verified — also qualifies for green check when count is 0 */
  verifiedDocs?: Set<string>
  /** Map top-tab key → verified doc key(s) for green-check qualification */
  tabVerifiedKeys?: Record<string, string[]>
}

export default function ReviewTab({
  activeTopTab = 'w2s',
  onTopTabChange,
  onTabChange,
  onPopOut,
  isPopout = false,
  flagCounts,
  initialFlagCounts,
  verifiedDocs,
  tabVerifiedKeys,
}: ReviewTabProps) {

  const handleTabClick = (key: string, label: string) => {
    if (key === 'w2s' || key === '1099-divs' || key === '1099-ints' || key === '1099-rs' || key === '1099-necs' || key === 'prior-1040') {
      onTopTabChange?.(key as TopTab)
    }
    onTabChange?.(label)
  }

  const renderBadge = (tabKey: string) => {
    if (!flagCounts) return null
    const count = flagCounts[tabKey] ?? 0
    if (count > 0) {
      return <span className={styles.tabFlagBadge}>{count}</span>
    }
    const initial = initialFlagCounts?.[tabKey] ?? 0
    const verifiedKeys = tabVerifiedKeys?.[tabKey] ?? []
    const isVerified = verifiedKeys.some(k => verifiedDocs?.has(k))
    if (initial > 0 || isVerified) {
      return (
        <span className={styles.tabClearedCheck} aria-label="All flags cleared">
          <CircleCheck size="small" />
        </span>
      )
    }
    return null
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
              {renderBadge(tab.key)}
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
