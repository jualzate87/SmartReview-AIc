import { useEffect, useRef } from 'react'
import { Close, Document } from '@design-systems/icons'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/TaxControlDocPopover.module.css'

interface TaxControlDocPopoverProps {
  rowLabel: string
  docs: TaxControlDocEntry[]
  /** Navigate to the source document for a specific doc field */
  onNavigateToDoc?: (docId: string) => void
  anchorRect: DOMRect
  onClose: () => void
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function TaxControlDocPopover({
  rowLabel,
  docs,
  onNavigateToDoc,
  anchorRect,
  onClose,
}: TaxControlDocPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const total = docs.reduce((sum, d) => sum + (d.hint ?? 0), 0)

  const top = anchorRect.top + anchorRect.height / 2
  const left = anchorRect.right + 8

  return (
    <div
      ref={ref}
      className={styles.popover}
      style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 300 }}
      role="dialog"
      aria-label={`Source documents for ${rowLabel}`}
    >
      <div className={styles.header}>
        <span className={styles.title}>{rowLabel}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>
      <p className={styles.subtitle}>
        Select a source below to open its document.
      </p>

      <div className={styles.docFields}>
        {docs.map(doc => {
          const amount = doc.hint ?? 0
          return (
            <button
              key={doc.docId}
              type="button"
              className={styles.docRow}
              onClick={() => onNavigateToDoc?.(doc.docId)}
              aria-label={`View source document for ${doc.label}`}
            >
              <div className={styles.docRowMain}>
                <span className={styles.docLabel}>{doc.label}</span>
                <span className={styles.docAmount}>${fmt(amount)}</span>
              </div>
              <span className={styles.viewSource}>
                <Document size="small" />
                View source
              </span>
            </button>
          )
        })}
      </div>

      <div className={styles.sumRow}>
        <span className={styles.sumLabel}>Total from sources</span>
        <span className={styles.sumValue}>${fmt(total)}</span>
      </div>
    </div>
  )
}

/** Sum all per-doc inputs for a control row. Returns null if any field is empty. */
export function sumControlDocInputs(
  docs: TaxControlDocEntry[],
  values: Record<string, string>,
): number | null {
  const parsed = docs.map(d => parseCurrency(values[d.docId] ?? ''))
  if (parsed.some(v => v === null)) return null
  return parsed.reduce((a, b) => a! + b!, 0)!
}

/** Flat controlInputs map → per-doc values for a given row. */
export function getDocValuesForRow(
  rowId: string,
  docs: TaxControlDocEntry[],
  controlInputs: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const doc of docs) {
    const key = `${rowId}::${doc.docId}`
    if (controlInputs[key] !== undefined) result[doc.docId] = controlInputs[key]
  }
  return result
}

/** Update a single per-doc value in the flat controlInputs map. */
export function setDocValueForRow(
  rowId: string,
  docId: string,
  value: string,
  prev: Record<string, string>,
): Record<string, string> {
  return { ...prev, [`${rowId}::${docId}`]: value }
}

/** Merge all per-doc values for a row into the flat controlInputs map. */
export function setDocValuesForRow(
  rowId: string,
  values: Record<string, string>,
  prev: Record<string, string>,
): Record<string, string> {
  const next = { ...prev }
  for (const [docId, value] of Object.entries(values)) {
    next[`${rowId}::${docId}`] = value
  }
  return next
}
