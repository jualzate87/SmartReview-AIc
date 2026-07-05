import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleCheckFill, NewWindow, Notification, Settings, Lock, ChevronDown, List, Rocket, Edit, Checklist, Send, CloudUpload, CircleClock } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import helpIcon from '../assets/icons/help-icon.svg'
import sidebarTaxOrganizerIcon from '../assets/icons/sidebar-tax-organizer.svg'
import sidebarImportHubIcon from '../assets/icons/sidebar-import-hub.svg'
import sidebarDocumentsListIcon from '../assets/icons/sidebar-documents-list.svg'
import sidebarClientActivityIcon from '../assets/icons/sidebar-client-activity.svg'
import sidebarFlaggedItemsIcon from '../assets/icons/sidebar-flagged-items.svg'
import sidebarCommentsIcon from '../assets/icons/sidebar-comments.svg'
import styles from '../styles/SmartReturnPage.module.css'
import openStyles from '../styles/OpenReturnPage.module.css'

export default function SmartReturnPage() {
  const navigate = useNavigate()

  // Force #205ea3 blue on IDS buttons for this page regardless of saved theme
  useEffect(() => {
    const el = document.documentElement
    const prevTheme = el.getAttribute('data-theme')
    const prevStyle = el.style.getPropertyValue('--color-action-standard')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prevTheme) el.setAttribute('data-theme', prevTheme)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  const handleReviewReturn = () => {
    window.open(`${window.location.origin}${window.location.pathname}#/data-review?agent=true`, '_blank')
  }

  return (
    <div className={styles.page} data-theme="intuit">

      <div className={styles.rightSide}>
        {/* ── Top product bar ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.firmName}>HONEY TAX ACCOUNTING</span>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.topNavBtn}><img src={helpIcon} alt="" style={{width:20,height:20}} /><span>Help</span></button>
            <button className={styles.topNavBtn}><Notification size="small" /><span>Notifications</span></button>
            <button className={styles.topNavBtn}><Settings size="small" /><span>Settings</span></button>
            <div className={styles.avatar}>S</div>
          </div>
        </div>

        {/* ── Return sub-header ── */}
        <div className={openStyles.returnSubHeader}>
          <div className={openStyles.returnSubHeaderLeft}>
            <div className={openStyles.clientName}>
              <span className={openStyles.clientNameText}>Jessica</span>
              <span className={openStyles.clientNameText}>Drake</span>
            </div>
            <div className={openStyles.lockIcon}><Lock size="small" /></div>
            <button className={openStyles.clientProfileBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#5d686f"/></svg>
              Client profile
            </button>
            <div className={openStyles.subHeaderDivider} />
            <div className={openStyles.metaItem}>
              <span className={openStyles.metaLabel}>Tax year</span>
              <div className={openStyles.metaValue}>
                <span className={openStyles.metaValueText}>2025</span>
                <span className={openStyles.metaInfoIcon}><ChevronDown size="xsmall" /></span>
              </div>
            </div>
            <div className={openStyles.metaItem}>
              <span className={openStyles.metaLabel}>Return type</span>
              <div className={openStyles.metaValue}>
                <span className={openStyles.metaValueText}>1040</span>
                <span className={openStyles.metaInfoIcon}><ChevronDown size="xsmall" /></span>
              </div>
            </div>
          </div>
          <div className={openStyles.returnSubHeaderRight}>
            <div className={openStyles.presenceGroup}>
              <div className={openStyles.presenceAvatar} style={{ background: '#236cff' }}>D</div>
              <div className={openStyles.presenceAvatar} style={{ background: '#7c00f6' }}>H</div>
              <div className={`${openStyles.presenceAvatar} ${openStyles.presenceOverflow}`}>+1</div>
            </div>
            <button className={openStyles.dropdownBtn}>Select Assignee <ChevronDown size="small" /></button>
            <button className={openStyles.dropdownBtn}>Select Status <ChevronDown size="small" /></button>
            <button className={openStyles.returnActionsBtn}>Return actions <ChevronDown size="small" /></button>
          </div>
        </div>

        {/* ── Tabs row ── */}
        <div className={openStyles.tabsRow}>
          <div className={openStyles.tabsRowLeft}>
            {[
              { icon: <List size="small" />, label: 'Profile', active: false, onClick: () => {} },
              { icon: <Rocket size="small" />, label: 'SmartReturn', active: true, onClick: () => {} },
              { icon: <Edit size="small" />, label: 'Input return', active: false, onClick: () => {} },
              { icon: <Checklist size="small" />, label: 'Check return', active: false, onClick: () => navigate('/check-return') },
              { icon: <Send size="small" />, label: 'File return', active: false, onClick: () => {} },
            ].map(tab => (
              <button key={tab.label} className={`${openStyles.tab} ${tab.active ? openStyles.tabActive : ''}`} onClick={tab.onClick}>
                <div className={openStyles.tabContent}>
                  {tab.icon}
                  <span className={openStyles.tabLabel}>{tab.label}</span>
                </div>
                <div className={openStyles.tabStroke} />
              </button>
            ))}
          </div>
          <div className={openStyles.tabsRowRight}>
            <div className={openStyles.tabsMeta}>
              <div className={openStyles.tabsMetaItem}><CloudUpload size="small" />Saved at 11:34 AM</div>
              <div className={openStyles.tabsMetaItem}><CircleClock size="small" />Prep time: 0 mins</div>
            </div>
            <button className={openStyles.refreshFormsBtn}>Refresh forms</button>
          </div>
        </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Main content area */}
        <div className={styles.main}>
          {/* Center card */}
          <div className={styles.card}>
            <CircleCheckFill size="large" className={styles.checkIcon} />
            <h2 className={styles.cardTitle}>The return is ready for review</h2>
            <p className={styles.cardBody}>
              Your review starts in a <strong>new tab</strong>, showing output forms first
            </p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
            </div>
            <Button priority="primary" onClick={handleReviewReturn}>
              Review the return <NewWindow size="small" />
            </Button>
            <p className={styles.feedback}>
              How was your import?{' '}
              <button className={styles.feedbackLink}>Share your feedback</button>
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className={styles.sidebar}>
          <button className={styles.sidebarItem}>
            <img src={sidebarTaxOrganizerIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Tax<br />Organizer</span>
          </button>
          <button className={styles.sidebarItem}>
            <img src={sidebarImportHubIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Import<br />hub</span>
          </button>
          <button className={styles.sidebarItem}>
            <img src={sidebarDocumentsListIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Documents<br />list</span>
          </button>
          <button className={styles.sidebarItem}>
            <img src={sidebarClientActivityIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Client<br />activity</span>
          </button>
          <div className={styles.sidebarDivider} />
          <button className={styles.sidebarItem}>
            <img src={sidebarFlaggedItemsIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Flagged<br />items</span>
          </button>
          <button className={styles.sidebarItem}>
            <img src={sidebarCommentsIcon} alt="" className={openStyles.sidebarIcon} />
            <span>Comments</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
