import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import styles from '../styles/ReturnInsightsPage.module.css'

// Figma asset — Return Insights visualization image (valid 7 days)
const insightsImage = "https://www.figma.com/api/mcp/asset/644c8882-32db-4e16-aa4c-27d5b74b9275"

const CHECK_NAV_ITEMS = [
  { label: 'Tax Summary', active: false, link: '/check-return' },
  { label: 'Return Profile', active: false },
  { label: 'Return Insights', active: true },
  { label: 'Credits', active: false },
  { label: 'Deductions', active: false },
  { label: 'IRS Compliance', active: false },
  { label: 'Suggestions', active: false },
]

export default function ReturnInsightsPage() {
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
          {/* Left check navigation */}
          <div className={styles.leftNav}>
            {CHECK_NAV_ITEMS.map(item => (
              <button
                key={item.label}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}
                onClick={() => item.link && navigate(item.link)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Main content — Return Insights visualization */}
          <div className={styles.mainContent}>
            <img
              src={insightsImage}
              alt="Return Insights — Jessica Drake 2025 Tax Report"
              className={styles.insightsImage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
