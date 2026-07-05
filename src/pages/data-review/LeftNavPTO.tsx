import idsLogo from '../../assets/ids-logo.svg'
import styles from '../../styles/data-review/LeftNavPTO.module.css'

interface NavItemProps {
  icon: React.ReactNode
  active?: boolean
  label?: string
}

function NavItem({ icon, active = false, label }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ''}`} title={label}>
      {active && <div className={styles.activeBar} />}
      <span className={styles.navIconWrap}>{icon}</span>
    </div>
  )
}

function Divider() {
  return <div className={styles.divider} />
}

const iconColor = '#b3c5d1'
const iconActive = '#ffffff'

export default function LeftNavPTO() {
  return (
    <div className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src={idsLogo} alt="Intuit ProConnect" className={styles.logoImg} />
      </div>

      {/* Nav links */}
      <div className={styles.navLinks}>
        {/* Welcome */}
        <NavItem label="Welcome" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 8v9h5v-5h4v5h5V8L10 2z" stroke={iconColor} strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        } />

        {/* Tax Returns — active */}
        <NavItem label="Tax Returns" active icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2" width="14" height="16" rx="2" stroke={iconActive} strokeWidth="1.4"/>
            <path d="M6 6h8M6 9.5h8M6 13h5" stroke={iconActive} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        } />

        {/* Clients */}
        <NavItem label="Clients" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3" stroke={iconColor} strokeWidth="1.4"/>
            <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        } />

        {/* E-File Dashboard */}
        <NavItem label="E-File Dashboard" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2" stroke={iconColor} strokeWidth="1.4"/>
            <path d="M5 10h10M5 7h6M5 13h8" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M14 12l2 2-2 2" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />

        {/* Intuit Link */}
        <NavItem label="Intuit Link" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 10a4 4 0 0 1 6 0" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M7 7.5A6 6 0 0 1 17 12.5" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M5 5A9 9 0 0 1 18 14.5" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="5" cy="14" r="1.5" fill={iconColor}/>
          </svg>
        } />

        <Divider />

        {/* Tax Advisor */}
        <NavItem label="Tax Advisor" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l1.8 5.4H17l-4.5 3.3 1.7 5.3L10 13l-4.2 3 1.7-5.3L3 7.4h5.2L10 2z" stroke={iconColor} strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        } />

        {/* QB Accountant */}
        <NavItem label="QB Accountant" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke={iconColor} strokeWidth="1.4"/>
            <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5v2" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="10" cy="14.5" r="0.8" fill={iconColor}/>
          </svg>
        } />

        {/* All Solutions */}
        <NavItem label="All Solutions" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={iconColor} strokeWidth="1.4"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" stroke={iconColor} strokeWidth="1.4"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" stroke={iconColor} strokeWidth="1.4"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" stroke={iconColor} strokeWidth="1.4"/>
          </svg>
        } />
      </div>

      <Divider />

      {/* Purchase */}
      <NavItem label="Purchase" icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 4h2l2.4 8.4a1 1 0 0 0 .96.7h6.8a1 1 0 0 0 .96-.73L17 8H6" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="16" r="1.2" fill={iconColor}/>
          <circle cx="15.5" cy="16" r="1.2" fill={iconColor}/>
        </svg>
      } />

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Bottom nav */}
      <div className={styles.bottomNav}>
        <Divider />
        {/* Collapse */}
        <NavItem label="Collapse" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5l-5 5 5 5" stroke={iconColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />
      </div>
    </div>
  )
}
