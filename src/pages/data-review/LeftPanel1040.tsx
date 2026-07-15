import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, CircleInfo, Comment, Flag } from '@design-systems/icons'
import FieldPopover, { FIELD_META } from './FieldPopover'
import TaxControlDocPopover from './TaxControlDocPopover'
import TaxControlBreakdownPopover from './TaxControlBreakdownPopover'
import { getTaxControlBreakdown } from '../../data/taxControlBreakdowns'
import { getFieldLiveCurrent, getFieldOrigin } from '../../data/fieldOrigins'
import type { FieldOriginSource } from '../../data/fieldOrigins'
import type { LiveAmounts } from '../../data/liveReturn'
import { SEED_AMOUNTS } from '../../data/liveReturn'
import Tooltip from './Tooltip'
import { TAX_CONTROL_ROWS, getControlSystemValues, type TaxControlDocEntry } from '../../data/sourceDocuments'
import type { LiveReturnTotals } from '../../data/liveReturn'
import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import { summaryFieldHasUnresolvedFlags } from './phase1FieldSync'
import styles from '../../styles/data-review/LeftPanel1040.module.css'


interface LeftPanel1040Props {
  selectedField?: string | null
  /** 1040 row highlight — may differ from selectedField when a detail key maps to a 1040 line */
  highlightField?: string | null
  onFieldClick?: (fieldName: string | null) => void
  total1a?: number
  wages?: { techCircle: number }
  /** When true: clicking a field shows YoY badge, not blue popover */
  yoyExpanded?: boolean
  reviewedFields?: Set<string> | Map<string, unknown>
  /** Summary-row checks — independent of import mark-reviewed */
  checkedFields?: Set<string>
  /** Toggle a field's summary-checked state */
  onToggleChecked?: (fieldName: string) => void
  /** When true: this field is highlighted orange (active agent issue card) — takes precedence over blue */
  issueField?: string | null
  /** Called when user clicks a source link in the field popover */
  onViewSource?: (fieldName: string, sourceLabel?: string) => void
  /** Navigate to a specific source document + highlight its detail field */
  onNavigateSource?: (source: FieldOriginSource) => void
  /** Navigate to a specific source document (summary flyout) */
  onNavigateToSourceDoc?: (docId: string) => void
  /**
   * Live-computed 1040 totals from synced editable amounts.
   * Prefer this over frozen constants so edits recalculate income / payments / owed.
   */
  liveTotals?: LiveReturnTotals
  /** Per-payer live amounts for source-document popover values */
  liveAmounts?: LiveAmounts
  /** Audit-trail field keys that were edited+saved this session */
  editedFields?: Set<string>
  /** Called when user posts a comment from a 1040 field */
  onAddFieldNote?: (text: string, context: string) => void
}

import { PRIOR_YEAR_1040_VALUES, buildYoyMap, yoyPercent } from './priorYear1040Data'

const PRIOR_YEAR = PRIOR_YEAR_1040_VALUES

// Threshold: >=15% change AND >$300 estimated tax impact
function meetsRowTintThreshold(field: string, yoy: Record<string, number>): boolean {
  const pct = yoy[field]
  if (pct === undefined) return false
  const prior = PRIOR_YEAR[field]
  const taxImpact = prior !== undefined ? Math.abs(pct) * prior * 0.001 : 0
  return Math.abs(pct) >= 15 && taxImpact > 300
}

// Badge color based purely on absolute magnitude (no green — green = reviewed only)
// Applied to ALL YoY fields (badges on every YoY field, tints only on threshold-meeting ones)
function badgeColor(pct: number): string {
  const abs = Math.abs(pct)
  if (abs <= 10)  return styles.badgeGrey
  if (abs <= 30)  return styles.badgeOrange
  return styles.badgeRed
}

// Row background tint — only for fields exceeding the significance threshold
function rowYoyClass(pct: number): string {
  const abs = Math.abs(pct)
  if (abs <= 30) return styles.rowYoyOrange
  return styles.rowYoyRed
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function LeftPanel1040({
  selectedField,
  highlightField,
  onFieldClick,
  total1a = 118940,
  yoyExpanded = false,
  reviewedFields = new Set(),
  checkedFields = new Set(),
  onToggleChecked,
  issueField,
  onViewSource,
  onNavigateSource,
  onNavigateToSourceDoc,
  liveTotals,
  liveAmounts = SEED_AMOUNTS,
  editedFields = new Set(),
  onAddFieldNote,
}: LeftPanel1040Props) {
  // Detail-field keys may differ from 1040 row keys (e.g. fedTaxWithheld ↔ withholding).
  const activeHighlight = highlightField ?? selectedField

  // Live totals from synced edits; seeds match Build Spec frozen anchors at session start.
  const wages1040           = liveTotals?.wages ?? total1a
  const taxableInterest1040 = liveTotals?.taxableInterest ?? 6_336
  const qualifiedDivs1040   = liveTotals?.qualifiedDivs ?? 343_450
  const ordinaryDivs        = liveTotals?.ordinaryDivs ?? 350_400
  const taxablePension      = liveTotals?.taxablePension ?? 100_000
  const otherIncome         = liveTotals?.otherIncome ?? 0
  const necOnReturn         = liveTotals?.necOnReturn ?? false
  const w2Withholding       = liveTotals?.w2Withholding ?? 15_840
  const withholding1099     = liveTotals?.withholding1099 ?? 24_925
  const withholding1040     = liveTotals?.totalWithholding ?? (w2Withholding + withholding1099)
  const capitalGain         = liveTotals?.capitalGain ?? 0
  const totalIncome         = liveTotals?.totalIncome ?? (wages1040 + taxableInterest1040 + ordinaryDivs + taxablePension + capitalGain + otherIncome)
  const stdDeduction        = liveTotals?.stdDeduction ?? 15_750
  const taxableIncome       = liveTotals?.taxableIncome ?? (totalIncome - stdDeduction)
  const totalTax            = liveTotals?.totalTax ?? 149_830
  const incomeTax           = totalTax
  const estimatedPayments   = 0
  const oweAmount           = liveTotals?.oweAmount ?? Math.max(0, totalTax - withholding1040)
  const displaySsn          = liveTotals?.employeeSsn?.trim()
    ? liveTotals.employeeSsn
    : '987-65-4321'

  /** Effective totals object for field-origin lookups (always defined). */
  const originTotals: LiveReturnTotals = liveTotals ?? {
    wages: wages1040,
    taxableInterest: taxableInterest1040,
    ordinaryDivs,
    qualifiedDivs: qualifiedDivs1040,
    taxablePension,
    otherIncome,
    capitalGain,
    totalIncome,
    stdDeduction,
    taxableIncome,
    totalTax,
    w2Withholding,
    divWithholding: withholding1099,
    rWithholding: 0,
    withholding1099,
    totalWithholding: withholding1040,
    totalPayments: withholding1040,
    oweAmount,
    necOnReturn,
    employeeSsn: displaySsn,
    employerEin: '',
  }

  const fieldHasPopover = (field: string) =>
    !!FIELD_META[field] || !!getFieldOrigin(field, originTotals, liveAmounts)

  const reviewedHas = (key: string) =>
    reviewedFields instanceof Map ? reviewedFields.has(key) : reviewedFields.has(key)

  const controlSystemVals = getControlSystemValues({
    total1a: wages1040,
    taxableInterest: taxableInterest1040,
    ordinaryDivs,
    qualifiedDivs: qualifiedDivs1040,
    totalIncome,
    stdDeduction,
    taxableIncome,
    totalTax,
    w2Withholding,
    divWithholding: withholding1099,
    totalWithholding: withholding1040,
    oweAmount,
    taxablePension,
    otherIncome,
  })

  /** Summary CY field → tax-control row id (for breakdown / source flyouts). */
  const SUMMARY_TO_CONTROL: Record<string, string> = {
    wages: 'wages',
    taxableInterest: 'interest',
    ordinaryDivs: 'dividends',
    qualifiedDivs: 'qualDivs',
    iraDistrib: 'ira',
    totalIncome: 'totalIncome',
    stdDeduction: 'stdDeduction',
    taxableIncome: 'taxableIncome',
    incomeTax: 'totalTax',
    totalTax: 'totalTax',
    w2Withholding: 'withholdingW2',
    withholding: 'withholding99',
    totalPayments: 'totalPayments',
    amountOwed: 'amountOwed',
  }

  const YOY = buildYoyMap({
    wages: wages1040,
    wagesTotal: wages1040,
    taxableInterest: taxableInterest1040,
    qualifiedDivs: qualifiedDivs1040,
    ordinaryDivs,
    capitalGain,
    totalIncome,
    agi: totalIncome,
    stdDeduction,
    deductionSum: stdDeduction,
    taxableIncome,
    incomeTax,
    totalTax,
    w2Withholding,
    withholding: withholding1099,
    totalWithholding: withholding1040,
    estimatedPayments,
    totalPayments: withholding1040,
    amountOwed: oweAmount,
  })

  // View toggle: Summary (default) | Form
  const [view, setView] = useState<'form' | 'table'>('table')
  // Table view: which categories are expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['income', 'deductions', 'tax', 'payments']))
  /** Summary source flyout — Interest-style cards; doc opens only on card click */
  const [sourceFlyout, setSourceFlyout] = useState<{
    field: string
    label: string
    docs: TaxControlDocEntry[]
    detailByDocId?: Record<string, string>
  } | null>(null)
  const [sourceFlyoutRect, setSourceFlyoutRect] = useState<DOMRect | null>(null)
  // Read-only calculation breakdown popover
  const [breakdownRow, setBreakdownRow] = useState<string | null>(null)
  const [breakdownRect, setBreakdownRect] = useState<DOMRect | null>(null)
  const [breakdownField, setBreakdownField] = useState<string | null>(null)

  const toggleExpanded = (key: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  // Popover: which field + the viewport rect of its value cell
  const [popoverField, setPopoverField] = useState<string | null>(null)
  const [popoverRect, setPopoverRect]   = useState<DOMRect | null>(null)
  // Which field row is hovered (for showing the check button)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  // Comment popover
  const [commentField, setCommentField] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; left: number } | null>(null)
  const commentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!commentField) return
    const onDown = (e: MouseEvent) => {
      if (commentRef.current && !commentRef.current.contains(e.target as Node)) {
        setCommentField(null); setCommentDraft(''); setCommentAnchor(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [commentField])

  const openComment1040 = (fieldKey: string, label: string, btn: HTMLElement) => {
    const btnRect = btn.getBoundingClientRect()
    setCommentAnchor({ top: btnRect.top + btnRect.height / 2, left: btnRect.left - 292 })
    setCommentField(fieldKey)
    setCommentDraft('')
  }

  const postComment1040 = (context: string) => {
    if (!commentDraft.trim()) return
    onAddFieldNote?.(commentDraft.trim(), context)
    setCommentField(null); setCommentDraft(''); setCommentAnchor(null)
  }

  /** Anchor popover to the Amount cell of a form row (Form view only). */
  const openPopoverForRow = (field: string, rowEl: HTMLElement) => {
    const cells = rowEl.querySelectorAll('td')
    const valueCell = cells[cells.length - 1] as HTMLElement | undefined
    const anchor = valueCell ?? rowEl
    setPopoverRect(anchor.getBoundingClientRect())
    setPopoverField(field)
  }

  const clearSummaryFlyouts = () => {
    setSourceFlyout(null)
    setSourceFlyoutRect(null)
    setBreakdownRow(null)
    setBreakdownRect(null)
    setBreakdownField(null)
    setPopoverField(null)
    setPopoverRect(null)
  }

  /**
   * Open Summary CY info flyout only — never navigates to / shows a source document.
   * Document open is reserved for a source-card click inside TaxControlDocPopover.
   */
  const openSummaryInfo = (field: string, el: HTMLElement) => {
    // Toggle closed if the same flyout is already open
    if (
      sourceFlyout?.field === field ||
      breakdownField === field ||
      popoverField === field
    ) {
      clearSummaryFlyouts()
      return
    }

    clearSummaryFlyouts()

    const rect = el.getBoundingClientRect()
    const controlId = SUMMARY_TO_CONTROL[field]
    const cfg = controlId ? TAX_CONTROL_ROWS.find(r => r.id === controlId) : undefined
    const breakdown = controlId ? getTaxControlBreakdown(controlId, controlSystemVals) : null
    const origin = getFieldOrigin(field, originTotals, liveAmounts)

    // Source rows → Interest-style TaxControlDocPopover (control docs or origin sources)
    if (cfg && cfg.docs.length > 0 && breakdown?.kind === 'source') {
      setSourceFlyout({ field, label: cfg.label, docs: cfg.docs })
      setSourceFlyoutRect(rect)
      return
    }
    if (origin?.sources && origin.sources.length > 0) {
      const detailByDocId: Record<string, string> = {}
      const docs: TaxControlDocEntry[] = origin.sources.map(s => {
        detailByDocId[s.docId] = s.detailFieldId
        return {
          docId: s.docId,
          label: s.box ? `${s.label} · ${s.box}` : s.label,
          hint: s.amount,
        }
      })
      setSourceFlyout({ field, label: origin.label, docs, detailByDocId })
      setSourceFlyoutRect(rect)
      return
    }

    // Calc / formula rows → TaxControlBreakdownPopover
    if (breakdown?.kind === 'calc' && controlId) {
      setBreakdownRect(rect)
      setBreakdownRow(controlId)
      setBreakdownField(field)
      return
    }

    // Fallback — FieldPopover (notes / YoY-only lines with no source cards)
    if (fieldHasPopover(field)) {
      setPopoverRect(rect)
      setPopoverField(field)
    }
  }

  const handleRowClick = (field: string, e: React.MouseEvent<HTMLTableRowElement>) => {
    // If the field is the active issue field, just toggle selection (orange mode)
    if (field === issueField) {
      onFieldClick?.(activeHighlight === field ? null : field)
      setPopoverField(null)
      setPopoverRect(null)
      return
    }

    // Same field + popover already open → toggle closed
    if (field === activeHighlight && popoverField === field) {
      onFieldClick?.(null)
      setPopoverField(null)
      setPopoverRect(null)
      return
    }

    // New field, OR selected (e.g. from detail nav) without a popover → open it
    onFieldClick?.(field)
    if (fieldHasPopover(field)) {
      openPopoverForRow(field, e.currentTarget)
    } else {
      setPopoverField(null)
      setPopoverRect(null)
    }
  }

  // Close popover and deselect field (e.g. X button or outside click)
  const handleClosePopover = () => {
    setPopoverField(null)
    setPopoverRect(null)
    onFieldClick?.(null)
  }

  // Close popover UI only — keep field selected so highlight persists during navigation
  const handleDismissPopoverKeepSelection = () => {
    setPopoverField(null)
    setPopoverRect(null)
    // selectedField intentionally NOT cleared
  }

  /**
   * kind:
   *   'source'  — value comes from imported documents (W-2, 1099, etc.)
   *              → outlined box, subtle blue tint
   *   'calc'    — computed from other lines on this form
   *              → lighter box, italic value
   *   undefined — blank / no value
   */
  const Row = ({
    field,
    line,
    label,
    value,
    kind,
    bold,
    shaded,
    indent,
    subdued,
    owe,
  }: {
    field?: string
    line: string
    label: string
    value?: string | number
    kind?: 'source' | 'calc'
    bold?: boolean
    shaded?: boolean
    indent?: boolean
    subdued?: boolean
    owe?: boolean
  }) => {
    const commentable = !!field && !!onAddFieldNote
    const isIssueHighlight = !!field && field === issueField
    const isSelected       = !!field && activeHighlight === field
    const isReviewed       = !!field && reviewedHas(field)
    const isChecked        = !!field && checkedFields.has(field)
    const isHovered        = !!field && hoveredField === field
    const isPopoverOpen    = !!field && popoverField === field
    const yoy              = field ? YOY[field] : undefined
    const clickable        = !!field
    // Show check button on hover for any field with a value (kind set means it has data)
    const showCheckBtn     = !!field && !!kind && !!value && isHovered

    // Blue selection: selected but NOT the active issue field
    const isBlueSelected   = isSelected && !isIssueHighlight
    // Orange selection: selected AND it's the issue field
    const isOrangeSelected = isSelected && !!isIssueHighlight

    // YoY tint: only when row is selected/hovered via issue interaction (orange mode)
    const showYoyTint = isOrangeSelected

    const rowCls = [
      styles.row,
      bold    ? styles.rowBold    : '',
      shaded  ? styles.rowShaded  : '',
      indent  ? styles.rowIndent  : '',
      subdued ? styles.rowSubdued : '',
      owe     ? styles.rowOwe     : '',
      isOrangeSelected ? styles.rowSelected     : '',
      isBlueSelected   ? styles.rowSelectedBlue : '',
      isReviewed       ? styles.rowReviewed     : '',
      isChecked && !isReviewed ? styles.rowChecked : '',
      showYoyTint      ? rowYoyClass(yoy!)      : '',
      clickable        ? styles.rowClickable    : '',
      commentField === field ? styles.rowCommentOpen : '',
    ].filter(Boolean).join(' ')

    const isCommentOpen = commentField === field
    const valueCellCls = [
      styles.valueBox,
      kind === 'source'   ? styles.valueBoxSource   : '',
      kind === 'calc'     ? styles.valueBoxCalc     : '',
      value === undefined ? styles.valueBoxEmpty    : '',
      isOrangeSelected    ? styles.valueBoxSelected : '',
      isBlueSelected      ? styles.valueBoxSelectedBlue : '',
      isReviewed && !isSelected ? styles.valueBoxReviewed : '',
      isChecked && !isReviewed && !isSelected ? styles.valueBoxChecked : '',
      isCommentOpen && !isSelected ? styles.valueBoxCommentOpen : '',
    ].filter(Boolean).join(' ')

    const valueNumCls = [
      styles.valueNum,
      kind === 'calc'   ? styles.valueNumCalc   : '',
      kind === 'source' ? styles.valueNumSource : '',
      isOrangeSelected  ? styles.valueNumSelected   : '',
      isBlueSelected    ? styles.valueNumSelectedBlue : '',
      isReviewed && !isSelected ? styles.valueNumReviewed : '',
      isChecked && !isReviewed && !isSelected ? styles.valueNumChecked : '',
    ].filter(Boolean).join(' ')

    return (
      <tr
        className={rowCls}
        data-field-row={field || undefined}
        onMouseDown={clickable ? (e) => {
          // Keep FieldPopover's document mousedown-outside from stealing 1040 row clicks
          e.stopPropagation()
        } : undefined}
        onClick={clickable ? (e) => handleRowClick(field!, e) : undefined}
        onMouseEnter={field ? () => setHoveredField(field) : undefined}
        onMouseLeave={field ? () => setHoveredField(null) : undefined}
      >
        <td className={styles.cellLine}>{line}</td>
        <td className={styles.cellLabel}>
          <div className={styles.cellLabelInner}>
            {label}
          </div>
        </td>
        <td className={styles.cellLineRight}>{line}</td>
        <td className={styles.cellValue}>
          <div className={styles.cellValueInner}>
            <div className={valueCellCls}>
              {/* Reviewed check icon (AI review) — left side of value box */}
              {isReviewed && (
                <span className={styles.reviewedIcon}><CircleCheck size="small" /></span>
              )}

              {/* The value number */}
              {value !== undefined && (
                <span className={valueNumCls}>
                  {typeof value === 'number' ? fmt(value) : value}
                </span>
              )}

            </div>

            {/* Check button — outside value box, shown on hover */}
            {showCheckBtn && !isReviewed && (
              <Tooltip text={isChecked ? 'Unmark as correct' : 'Mark as correct'} placement="top"><button
                className={`${styles.checkBtn} ${isChecked ? styles.checkBtnActive : ''}`}
                aria-label={isChecked ? `Unmark ${field} as verified` : `Mark ${field} as verified`}
                onClick={(e) => { e.stopPropagation(); onToggleChecked?.(field!) }}
              >
                <CircleCheck size="small" />
              </button></Tooltip>
            )}

            {/* Static check icon when checked but not hovered */}
            {isChecked && !isReviewed && !isHovered && (
              <span className={styles.checkedIcon}><CircleCheck size="small" /></span>
            )}

            {/* Comment button — outside value box, shown on hover */}
            {commentable && (isHovered || commentField === field) && (
              <Tooltip text="Add a comment" placement="top"><button
                className={`${styles.commentBtn1040} ${commentField === field ? styles.commentBtn1040Active : ''}`}
                aria-label={`Add comment for ${label}`}
                onClick={e => {
                  e.stopPropagation()
                  if (commentField === field) { setCommentField(null); setCommentDraft(''); setCommentAnchor(null) }
                  else openComment1040(field!, label, e.currentTarget)
                }}
              >
                <Comment size="small" />
              </button></Tooltip>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const Section = ({ title }: { title: string }) => (
    <tr className={styles.sectionHeader}>
      <td />
      <td colSpan={3} className={styles.sectionTitle}>{title}</td>
    </tr>
  )

  const Divider = () => (
    <tr className={styles.dividerRow}>
      <td colSpan={4}><div className={styles.dividerLine} /></td>
    </tr>
  )

  // Prior-year lookup — directly from document values (single source of truth)
  const py = (_current: number, field: string): number | null => {
    return PRIOR_YEAR[field] ?? null
  }
  const fmtDiff = (curr: number, prior: number | null) => {
    if (prior === null) return { diff: null, pct: null }
    const diff = curr - prior
    const pct  = prior !== 0 ? Math.round((diff / prior) * 100) : null
    return { diff, pct }
  }

  // Card view data — categories with rows
  const tableCategories = [
    {
      key: 'income', label: 'Income', icon: '💰',
      totalField: 'totalIncome', totalCurr: totalIncome,
      rows: [
        { line: '1a',  label: 'W-2 wages',              sub: 'Form W-2 · Box 1',              field: 'wages',            curr: wages1040,         kind: 'source' as const },
        { line: '2a',  label: 'Tax-exempt interest',     sub: 'Line 2a',                       field: 'taxExemptInterest', curr: 180,                  kind: 'source' as const },
        { line: '2b',  label: 'Taxable interest',        sub: 'Line 2b',                       field: 'taxableInterest',  curr: taxableInterest1040, kind: 'source' as const },
        { line: '3a',  label: 'Qualified dividends',     sub: 'Line 3a',                       field: 'qualifiedDivs',    curr: qualifiedDivs1040,   kind: 'source' as const },
        { line: '3b',  label: 'Ordinary dividends',      sub: 'Line 3b',                       field: 'ordinaryDivs',     curr: ordinaryDivs,    kind: 'source' as const },
        { line: '4b',  label: 'IRA distributions',       sub: '1099-R · Box 2a',               field: 'iraDistrib',       curr: taxablePension,    kind: 'source' as const },
        { line: '7',   label: 'Capital gain or (loss)',  sub: 'Line 7',                        field: 'capitalGain',      curr: capitalGain,     kind: 'source' as const },
        ...(necOnReturn
          ? [{ line: '8', label: 'Other income', sub: '1099-NEC · Box 1', field: 'otherIncome', curr: otherIncome, kind: 'source' as const }]
          : []),
        // 'Total income' (Line 9) omitted — same value as section header total
      ],
    },
    {
      key: 'deductions', label: 'Deductions', icon: '📋',
      totalField: 'taxableIncome', totalCurr: taxableIncome,
      rows: [
        // AGI (Line 11) omitted — equals Income total shown in section header above
        { line: '12', label: 'Standard deduction',  sub: 'From Schedule A', field: 'stdDeduction', curr: stdDeduction,  kind: 'calc' as const },
        // Taxable income (Line 15) omitted — same value as this section header total
      ],
    },
    {
      key: 'tax', label: 'Tax & Credits', icon: '🧾',
      totalField: 'totalTax', totalCurr: totalTax,
      rows: [
        { line: '16', label: 'Tax', sub: 'See instructions', field: 'incomeTax', curr: incomeTax, kind: 'calc' as const },
      ],
    },
    {
      key: 'payments', label: 'Payments', icon: '💳',
      totalField: 'totalPayments', totalCurr: withholding1040,
      rows: [
        { line: '25a', label: 'Federal tax withheld (W-2)', sub: 'Form W-2 · Box 2', field: 'w2Withholding', curr: w2Withholding, kind: 'source' as const },
        { line: '25b', label: 'Federal tax withheld (1099)', sub: '1099-DIV / 1099-R · Box 4', field: 'withholding', curr: withholding1099, kind: 'source' as const },
      ],
    },
  ]

  return (
    <div className={styles.leftPanel}>

      {/* ── View toggle ── */}
      <div className={styles.viewToggle}>
        <div className={styles.viewTogglePill} role="tablist">
          <button
            role="tab"
            aria-selected={view === 'table'}
            className={`${styles.viewToggleTab} ${view === 'table' ? styles.viewToggleTabActive : ''}`}
            onClick={() => setView('table')}
          >Summary</button>
          <button
            role="tab"
            aria-selected={view === 'form'}
            className={`${styles.viewToggleTab} ${view === 'form' ? styles.viewToggleTabActive : ''}`}
            onClick={() => setView('form')}
          >Form</button>
        </div>
      </div>

      {/* ── SUMMARY TABLE VIEW — Figma ProConnect style ── */}
      {view === 'table' && (
        <div className={styles.summaryWrapper}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <span className={styles.summaryCardLabel}>RETURN BREAKDOWN</span>
              <span className={styles.summaryCardSub}>Line-by-line · 2025 return</span>
            </div>

            {/* Column headers — structure mirrors summaryRowLeft + summaryRowRight exactly */}
            <div className={styles.summaryColHeaders}>
              <div className={styles.summaryColSpacer} />
              <div className={styles.summaryColValues}>
                <div className={styles.summaryColLabel} style={{ width: 108 }}>Current year</div>
                <div className={styles.summaryColLabel} style={{ width: 80 }}>Prior year</div>
                <div className={styles.summaryColLabel} style={{ width: 72 }}>Change $</div>
                <div className={styles.summaryColLabel} style={{ width: 52 }}>Change %</div>
                <div className={styles.summaryColLabel} style={{ width: 96 }} />
              </div>
            </div>

            {/* Rows */}
            <div className={styles.summaryBody}>
              {tableCategories.map(cat => {
                const isOpen = expanded.has(cat.key)
                return (
                  <div key={cat.key}>
                    {/* Section header row — div (not button) so info (i) can nest without invalid HTML */}
                    <div
                      className={styles.summarySectionRow}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={() => toggleExpanded(cat.key)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpanded(cat.key)
                        }
                      }}
                    >
                      <div className={styles.summaryRowLeft}>
                        <span className={`${styles.summaryChevron} ${isOpen ? styles.summaryChevronOpen : ''}`}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span className={styles.summarySectionLabel}>{cat.label}</span>
                      </div>
                      {(() => {
                        const p = cat.totalField ? py(cat.totalCurr, cat.totalField) : null
                        const d = p !== null ? cat.totalCurr - p : null
                        const pct = p !== null && p !== 0 ? Math.round((cat.totalCurr - p) / Math.abs(p) * 100) : null
                        const pos = d !== null && d > 0
                        const neg = d !== null && d < 0
                        const totalHasBreakdown = !!cat.totalField && !!SUMMARY_TO_CONTROL[cat.totalField]
                          && getTaxControlBreakdown(SUMMARY_TO_CONTROL[cat.totalField], controlSystemVals)?.kind === 'calc'
                        return (
                          <div className={styles.summaryRowRight}>
                            <div className={styles.summaryCurrVal} style={{ width: 108 }}>
                              <span className={styles.summaryCurrValText}>${fmt(cat.totalCurr)}</span>
                              {totalHasBreakdown && (
                                <Tooltip text="View subtotals" placement="top">
                                  <button
                                    type="button"
                                    className={`${styles.summaryInfoBtn} ${breakdownField === cat.totalField ? styles.summaryInfoBtnActive : ''}`}
                                    aria-label={`View subtotals for ${cat.label}`}
                                    onClick={e => {
                                      e.stopPropagation()
                                      openSummaryInfo(cat.totalField!, e.currentTarget)
                                    }}
                                  >
                                    <CircleInfo size="small" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                            <span className={styles.summaryPriorVal}>{p !== null ? `$${fmt(p)}` : ''}</span>
                            <span className={`${styles.summaryDiffVal} ${pos ? styles.summaryDiffPos : ''} ${neg ? styles.summaryDiffNeg : ''}`}>
                              {d !== null ? (d >= 0 ? `$${fmt(d)}` : `−$${fmt(Math.abs(d))}`) : ''}
                            </span>
                            <span className={`${styles.summaryPctVal} ${pos ? styles.summaryDiffPos : ''} ${neg ? styles.summaryDiffNeg : ''}`}>
                              {pct !== null ? `${pct < 0 ? '−' : ''}${Math.abs(pct)}%` : ''}
                            </span>
                            <div className={styles.summaryRowEndActions} aria-hidden="true" />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Sub-rows */}
                    {isOpen && cat.rows.map(row => {
                      const prior = row.field ? py(row.curr, row.field) : null
                      const hasPrior = prior !== null
                      const diff = hasPrior ? row.curr - prior! : null
                      const pctChg = hasPrior && prior !== 0 ? Math.round((row.curr - prior!) / Math.abs(prior!) * 100) : null
                      const isReviewed = !!row.field && reviewedHas(row.field)
                      const isChecked  = !!row.field && checkedFields.has(row.field)
                      const isSelected = !!row.field && activeHighlight === row.field
                      const isIssue    = !!row.field && row.field === issueField
                      const isBlue     = isSelected && !isIssue
                      const isOrange   = isSelected && !!isIssue
                      const clickable  = !!row.field
                      const hasPopover = !!row.field && fieldHasPopover(row.field)
                      const hasAttention = !!row.field && summaryFieldHasUnresolvedFlags(
                        row.field,
                        reviewedFields instanceof Map ? reviewedFields : new Map([...reviewedFields].map(k => [k, true])),
                      )
                      const diffPos = diff !== null && diff > 0
                      const diffNeg = diff !== null && diff < 0

                      const subRowCls = [
                        styles.summarySubRow,
                        isOrange ? styles.summarySubRowOrange : '',
                        isBlue   ? styles.summarySubRowBlue   : '',
                        isReviewed ? styles.summarySubRowReviewed : '',
                        clickable  ? styles.summarySubRowClickable : '',
                      ].filter(Boolean).join(' ')

                      return (
                        <div
                          key={row.line}
                          className={subRowCls}
                          data-field-row={row.field || undefined}
                          onMouseDown={clickable ? (e) => e.stopPropagation() : undefined}
                          onClick={clickable && hasPopover ? (e) => {
                            // Open Interest-style flyout only — never auto-open a source document
                            const el = (e.currentTarget as HTMLElement).querySelector(`.${styles.summaryCurrValText}`) as HTMLElement | null
                            openSummaryInfo(row.field!, el ?? e.currentTarget)
                          } : undefined}
                          onMouseEnter={row.field ? () => setHoveredField(row.field!) : undefined}
                          onMouseLeave={row.field ? () => setHoveredField(null) : undefined}
                        >
                          <div className={styles.summaryRowLeft}>
                            <div className={styles.summarySubLabelGroup}>
                              <span className={`${styles.summarySubLabel} ${row.kind === 'calc' ? styles.summarySubLabelCalc : ''}`}>
                                {row.label}
                              </span>
                              <span className={styles.summarySubNote}>Line {row.line} · {row.sub}</span>
                            </div>
                          </div>
                          <div className={styles.summaryRowRight}>
                            {/* Current year — value + info affordance (info stays here for drilldown) */}
                            <div className={styles.summaryCurrVal} style={{ width: 108 }}>
                              <span
                                className={`${styles.summaryCurrValText} ${row.kind === 'calc' ? styles.summaryCurrValCalc : ''} ${isBlue ? styles.summaryCurrValBlue : ''} ${isOrange ? styles.summaryCurrValOrange : ''} ${clickable ? styles.summaryCurrValClickable : ''}`}
                                onClick={clickable ? e => {
                                  e.stopPropagation()
                                  // Summary CY click opens flyout only — never auto-opens a document
                                  if (hasPopover) {
                                    openSummaryInfo(row.field!, e.currentTarget)
                                  }
                                } : undefined}
                              >
                                ${fmt(row.curr)}
                              </span>
                              {hasPopover && (
                                <Tooltip
                                  text={row.kind === 'calc' ? 'View subtotals' : 'View sources'}
                                  placement="top"
                                >
                                  <button
                                    type="button"
                                    className={`${styles.summaryInfoBtn} ${(sourceFlyout?.field === row.field || breakdownField === row.field || popoverField === row.field) ? styles.summaryInfoBtnActive : ''}`}
                                    aria-label={row.kind === 'calc' ? `View subtotals for ${row.label}` : `View sources for ${row.label}`}
                                    onClick={e => {
                                      e.stopPropagation()
                                      openSummaryInfo(row.field!, e.currentTarget)
                                    }}
                                  >
                                    <CircleInfo size="small" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                            <span className={styles.summaryPriorVal}>
                              {hasPrior ? `$${fmt(prior!)}` : ''}
                            </span>
                            <span className={`${styles.summaryDiffVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                              {hasPrior && diff !== null
                                ? diff >= 0 ? `$${fmt(diff)}` : `−$${fmt(Math.abs(diff))}`
                                : ''}
                            </span>
                            <span className={`${styles.summaryPctVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                              {hasPrior && pctChg !== null
                                ? `${pctChg < 0 ? '−' : ''}${Math.abs(pctChg)}%`
                                : ''}
                            </span>
                            {/* Comment + flag + check — always three equal slots on data rows */}
                            <div className={styles.summaryRowEndActions}>
                              {!!row.field && !!onAddFieldNote ? (
                                <Tooltip text="Add a comment" placement="top">
                                  <button
                                    type="button"
                                    className={`${styles.summaryActionBtn} ${commentField === row.field ? styles.summaryActionBtnActive : ''}`}
                                    aria-label={`Add comment for ${row.label}`}
                                    onClick={e => {
                                      e.stopPropagation()
                                      if (commentField === row.field) { setCommentField(null); setCommentDraft(''); setCommentAnchor(null) }
                                      else openComment1040(row.field!, row.label, e.currentTarget)
                                    }}
                                  >
                                    <Comment size="small" />
                                  </button>
                                </Tooltip>
                              ) : (
                                <span className={styles.summaryActionBtnSlot} aria-hidden="true" />
                              )}
                              {!!row.field ? (
                                <Tooltip
                                  text={hasAttention ? 'Import flags still need review' : 'No import flags on this row'}
                                  placement="top"
                                >
                                  <span
                                    className={`${styles.summaryActionBtn} ${hasAttention ? styles.summaryActionBtnFlag : styles.summaryActionBtnFlagMuted}`}
                                    role="img"
                                    aria-label={hasAttention ? 'Import flags still need review' : 'No import flags on this row'}
                                  >
                                    <Flag size="small" />
                                  </span>
                                </Tooltip>
                              ) : (
                                <span className={styles.summaryActionBtnSlot} aria-hidden="true" />
                              )}
                              {!!row.field && !!onToggleChecked ? (
                                <Tooltip text={isChecked ? 'Unmark as reviewed' : 'Mark row as reviewed'} placement="top">
                                  <button
                                    type="button"
                                    className={`${styles.summaryActionBtn} ${isChecked ? styles.summaryActionBtnChecked : ''}`}
                                    aria-label={isChecked ? 'Unmark' : 'Mark as reviewed'}
                                    onClick={e => { e.stopPropagation(); onToggleChecked(row.field!) }}
                                  >
                                    <CircleCheck size="small" />
                                  </button>
                                </Tooltip>
                              ) : (
                                <span className={styles.summaryActionBtnSlot} aria-hidden="true" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Amount owed row */}
              {(() => {
                const priorOwed = PRIOR_YEAR.amountOwed
                const diff = oweAmount - priorOwed
                const pctChg = yoyPercent(oweAmount, priorOwed)
                const isIssue = issueField === 'amountOwed'
                const isSelected = activeHighlight === 'amountOwed'
                const diffPos = diff > 0
                const diffNeg = diff < 0
                return (
              <div
                className={`${styles.summarySubRow} ${styles.summaryOweRow} ${isIssue && isSelected ? styles.summarySubRowOrange : ''} ${isSelected && !isIssue ? styles.summarySubRowBlue : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onFieldClick?.(activeHighlight === 'amountOwed' ? null : 'amountOwed')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFieldClick?.(activeHighlight === 'amountOwed' ? null : 'amountOwed') } }}
              >
                <div className={styles.summaryRowLeft}>
                  <span className={styles.summaryOweLabel}>Amount you owe · Line 37</span>
                </div>
                <div className={styles.summaryRowRight}>
                  <div className={styles.summaryCurrVal} style={{ width: 108 }}>
                    <span className={`${styles.summaryCurrValText} ${styles.summaryOweAmt}`}>${fmt(oweAmount)}</span>
                    <Tooltip text="View subtotals" placement="top">
                      <button
                        type="button"
                        className={`${styles.summaryInfoBtn} ${breakdownField === 'amountOwed' ? styles.summaryInfoBtnActive : ''}`}
                        aria-label="View subtotals for amount you owe"
                        onClick={e => {
                          e.stopPropagation()
                          openSummaryInfo('amountOwed', e.currentTarget)
                        }}
                      >
                        <CircleInfo size="small" />
                      </button>
                    </Tooltip>
                  </div>
                  <span className={styles.summaryPriorVal}>${fmt(priorOwed)}</span>
                  <span className={`${styles.summaryDiffVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                    {diff >= 0 ? `$${fmt(diff)}` : `−$${fmt(Math.abs(diff))}`}
                  </span>
                  <span className={`${styles.summaryPctVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                    {pctChg >= 0 ? '' : '−'}{Math.abs(pctChg)}%
                  </span>
                  <div className={styles.summaryRowEndActions} aria-hidden="true" />
                </div>
              </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}


      {/* Summary source flyout — Interest card style; doc opens only on card click */}
      {sourceFlyout && sourceFlyoutRect && (
        <TaxControlDocPopover
          rowLabel={sourceFlyout.label}
          docs={sourceFlyout.docs}
          onNavigateToDoc={docId => {
            const detailFieldId = sourceFlyout.detailByDocId?.[docId]
            if (detailFieldId && onNavigateSource) {
              onNavigateSource({
                docId,
                detailFieldId,
                label: sourceFlyout.docs.find(d => d.docId === docId)?.label ?? docId,
              })
            } else {
              onNavigateToSourceDoc?.(docId)
            }
            setSourceFlyout(null)
            setSourceFlyoutRect(null)
          }}
          anchorRect={sourceFlyoutRect}
          onClose={() => { setSourceFlyout(null); setSourceFlyoutRect(null) }}
        />
      )}

      {/* Summary calculation breakdown popover */}
      {breakdownRow && breakdownRect && (() => {
        const breakdown = getTaxControlBreakdown(breakdownRow, controlSystemVals)
        if (!breakdown) return null
        return (
          <TaxControlBreakdownPopover
            breakdown={breakdown}
            anchorRect={breakdownRect}
            onClose={() => { setBreakdownRow(null); setBreakdownRect(null); setBreakdownField(null) }}
          />
        )
      })()}

      <div className={styles.documentViewer} style={{ display: view === 'table' ? 'none' : undefined }}>
        <div className={styles.formDoc}>

          {/* ── IRS Header ── */}
          <div className={styles.irsHeader}>
            <div className={styles.irsLeft}>
              <div className={styles.irsDept}>Department of the Treasury — Internal Revenue Service</div>
              <div className={styles.irsTitle}>Form <strong>1040</strong> U.S. Individual Income Tax Return</div>
            </div>
            <div className={styles.irsRight}>
              <div className={styles.irsYear}>2025</div>
              <div className={styles.irsOmb}>OMB No. 1545-0074</div>
            </div>
          </div>

          {/* ── Taxpayer info ── */}
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <div className={styles.infoField} style={{ flex: 2 }}>
                <span className={styles.infoLabel}>Your first name and middle initial</span>
                <span className={styles.infoValue}>Jessica</span>
              </div>
              <div className={styles.infoField} style={{ flex: 2 }}>
                <span className={styles.infoLabel}>Last name</span>
                <span className={styles.infoValue}>Drake</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Your social security number</span>
                <span className={styles.infoValue}>{displaySsn}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoField} style={{ flex: 3 }}>
                <span className={styles.infoLabel}>Home address</span>
                <span className={styles.infoValue}>{CLIENT_ADDRESS.street}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>City, State, ZIP</span>
                <span className={styles.infoValue}>{formatClientCityStateZip()}</span>
              </div>
            </div>
          </div>

          {/* ── Filing status ── */}
          <div className={styles.filingStatus}>
            <span className={styles.filingLabel}>Filing Status</span>
            {['Single', 'Married filing jointly', 'Married filing separately', 'Head of household'].map((s, i) => (
              <label key={i} className={styles.filingOption}>
                <input type="radio" readOnly checked={i === 0} onChange={() => {}} /> {s}
              </label>
            ))}
          </div>

          <Divider />

          {/* ── Column headers ── */}
          <div className={styles.colHeaders}>
            <div className={styles.colLine} />
            <div className={styles.colDesc}>Description</div>
            <div className={styles.colLineR} />
            <div className={styles.colVal}>Amount</div>
          </div>

          {/* ── Field legend ── */}
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchSource}`} />
              From documents
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchCalc}`} />
              Calculated
            </span>
          </div>

          {/* ── Income table ── */}
          <table className={styles.table}>
            <colgroup>
              <col style={{ width: '22px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '22px' }} />
              <col style={{ width: '180px' }} />
            </colgroup>
            <tbody>
              <Section title="Income" />
              <Row field="wages"           line="1a" label="Total amount from Form(s) W-2, box 1"              kind="source" value={wages1040} />
              <Row                         line="1b" label="Household employee wages not on Form(s) W-2"      subdued />
              <Row                         line="1c" label="Tip income not reported on line 1a"                subdued />
              <Row field="wagesTotal"      line="1z" label="Add lines 1a through 1h"                           kind="calc"   value={wages1040} bold />

              <Row field="taxExemptInterest" line="2a" label="Tax-exempt interest"                             kind="source" value={180} />
              <Row field="taxableInterest"  line="2b" label="Taxable interest"                                 kind="source" value={taxableInterest1040} />
              <Row field="qualifiedDivs"   line="3a" label="Qualified dividends"                               kind="source" value={qualifiedDivs1040} />
              <Row field="ordinaryDivs"    line="3b" label="Ordinary dividends"                                kind="source" value={ordinaryDivs} />
              <Row field="iraDistrib"      line="4b" label="IRA distributions"                                 kind="source" value={taxablePension} />
              <Row field="capitalGain"     line="7"  label="Capital gain or (loss)"                            kind="source" value={capitalGain} />
              {necOnReturn && (
                <Row field="otherIncome"   line="8"  label="Other income from Schedule 1, line 10"            kind="source" value={otherIncome} />
              )}

              <Divider />
              <Row field="totalIncome"     line="9"  label="Total income. Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8" kind="calc" value={totalIncome} bold />

              <Section title="Adjustments to Income" />
              <Row field="agi"             line="11" label="Adjusted gross income"                                         kind="calc"   value={totalIncome} bold shaded />

              <Section title="Deductions" />
              <Row field="stdDeduction"    line="12" label="Standard deduction or itemized deductions (from Schedule A)"  kind="calc"   value={stdDeduction} />
              <Row field="deductionSum"    line="14" label="Add lines 12 and 13"                                           kind="calc"   value={stdDeduction} />

              <Divider />
              <Row field="taxableIncome"   line="15" label="Taxable income"                                                kind="calc"   value={taxableIncome} bold shaded />

              <Section title="Tax and Credits" />
              <Row field="incomeTax"       line="16" label="Tax (see instructions)"                                        kind="calc"   value={incomeTax} />
              <Row field="totalTax"        line="24" label="Total tax"                                                     kind="calc"   value={totalTax} bold />

              <Section title="Payments" />
              <Row field="w2Withholding"   line="25a" label="Federal income tax withheld from Form(s) W-2"                 kind="source" value={w2Withholding} />
              <Row field="withholding"     line="25b" label="Federal income tax withheld from Form(s) 1099"               kind="source" value={withholding1099} />
              <Row field="totalWithholding" line="25d" label="Add lines 25a through 25c"                                    kind="calc"   value={withholding1040} />
              <Row field="totalPayments"   line="33"  label="Total payments"                                               kind="calc"   value={withholding1040} bold />

              <tr className={styles.oweDividerRow}>
                <td colSpan={4} />
              </tr>
              <Row field="amountOwed"      line="37" label="Amount you owe. Subtract line 33 from line 24"                kind="calc"   value={oweAmount} bold owe />
            </tbody>
          </table>

        </div>
      </div>

      {/* ── Field popover — fixed-positioned so it escapes overflow:hidden ── */}
      {popoverField && popoverRect && (
        <FieldPopover
          fieldName={popoverField}
          anchorRect={popoverRect}
          origin={getFieldOrigin(popoverField, originTotals, liveAmounts)}
          liveCurrent={getFieldLiveCurrent(popoverField, originTotals)}
          onClose={handleClosePopover}
          onNavigateSource={(source) => {
            handleDismissPopoverKeepSelection()
            onNavigateSource?.(source)
          }}
          onViewSource={(fieldName, sourceLabel) => {
            // Dismiss the popover UI but keep the field selected so highlight carries through
            handleDismissPopoverKeepSelection()
            onViewSource?.(fieldName, sourceLabel)
          }}
        />
      )}

      {/* ── Comment popover (portal) ── */}
      {commentField && commentAnchor && createPortal(
        <div
          className={styles.commentPopover1040}
          style={{ top: commentAnchor.top, left: commentAnchor.left, transform: 'translateY(-50%)' }}
          ref={commentRef}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.commentPopoverCtx}>
            <span className={styles.commentPopoverChip}>
              Form 1040 · {FIELD_META[commentField]?.label ?? commentField}
            </span>
          </div>
          <textarea
            autoFocus
            className={styles.commentPopoverInput}
            placeholder="Add a comment…"
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                postComment1040(`Form 1040 · ${FIELD_META[commentField]?.label ?? commentField}`)
            }}
            rows={3}
          />
          <div className={styles.commentPopoverActions}>
            <button className={styles.commentPopoverCancel}
              onClick={e => { e.stopPropagation(); setCommentField(null); setCommentDraft(''); setCommentAnchor(null) }}>
              Cancel
            </button>
            <button
              className={`${styles.commentPopoverPost} ${commentDraft.trim() ? styles.commentPopoverPostActive : ''}`}
              disabled={!commentDraft.trim()}
              onClick={e => {
                e.stopPropagation()
                postComment1040(`Form 1040 · ${FIELD_META[commentField]?.label ?? commentField}`)
              }}
            >
              Post
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
