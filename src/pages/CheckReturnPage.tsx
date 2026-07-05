import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from '@design-systems/icons'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import styles from '../styles/CheckReturnPage.module.css'

// Table data exactly from Figma node 29298:137106
const TABLE_ROWS = [
  { label: 'Total Income',             v2024: '134,472', v2023: '109,400', diff: '25,072',  expandable: true,  indent: false },
  { label: '- Largest of Deductions',  v2024: '14,600',  v2023: '13,850',  diff: '750',     expandable: true,  indent: false },
  { label: 'Total taxable income',      v2024: '119,872', v2023: '95,550',  diff: '24,322',  expandable: false, indent: false },
  { label: 'Effective tax rate',        v2024: '18.2%',   v2023: '16.9%',   diff: '1.3%',    expandable: false, indent: false },
  { label: 'Total federal tax',         v2024: '9,000',   v2023: '6,000',   diff: '3,000',   expandable: false, indent: false },
  { label: '- Payments/ Withholdings', v2024: '16,022',  v2023: '14,556',  diff: '1,466',   expandable: true,  indent: false },
  { label: '- Credits',                v2024: '0',       v2023: '0',       diff: '0',       expandable: false, indent: false },
  { label: 'Amount due',               v2024: '5,967',   v2023: '1,603',   diff: '4,364',   expandable: false, indent: false },
]

export default function CheckReturnPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  return (
    <div className={styles.page} data-theme="intuit">
      <SmartReturnHeader activeTab="checkreturns" />

      <div className={styles.body}>
        <LeftNavPTO />

        <div className={styles.contentArea}>

          {/* Left check navigation — exact Figma spec */}
          <div className={styles.leftNav}>
            {/* Forms — category */}
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>Forms</span>
            </div>
            {/* Tax Summary — category */}
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>Tax Summary</span>
            </div>
            {/* Federal Income Tax Summary — active secondary */}
            <div className={`${styles.navSecondary} ${styles.navSecondaryActive}`}>
              <span className={styles.navSecondaryLabel}>Federal Income Tax Summary</span>
            </div>
            {/* California Tax Summary — inactive secondary */}
            <div className={styles.navSecondary}>
              <span className={styles.navSecondaryLabel}>California Tax Summary</span>
            </div>
            {/* Return Insights — category, clickable */}
            <button className={styles.navCategory} onClick={() => navigate('/check-return/insights')}>
              <span className={styles.navCategoryLabel}>Return Insights</span>
            </button>
            {/* Other categories */}
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>Fatal Diagnostics</span>
            </div>
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>EF Critical diagnostics</span>
            </div>
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>Critical Diagnostics</span>
            </div>
            <div className={styles.navCategory}>
              <span className={styles.navCategoryLabel}>Overrides</span>
            </div>
            <div className={`${styles.navCategory} ${styles.navCategoryLast}`}>
              <span className={styles.navCategoryLabel}>Suggestions</span>
            </div>
          </div>

          {/* Main content — Federal Income Tax Summary */}
          <div className={styles.mainContent}>
            <p className={styles.sectionTitle}>Federal Income Tax Summary</p>

            {/* Table — border: 1px solid #c3ced5, border-radius: 16px, padding: 16px */}
            <div className={styles.tableContainer}>

              {/* Header row */}
              <div className={`${styles.tableRow} ${styles.tableRowHeader}`}>
                <span className={styles.colLabel} />
                <span className={`${styles.colValue} ${styles.colDemi}`}>2024</span>
                <span className={`${styles.colValue} ${styles.colDemi}`}>2023</span>
                <span className={`${styles.colValue} ${styles.colDemi}`}>Diff</span>
                <span className={styles.colAction} />
              </div>

              {/* Data rows */}
              {TABLE_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`${styles.tableRow} ${i === TABLE_ROWS.length - 1 ? styles.tableRowLast : ''}`}
                >
                  <span className={`${styles.colLabel} ${styles.colDemi}`}>{row.label}</span>
                  <span className={styles.colValue}>{row.v2024}</span>
                  <span className={styles.colValue}>{row.v2023}</span>
                  <span className={styles.colValue}>{row.diff}</span>
                  <span className={styles.colAction}>
                    {row.expandable && (
                      <button className={styles.expandBtn} aria-label="Expand">
                        <ChevronDown size="small" />
                      </button>
                    )}
                  </span>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
