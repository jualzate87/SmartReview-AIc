import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheckFill, Document, Flag, Comment, InboxActivity } from '@design-systems/icons'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import styles from '../styles/ReadyToImportPage.module.css'

const DOCUMENTS = [
  { type: 'W-2',       name: 'W-2 Wages',       source: 'Tech Circle' },
  { type: '1099',      name: '1099-INT Interest', source: 'Unwavering Financial' },
  { type: '1099',      name: '1099-DIV Dividends', source: 'Unwavering Financial' },
]

export default function ReadyToImportPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // When loading starts, auto-navigate after 3s (matches CSS animation)
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => navigate('/smart-return'), 3000)
    return () => clearTimeout(timer)
  }, [loading, navigate])

  return (
    <div className={styles.page} data-theme="intuit">
      <SmartReturnHeader activeTab="smartreturn" />

      <div className={styles.body}>
        <LeftNavPTO />

        <div className={styles.main}>
          <div className={styles.card}>

            {!loading ? (
              <div className={styles.cardInner}>
                {/* Client row */}
                <div className={styles.clientRow}>
                  <div className={styles.clientAvatar}>JD</div>
                  <div className={styles.clientInfo}>
                    <p className={styles.clientName}>Jessica Drake</p>
                    <p className={styles.clientMeta}>Form 1040 · Tax Year 2025</p>
                  </div>
                </div>

                {/* Document list */}
                <div>
                  <p className={styles.docsLabel}>Documents ready to import</p>
                  <div className={styles.docList}>
                    {DOCUMENTS.map((doc, i) => (
                      <div key={i} className={styles.docRow}>
                        <div className={styles.docLeft}>
                          <div className={styles.docIcon}>{doc.type}</div>
                          <div>
                            <p className={styles.docName}>{doc.name}</p>
                            <p className={styles.docSource}>{doc.source}</p>
                          </div>
                        </div>
                        <div className={styles.docReady}>
                          <CircleCheckFill size="small" />
                          Ready
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className={styles.importBtn} onClick={() => setLoading(true)}>
                  Import ready documents
                </button>
              </div>
            ) : (
              <div className={styles.loadingCard}>
                <p className={styles.loadingTitle}>Preparing Jessica's return...</p>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} />
                </div>
                <p className={styles.loadingSubtext}>
                  Importing documents and setting up Form 1040 for Tax Year 2025
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right sidebar */}
        <div className={styles.sidebar}>
          <button className={styles.sidebarItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#6b6c72" strokeWidth="1.5"/><path d="M8 7h8M8 11h8M8 15h5" stroke="#6b6c72" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span>Tax<br />Organizer</span>
          </button>
          <button className={styles.sidebarItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6b6c72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Import<br />hub</span>
          </button>
          <button className={styles.sidebarItem}>
            <Document size="small" />
            <span>Documents<br />list</span>
          </button>
          <button className={styles.sidebarItem}>
            <InboxActivity size="small" />
            <span>Client<br />activity</span>
          </button>
          <div className={styles.sidebarDivider} />
          <button className={styles.sidebarItem}>
            <Flag size="small" />
            <span>Flagged<br />items</span>
          </button>
          <button className={styles.sidebarItem}>
            <Comment size="small" />
            <span>Comments</span>
          </button>
        </div>
      </div>
    </div>
  )
}
