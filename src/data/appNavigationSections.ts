import AccountingIcon from '../assets/accounting_icon.svg'
import SalesIcon from '../assets/sales-payments_icon.svg'
import ExpensesIcon from '../assets/expenses_icon.svg'
import CustomerHubIcon from '../assets/customers_icon.svg'
import TeamIcon from '../assets/team_icon.svg'
import TimeIcon from '../assets/time_icon.svg'
import ProjectsIcon from '../assets/projects_icon.svg'
import InventoryIcon from '../assets/inventory_icon.svg'
import BusinessTaxIcon from '../assets/business-tax_icon.svg'
import LendingIcon from '../assets/lending_icon.svg'
import PayrollIcon from '../assets/payroll_icon.svg'

export interface NavLink {
  name: string
  link: string
}

export interface AppNavigationSection {
  id: string
  label: string
  icon: string
  links: NavLink[]
  paidUpgrade?: boolean
}

export const appNavigationSections: AppNavigationSection[] = [
  {
    id: 'accounting',
    label: 'Accounting',
    icon: AccountingIcon,
    links: [
      { name: 'Bank Transactions', link: '/accounting/bank-transactions' },
      { name: 'Integration transactions', link: '/accounting/integration-transactions' },
      { name: 'Receipts', link: '/accounting/receipts' },
      { name: 'Reconcile', link: '/accounting/reconcile' },
      { name: 'Rules', link: '/accounting/rules' },
      { name: 'Chart of accounts', link: '/accounting/chart-of-accounts' },
      { name: 'Recurring transactions', link: '/accounting/recurring-transactions' },
      { name: 'Prepaid expenses', link: '/accounting/prepaid-expenses' },
      { name: 'My accountant', link: '/accounting/my-accountant' },
      { name: 'Live Experts', link: '/accounting/live-experts' },
    ],
  },
  {
    id: 'expenses-bills',
    label: 'Expenses & Bills',
    icon: ExpensesIcon,
    links: [
      { name: 'Overview', link: '/expenses-bills/overview' },
      { name: 'Expense transactions', link: '/expenses-bills/expense-transactions' },
      { name: 'Vendors', link: '/expenses-bills/vendors' },
      { name: 'Bills', link: '/expenses-bills/bills' },
      { name: 'Bill payments', link: '/expenses-bills/bill-payments' },
      { name: 'Mileage', link: '/expenses-bills/mileage' },
      { name: 'Expense claims', link: '/expenses-bills/expense-claims' },
      { name: 'Contractors', link: '/expenses-bills/contractors' },
      { name: '1099s', link: '/expenses-bills/1099s' },
    ],
  },
  {
    id: 'sales-payments',
    label: 'Sales & Get Paid',
    icon: SalesIcon,
    links: [
      { name: 'Overview', link: '/sales-payments/overview' },
      { name: 'Sales transactions', link: '/sales-payments/sales-transactions' },
      { name: 'Invoices', link: '/sales-payments/invoices' },
      { name: 'Payment links', link: '/sales-payments/payment-links' },
      { name: 'Recurring payments', link: '/sales-payments/recurring-payments' },
      { name: 'Sales orders', link: '/sales-payments/sales-orders' },
      { name: 'Sales channels', link: '/sales-payments/sales-channels' },
      { name: 'QuickBooks payouts', link: '/sales-payments/quickbooks-payouts' },
      { name: 'Products & services', link: '/sales-payments/products-services' },
    ],
  },
  {
    id: 'customer-hub',
    label: 'Customer Hub',
    icon: CustomerHubIcon,
    links: [
      { name: 'Overview', link: '/customer-hub/overview' },
      { name: 'Customers & Leads', link: '/customer-hub/customers' },
      { name: 'Opportunities', link: '/customer-hub/opportunities' },
      { name: 'Estimates', link: '/customer-hub/estimates' },
      { name: 'Proposals', link: '/customer-hub/proposals' },
      { name: 'Contracts', link: '/customer-hub/contracts' },
      { name: 'Appointments', link: '/customer-hub/appointments' },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: PayrollIcon,
    links: [{ name: '', link: '' }],
    paidUpgrade: true,
  },
  {
    id: 'team',
    label: 'Team',
    icon: TeamIcon,
    links: [
      { name: 'Employees', link: '/team/employees' },
      { name: 'Contractors', link: '/team/contractors' },
      { name: "Workers' comp", link: '/team/workers-comp' },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    icon: TimeIcon,
    links: [
      { name: 'Time entries', link: '/time/time-entries' },
      { name: 'Schedule', link: '/time/schedule' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: ProjectsIcon,
    links: [
      { name: 'Overview', link: '/projects/overview' },
      { name: 'Projects', link: '/projects/projects' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: InventoryIcon,
    links: [
      { name: 'Overview', link: '/inventory/overview' },
      { name: 'Inventory', link: '/inventory/inventory' },
      { name: 'Purchase orders', link: '/inventory/purchase-orders' },
      { name: 'Item receipts', link: '/inventory/item-receipts' },
      { name: 'Sales orders', link: '/inventory/sales-orders' },
      { name: 'Shipping labels', link: '/inventory/shipping-labels' },
    ],
  },
  {
    id: 'business-tax',
    label: 'Business Tax',
    icon: BusinessTaxIcon,
    links: [
      { name: 'Overview', link: '/business-tax/overview' },
      { name: 'Tax summary', link: '/business-tax/tax-summary' },
      { name: 'Year-end filing', link: '/business-tax/year-end-filing' },
    ],
  },
  {
    id: 'lending',
    label: 'Lending',
    icon: LendingIcon,
    links: [
      { name: 'Overview', link: '/lending/overview' },
      { name: 'Term loans', link: '/lending/term-loans' },
      { name: 'Line of credit', link: '/lending/line-of-credit' },
      { name: 'Credit cards', link: '/lending/credit-cards' },
      { name: 'QuickBooks Checkin', link: '/lending/quickbooks-checkin' },
    ],
  },
]

/**
 * Resolve breadcrumb labels from the current pathname.
 * Returns the section label and page label for the matched route,
 * or null if the pathname doesn't match any known app route.
 */
export function getRouteLabels(pathname: string, pathPrefix = '') {
  const normalised = pathPrefix === '/' ? pathname : pathname.replace(pathPrefix, '')

  for (const section of appNavigationSections) {
    const match = section.links.find((item) => normalised === `/app${item.link}`)
    if (match) {
      return { sectionLabel: section.label, sectionId: section.id, pageLabel: match.name }
    }
    if (normalised === `/app/${section.id}`) {
      return { sectionLabel: section.label, sectionId: section.id, pageLabel: section.label }
    }
  }
  return null
}

/**
 * Determine which section is active based on the current pathname.
 * Used by SubNav to highlight the active section.
 */
export function getActiveSection(pathname: string, pathPrefix: string): string | null {
  for (const section of appNavigationSections) {
    if (pathname.includes(`${pathPrefix}/app/${section.id}`)) {
      return section.label
    }
  }
  return null
}
