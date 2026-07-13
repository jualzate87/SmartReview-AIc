import { useEffect, useRef } from 'react'
import { Close } from '@design-systems/icons'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/TaxControlDocPopover.module.css'

interface TaxControlDocPopoverProps {
  rowLabel: string
  docs: TaxControlDocEntry[]
  /** Current per-doc input values keyed by docId */
  values: Record<string, string>
  onChange: (docId: string, value: string) => void
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
  values,
  onChange,
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

  const docSums = docs.map(d => parseCurrency(values[d.docId] ?? ''))
  const enteredSum = docSums.every(v => v !== null)
    ? docSums.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)!
    : null
  const hasAnyInput = docs.some(d => values[d.docId]?.trim())

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
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>
      <p className={styles.subtitle}>
        Enter the value from each source document. The total is the sum of all fields below.
      </p>

      <div className={styles.docFields}>
        {docs.map(doc => (
          <div
            key={doc.docId}
            className={styles.docField}
            onClick={() => onNavigateToDoc?.(doc.docId)}
          >
            <label className={styles.docLabel} htmlFor={`tc-${doc.docId}`}>
              {doc.label}
            </label>
            <input
              id={`tc-${doc.docId}`}
              className={styles.docInput}
              type="text"
              inputMode="numeric"
              placeholder={doc.hint !== undefined ? `$${fmt(doc.hint)}` : '$0'}
              value={values[doc.docId] ?? ''}
              onChange={e => onChange(doc.docId, e.target.value)}
              onFocus={() => onNavigateToDoc?.(doc.docId)}
              aria-label={`${doc.label} amount`}
            />
          </div>
        ))}
      </div>

      {hasAnyInput && enteredSum !== null && (
        <div className={styles.sumRow}>
          <span className={styles.sumLabel}>Total from sources</span>
          <span className={styles.sumValue}>${fmt(enteredSum)}</span>
        </div>
      )}
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
