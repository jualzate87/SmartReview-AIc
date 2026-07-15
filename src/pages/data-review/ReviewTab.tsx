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
  /** Initial flag totals — used when combining with verified semantics */
  initialFlagCounts?: Record<string, number>
  /** Docs the preparer marked verified */
  verifiedDocs?: Set<string>
  /** Map top-tab key → verified doc key(s) for type-level green check */
  tabVerifiedKeys?: Record<string, string[]>
  /**
   * Per-tab: true when every L2 doc in that type is reviewed/verified.
   * When provided, drives the L1 green check (preferred over internal heuristics).
   */
  typeReviewed?: Record<string, boolean>
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
  typeReviewed,
}: ReviewTabProps) {

  const handleTabClick = (key: string, label: string) => {
    if (key === 'w2s' || key === '1099-divs' || key === '1099-ints' || key === '1099-rs' || key === '1099-necs' || key === 'prior-1040') {
      onTopTabChange?.(key as TopTab)
    }
    onTabChange?.(label)
  }

  const renderBadge = (tabKey: string) => {
    if (!flagCounts && !typeReviewed && !verifiedDocs) return null
    const count = flagCounts?.[tabKey] ?? 0
    if (count > 0) {
      return <span className={styles.tabFlagBadge}>{count}</span>
    }
    // Prefer explicit type-level reviewed signal from parent
    if (typeReviewed?.[tabKey]) {
      return (
        <span className={styles.tabClearedCheck} aria-label="All documents reviewed">
          <CircleCheck size="small" />
        </span>
      )
    }
    // Fallback: all verified-doc keys for this type are marked verified
    const verifiedKeys = tabVerifiedKeys?.[tabKey] ?? []
    const allVerified =
      verifiedKeys.length > 0 && verifiedKeys.every(k => verifiedDocs?.has(k))
    const initial = initialFlagCounts?.[tabKey] ?? 0
    // Legacy: flags existed and are now cleared (single-doc types)
    const flagsCleared = initial > 0 && count === 0 && verifiedKeys.length <= 1
    if (allVerified || flagsCleared) {
      return (
        <span className={styles.tabClearedCheck} aria-label="All documents reviewed">
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
