import styles from './GlobalCreate.module.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import ClusterLayout from '../ClusterLayout'
import { useNavigate } from 'react-router-dom'
import StackLayout from '../StackLayout'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { useFusion } from '../../contexts/fusion'

type CreateAction = {
  name: string
  link: string
  badge?: {
    status: 'new' | 'beta' | 'info' | 'success' | 'pending' | 'warning' | 'error' | 'draft'
    label: string
  }
}

type GlobalCreateItem = {
  section: string
  items: CreateAction[]
}

const items: GlobalCreateItem[] = [
  {
    section: 'Customers',
    items: [
      { name: 'Invoice', link: '/invoice' },
      { name: 'Payment links', link: '/payment-links' },
      { name: 'Receive payment', link: '/receive-payment' },
      { name: 'Statement', link: '/statement' },
      { name: 'Estimate', link: '/estimate' },
      { name: 'Sales order', link: '/sales-order' },
      { name: 'Credit memo', link: '/credit-memo' },
      { name: 'Sales receipt', link: '/sales-receipt' },
      { name: 'Recurring payment', link: '/recurring-payment' },
      { name: 'Shipping label', link: '/shipping-label' },
      { name: 'Refund receipt', link: '/refund-receipt' },
      { name: 'Delayed credit', link: '/delayed-credit' },
      { name: 'Delayed charge', link: '/delayed-charge' },
      { name: 'Add customer', link: '/add-customer' },
      { name: 'Contract', link: '/contract' },
    ],
  },
  {
    section: 'Vendors',
    items: [
      { name: 'Expense', link: '/expense' },
      { name: 'Check', link: '/check' },
      { name: 'Bill', link: '/bill' },
      { name: 'Pay bills', link: '/pay-bills' },
      {
        name: 'Item receipt',
        link: '/item-receipt',
        badge: { status: 'new', label: 'New' },
      },
      { name: 'Vendor credit', link: '/vendor-credit' },
      { name: 'Credit card credit', link: '/credit-card-credit' },
      { name: 'Print checks', link: '/print-checks' },
      { name: 'Add vendor', link: '/add-vendor' },
    ],
  },
  {
    section: 'Team',
    items: [
      { name: 'Payroll', link: '/payroll' },
      { name: 'Single time activity', link: '/single-time-activity' },
      { name: 'Weekly timesheet', link: '/weekly-timesheet' },
      { name: 'Add contractor', link: '/add-contractor' },
    ],
  },
  {
    section: 'Projects',
    items: [
      { name: 'Project', link: '/project' },
      { name: 'Project estimate', link: '/project-estimate' },
    ],
  },
  {
    section: 'Other',
    items: [
      { name: 'Task', link: '/task' },
      { name: 'Bank deposit', link: '/bank-deposit' },
      { name: 'Batch transactions', link: '/batch-transactions' },
      { name: 'Transfer', link: '/transfer' },
      { name: 'Journal entry', link: '/journal-entry' },
      { name: 'Apply for Capital', link: '/apply-for-capital' },
      { name: 'Add product/service', link: '/add-product-service' },
    ],
  },
]

function GlobalCreate() {
  const { pathPrefix } = useFusion()
  const navigate = useNavigate()
  return (
    <ClusterLayout
      nowrap
      justifyContent="spaceBetween"
      alignItems="flexStart"
      className={styles.root}
      gap={4}
    >
      {items.map((item) => (
        <StackLayout gap={2} key={item.section}>
          <B3 weight="demi" className={styles.sectionTitle}>
            {item.section}
          </B3>
          <StackLayout gap={1}>
            {item.items.map((action) => (
              <button
                key={action.name}
                onClick={() => navigate(pathPrefix + action.link)}
                className={styles.item}
              >
                <B3 weight="regular">{action.name}</B3>
                {action.badge && (
                  <Badge status={action.badge.status} size="small">
                    {action.badge.label}
                  </Badge>
                )}
              </button>
            ))}
          </StackLayout>
        </StackLayout>
      ))}
    </ClusterLayout>
  )
}

export default GlobalCreate
