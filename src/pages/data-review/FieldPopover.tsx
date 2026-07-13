import { useEffect, useRef } from 'react'
import { Close, Panel } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/FieldPopover.module.css'

// ── Field metadata ────────────────────────────────────────────────────────────

export interface FieldMeta {
  label: string
  // Prior year value (2024 / prior year)
  prior: number
  // Current year value (2025 / current year)
  current: number
  // Year labels
  priorYear?: string
  currentYear?: string
  // Source document links
  sources?: { label: string; value: number }[]
  // Optional explanatory note (e.g. why a deduction or figure was chosen)
  note?: string
}

import { FROZEN_RETURN, TOKEN_QUALIFIED_DIVS_RETURN } from '../../data/frozenReturn'
// Prior-year (2024) values sourced from priorYear1040Data.ts / sample_1040_2024_variant_amounts_no_ssn.pdf
export const FIELD_META: Record<string, FieldMeta> = {
  wages: {
    label: 'Wages',
    prior: 136480,
    current: 118940,
    sources: [
      { label: 'Tech Circle (W-2)', value: 118940 },
    ],
  },
  taxableInterest: {
    label: 'Taxable interest',
    prior: 2740,
    current: FROZEN_RETURN.taxableInterest,
    sources: [
      { label: 'Unwavering Financial (1099-INT)', value: 1986 },
      { label: 'Harborline Credit Union (1099-INT)', value: 3200 },
      { label: 'Cascade Federal Savings (1099-INT)', value: 1150 },
    ],
  },
  taxExemptInterest: {
    label: 'Tax-exempt interest',
    prior: 180,
    current: 180,
  },
  qualifiedDivs: {
    label: 'Qualified dividends',
    prior: 219850,
    current: FROZEN_RETURN.qualifiedDivs,
    sources: [
      { label: 'Token Financial (1099-DIV)', value: TOKEN_QUALIFIED_DIVS_RETURN },
      { label: 'Northmark Index Funds (1099-DIV)', value: 8000 },
      { label: 'Beacon Dividend Trust (1099-DIV)', value: 4200 },
    ],
  },
  ordinaryDivs: {
    label: 'Ordinary dividends',
    prior: 126750,
    current: FROZEN_RETURN.ordinaryDivs,
    sources: [
      { label: 'Token Financial (1099-DIV)', value: 331250 },
      { label: 'Northmark Index Funds (1099-DIV)', value: 12400 },
      { label: 'Beacon Dividend Trust (1099-DIV)', value: 6750 },
    ],
  },
  capitalGain: {
    label: 'Capital gain / (loss)',
    prior: 219850,
    current: 0,
  },
  totalIncome: {
    label: 'Total income',
    prior: 485820,
    current: FROZEN_RETURN.totalIncome,
  },
  agi: {
    label: 'Adjusted gross income',
    prior: 485820,
    current: FROZEN_RETURN.totalIncome,
  },
  stdDeduction: {
    label: 'Standard deduction',
    prior: 31850,
    current: 15750,
    sources: [
      { label: 'Standard deduction (single)', value: 15750 },
    ],
    note: 'Jessica qualifies for the standard deduction because her itemizable expenses (mortgage interest, state and local taxes, charitable gifts) don\'t exceed the standard deduction amount for her filing status.',
  },
  taxableIncome: {
    label: 'Taxable income',
    prior: 453970,
    current: FROZEN_RETURN.totalIncome - FROZEN_RETURN.stdDeduction,
  },
  withholding: {
    label: 'Federal income tax withheld',
    prior: 18740,
    current: FROZEN_RETURN.divWithholding,
    sources: [
      { label: 'Token Financial (1099-DIV)', value: FROZEN_RETURN.divWithholding },
    ],
  },
  totalPayments: {
    label: 'Total payments',
    prior: 76100,
    current: FROZEN_RETURN.totalWithholding,
  },
  totalTax: {
    label: 'Total tax',
    prior: 98890,
    current: 149830,
  },
  incomeTax: {
    label: 'Tax (line 16)',
    prior: 84610,
    current: 149830,
  },
  w2Withholding: {
    label: 'W-2 federal withholding',
    prior: 22360,
    current: FROZEN_RETURN.w2Withholding,
    sources: [
      { label: 'Tech Circle (W-2 Box 2)', value: FROZEN_RETURN.w2Withholding },
    ],
  },
  totalWithholding: {
    label: 'Total withholding',
    prior: 41100,
    current: FROZEN_RETURN.totalWithholding,
  },
  estimatedPayments: {
    label: 'Estimated tax payments',
    prior: 35000,
    current: 0,
  },
  amountOwed: {
    label: 'Amount you owe',
    prior: 22790,
    current: FROZEN_RETURN.totalTax - FROZEN_RETURN.totalWithholding,
  },
  box12: {
    label: 'Box 12 — Codes',
    prior: 0,
    current: 0,
    sources: [
      { label: 'Tech Circle (W-2 Box 12)', value: 0 },
    ],
  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FieldPopoverProps {
  fieldName: string
  /** Viewport rect of the value cell — used for fixed positioning */
  anchorRect: DOMRect
  onClose: () => void
  onViewSource?: (fieldName: string, sourceLabel?: string) => void
}

function fmt(n: number) {
  return n.toLocaleString()
}

function badgeClass(pct: number): string {
  const abs = Math.abs(pct)
  if (abs < 5)   return styles.yoyBadgeGrey
  if (abs <= 30) return styles.yoyBadgeOrange
  return styles.yoyBadgeRed
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FieldPopover({
  fieldName,
  anchorRect,
  containerRect,
  onClose,
  onViewSource,
}: FieldPopoverProps) {
  const meta = FIELD_META[fieldName]
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Small delay so the click that opened the popover doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!meta) return null

  const diff = meta.current - meta.prior
  const pct  = meta.prior !== 0 ? Math.round((diff / meta.prior) * 100) : null

  // Position: right of the form doc, vertically centered on the anchor cell
  // Calculated relative to the viewport
  const top  = anchorRect.top + anchorRect.height / 2
  const left = anchorRect.right + 10

  return (
    <div
      ref={ref}
      className={styles.popover}
      style={{
        position: 'fixed',
        top,
        left,
        transform: 'translateY(-50%)',
        zIndex: 200,
      }}
    >
      {/* Header */}
      <div className={styles.header}>
        <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
        <span className={styles.fieldLabel}>{meta.label}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close popover">
          <Close size="small" />
        </button>
      </div>

      {/* YoY section */}
      <div className={styles.yoySection}>
        <div className={styles.yoySectionLabel}>Year over year</div>
        <div className={styles.yoyCard}>
          <div className={styles.yoyRow}>
            <div className={styles.yoyCol}>
              <span className={styles.yoyColLabel}>2024</span>
              <span className={styles.yoyColValue}>${fmt(meta.prior)}</span>
            </div>
            <div className={styles.yoyDivider} />
            <div className={styles.yoyCol}>
              <span className={styles.yoyColLabel}>2025</span>
              <span className={styles.yoyColValue}>${fmt(meta.current)}</span>
            </div>
            <div className={styles.yoyDivider} />
            <div className={styles.yoyCol}>
              <span className={styles.yoyColLabel}>Diff</span>
              <span className={styles.yoyColValue}>{diff > 0 ? `+$${fmt(diff)}` : diff < 0 ? `−$${fmt(Math.abs(diff))}` : '—'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            {pct !== null ? (
              <span className={`${styles.yoyBadge} ${badgeClass(pct)}`}>
                {pct >= 0 ? `+${pct}%` : `${pct}%`}
              </span>
            ) : (
              <span className={`${styles.yoyBadge} ${styles.yoyBadgeNeutral}`}>New</span>
            )}
          </div>
        </div>
      </div>

      {/* Explanatory note section — only if field has one */}
      {meta.note && (
        <div className={styles.sourcesSection}>
          <div className={styles.sourcesSectionLabel}>Why this deduction?</div>
          <p style={{ margin: 0, fontFamily: 'var(--font-family-component)', fontSize: 12, lineHeight: 1.4, color: '#495a63' }}>{meta.note}</p>
        </div>
      )}

      {/* Sources section — only if field has sources */}
      {meta.sources && meta.sources.length > 0 && (
        <div className={styles.sourcesSection}>
          <div className={styles.sourcesSectionLabel}>Sources</div>
          {meta.sources.map(s => (
            <div key={s.label} className={styles.sourceRow}>
              {/* Link: name + panel icon together, inline */}
              <button className={styles.sourceLink} onClick={() => onViewSource?.(fieldName, s.label)}>
                {s.label}
                <span className={styles.sourcePanelIcon}><Panel size="small" /></span>
              </button>
              <span className={styles.sourceDots} />
              <span className={styles.sourceValue}>${fmt(s.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
