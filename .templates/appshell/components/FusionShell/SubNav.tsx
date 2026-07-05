import { useEffect, useState } from 'react'
import styles from './FusionSubNav.module.css'
import { Bookmark, ChevronDown, ChevronRight, Diamond, MenuCollapse } from '@design-systems/icons'
import ClusterLayout from '../ClusterLayout'
import cx from 'classnames'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { useFusion } from '../../contexts/fusion'
import { B3, B4 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import FusionPopoverNavItem from './FusionPopoverNavItem'

import AccountingIcon from '../../assets/accounting_icon.svg'
import SalesIcon from '../../assets/sales-payments_icon.svg'
import ExpensesIcon from '../../assets/expenses_icon.svg'
import CustomerHubIcon from '../../assets/customers_icon.svg'
import TeamIcon from '../../assets/team_icon.svg'
import TimeIcon from '../../assets/time_icon.svg'
import ProjectsIcon from '../../assets/projects_icon.svg'
import InventoryIcon from '../../assets/inventory_icon.svg'
import BusinessTaxIcon from '../../assets/business-tax_icon.svg'
import LendingIcon from '../../assets/lending_icon.svg'
import PayrollIcon from '../../assets/payroll_icon.svg'
import Portal from '../Portal'

function SubNavLinks({
  links,
  pathPrefix,
  className,
  floating,
}: {
  links: { name: string; link: string }[]
  pathPrefix: string
  className?: string
  floating?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [urlActiveLink, setUrlActiveLink] = useState<string | undefined>(undefined)

  function onLinkClick(link: string) {
    navigate(`${pathPrefix}/app${link}`)
  }

  useEffect(() => {
    const raw = pathPrefix === '/' ? location.pathname : location.pathname.replace(pathPrefix, '')
    const pathNorm = raw.startsWith('/') ? raw : '/' + raw
    setUrlActiveLink(links.find((link) => pathNorm.includes(link.link))?.name)
  }, [location.pathname, links, pathPrefix])

  return (
    <ul className={cx(styles.subNavLinks, className)} key={'subnav-' + links.length}>
      {links.map((link) => (
        <li key={link.name + '-' + link.link + '-subnav'}>
          <button
            onClick={() => onLinkClick(link.link)}
            className={cx(styles.subNavLink, {
              [styles.subNavLinkActive]: urlActiveLink === link.name,
              [styles.subNavLinkSub]: true,
              [styles.subNavLinkSubFloating]: floating,
            })}
          >
            <B3 weight="medium" className={styles.subNavLinkText}>
              {link.name}
            </B3>
            {!floating && <Bookmark size={'xsmall'} />}
          </button>
        </li>
      ))}
    </ul>
  )
}

function getActiveSection(pathname: string, pathPrefix: string): string | null {
  const path = pathname
  if (path.includes(pathPrefix + '/app/accounting')) return 'Accounting'
  if (path.includes(pathPrefix + '/app/sales-payments')) return 'Sales & Get Paid'
  if (path.includes(pathPrefix + '/app/expenses-bills')) return 'Expenses & Bills'
  if (path.includes(pathPrefix + '/app/customer-hub')) return 'Customer Hub'
  if (path.includes(pathPrefix + '/app/team')) return 'Team'
  if (path.includes(pathPrefix + '/app/time')) return 'Time'
  if (path.includes(pathPrefix + '/app/projects')) return 'Projects'
  if (path.includes(pathPrefix + '/app/inventory')) return 'Inventory'
  if (path.includes(pathPrefix + '/app/sales-tax')) return 'Sales Tax'
  if (path.includes(pathPrefix + '/app/business-tax')) return 'Business Tax'
  if (path.includes(pathPrefix + '/app/lending')) return 'Lending'
  if (path.includes(pathPrefix + '/app/marketing')) return 'Marketing'
  if (path.includes(pathPrefix + '/app/payroll')) return 'Payroll'
  return null
}

function SubNavSection({
  section,
  links,
  activeSection,
  toggleSection,
  openSections,
  pathPrefix,
  paidUpgrade,
  icon,
  floating,
}: {
  section: string
  links: { name: string; link: string }[]
  activeSection: string | null
  toggleSection: (section: string) => void
  pathPrefix: string
  paidUpgrade?: boolean
  icon: string
  openSections: Set<string>
  floating?: boolean
}) {
  return (
    <FusionPopoverNavItem
      popover={<SubNavLinks links={links} pathPrefix={pathPrefix} floating={floating} />}
      disabled={!floating || paidUpgrade}
      id={`subnav-${section}`}
    >
      <div
        className={cx(styles.subNavSectionContainer, {
          [styles.subNavSectionContainerOpen]: openSections.has(section),
        })}
        key={section}
      >
        <button
          type="button"
          className={cx(styles.subNavLink, {
            [styles.subNavLinkActive]: activeSection === section && !openSections.has(section),
          })}
          onClick={() => toggleSection(section)}
        >
          <ClusterLayout justifyContent="spaceBetween">
            <ClusterLayout>
              <span className={styles.subNavLinkIcon}>
                <img src={icon} alt={section} />
              </span>
              <B3 weight="medium">{section}</B3>
            </ClusterLayout>
            {!paidUpgrade ? (
              !floating ? (
                <ChevronDown
                  className={cx(styles.accordionIcon, {
                    [styles.accordionIconOpen]: openSections.has(section),
                  })}
                  size={'xsmall'}
                />
              ) : (
                <ChevronRight size={'xsmall'} />
              )
            ) : (
              <Diamond size={'xsmall'} />
            )}
          </ClusterLayout>
        </button>
        {!paidUpgrade && !floating && (
          <div
            className={cx(styles.subNavSectionContent, {
              [styles.subNavSectionContentOpen]: openSections.has(section),
            })}
          >
            <SubNavLinks
              links={links}
              pathPrefix={pathPrefix}
              className={floating ? styles.subNavLinksFloating : undefined}
            />
          </div>
        )}
      </div>
    </FusionPopoverNavItem>
  )
}

function SubNav({ floating }: { floating?: boolean }) {
  const { toggleSubNav, subNavOpen, sidePanelOpen, pathPrefix } = useFusion()
  const location = useLocation()
  const activeSection = getActiveSection(location.pathname, pathPrefix)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (activeSection) {
      setOpenSections((prev) => {
        if (prev.has(activeSection)) return prev
        const next = new Set(prev)
        next.add(activeSection)
        return next
      })
    }
  }, [activeSection])

  function toggleSection(section: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const emptySection = [
    {
      name: '',
      link: '',
    },
  ]

  const accountingLinks = [
    { name: 'Bank Transactions', link: '/accounting/bank-transactions' },
    {
      name: 'Integration transactions',
      link: '/accounting/integration-transactions',
    },
    { name: 'Receipts', link: '/accounting/receipts' },
    { name: 'Reconcile', link: '/accounting/reconcile' },
    { name: 'Rules', link: '/accounting/rules' },
    { name: 'Chart of accounts', link: '/accounting/chart-of-accounts' },
    {
      name: 'Recurring transactions',
      link: '/accounting/recurring-transactions',
    },
    { name: 'Prepaid expenses', link: '/accounting/prepaid-expenses' },
    { name: 'My accountant', link: '/accounting/my-accountant' },
    { name: 'Live Experts', link: '/accounting/live-experts' },
  ]

  const expensesAndBillsLinks = [
    { name: 'Overview', link: '/expenses-bills/overview' },
    {
      name: 'Expense transactions',
      link: '/expenses-bills/expense-transactions',
    },
    { name: 'Vendors', link: '/expenses-bills/vendors' },
    { name: 'Bills', link: '/expenses-bills/bills' },
    { name: 'Bill payments', link: '/expenses-bills/bill-payments' },
    { name: 'Mileage', link: '/expenses-bills/mileage' },
    { name: 'Expense claims', link: '/expenses-bills/expense-claims' },
    { name: 'Contractors', link: '/expenses-bills/contractors' },
    { name: '1099s', link: '/expenses-bills/1099s' },
  ]

  const salesAndPaidLinks = [
    { name: 'Overview', link: '/sales-payments/overview' },
    { name: 'Sales transactions', link: '/sales-payments/sales-transactions' },
    { name: 'Invoices', link: '/sales-payments/invoices' },
    { name: 'Payment links', link: '/sales-payments/payment-links' },
    { name: 'Recurring payments', link: '/sales-payments/recurring-payments' },
    { name: 'Sales orders', link: '/sales-payments/sales-orders' },
    { name: 'Sales channels', link: '/sales-payments/sales-channels' },
    { name: 'QuickBooks payouts', link: '/sales-payments/quickbooks-payouts' },
    { name: 'Products & services', link: '/sales-payments/products-services' },
  ]

  const customerHubLinks = [
    { name: 'Overview', link: '/customer-hub/overview' },
    { name: 'Customers & Leads', link: '/customer-hub/customers' },
    { name: 'Opportunities', link: '/customer-hub/opportunities' },
    { name: 'Estimates', link: '/customer-hub/estimates' },
    { name: 'Proposals', link: '/customer-hub/proposals' },
    { name: 'Contracts', link: '/customer-hub/contracts' },
    { name: 'Appointments', link: '/customer-hub/appointments' },
  ]

  const teamLinks = [
    { name: 'Employees', link: '/team/employees' },
    { name: 'Contractors', link: '/team/contractors' },
    { name: "Workers' comp", link: '/team/workers-comp' },
  ]

  const timeLinks = [
    { name: 'Time entries', link: '/time/time-entries' },
    { name: 'Schedule', link: '/time/schedule' },
  ]

  const projectsLinks = [
    { name: 'Overview', link: '/projects/overview' },
    { name: 'Projects', link: '/projects/projects' },
  ]

  const inventoryLinks = [
    { name: 'Overview', link: '/inventory/overview' },
    { name: 'Inventory', link: '/inventory/inventory' },
    { name: 'Purchase orders', link: '/inventory/purchase-orders' },
    { name: 'Item receipts', link: '/inventory/item-receipts' },
    { name: 'Sales orders', link: '/inventory/sales-orders' },
    { name: 'Shipping labels', link: '/inventory/shipping-labels' },
  ]

  const businessTaxLinks = [
    { name: 'Overview', link: '/business-tax/overview' },
    { name: 'Tax summary', link: '/business-tax/tax-summary' },
    { name: 'Year-end filing', link: '/business-tax/year-end-filing' },
  ]

  const lendingLinks = [
    { name: 'Overview', link: '/lending/overview' },
    { name: 'Term loans', link: '/lending/term-loans' },
    { name: 'Line of credit', link: '/lending/line-of-credit' },
    { name: 'Credit cards', link: '/lending/credit-cards' },
    { name: 'QuickBooks Checkin', link: '/lending/quickbooks-checkin' },
  ]

  return (
    <div
      className={cx(styles.subNav, {
        [styles.subNavOpen]: subNavOpen,
        [styles.sidePanelOpen]: sidePanelOpen,
        [styles.visible]: true,
        [styles.floating]: floating,
      })}
    >
      {!floating && (
        <ClusterLayout justifyContent="spaceBetween" nowrap className={styles.header}>
          <B4 weight="demi">All Apps</B4>
          <Portal id="subnav-toggle">
            <div
              className={cx(styles.subnavToggle, {
                [styles.subNavOpen]: subNavOpen,
                [styles.hidden]: !location.pathname.includes('/app'),
              })}
            >
              <IconControl aria-label="Toggle subnav" onClick={toggleSubNav}>
                <MenuCollapse size={'small'} />
              </IconControl>
            </div>
          </Portal>
        </ClusterLayout>
      )}
      <nav>
        <SubNavSection
          section="Accounting"
          links={accountingLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={AccountingIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Expenses & Bills"
          links={expensesAndBillsLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={ExpensesIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Sales & Get Paid"
          links={salesAndPaidLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={SalesIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />

        <SubNavSection
          section="Customer Hub"
          links={customerHubLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={CustomerHubIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Payroll"
          links={emptySection}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={PayrollIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          paidUpgrade
          floating={floating}
        />
        <SubNavSection
          section="Team"
          links={teamLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={TeamIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Time"
          links={timeLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={TimeIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Projects"
          links={projectsLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={ProjectsIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Inventory"
          links={inventoryLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={InventoryIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />

        <SubNavSection
          section="Business Tax"
          links={businessTaxLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={BusinessTaxIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
        <SubNavSection
          section="Lending"
          links={lendingLinks}
          pathPrefix={pathPrefix}
          openSections={openSections}
          icon={LendingIcon}
          activeSection={activeSection}
          toggleSection={toggleSection}
          floating={floating}
        />
      </nav>
    </div>
  )
}

export default SubNav
