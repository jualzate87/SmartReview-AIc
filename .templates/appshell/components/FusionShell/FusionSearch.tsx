import { Search } from '@design-systems/icons'
import styles from './FusionSearch.module.css'

function FusionSearch() {
  return (
    <div className={styles.root}>
      <Search size={'xsmall'} className={styles.icon} />
      <span className={styles.text}>
        Navigate or search for transactions, contacts, reports, help, and more.
      </span>
    </div>
  )
}
export default FusionSearch
