import { useEffect, useRef } from 'react'
import { Close } from '@design-systems/icons'
import type { TaxControlBreakdown } from '../../data/taxControlBreakdowns'
import styles from '../../styles/data-review/TaxControlBreakdownPopover.module.css'

interface TaxControlBreakdownPopoverProps {
  breakdown: TaxControlBreakdown
  anchorRect: DOMRect
  onClose: () => void
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function TaxControlBreakdownPopover({
  breakdown,
  anchorRect,
  onClose,
}: TaxControlBreakdownPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const top = anchorRect.top + anchorRect.height / 2
  const left = anchorRect.right + 8

  return (
    <div
      ref={ref}
      className={styles.popover}
      style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 300 }}
      role="dialog"
      aria-label={`${breakdown.title} breakdown`}
    >
      <div className={styles.header}>
        <span className={styles.title}>{breakdown.title}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>

      <p className={styles.formula}>{breakdown.formula}</p>

      <ul className={styles.componentList}>
        {breakdown.components.map((comp, i) => (
          <li key={i} className={styles.componentRow}>
            <span className={styles.componentOp}>{comp.operator ?? '+'}</span>
            <span className={styles.componentLabel}>{comp.label}</span>
            <span className={styles.componentValue}>${fmt(comp.value)}</span>
          </li>
        ))}
      </ul>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>{breakdown.totalLabel}</span>
        <span className={styles.totalValue}>${fmt(breakdown.total)}</span>
      </div>

      {breakdown.footnote && (
        <p className={styles.footnote}>{breakdown.footnote}</p>
      )}
    </div>
  )
}
