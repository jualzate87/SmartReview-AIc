import { useLocation } from 'react-router-dom'
import { H3, B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import styles from '../styles/NotFoundPage.module.css'

export default function NotFoundPage() {
  const location = useLocation()
  const path = location.pathname

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <H3>Page not found</H3>
        <B3 className={styles.subtitle}>
          Add a route to this path <code className={styles.code}>{path}</code> in your prototype.
        </B3>
        <B3 className={styles.subtitle}>
          Ask your agent: <code className={styles.code}>/page table at {path}</code>
        </B3>
      </div>
    </div>
  )
}
