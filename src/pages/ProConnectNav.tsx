import { useState } from 'react'
import navLogo from '../assets/icons/nav/nav-logo.svg'
import ptgLogo from '../assets/icons/ptg-logo.svg'
import navWelcome from '../assets/icons/nav/nav-welcome.svg'
import navTaxReturns from '../assets/icons/nav/nav-tax-returns.svg'
import navClients from '../assets/icons/nav/nav-clients.svg'
import navEfile from '../assets/icons/nav/nav-efile.svg'
import navIntuitLink from '../assets/icons/nav/nav-intuit-link.svg'
import navReporting from '../assets/icons/nav/nav-reporting.svg'
import navTaxAdvisor from '../assets/icons/nav/nav-tax-advisor.svg'
import navQbAccountant from '../assets/icons/nav/nav-qb-accountant.svg'
import navAllSolutions from '../assets/icons/nav/nav-all-solutions.svg'
import navPurchase from '../assets/icons/nav/nav-purchase.svg'
import navCollapse from '../assets/icons/nav/nav-collapse.svg'
import styles from '../styles/ProConnectNav.module.css'

interface ProConnectNavProps {
  activeItem?: string
}

export default function ProConnectNav({ activeItem = 'tax-returns' }: ProConnectNavProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav className={`${styles.nav} ${collapsed ? styles.navCollapsed : ''}`}>
      {/* Logo */}
      <div className={styles.navLogo}>
        {collapsed
          ? <img src={ptgLogo} alt="ProConnect" className={styles.navLogoIconOnly} />
          : <img src={navLogo} alt="ProConnect" className={styles.navLogoImg} />
        }
      </div>

      {/* Welcome */}
      <NavItem icon={navWelcome} label="Welcome" collapsed={collapsed} active={activeItem === 'welcome'} />

      {/* Section: TAX */}
      <div className={styles.navDivider} />
      {!collapsed && <span className={styles.navSectionLabel}>TAX</span>}

      <NavItem icon={navTaxReturns}  label="Tax returns"      collapsed={collapsed} active={activeItem === 'tax-returns'} />
      <NavItem icon={navClients}     label="Clients"          collapsed={collapsed} active={activeItem === 'clients'} />
      <NavItem icon={navEfile}       label="E-File Dashboard" collapsed={collapsed} active={activeItem === 'efile'} />
      <NavItem icon={navIntuitLink}  label="Intuit Link"      collapsed={collapsed} active={activeItem === 'intuit-link'} />
      <NavItem icon={navReporting}   label="Reporting"        collapsed={collapsed} active={activeItem === 'reporting'} />

      {/* Section: WORKFLOW SOLUTIONS */}
      <div className={styles.navDivider} />
      {!collapsed && <span className={styles.navSectionLabel}>WORKFLOW SOLUTIONS</span>}

      <NavItem icon={navTaxAdvisor}   label="Tax Advisor"    collapsed={collapsed} active={activeItem === 'tax-advisor'} />
      <NavItem icon={navQbAccountant} label="QB Accountant"  collapsed={collapsed} active={activeItem === 'qb-accountant'} />
      <NavItem icon={navAllSolutions} label="All solutions"  collapsed={collapsed} active={activeItem === 'all-solutions'} />

      <div className={styles.navDivider} />
      <NavItem icon={navPurchase} label="Purchase" collapsed={collapsed} active={activeItem === 'purchase'} />

      {/* Spacer + Collapse */}
      <div className={styles.navSpacer} />
      <div className={styles.navDivider} />
      <button
        className={`${styles.navItem} ${styles.navCollapseBtn}`}
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <img
          src={navCollapse}
          alt=""
          className={`${styles.navIcon} ${collapsed ? styles.navIconFlipped : ''}`}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </nav>
  )
}

interface NavItemProps {
  icon: string
  label: string
  collapsed: boolean
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, collapsed, active, onClick }: NavItemProps) {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {active && <div className={styles.activeBar} />}
      <img src={icon} alt="" className={styles.navIcon} />
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
