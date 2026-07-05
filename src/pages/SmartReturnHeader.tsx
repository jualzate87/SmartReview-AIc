import { useNavigate } from 'react-router-dom'
import {
  Question, Notification, Settings, Lock, PersonThree,
  CircleInfo, ChevronDown, List, Edit, Checklist,
  Send, CloudUpload, AlarmClock, Rocket,
} from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../styles/SmartReturnHeader.module.css'

interface SmartReturnHeaderProps {
  activeTab?: 'smartreturn' | 'checkreturns'
}

export default function SmartReturnHeader({ activeTab = 'smartreturn' }: SmartReturnHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className={styles.header}>

      {/* ── Row 1: Product header 48px ── */}
      <div className={styles.row1}>
        <span className={styles.businessName}>Honey Tax Accounting</span>
        <div className={styles.row1Right}>
          <button className={styles.navBtn}>
            <Question size="small" />
            <span className={styles.navBtnLabel}>Help</span>
          </button>
          <button className={styles.navBtn}>
            <Notification size="small" />
            <span className={styles.navBtnLabel}>Notifications</span>
          </button>
          <button className={styles.navBtn}>
            <Settings size="small" />
            <span className={styles.navBtnLabel}>Settings</span>
          </button>
          <div className={styles.row1Divider} />
          <div className={styles.oiaaAvatar}>S</div>
        </div>
      </div>

      {/* ── Row 2: Client sub-header 63px ── */}
      <div className={styles.row2}>
        <div className={styles.row2Left}>
          <div className={styles.clientName}>Jessica<br />Drake</div>
          <Lock size="small" className={styles.lockIcon} />
          <button className={styles.clientProfileBtn}>
            <PersonThree size="small" />
            <span className={styles.clientProfileLabel}>Client profile</span>
          </button>
          <div className={styles.vertDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tax year</span>
            <div className={styles.metaValueRow}>
              <span className={styles.metaValue}>2025</span>
              <CircleInfo size="small" className={styles.circleInfo} />
            </div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Return type</span>
            <div className={styles.metaValueRow}>
              <span className={styles.metaValue}>1040</span>
              <CircleInfo size="small" className={styles.circleInfo} />
            </div>
          </div>
        </div>

        <div className={styles.row2Right}>
          {/* Avatar stack — D, H, +1 */}
          <div className={styles.avatarStack}>
            <div className={styles.avatarD}>D</div>
            <div className={styles.avatarH}>H</div>
            <div className={styles.avatarPlus}>+1</div>
          </div>

          {/* Select Assignee — ghost dropdown */}
          <button className={styles.ghostBtn}>
            Select Asignee <ChevronDown size="small" />
          </button>

          {/* Select Status — ghost dropdown */}
          <button className={styles.ghostBtn}>
            Select Status <ChevronDown size="small" />
          </button>

          {/* Notes — IDS secondary button */}
          <Button priority="secondary">Notes</Button>

          {/* Return actions — IDS primary button */}
          <Button priority="primary">
            Return actions <ChevronDown size="small" />
          </Button>
        </div>
      </div>

      {/* ── Row 3: Tab bar 46px ── */}
      <div className={styles.row3}>
        <div className={styles.tabsLeft}>
          <button className={styles.tab}>
            <List size="small" /> Profile
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'smartreturn' ? styles.tabActive : ''}`}
            onClick={() => navigate('/smart-return')}
          >
            <Rocket size="small" /> SmartReturn
          </button>
          <button className={styles.tab}>
            <Edit size="small" /> Input return
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'checkreturns' ? styles.tabActive : ''}`}
            onClick={() => navigate('/check-return')}
          >
            <Checklist size="small" /> Check return
          </button>
          <button className={styles.tab}>
            <Send size="small" /> File return
          </button>
        </div>
        <div className={styles.tabsRight}>
          <span className={styles.tabMeta}>
            <CloudUpload size="small" /> Saved at 11:34 AM
          </span>
          <span className={styles.tabMeta}>
            <AlarmClock size="small" /> Prep time: 0 mins
          </span>
          {/* Refresh forms — IDS secondary button */}
          <Button priority="secondary">Refresh forms</Button>
        </div>
      </div>

    </div>
  )
}
