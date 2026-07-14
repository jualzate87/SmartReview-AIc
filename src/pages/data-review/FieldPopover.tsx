import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Close } from '@design-systems/icons'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import type { FieldOrigin, FieldOriginSource } from '../../data/fieldOrigins'
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
  // Source document links (legacy — prefer FieldOrigin.sources)
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
  wagesTotal: {
    label: 'Total wages (1a–1h)',
    prior: 136480,
    current: 118940,
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
    sources: [
      { label: 'Unwavering Financial (1099-INT) · Box 8', value: 180 },
    ],
  },
  qualifiedDivs: {
    label: 'Qualified dividends',
    prior: 142300,
    current: FROZEN_RETURN.qualifiedDivs,
    sources: [
      { label: 'Token Financial (1099-DIV)', value: TOKEN_QUALIFIED_DIVS_RETURN },
      { label: 'Northmark Index Funds (1099-DIV)', value: 8000 },
      { label: 'Beacon Dividend Trust (1099-DIV)', value: 4200 },
    ],
  },
  ordinaryDivs: {
    label: 'Ordinary dividends',
    prior: 219850,
    current: FROZEN_RETURN.ordinaryDivs,
    sources: [
      { label: 'Token Financial (1099-DIV)', value: 331250 },
      { label: 'Northmark Index Funds (1099-DIV)', value: 12400 },
      { label: 'Beacon Dividend Trust (1099-DIV)', value: 6750 },
    ],
  },
  iraDistrib: {
    label: 'IRA distributions',
    prior: 0,
    current: FROZEN_RETURN.taxablePension,
    sources: [
      { label: 'Meridian Retirement Trust (1099-R)', value: FROZEN_RETURN.taxablePension },
    ],
  },
  capitalGain: {
    label: 'Capital gain / (loss)',
    prior: 126750,
    current: 0,
  },
  otherIncome: {
    label: 'Other income',
    prior: 0,
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
    note: 'Jessica qualifies for the standard deduction because her itemizable expenses (mortgage interest, state and local taxes, charitable gifts) don\'t exceed the standard deduction amount for her filing status.',
  },
  deductionSum: {
    label: 'Deductions total',
    prior: 31850,
    current: 15750,
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
  /** Legacy source-link handler (label match) */
  onViewSource?: (fieldName: string, sourceLabel?: string) => void
  /** Navigate to a specific source document + highlight the detail field */
  onNavigateSource?: (source: FieldOriginSource) => void
  /** Live origin breakdown (sources / calc) */
  origin?: FieldOrigin | null
  /** Override current-year amount (live totals) */
  liveCurrent?: number
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

const POPOVER_WIDTH = 360
const VIEWPORT_PAD = 12

export default function FieldPopover({
  fieldName,
  anchorRect,
  onClose,
  onViewSource,
  onNavigateSource,
  origin,
  liveCurrent,
}: FieldPopoverProps) {
  const meta = FIELD_META[fieldName]
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState(() => ({
    top: anchorRect.top + anchorRect.height / 2,
    left: Math.min(anchorRect.right + 10, window.innerWidth - POPOVER_WIDTH - VIEWPORT_PAD),
  }))

  // Clamp popover fully on-screen after mount (width/height vary with Source/Calc/YoY)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width: w, height: h } = el.getBoundingClientRect()
    const popW = Math.max(w, POPOVER_WIDTH)
    let top = anchorRect.top + anchorRect.height / 2
    // Prefer right of the cell; flip left if it would overflow the viewport
    let left = anchorRect.right + 10
    if (left + popW > window.innerWidth - VIEWPORT_PAD) {
      left = anchorRect.left - popW - 10
    }
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - popW - VIEWPORT_PAD))
    const half = h / 2
    top = Math.max(VIEWPORT_PAD + half, Math.min(top, window.innerHeight - VIEWPORT_PAD - half))
    setCoords({ top, left })
  }, [anchorRect, fieldName, origin, liveCurrent])

  // Close on outside click — ignore 1040/summary field rows (they manage open/close themselves)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (ref.current?.contains(target)) return
      if (target.closest?.('[data-field-row]')) return
      onClose()
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

  const label = origin?.label ?? meta?.label
  if (!label) return null

  const prior = meta?.prior ?? 0
  const current = liveCurrent ?? meta?.current ?? 0
  const hasYoy = !!meta
  const diff = current - prior
  const pct  = prior !== 0 ? Math.round((diff / prior) * 100) : null

  // Prefer live origin sources; fall back to FIELD_META.sources so Source never vanishes when YoY shows
  const sources = origin?.sources
  const calc = origin?.calc
  const note = origin?.note ?? meta?.note
  const hasOriginSources = !!(sources && sources.length > 0)
  const legacySources = !hasOriginSources ? meta?.sources : undefined

  const handleSourceClick = (s: FieldOriginSource) => {
    if (onNavigateSource) {
      onNavigateSource(s)
      return
    }
    onViewSource?.(fieldName, s.label)
  }

  return createPortal(
    <div
      ref={ref}
      className={styles.popover}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateY(-50%)',
        zIndex: 10000,
        width: POPOVER_WIDTH,
      }}
      role="dialog"
      aria-label={`${label} details`}
    >
      {/* Header — sparkle + field label + close */}
      <div className={styles.header}>
        <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
        <span className={styles.fieldLabel}>{label}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close popover">
          <Close size="small" />
        </button>
      </div>

      {/* YoY section — original structure */}
      {hasYoy && (
        <div className={styles.yoySection}>
          <div className={styles.yoySectionLabel}>Year over year</div>
          <div className={styles.yoyCard}>
            <div className={styles.yoyRow}>
              <div className={styles.yoyCol}>
                <span className={styles.yoyColLabel}>2024</span>
                <span className={styles.yoyColValue}>${fmt(prior)}</span>
              </div>
              <div className={styles.yoyDivider} />
              <div className={styles.yoyCol}>
                <span className={styles.yoyColLabel}>2025</span>
                <span className={styles.yoyColValue}>${fmt(current)}</span>
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
      )}

      {/* Manual / explanatory note */}
      {note && (
        <div className={styles.sourcesSection}>
          <div className={styles.sourcesSectionLabel}>
            {fieldName === 'stdDeduction'
              ? 'Why this deduction?'
              : origin?.kind === 'manual' || (origin?.kind === 'calc' && !calc)
                ? 'About this amount'
                : 'Note'}
          </div>
          <p className={styles.noteText}>{note}</p>
        </div>
      )}

      {/* Sources — original slim rows (label ····· $amount), clickable for navigate+highlight */}
      {hasOriginSources && (
        <div className={styles.sourcesSection}>
          <div className={styles.sourcesSectionLabel}>Sources</div>
          {sources!.map(s => {
            const displayLabel = s.box ? `${s.label} · ${s.box}` : s.label
            return (
              <div key={`${s.docId}-${s.detailFieldId}`} className={styles.sourceRow}>
                <button
                  type="button"
                  className={styles.sourceLink}
                  onClick={() => handleSourceClick(s)}
                >
                  {displayLabel}
                </button>
                <span className={styles.sourceDots} aria-hidden="true" />
                <span className={styles.sourceValue}>${fmt(s.amount)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Legacy sources fallback when no origin.sources */}
      {legacySources && legacySources.length > 0 && (
        <div className={styles.sourcesSection}>
          <div className={styles.sourcesSectionLabel}>Sources</div>
          {legacySources.map(s => (
            <div key={s.label} className={styles.sourceRow}>
              <button
                type="button"
                className={styles.sourceLink}
                onClick={() => onViewSource?.(fieldName, s.label)}
              >
                {s.label}
              </button>
              <span className={styles.sourceDots} aria-hidden="true" />
              <span className={styles.sourceValue}>${fmt(s.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calculated from — quiet formula list (matches TaxControlBreakdownPopover language) */}
      {calc && calc.components.length > 0 && (
        <div className={styles.calcSection}>
          <div className={styles.sourcesSectionLabel}>Calculated from</div>
          <p className={styles.calcFormula}>{calc.formula}</p>
          <ul className={styles.calcList}>
            {calc.components.map((comp, i) => (
              <li key={i} className={styles.calcRow}>
                <span className={styles.calcOp}>{comp.operator ?? '+'}</span>
                <span className={styles.calcLabel}>{comp.label}</span>
                <span className={styles.calcValue}>${fmt(comp.amount)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.calcTotalRow}>
            <span className={styles.calcTotalLabel}>{calc.totalLabel}</span>
            <span className={styles.calcTotalValue}>${fmt(calc.total)}</span>
          </div>
          {calc.footnote && <p className={styles.calcFootnote}>{calc.footnote}</p>}
        </div>
      )}
    </div>,
    document.body,
  )
}
