import { ChevronDown, ChevronRight, Document } from '@design-systems/icons'
import { useState } from 'react'
import { SOURCE_DOCUMENTS, type SourceDocument } from '../../data/sourceDocuments'
import type { TopTab } from './ReviewTab'
import styles from '../../styles/data-review/SourceDocumentList.module.css'

interface SourceDocumentListProps {
  activeDocId?: string
  onSelectDoc: (doc: SourceDocument) => void
  /** When false, list starts collapsed */
  defaultExpanded?: boolean
}

export default function SourceDocumentList({
  activeDocId,
  onSelectDoc,
  defaultExpanded = true,
}: SourceDocumentListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronDown size="small" /> : <ChevronRight size="small" />}
        <span className={styles.headerLabel}>All source documents</span>
        <span className={styles.headerCount}>{SOURCE_DOCUMENTS.length}</span>
      </button>

      {expanded && (
        <ul className={styles.list} role="list">
          {SOURCE_DOCUMENTS.map(doc => (
            <li key={doc.id}>
              <button
                className={`${styles.docItem} ${activeDocId === doc.id ? styles.docItemActive : ''}`}
                onClick={() => onSelectDoc(doc)}
                aria-current={activeDocId === doc.id ? 'true' : undefined}
              >
                <Document size="small" className={styles.docIcon} />
                <div className={styles.docInfo}>
                  <span className={styles.docLabel}>{doc.label}</span>
                  <span className={styles.docMeta}>{doc.formType} · {doc.payer}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Derive the active source document id from current tab + sub-tab state. */
export function getActiveDocId(
  activeTopTab: TopTab,
  activeSubTab: string,
  activeDivPayer: string,
  activeIntPayer: string,
): string | undefined {
  const match = SOURCE_DOCUMENTS.find(d => {
    if (d.tab !== activeTopTab) return false
    if (activeTopTab === 'w2s') return d.subTab === activeSubTab
    if (activeTopTab === '1099-divs') return d.subTab === activeDivPayer
    if (activeTopTab === '1099-ints') return d.subTab === activeIntPayer
    if (activeTopTab === '1099-rs') return d.subTab === 'meridian'
    if (activeTopTab === '1099-necs') return d.subTab === 'summit'
    return false
  })
  return match?.id
}
