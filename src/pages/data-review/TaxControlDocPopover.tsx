import { useEffect, useRef, useState } from 'react'
import { Close } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/TaxControlDocPopover.module.css'

interface TaxControlDocPopoverProps {
  rowLabel: string
  docs: TaxControlDocEntry[]
  /** Saved per-doc values keyed by docId (committed on last Save) */
  values: Record<string, string>
  /** Commit draft values to the System / Source docs column */
  onSave: (values: Record<string, string>) => void
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
  onSave,
  onNavigateToDoc,
  anchorRect,
  onClose,
}: TaxControlDocPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...values }))

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

  const docSums = docs.map(d => parseCurrency(draft[d.docId] ?? ''))
  const enteredSum = docSums.every(v => v !== null)
    ? docSums.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)!
    : null
  const hasAnyInput = docs.some(d => draft[d.docId]?.trim())
  const canSave = docs.every(d => parseCurrency(draft[d.docId] ?? '') !== null)

  const handleSave = () => {
    if (!canSave) return
    onSave(draft)
    onClose()
  }

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
        Enter amounts from each source document, then Save to update the Source docs column.
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
              value={draft[doc.docId] ?? ''}
              onChange={e => setDraft(prev => ({ ...prev, [doc.docId]: e.target.value }))}
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

      <div className={styles.actions}>
        <Button
          type="button"
          size="small"
          priority="secondary"
          purpose="passive"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="small"
          priority="primary"
          purpose="standard"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save
        </Button>
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
