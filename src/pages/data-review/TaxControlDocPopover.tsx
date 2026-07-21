import { useEffect, useRef } from 'react'
import { Close, Document } from '@design-systems/icons'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/TaxControlDocPopover.module.css'

/** One bordered card in the Interest-style Summary flyout. */
export type SummaryInfoItem = {
  id: string
  label: string
  amount?: number
  /** When set in `source` mode, card click opens this document. */
  docId?: string
  /** Optional body text (info cards / notes). */
  note?: string
}

export type SummaryInfoMode = 'source' | 'calc' | 'info'

interface TaxControlDocPopoverProps {
  rowLabel: string
  mode?: SummaryInfoMode
  /** Override default subtitle for the mode. */
  subtitle?: string
  items: SummaryInfoItem[]
  /** Footer left label. Omit to hide the footer. */
  sumLabel?: string
  /** Footer right amount. Defaults to sum of item amounts when omitted. */
  sumValue?: number
  footnote?: string
  /** Navigate to the source document (source mode only). */
  onNavigateToDoc?: (docId: string) => void
  anchorRect: DOMRect
  onClose: () => void
}

function fmt(n: number) {
  return n.toLocaleString()
}

const DEFAULT_SUBTITLE: Record<SummaryInfoMode, string> = {
  source: 'Select a source below to open its document.',
  calc: 'Amounts included in this total.',
  info: 'About this amount.',
}

const DEFAULT_SUM_LABEL: Record<SummaryInfoMode, string> = {
  source: 'Total from sources',
  calc: 'Total from lines',
  info: 'Total',
}

export default function TaxControlDocPopover({
  rowLabel,
  mode = 'source',
  subtitle,
  items,
  sumLabel,
  sumValue,
  footnote,
  onNavigateToDoc,
  anchorRect,
  onClose,
}: TaxControlDocPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (ref.current?.contains(target)) return
      // Output / summary rows manage their own open/close
      if (target.closest?.('[data-field-row]')) return
      onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const itemsSum = items.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const footerValue = sumValue ?? itemsSum
  const showFooter = sumLabel !== undefined || mode !== 'info' || items.some(i => i.amount !== undefined)
  const footerLabel = sumLabel ?? DEFAULT_SUM_LABEL[mode]

  // Prefer right of the (i) icon; flip left if the flyout would overflow.
  const POP_W = 300
  const GAP = 12
  const placeRight = anchorRect.right + GAP + POP_W <= window.innerWidth - 8
  const top = anchorRect.top + anchorRect.height / 2
  const left = placeRight
    ? anchorRect.right + GAP
    : Math.max(8, anchorRect.left - GAP - POP_W)
  const beakSide = placeRight ? 'left' : 'right'

  return (
    <div
      ref={ref}
      className={`${styles.popover} ${beakSide === 'left' ? styles.popoverBeakLeft : styles.popoverBeakRight}`}
      style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 300 }}
      role="dialog"
      aria-label={`${rowLabel} details`}
    >
      <div className={styles.header}>
        <span className={styles.title}>{rowLabel}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>
      <p className={styles.subtitle}>
        {subtitle ?? DEFAULT_SUBTITLE[mode]}
      </p>

      <div className={styles.docFields}>
        {items.map(item => {
          const isSourceNav = mode === 'source' && !!item.docId && !!onNavigateToDoc
          const amount = item.amount
          const content = (
            <>
              <div className={styles.docRowMain}>
                <span className={styles.docLabel}>{item.label}</span>
                {amount !== undefined && (
                  <span className={styles.docAmount}>${fmt(amount)}</span>
                )}
              </div>
              {item.note && (
                <p className={styles.itemNote}>{item.note}</p>
              )}
              {isSourceNav && (
                <span className={styles.viewSource}>
                  <Document size="small" />
                  View source
                </span>
              )}
            </>
          )

          if (isSourceNav) {
            return (
              <button
                key={item.id}
                type="button"
                className={styles.docRow}
                onClick={() => onNavigateToDoc?.(item.docId!)}
                aria-label={`View source document for ${item.label}`}
              >
                {content}
              </button>
            )
          }

          return (
            <div
              key={item.id}
              className={`${styles.docRow} ${styles.docRowStatic}`}
              role="group"
              aria-label={item.label}
            >
              {content}
            </div>
          )
        })}
      </div>

      {showFooter && (
        <div className={styles.sumRow}>
          <span className={styles.sumLabel}>{footerLabel}</span>
          <span className={styles.sumValue}>${fmt(footerValue)}</span>
        </div>
      )}

      {footnote && (
        <p className={styles.footnote}>{footnote}</p>
      )}
    </div>
  )
}

/** Map legacy TaxControlDocEntry[] into SummaryInfoItems. */
export function docsToSummaryItems(docs: TaxControlDocEntry[]): SummaryInfoItem[] {
  return docs.map(doc => ({
    id: doc.docId,
    label: doc.label,
    amount: doc.hint ?? 0,
    docId: doc.docId,
  }))
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
