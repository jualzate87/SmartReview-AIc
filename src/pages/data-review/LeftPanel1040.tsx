import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import FieldPopover, { FIELD_META } from './FieldPopover'
import Tooltip from './Tooltip'
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
  reviewedFields?: Set<string>
  /** Fields manually checked off by the preparer (independent of AI review) */
  checkedFields?: Set<string>
  /** Toggle a field's checked state */
  onToggleChecked?: (fieldName: string) => void
  /** When true: this field is highlighted orange (active agent issue card) — takes precedence over blue */
  issueField?: string | null
  /** Called when user clicks a source link in the field popover */
  onViewSource?: (fieldName: string, sourceLabel?: string) => void
  /** Live editable field values from source-doc entry sheets */
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  /** Called when user posts a comment from a 1040 field */
  onAddFieldNote?: (text: string, context: string) => void
  /** When true: all Phase 1 import flags have been reviewed — unlocks the Tax control tab's dot indicator */
  allFlagsCleared?: boolean
}

import { PRIOR_YEAR_1040_VALUES } from './priorYear1040Data'

const PRIOR_YEAR = PRIOR_YEAR_1040_VALUES

// Current-year values used for YoY comparison (must match the live figures below)
const CURR_YEAR = {
  wages:           118940,
  taxableInterest:   1986,
  qualifiedDivs:   187500,
  ordinaryDivs:    331250,
  capitalGain:          0,
  totalIncome:     452176,
  agi:             452176,
  stdDeduction:     15750,
  taxableIncome:   436426,
}

// YOY % — derived from document values vs current year (for badge/tint logic only)
const YOY: Record<string, number> = {
  wages:           Math.round((CURR_YEAR.wages           - PRIOR_YEAR.wages)           / PRIOR_YEAR.wages           * 100),
  taxableInterest: Math.round((CURR_YEAR.taxableInterest - PRIOR_YEAR.taxableInterest) / PRIOR_YEAR.taxableInterest * 100),
  qualifiedDivs:   Math.round((CURR_YEAR.qualifiedDivs    - PRIOR_YEAR.qualifiedDivs)   / PRIOR_YEAR.qualifiedDivs   * 100),
  ordinaryDivs:    Math.round((CURR_YEAR.ordinaryDivs    - PRIOR_YEAR.ordinaryDivs)    / PRIOR_YEAR.ordinaryDivs    * 100),
  capitalGain:     PRIOR_YEAR.capitalGain !== 0 ? Math.round((CURR_YEAR.capitalGain - PRIOR_YEAR.capitalGain) / PRIOR_YEAR.capitalGain * 100) : 0,
  totalIncome:     Math.round((CURR_YEAR.totalIncome      - PRIOR_YEAR.totalIncome)     / PRIOR_YEAR.totalIncome     * 100),
  agi:             Math.round((CURR_YEAR.agi              - PRIOR_YEAR.agi)             / PRIOR_YEAR.agi             * 100),
  stdDeduction:    Math.round((CURR_YEAR.stdDeduction     - PRIOR_YEAR.stdDeduction)    / PRIOR_YEAR.stdDeduction    * 100),
  taxableIncome:   Math.round((CURR_YEAR.taxableIncome    - PRIOR_YEAR.taxableIncome)   / PRIOR_YEAR.taxableIncome   * 100),
}

// Dollar tax impact = change in field value × marginal rate (qualified divs/cap gain use the
// 15% preferential rate; everything else uses Jessica's ordinary marginal rate)
const YOY_TAX_IMPACT: Record<string, number> = {
  wages:           Math.abs(CURR_YEAR.wages           - PRIOR_YEAR.wages)           * 0.24,
  taxableInterest: Math.abs(CURR_YEAR.taxableInterest - PRIOR_YEAR.taxableInterest) * 0.24,
  qualifiedDivs:   Math.abs(CURR_YEAR.qualifiedDivs   - PRIOR_YEAR.qualifiedDivs)   * 0.15,
  ordinaryDivs:    Math.abs(CURR_YEAR.ordinaryDivs    - PRIOR_YEAR.ordinaryDivs)    * 0.15,
  capitalGain:     Math.abs(CURR_YEAR.capitalGain     - PRIOR_YEAR.capitalGain)     * 0.15,
  totalIncome:     Math.abs(CURR_YEAR.totalIncome      - PRIOR_YEAR.totalIncome)     * 0.24,
  agi:             Math.abs(CURR_YEAR.agi              - PRIOR_YEAR.agi)             * 0.24,
  stdDeduction:    Math.abs(CURR_YEAR.stdDeduction     - PRIOR_YEAR.stdDeduction)    * 0.24,
  taxableIncome:   Math.abs(CURR_YEAR.taxableIncome    - PRIOR_YEAR.taxableIncome)   * 0.24,
}

// Threshold: >=15% change AND >$300 estimated tax impact
function meetsRowTintThreshold(field: string): boolean {
  const pct = YOY[field]
  if (pct === undefined) return false
  const taxImpact = YOY_TAX_IMPACT[field] ?? 0
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

// 1099-DIV Box 4 withholding is a fixed $26,363 (Token Financial); the W-2 Box 2 (federal
// withholding) is blank on Jessica's W-2, so the W-2 portion is whatever the preparer edits
// it to be.
const DIV_WITHHOLDING = 24925

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
  fieldValues,
  onAddFieldNote,
  allFlagsCleared = false,
}: LeftPanel1040Props) {
  // Detail-field keys may differ from 1040 row keys (e.g. fedTaxWithheld ↔ withholding).
  const activeHighlight = highlightField ?? selectedField

  // Derived 1040 values — Jessica Drake's return (TY 2025)
  const taxableInterest = fieldValues?.taxableInterest ?? 1986
  const qualifiedDivs   = fieldValues?.qualifiedDivs   ?? 187500
  const withholding1040 = fieldValues?.withholding      ?? DIV_WITHHOLDING
  const w2Withholding    = Math.max(0, withholding1040 - DIV_WITHHOLDING)
  const ordinaryDivs    = 331250  // Box 1a — includes the qualifiedDivs portion above
  const capitalGain     = 0       // 1099-DIV Box 2a — not present on this year's 1099-DIV
  // totalIncome & AGI recalculate from live taxableInterest/qualifiedDivs (other lines are static)
  const totalIncome     = total1a + taxableInterest + ordinaryDivs + capitalGain
  const stdDeduction    = 15750
  const taxableIncome   = totalIncome - stdDeduction
  // Flat, hardcoded total tax — matches ProtoA (no bracket computation, no NIIT breakout).
  const totalTax = 149830
  const incomeTax = totalTax

  // View toggle: 'form' | 'table' | 'control'
  const [view, setView] = useState<'form' | 'table' | 'control'>('form')
  // Table view: which categories are expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['income', 'deductions', 'tax', 'payments']))
  // Control sheet: input values keyed by row id
  const [controlInputs, setControlInputs] = useState<Record<string, string>>({})
  // Control sheet modal: shown once when flags are first cleared
  const [modalDismissed, setModalDismissed] = useState(() => {
    try { return localStorage.getItem('taxControlModalDismissed') === '1' } catch { return false }
  })
  const [showModal, setShowModal] = useState(false)
  const prevFlagsCleared = useRef(false)

  useEffect(() => {
    if (allFlagsCleared && !prevFlagsCleared.current && !modalDismissed) {
      setShowModal(true)
    }
    prevFlagsCleared.current = !!allFlagsCleared
  }, [allFlagsCleared, modalDismissed])

  const dismissModal = () => {
    setShowModal(false)
    setModalDismissed(true)
    try { localStorage.setItem('taxControlModalDismissed', '1') } catch { /* ignore */ }
  }
  const openControlFromModal = () => {
    setView('control')
    dismissModal()
  }
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

  const handleRowClick = (field: string, e: React.MouseEvent<HTMLTableRowElement>) => {
    // If the field is the active issue field, just toggle selection (orange mode)
    if (field === issueField) {
      onFieldClick?.(activeHighlight === field ? null : field)
      setPopoverField(null)
      return
    }

    // Toggle: clicking the same field closes the popover
    if (field === activeHighlight) {
      onFieldClick?.(null)
      setPopoverField(null)
      return
    }

    // New field clicked — open blue popover if it has metadata
    onFieldClick?.(field)
    if (FIELD_META[field]) {
      // Get the rect of the value cell (last td in the row)
      const row = e.currentTarget
      const cells = row.querySelectorAll('td')
      const valueCell = cells[cells.length - 1]
      if (valueCell) {
        setPopoverRect(valueCell.getBoundingClientRect())
        setPopoverField(field)
      }
    } else {
      setPopoverField(null)
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
    const isReviewed       = !!field && reviewedFields.has(field)
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

            {/* YoY badge — outside value box, to the right */}
            {yoyExpanded && yoy !== undefined && !!field && (
              <span className={`${styles.badge} ${badgeColor(yoy)}`}>
                {yoy > 0 ? `+${yoy}%` : `${yoy}%`}
              </span>
            )}

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
        { line: '1a',  label: 'W-2 wages',              sub: 'Form W-2 · Box 1',              field: 'wages',            curr: total1a,         kind: 'source' as const },
        { line: '2a',  label: 'Tax-exempt interest',     sub: 'Line 2a',                       field: 'taxExemptInterest', curr: 234,             kind: 'source' as const },
        { line: '2b',  label: 'Taxable interest',        sub: 'Line 2b',                       field: 'taxableInterest',  curr: taxableInterest, kind: 'source' as const },
        { line: '3a',  label: 'Qualified dividends',     sub: 'Line 3a',                       field: 'qualifiedDivs',    curr: qualifiedDivs,   kind: 'source' as const },
        { line: '3b',  label: 'Ordinary dividends',      sub: 'Line 3b',                       field: 'ordinaryDivs',     curr: ordinaryDivs,    kind: 'source' as const },
        { line: '7',   label: 'Capital gain or (loss)',  sub: 'Line 7',                        field: 'capitalGain',      curr: capitalGain,     kind: 'source' as const },
        // 'Total income' (Line 9) omitted — same value as section header total
      ],
    },
    {
      key: 'deductions', label: 'Deductions', icon: '📋',
      totalField: 'taxableIncome', totalCurr: taxableIncome,
      rows: [
        // AGI (Line 11) omitted — equals Income total shown in section header above
        { line: '12', label: 'Standard deduction',  sub: 'From Schedule A', field: 'stdDeduction', curr: stdDeduction,  kind: 'source' as const },
        // Taxable income (Line 15) omitted — same value as this section header total
      ],
    },
    {
      key: 'tax', label: 'Tax & Credits', icon: '🧾',
      totalField: null, totalCurr: totalTax,
      rows: [
        { line: '16', label: 'Tax', sub: 'See instructions', field: null, curr: incomeTax, kind: 'calc' as const },
        // Total tax (Line 24) omitted — same value as section header
      ],
    },
    {
      key: 'payments', label: 'Payments', icon: '💳',
      totalField: null, totalCurr: withholding1040,
      rows: [
        { line: '25a', label: 'Federal tax withheld', sub: 'Form W-2 · Box 2',    field: null,           curr: w2Withholding,  kind: 'source' as const },
        { line: '25b', label: 'Federal tax withheld', sub: '1099-DIV · Box 4',    field: 'withholding',  curr: DIV_WITHHOLDING, kind: 'source' as const },
        // Total payments (Line 33) omitted — same value as section header
      ],
    },
  ]
  const oweAmount = Math.max(0, totalTax - withholding1040)

  return (
    <div className={styles.leftPanel}>

      {/* ── Tax control unlock modal ── */}
      <Modal open={showModal} onClose={dismissModal} size="medium" dismissible>
        <ModalHeader alignment="center" transparentBackground onClose={dismissModal}>
          <ModalTitle title="Nice job! Want to check your totals?" />
        </ModalHeader>
        <ModalContent alignment="left">
          <p className={styles.controlModalBody}>
            Compare summary totals against the source documents to quickly see if everything aligns or if you need to look closer at the details.
          </p>
        </ModalContent>
        <ModalActions alignment="right">
          <Button priority="tertiary" onClick={dismissModal}>Not now</Button>
          <Button priority="primary" onClick={openControlFromModal}>Check totals</Button>
        </ModalActions>
      </Modal>

      {/* ── View toggle ── */}
      <div className={styles.viewToggle}>
        <div className={styles.viewTogglePill} role="tablist">
          <button
            role="tab"
            aria-selected={view === 'form'}
            className={`${styles.viewToggleTab} ${view === 'form' ? styles.viewToggleTabActive : ''}`}
            onClick={() => setView('form')}
          >Form</button>
          <button
            role="tab"
            aria-selected={view === 'table'}
            className={`${styles.viewToggleTab} ${view === 'table' ? styles.viewToggleTabActive : ''}`}
            onClick={() => setView('table')}
          >Summary</button>
          <button
            role="tab"
            aria-selected={view === 'control'}
            className={[
              styles.viewToggleTab,
              view === 'control' ? styles.viewToggleTabActive : '',
            ].filter(Boolean).join(' ')}
            onClick={() => { setView('control'); dismissModal() }}
          >
            Tax control
            {allFlagsCleared && view !== 'control' && (
              <span className={styles.tabDot} aria-hidden="true" />
            )}
          </button>
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
                <div className={styles.summaryColLabel} style={{ width: 88 }}>Current year</div>
                <div className={styles.summaryColLabel} style={{ width: 80 }}>Prior year</div>
                <div className={styles.summaryColLabel} style={{ width: 72 }}>Change $</div>
                <div className={styles.summaryColLabel} style={{ width: 52 }}>Change %</div>
              </div>
            </div>

            {/* Rows */}
            <div className={styles.summaryBody}>
              {tableCategories.map(cat => {
                const isOpen = expanded.has(cat.key)
                return (
                  <div key={cat.key}>
                    {/* Section header row */}
                    <button
                      className={styles.summarySectionRow}
                      onClick={() => toggleExpanded(cat.key)}
                      aria-expanded={isOpen}
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
                        return (
                          <div className={styles.summaryRowRight}>
                            <div className={styles.summaryCurrVal}><span className={styles.summaryCurrValText}>${fmt(cat.totalCurr)}</span></div>
                            <span className={styles.summaryPriorVal}>{p !== null ? `$${fmt(p)}` : ''}</span>
                            <span className={`${styles.summaryDiffVal} ${pos ? styles.summaryDiffPos : ''} ${neg ? styles.summaryDiffNeg : ''}`}>
                              {d !== null ? (d >= 0 ? `$${fmt(d)}` : `−$${fmt(Math.abs(d))}`) : ''}
                            </span>
                            <span className={`${styles.summaryPctVal} ${pos ? styles.summaryDiffPos : ''} ${neg ? styles.summaryDiffNeg : ''}`}>
                              {pct !== null ? `${pct < 0 ? '−' : ''}${Math.abs(pct)}%` : ''}
                            </span>
                          </div>
                        )
                      })()}
                    </button>

                    {/* Sub-rows */}
                    {isOpen && cat.rows.map(row => {
                      const prior = row.field ? py(row.curr, row.field) : null
                      const hasPrior = prior !== null
                      const diff = hasPrior ? row.curr - prior! : null
                      const pctChg = hasPrior && prior !== 0 ? Math.round((row.curr - prior!) / Math.abs(prior!) * 100) : null
                      const isReviewed = !!row.field && reviewedFields.has(row.field)
                      const isChecked  = !!row.field && checkedFields.has(row.field)
                      const isSelected = !!row.field && activeHighlight === row.field
                      const isIssue    = !!row.field && row.field === issueField
                      const isHov      = !!row.field && hoveredField === row.field
                      const isBlue     = isSelected && !isIssue
                      const isOrange   = isSelected && !!isIssue
                      const clickable  = !!row.field && !!FIELD_META[row.field]
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
                          onMouseEnter={row.field ? () => setHoveredField(row.field!) : undefined}
                          onMouseLeave={row.field ? () => setHoveredField(null) : undefined}
                        >
                          <div className={styles.summaryRowLeft}>
                            <div className={styles.summarySubLabelGroup}>
                              <span className={`${styles.summarySubLabel} ${row.kind === 'calc' ? styles.summarySubLabelCalc : ''}`}>
                                {isReviewed && <span className={styles.summaryReviewedIcon}><CircleCheck size="small" /></span>}
                                {row.label}
                              </span>
                              <span className={styles.summarySubNote}>Line {row.line} · {row.sub}</span>
                            </div>
                          </div>
                          <div className={styles.summaryRowRight}>
                            {/* Current year — value text + action buttons */}
                            <div className={styles.summaryCurrVal}>
                              <span
                                className={`${styles.summaryCurrValText} ${row.kind === 'calc' ? styles.summaryCurrValCalc : ''} ${isBlue ? styles.summaryCurrValBlue : ''} ${isOrange ? styles.summaryCurrValOrange : ''} ${clickable ? styles.summaryCurrValClickable : ''}`}
                                onClick={clickable ? e => {
                                  e.stopPropagation()
                                  const el = e.currentTarget as HTMLElement
                                  if (activeHighlight === row.field) {
                                    onFieldClick?.(null)
                                    setPopoverField(null); setPopoverRect(null)
                                  } else {
                                    onFieldClick?.(row.field!)
                                    if (FIELD_META[row.field!]) {
                                      setPopoverRect(el.getBoundingClientRect())
                                      setPopoverField(row.field!)
                                    }
                                  }
                                } : undefined}
                              >
                                ${fmt(row.curr)}
                              </span>
                              {/* Action buttons — check + comment, shown on row hover */}
                              {!!row.field && !isReviewed && !!row.kind && (
                                <div className={`${styles.summaryRowActions} ${(isChecked || commentField === row.field) ? styles.summaryRowActionsVisible : ''}`}>
                                  {!!onToggleChecked && (
                                    <Tooltip text={isChecked ? 'Unmark as correct' : 'Mark as correct'} placement="top">
                                      <button
                                        className={`${styles.checkBtn} ${isChecked ? styles.checkBtnActive : ''}`}
                                        aria-label={isChecked ? 'Unmark' : 'Mark as correct'}
                                        onClick={e => { e.stopPropagation(); onToggleChecked(row.field!) }}
                                      ><CircleCheck size="small" /></button>
                                    </Tooltip>
                                  )}
                                  {!!onAddFieldNote && (
                                    <Tooltip text="Add a comment" placement="top">
                                      <button
                                        className={`${styles.commentBtn1040} ${commentField === row.field ? styles.commentBtn1040Active : ''}`}
                                        aria-label="Add comment"
                                        onClick={e => {
                                          e.stopPropagation()
                                          if (commentField === row.field) { setCommentField(null); setCommentDraft(''); setCommentAnchor(null) }
                                          else openComment1040(row.field!, row.label, e.currentTarget)
                                        }}
                                      ><Comment size="small" /></button>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className={styles.summaryPriorVal}>
                              {hasPrior ? `$${fmt(prior!)}` : ''}
                            </span>
                            {/* Diff $ — only if prior year exists */}
                            <span className={`${styles.summaryDiffVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                              {hasPrior && diff !== null
                                ? diff >= 0 ? `$${fmt(diff)}` : `−$${fmt(Math.abs(diff))}`
                                : ''}
                            </span>
                            {/* Diff % — only if prior year exists */}
                            <span className={`${styles.summaryPctVal} ${diffPos ? styles.summaryDiffPos : ''} ${diffNeg ? styles.summaryDiffNeg : ''}`}>
                              {hasPrior && pctChg !== null
                                ? `${pctChg < 0 ? '−' : ''}${Math.abs(pctChg)}%`
                                : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Amount owed row */}
              <div className={`${styles.summarySubRow} ${styles.summaryOweRow}`}>
                <div className={styles.summaryRowLeft}>
                  <span className={styles.summaryOweLabel}>Amount you owe · Line 37</span>
                </div>
                <div className={styles.summaryRowRight}>
                  <div className={styles.summaryCurrVal}><span className={`${styles.summaryCurrValText} ${styles.summaryOweAmt}`}>${fmt(oweAmount)}</span></div>
                  <span className={styles.summaryPriorVal} />
                  <span className={styles.summaryDiffVal} />
                  <span className={styles.summaryPctVal} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAX CONTROL VIEW ── */}
      {view === 'control' && (() => {
        type ControlRow = {
          id: string
          line: string
          label: string
          desc: string           // where the value comes from / what to add up
          systemVal: number | null
          sourceTab?: Parameters<NonNullable<typeof onViewSource>>[0]  // which doc tab to jump to
          isTotalRow?: boolean   // bold total rows
          isBlank?: boolean      // rows with no system value (not applicable to this return)
        }
        const controlSections: { key: string; label: string; rows: ControlRow[] }[] = [
          {
            key: 'income',
            label: 'Income',
            rows: [
              { id: 'wages',       line: '1a', label: 'Wages',           desc: 'Sum of Box 1 from all W-2s',                              systemVal: total1a,        sourceTab: 'wages' },
              { id: 'interest',    line: '2b', label: 'Interest',        desc: 'Box 1 (taxable interest) from all 1099-INTs',              systemVal: taxableInterest, sourceTab: 'taxableInterest' },
              { id: 'dividends',   line: '3b', label: 'Dividends',       desc: 'Box 1a (ordinary dividends) from all 1099-DIVs',           systemVal: ordinaryDivs,   sourceTab: 'ordinaryDivs' },
              { id: 'qualDivs',    line: '3a', label: 'Qualified divs',  desc: 'Box 1b (qualified dividends) from all 1099-DIVs',          systemVal: qualifiedDivs,  sourceTab: 'qualifiedDivs' },
              { id: 'ira',         line: '4b', label: 'IRA / pension',   desc: 'Box 2a (taxable amount) from all 1099-Rs',                 systemVal: null,           isBlank: true },
              { id: 'totalIncome', line: '9',  label: 'Total income',    desc: 'Lines 1z + 2b + 3b + 4b (sum of all income lines)',       systemVal: totalIncome,    isTotalRow: true },
            ],
          },
          {
            key: 'deductions',
            label: 'Deductions',
            rows: [
              { id: 'stdDeduction',  line: '12', label: 'Standard deduction', desc: 'Deduction for filing status Single: $15,750 for 2025', systemVal: stdDeduction },
              { id: 'taxableIncome', line: '15', label: 'Taxable income',      desc: 'Line 9 minus line 12 (Total income − Deductions)',      systemVal: taxableIncome, isTotalRow: true },
            ],
          },
          {
            key: 'payments',
            label: 'Payments & tax owed',
            rows: [
              { id: 'totalTax',      line: '24', label: 'Total tax',           desc: 'Tax on taxable income per IRS tax tables',                              systemVal: totalTax,       isTotalRow: true },
              { id: 'withholdingW2', line: '25a', label: 'W-2 withholding',   desc: 'Box 2 (federal income tax withheld) from all W-2s',                    systemVal: w2Withholding,  sourceTab: 'withholding' },
              { id: 'withholding99', line: '25b', label: '1099 withholding',   desc: 'Box 4 (federal income tax withheld) from all 1099s',                   systemVal: DIV_WITHHOLDING, sourceTab: 'withholding1099' },
              { id: 'totalPayments', line: '33', label: 'Total payments',      desc: 'Lines 25a + 25b (sum of all federal tax withheld)',                    systemVal: withholding1040, isTotalRow: true },
              { id: 'amountOwed',    line: '37', label: 'Amount owed',         desc: 'Line 24 minus line 33 (Total tax − Total payments)',                   systemVal: oweAmount,      isTotalRow: true },
            ],
          },
        ]

        const allRows = controlSections.flatMap(s => s.rows).filter(r => !r.isBlank)
        const inputRows = allRows.filter(r => r.systemVal !== null && !r.isBlank)
        const matches = inputRows.map(r => {
          const raw = controlInputs[r.id]
          if (!raw || raw.trim() === '') return null
          const parsed = parseFloat(raw.replace(/[,$]/g, ''))
          if (isNaN(parsed)) return null
          return Math.abs(parsed - r.systemVal!) <= 1
        })
        const allMatch = matches.length > 0 && matches.every(m => m === true)

        const getMatch = (id: string) => {
          const idx = inputRows.findIndex(r => r.id === id)
          return idx >= 0 ? matches[idx] : null
        }

        return (
          <div className={styles.controlWrapper}>
            <div className={`${styles.summaryCard} ${allMatch ? styles.controlCardSuccess : ''}`}>
              <div className={styles.summaryCardHeader}>
                <span className={styles.summaryCardLabel}>TAX CONTROL</span>
                <span className={styles.summaryCardSub}>Reconcile source totals · 2025 return</span>
              </div>

              <div className={styles.controlInstruction}>
                <div className={styles.controlInstructionIcon}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" fill="#0077c5"/>
                    <path d="M10 9v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="10" cy="6.5" r="1" fill="#fff"/>
                  </svg>
                </div>
                <div className={styles.controlInstructionBody}>
                  <strong>Enter the totals from your source documents in the column on the right.</strong> The system total is shown for comparison. If both match, your extraction is confirmed correct. Small rounding differences (±$1) are normal.
                </div>
              </div>

              {/* Column headers */}
              <div className={styles.controlColHeaders}>
                <div className={styles.controlColLine}>Line</div>
                <div className={styles.controlColItem}>Item</div>
                <div className={styles.controlColSystem}>System</div>
                <div className={styles.controlColSource}>Source docs</div>
                <div className={styles.controlColMatch}></div>
              </div>

              <div className={styles.summaryBody}>
                {controlSections.map(section => (
                  <div key={section.key}>
                    <div className={styles.controlSectionHeader}>{section.label}</div>
                    {section.rows.map(row => {
                      if (row.isBlank) {
                        return (
                          <div key={row.id} className={`${styles.controlRow} ${styles.controlRowBlank}`}>
                            <div className={styles.controlLineNum}>{row.line}</div>
                            <div className={styles.controlLabelGroup}>
                              <span className={styles.controlLabelText}>{row.label}</span>
                              <span className={styles.controlDesc}>{row.desc}</span>
                            </div>
                            <div className={styles.controlSystemVal}>—</div>
                            <div className={styles.controlInputBlank}>N/A</div>
                            <div className={styles.controlMatch} />
                          </div>
                        )
                      }

                      const matchResult = getMatch(row.id)
                      const hasInput = !!controlInputs[row.id]?.trim()
                      const diff = hasInput ? parseFloat((controlInputs[row.id] ?? '').replace(/[,$]/g, '')) - (row.systemVal ?? 0) : null
                      const clickable = !!row.sourceTab

                      return (
                        <div
                          key={row.id}
                          className={[
                            styles.controlRow,
                            row.isTotalRow ? styles.controlRowTotal : '',
                            clickable ? styles.controlRowClickable : '',
                          ].filter(Boolean).join(' ')}
                          onClick={clickable ? () => onViewSource?.(row.sourceTab!) : undefined}
                          title={clickable ? 'Click to view source document' : undefined}
                        >
                          <div className={styles.controlLineNum}>{row.line}</div>
                          <div className={styles.controlLabelGroup}>
                            <span className={styles.controlLabelText}>
                              {row.label}
                              {clickable && (
                                <svg className={styles.controlNavIcon} width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <span className={styles.controlDesc}>{row.desc}</span>
                          </div>
                          <div className={styles.controlSystemVal}>
                            {row.systemVal !== null ? `$${fmt(row.systemVal)}` : '—'}
                          </div>
                          <input
                            className={[
                              styles.controlInput,
                              hasInput && matchResult === true  ? styles.controlInputOk   : '',
                              hasInput && matchResult === false ? styles.controlInputFail : '',
                            ].filter(Boolean).join(' ')}
                            type="text"
                            inputMode="numeric"
                            placeholder="$0"
                            value={controlInputs[row.id] ?? ''}
                            onChange={e => setControlInputs(prev => ({ ...prev, [row.id]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            onFocus={() => row.sourceTab && onViewSource?.(row.sourceTab)}
                            aria-label={`Source total for ${row.label}`}
                          />
                          <div className={styles.controlMatch}>
                            {hasInput && matchResult === true  && <span className={styles.controlMatchOk}>✓</span>}
                            {hasInput && matchResult === false && (
                              <span className={styles.controlMatchFail} title={`Diff: ${diff !== null && diff >= 0 ? '+' : ''}${diff?.toFixed(2)}`}>✗</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {allMatch && (
                <div className={styles.controlFooter}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" fill="#00856D"/>
                    <path d="M6.5 10.5L8.5 12.5L13.5 7.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Totals reconciled — return is confirmed complete.
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <div className={styles.documentViewer} style={{ display: (view === 'table' || view === 'control') ? 'none' : undefined }}>
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
                <span className={styles.infoValue}>400-01-4699</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoField} style={{ flex: 3 }}>
                <span className={styles.infoLabel}>Home address</span>
                <span className={styles.infoValue}>333 Easy Street</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>City, State, ZIP</span>
                <span className={styles.infoValue}>Middlefield, CA  98756</span>
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
              <Row field="wages"           line="1a" label="Total amount from Form(s) W-2, box 1"              kind="source" value={total1a} />
              <Row                         line="1b" label="Household employee wages not on Form(s) W-2"      subdued />
              <Row                         line="1c" label="Tip income not reported on line 1a"                subdued />
              <Row                         line="1z" label="Add lines 1a through 1h"                           kind="calc"   value={total1a} bold />

              <Row field="taxExemptInterest" line="2a" label="Tax-exempt interest"                             kind="source" value={180} />
              <Row field="taxableInterest"  line="2b" label="Taxable interest"                                 kind="source" value={taxableInterest} />
              <Row field="qualifiedDivs"   line="3a" label="Qualified dividends"                               kind="source" value={qualifiedDivs} />
              <Row field="ordinaryDivs"    line="3b" label="Ordinary dividends"                                kind="source" value={ordinaryDivs} />
              <Row field="capitalGain"     line="7"  label="Capital gain or (loss)"                            kind="source" value={capitalGain} />

              <Divider />
              <Row field="totalIncome"     line="9"  label="Total income. Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8" kind="calc" value={totalIncome} bold />

              <Section title="Adjustments to Income" />
              <Row field="agi"             line="11" label="Adjusted gross income"                                         kind="calc"   value={totalIncome} bold shaded />

              <Section title="Deductions" />
              <Row field="stdDeduction"    line="12" label="Standard deduction or itemized deductions (from Schedule A)"  kind="source" value={stdDeduction} />
              <Row                         line="14" label="Add lines 12 and 13"                                           kind="calc"   value={stdDeduction} />

              <Divider />
              <Row field="taxableIncome"   line="15" label="Taxable income"                                                kind="calc"   value={taxableIncome} bold shaded />

              <Section title="Tax and Credits" />
              <Row                         line="16" label="Tax (see instructions)"                                        kind="calc"   value={incomeTax} />
              <Row                         line="24" label="Total tax"                                                     kind="calc"   value={totalTax} bold />

              <Section title="Payments" />
              <Row                         line="25a" label="Federal income tax withheld from Form(s) W-2"                 kind="source" value={w2Withholding} />
              <Row field="withholding"     line="25b" label="Federal income tax withheld from Form(s) 1099"               kind="source" value={DIV_WITHHOLDING} />
              <Row                         line="25d" label="Add lines 25a through 25c"                                    kind="calc"   value={withholding1040} />
              <Row                         line="33"  label="Total payments"                                               kind="calc"   value={withholding1040} bold />

              <tr className={styles.oweDividerRow}>
                <td colSpan={4} />
              </tr>
              <Row                         line="37" label="Amount you owe. Subtract line 33 from line 24"                kind="calc"   value={oweAmount} bold owe />
            </tbody>
          </table>

        </div>
      </div>

      {/* ── Field popover — fixed-positioned so it escapes overflow:hidden ── */}
      {popoverField && popoverRect && (
        <FieldPopover
          fieldName={popoverField}
          anchorRect={popoverRect}
          onClose={handleClosePopover}
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
