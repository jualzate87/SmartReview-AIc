import { useState, useEffect, useRef } from 'react'
import { Close, Plus, ChevronDown, ChevronRight, CircleCheck, Panel } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import brandBallsIcon from '../../assets/icons/brand-balls.svg'
import compareOthersIcon from '../../assets/icons/compare-others.svg'
import federalTaxesIcon from '../../assets/icons/federal-taxes.svg'
import scannerIcon from '../../assets/icons/scanner.svg'
import taxesAndCreditsIcon from '../../assets/icons/taxes-and-credits.svg'
import IssueDetailPane from './IssueDetailPane'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/AgentReportPane.module.css'

// ProtoC Phase 2 — AI diagnostics ONLY. Import/OCR flags (w2Box12, w2Ein,
// wagesConfidence, divCollectibles, divNonDiv) are owned by Phase 1 and removed here,
// so there is zero redundancy between the two phases.
export const TOTAL_REVIEW_ITEMS = 8

// Ordered list of issue keys for guided "Next" navigation (Phase 2 diagnostics only).
// Exported so DataReviewPage can compute the Phase 2 banner's progress from the same
// source of truth instead of duplicating the list. Ordered to match REPORT_CARDS
// grouping (Critical, then Review required, then Opportunities) so each card's
// "N of 8" badges read as a consecutive local sequence instead of jumping around.
export const GUIDED_ORDER = ['balanceDue', 'niit', 'verifyQualifiedDivs', 'missingPriorAgi', 'missingStateReturn', 'missingEstPayments', 'optW4Adjustment', 'optIra'] as const
type IssueKey = typeof GUIDED_ORDER[number]

interface AgentReportPaneProps {
  onClose?: () => void
  onYoyToggle?: (expanded: boolean) => void
  onViewW2?: (fromSubView?: 'overview' | 'yoyDetail') => void
  onReviewSource?: () => void
  onMarkReviewed?: (fieldName: string) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  closing?: boolean
  initialSubView?: 'overview' | 'yoyDetail'
  onSubViewChange?: (subView: 'overview' | 'yoyDetail') => void
  embedded?: boolean
  total1a?: number
  wages?: { techCircle: number }
  onNavigateToTab?: (tab: 'w2s' | '1099-divs' | '1099-ints' | 'questionnaire' | 'prior-1040', subTab?: 'techCircle', field?: string) => void
  /** Highlight a 1040 field without leaving the agent panel */
  onHighlightField?: (field: string | null) => void
  /** Live field values for inline editing */
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
}

// ProtoC Phase 2 — diagnostics only. Import/OCR keys removed (owned by Phase 1).
// Key order within each card matches GUIDED_ORDER so the "N of 8" badges are
// consecutive within the card (e.g. Critical always reads 1, 2, 3 — never 2, 3, 5).
const REPORT_CARDS = [
  { label: 'Critical',        keys: ['balanceDue', 'niit', 'verifyQualifiedDivs'],               badgeColor: 'red'    as const, position: 'first' },
  { label: 'Review required', keys: ['missingPriorAgi', 'missingStateReturn', 'missingEstPayments'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Opportunities',   keys: ['optW4Adjustment', 'optIra'],                                badgeColor: 'blue'   as const, position: 'last' },
]

const CARD_ICONS = [
  <img src={compareOthersIcon}   alt="" width={20} height={20} />,
  <img src={scannerIcon}         alt="" width={20} height={20} />,
  <img src={federalTaxesIcon}    alt="" width={20} height={20} />,
  <img src={taxesAndCreditsIcon} alt="" width={20} height={20} />,
]

// ── Jessica Drake Issues (Phase 2 diagnostics only) ────────────────────────
// Every figure below is pulled directly from LeftPanel1040's live values
// (wages $125,548, taxable interest $2,409, qualified divs $200,000, ordinary
// divs $353,000, capital gain distributions $203,000, total income/AGI $683,957,
// taxable income $668,207, income tax $129,560, NIIT $18,390, total tax
// $147,950, withholding $26,363, amount owed $121,587) or the real prior-year
// figures in PRIOR_YEAR. At this income level NIIT and the 110% (not 100%)
// safe-harbor threshold both genuinely apply; QBI does not (no pass-through
// business, and the income cap zeroes out SSTB income even if she had one),
// so it isn't included as a finding.

const BALANCE_DUE_ISSUE = {
  issueKey: 'balanceDue',
  dotColor: 'red' as const,
  title: 'Balance due: $121,587',
  category: 'IRS compliance',
  summary: 'Jessica owes $121,587 (line 37). Withholding of $26,363 covered only 17.8% of her $147,950 total tax — but no underpayment penalty applies, because her 2024 AGI ($109,400) was under $150,000, so her safe harbor is 100% of her 2024 tax ($20,638), which her withholding already exceeds.',
  taxImpact: 'No Form 2210 penalty is owed this year. But this is a one-time reprieve — the 100%-of-prior-year safe harbor only worked because 2024 was a normal-income year. With 2025 income this much larger, next year\'s safe harbor will be based on a much bigger number (see the W-4/estimated-payments finding), and this same withholding level would trigger a real penalty in 2026.',
  rootCause: 'Withholding from Tech Circle wages ($0 on the W-2) and the 1099-DIV ($26,363) together cover only a small fraction of the $558,409 in dividend, interest, and capital gain income that has no automatic wage-style withholding — the shortfall happens to still clear the (much lower) prior-year safe harbor.',
  tableRows: [
    { label: 'Total tax (line 24)',              cols: ['$147,950', '—', '—'],       badge: undefined,         total: false },
    { label: 'Federal withholding (25b)',        cols: ['$26,363', '17.8%', '—'],   badge: 'orange' as const, total: false },
    { label: 'Safe harbor (100% of 2024 tax)',   cols: ['$20,638', 'Met', '✓'],      badge: undefined,         total: false },
    { label: 'Amount you owe (line 37)',         cols: ['$121,587',  'Due', '!'],     badge: 'red' as const,    total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Let Jessica know no penalty applies this year, but confirm she has the cash on hand to cover $121,587 by the filing deadline.',
    'Confirm whether Jessica made any 2025 estimated payments not yet reflected on the return, which would lower this amount.',
    'Flag that this safe harbor won\'t protect her next year at this income level — see the withholding/estimated-payments recommendation.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'withholding',
}

const NIIT_ISSUE = {
  issueKey: 'niit',
  dotColor: 'red' as const,
  title: 'Net Investment Income Tax applies: $18,390',
  category: 'IRS compliance',
  summary: 'AGI of $683,957 exceeds the $200,000 single-filer NIIT threshold by $483,957. The 3.8% surtax applies to the lesser of net investment income ($558,409) or that excess — landing on $483,957 × 3.8% = $18,390.',
  taxImpact: 'NIIT (IRC §1411) is calculated on Form 8960 and reported as an "other tax" on Schedule 2, flowing to line 23. It has already been added to line 24 total tax below, but confirm Form 8960 is attached before filing — a missing form is a common e-file rejection reason at this income level.',
  rootCause: 'Net investment income = taxable interest ($2,409) + ordinary dividends ($353,000) + capital gain distributions ($203,000) = $558,409. Since this exceeds the $483,957 MAGI-over-threshold amount, the smaller figure ($483,957) is the NIIT base.',
  tableRows: [
    { label: 'Net investment income',            cols: ['$558,409', '—', '—'], badge: undefined, total: false },
    { label: 'AGI over $200,000 threshold',       cols: ['$483,957', 'Lesser of', '—'], badge: 'orange' as const, total: false },
    { label: 'NIIT (3.8% of $483,957)',           cols: ['$18,390', 'Owed', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Attach Form 8960 (Net Investment Income Tax) to the return.',
    'Confirm the $18,390 NIIT is included in the Schedule 2 total flowing to line 23.',
    'For future years, discuss whether any of the investment income could be sheltered (e.g., municipal bonds are NIIT-exempt).',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: undefined,
}

const VERIFY_QUALIFIED_DIVS_ISSUE = {
  issueKey: 'verifyQualifiedDivs',
  dotColor: 'red' as const,
  title: 'Verify qualified dividend classification',
  category: 'IRS compliance',
  summary: '$200,000 in qualified dividends (line 3a) is new this year (prior year: $0) and is the single largest driver of the return. Confirm the holding-period requirement was met.',
  taxImpact: 'Qualified dividends are taxed at preferential rates (15%/20% here, roughly $34,940 combined with the capital gain distributions) instead of ordinary rates. If any portion doesn\'t meet the holding-period requirement, it must be reported as ordinary income instead — at Jessica\'s 35% marginal rate, that would add a substantial amount to tax owed.',
  rootCause: 'Unwavering Financial\'s 1099-DIV reports $200,000 as qualified (Box 1b) out of $353,000 total ordinary dividends (Box 1a). No qualified dividends were reported on the prior-year return.',
  tableRows: [
    { label: 'Qualified dividends (line 3a)', cols: ['$200,000', 'New', '—'], badge: 'orange' as const, total: false },
    { label: 'Qualified dividends (2024)',    cols: ['$0', 'Prior year', '—'], badge: undefined, total: false },
    { label: 'Total ordinary dividends (1099-DIV Box 1a)', cols: ['$353,000', '—', '—'], badge: undefined, total: false },
  ],
  tableHeaders: ['Field', 'Amount', 'Status', ''],
  suggestedActions: [
    'Confirm with Jessica or the brokerage that the underlying shares were held for the required period (typically 61+ days).',
    'Cross-check the $200,000 qualified figure against the 1099-DIV Box 1b amount.',
    'If any amount doesn\'t qualify, move it to ordinary dividend treatment before filing.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'qualifiedDivs',
}

// ── Missing Information Issues ────────────────────────────────────────────

const MISSING_PRIOR_AGI_ISSUE = {
  issueKey: 'missingPriorAgi',
  dotColor: 'orange' as const,
  title: 'Prior-year AGI not on file',
  category: 'Missing information',
  summary: 'Prior-year (2024) AGI is required for e-file PIN validation. Not found in any imported document.',
  taxImpact: 'Without the correct prior-year AGI, the IRS cannot validate the e-file PIN. The return cannot be submitted electronically until this is confirmed.',
  rootCause: 'The 2024 return was not imported as a document and no prior-year AGI was recorded during client onboarding — the $109,400 figure shown on the Prior Year 1040 tab has not been confirmed against an IRS transcript.',
  tableRows: [
    { label: '2024 AGI (e-file PIN)', cols: ['$109,400', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm the $109,400 prior-year AGI with Jessica or her 2024 return.',
    'Enter it in the e-file section of the return.',
    'Alternatively, use the IRS Get Transcript tool to verify it.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: undefined,
}

const MISSING_STATE_RETURN_ISSUE = {
  issueKey: 'missingStateReturn',
  dotColor: 'orange' as const,
  title: 'CA state filing likely required',
  category: 'Missing information',
  summary: 'Jessica\'s address is Middlefield, CA. No California state return information was found in any imported document.',
  taxImpact: 'California taxes capital gains and dividends at ordinary rates, reaching 11.3%–12.3% in this income range (plus a 1% Mental Health Services surtax above $1M, which doesn\'t apply here). Estimated CA liability on this return is roughly $67,000–$74,000, based on taxable income of $668,207.',
  rootCause: 'No CA state documents (CA W-2 withholding, CA 540 prior return) were imported. State filing requirement is inferred from the address on Form 1040.',
  tableRows: [
    { label: 'CA state return (CA 540)', cols: ['—', 'Not started', '!'], badge: 'orange' as const, total: false },
    { label: 'CA withholding on W-2',    cols: ['—', 'Verify', '?'],      badge: 'orange' as const, total: false },
    { label: 'Estimated CA liability',   cols: ['~$67,000–$74,000', 'Estimate', '—'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Item', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm California state filing requirement with Jessica.',
    'Prepare Form CA 540 — capital gains and dividends are taxed at ordinary CA rates.',
    'Check W-2 Box 17 for CA state withholding amount, and consider CA estimated payments given the size of the liability.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'wages',
}

const MISSING_EST_PAYMENTS_ISSUE = {
  issueKey: 'missingEstPayments',
  dotColor: 'orange' as const,
  title: 'No estimated tax payments recorded',
  category: 'Missing information',
  summary: 'Line 26 shows $0 in 2025 estimated payments. Given the size of this return\'s investment income, confirm with Jessica whether any quarterly payments were made.',
  taxImpact: 'If estimated payments were made but not recorded, the $121,587 balance due (line 37) would decrease accordingly — this is too large a gap to leave unconfirmed.',
  rootCause: 'No 1040-ES payment records were imported. Either no payments were made, or they were made but not captured during document import.',
  tableRows: [
    { label: '2025 estimated payments (line 26)', cols: ['$0', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
    { label: 'Amount you owe (line 37)',          cols: ['$121,587', 'Due', '!'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Recorded', 'Status', ''],
  suggestedActions: [
    'Ask Jessica if she made any 2025 Form 1040-ES quarterly payments.',
    'If yes, enter the total on line 26 — this reduces the amount owed.',
    'IRS account transcript can confirm payments if Jessica is unsure.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'withholding',
}

// ── Optimization Suggestions ──────────────────────────────────────────────

const OPT_W4_ISSUE = {
  issueKey: 'optW4Adjustment',
  dotColor: 'blue' as const,
  title: 'Plan ahead: 2026 safe harbor will require much higher withholding',
  category: 'Optimization',
  summary: 'This year\'s $26,363 withholding cleared the safe harbor only because 2024 was a normal-income year. Since 2025 AGI ($683,957) exceeds $150,000, the 2026 safe harbor becomes 110% of this year\'s $147,950 total tax — $162,745. A W-4 update alone can\'t close a gap this size; quarterly estimated payments are the realistic fix.',
  taxImpact: 'Reaching $162,745 in withholding or estimated payments next year would avoid both a large balance due and an underpayment penalty, assuming similar income. Without action, 2026 will not have this year\'s low-prior-year-tax safe harbor to fall back on.',
  rootCause: 'All of Jessica\'s current withholding comes from the 1099-DIV backup withholding; her Tech Circle W-2 has no federal withholding at all, and neither source is calibrated to the scale of her dividend and capital gain income.',
  tableRows: [
    { label: 'Current annual withholding', cols: ['$26,363', '—', '—'],           badge: undefined,       total: false },
    { label: '2026 safe-harbor target (110% of 2025 tax)', cols: ['$162,745', 'Gap', '—'],         badge: 'blue' as const, total: false },
    { label: 'Additional needed/year',     cols: ['$136,382', 'Suggestion', '→'],  badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Set up quarterly 1040-ES estimated payments for 2026 — a W-4 change on wage income alone can\'t realistically cover a gap this large.',
    'Alternatively, request additional flat-dollar withholding on the W-2 via Form W-4 Step 4(c), sized to the investment income.',
    'Target at least 110% of this year\'s total tax ($162,745) given AGI now exceeds the $150,000 threshold for the higher safe-harbor percentage.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'withholding',
}

const OPT_IRA_ISSUE = {
  issueKey: 'optIra',
  dotColor: 'blue' as const,
  title: 'IRA deduction — confirm workplace plan coverage',
  category: 'Optimization',
  summary: 'No IRA deduction was claimed. At this AGI ($683,957), a traditional IRA contribution is only deductible if Jessica is NOT covered by a workplace retirement plan — the 2025 phase-out for covered single filers tops out around $89,000 MAGI, far below her income.',
  taxImpact: 'If Jessica is not covered by a workplace plan (check W-2 Box 13), a full $7,000 traditional IRA deduction would reduce taxable income by $7,000 — saving approximately $2,450 at her 35% marginal rate. If she is covered, the contribution would need to go to a Roth or be nondeductible instead.',
  rootCause: 'No IRA contribution deduction appears on the return, and the mock W-2 doesn\'t indicate whether Box 13 "Retirement plan" is checked.',
  tableRows: [
    { label: 'W-2 Box 13 — Retirement plan', cols: ['Unconfirmed', 'Check first', '?'], badge: 'orange' as const, total: false },
    { label: 'Max deductible (2025, if not covered)', cols: ['$7,000', 'Eligible?', '—'], badge: 'blue' as const,  total: false },
    { label: 'Tax savings (est., if deductible)',    cols: ['~$2,450', 'Opportunity', '→'], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Check W-2 Box 13 to confirm whether Jessica is covered by a workplace retirement plan.',
    'If not covered, a full $7,000 traditional IRA deduction is available regardless of income.',
    'If covered, a deduction isn\'t available at this AGI — consider a backdoor Roth conversion instead.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'wages',
}

// Maps each issue key to the 1040 field it should highlight — only fields with a
// real, highlightable row on LeftPanel1040 (see the `field=` prop on each <Row>).
// "Total tax" (line 24) and "Total payments" (line 33) have no field key there,
// so those issues intentionally highlight nothing rather than fabricate a pointer.
const ISSUE_FIELD: Partial<Record<IssueKey, string>> = {
  balanceDue:           'withholding',
  verifyQualifiedDivs:  'qualifiedDivs',
  missingStateReturn:   'wages',
  optW4Adjustment:      'withholding',
  optIra:               'wages',
}

// All issues as a flat list for getIssueConfig lookup
const ALL_ISSUES = [
  BALANCE_DUE_ISSUE, NIIT_ISSUE, VERIFY_QUALIFIED_DIVS_ISSUE, MISSING_PRIOR_AGI_ISSUE,
  MISSING_STATE_RETURN_ISSUE, MISSING_EST_PAYMENTS_ISSUE,
  OPT_W4_ISSUE, OPT_IRA_ISSUE,
]

export default function AgentReportPane({
  onClose,
  onYoyToggle,
  onViewW2,
  onReviewSource,
  onMarkReviewed,
  reviewedFields = new Map(),
  closing = false,
  initialSubView,
  onSubViewChange,
  embedded = false,
  total1a = 125548,
  wages,
  onNavigateToTab,
  onHighlightField,
  fieldValues,
  onFieldValueChange,
}: AgentReportPaneProps) {
  // ProtoC: count ONLY the Phase 2 diagnostic keys — Phase 1 import flags share the same
  // reviewedFields map but must not inflate this counter.
  const reviewedCount = GUIDED_ORDER.filter(k => reviewedFields.has(k)).length
  const progressPct = Math.round((reviewedCount / TOTAL_REVIEW_ITEMS) * 100)
  const allReviewed = reviewedCount >= TOTAL_REVIEW_ITEMS
  const [showCompletion, setShowCompletion] = useState(false)
  const prevAllReviewed = useRef(false)

  // Auto-trigger completion screen the moment all items become reviewed
  useEffect(() => {
    if (allReviewed && !prevAllReviewed.current) {
      // Brief delay so the "Reviewed" button state renders first
      const t = setTimeout(() => {
        setIssueDetailOpen(null)
        setShowCompletion(true)
      }, 600)
      return () => clearTimeout(t)
    }
    prevAllReviewed.current = allReviewed
  }, [allReviewed])
  const [inputValue, setInputValue] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [issueDetailOpen, setIssueDetailOpen] = useState<string | null>(null)
  const [issueDetailClosing, setIssueDetailClosing] = useState(false)

  // ── Detail pane navigation ─────────────────────────────────
  const openDetail = (key: string) => {
    // Highlight the corresponding 1040 field when opening any issue detail
    const field = ISSUE_FIELD[key as IssueKey] ?? null
    onHighlightField?.(field)
    setIssueDetailOpen(key)
  }

  const handleCloseIssueDetail = () => {
    setIssueDetailClosing(true)
    onHighlightField?.(null)  // clear 1040 highlight when closing
    setTimeout(() => { setIssueDetailOpen(null); setIssueDetailClosing(false) }, 200)
  }

  // Navigate to next issue in guided order
  const handleNext = (currentKey: string) => {
    const idx = GUIDED_ORDER.indexOf(currentKey as IssueKey)
    const nextKey = idx >= 0 && idx < GUIDED_ORDER.length - 1 ? GUIDED_ORDER[idx + 1] : null
    if (nextKey) {
      handleCloseIssueDetail()
      setTimeout(() => openDetail(nextKey), 220)
    } else {
      // All done — close detail and show completion screen if all reviewed
      handleCloseIssueDetail()
      setTimeout(() => setShowCompletion(true), 220)
    }
  }

  // Navigate to previous issue in guided order
  const handlePrev = (currentKey: string) => {
    const idx = GUIDED_ORDER.indexOf(currentKey as IssueKey)
    const prevKey = idx > 0 ? GUIDED_ORDER[idx - 1] : null
    if (!prevKey) return
    handleCloseIssueDetail()
    setTimeout(() => openDetail(prevKey), 220)
  }

  const isLastIssue  = (key: string) => GUIDED_ORDER.indexOf(key as IssueKey) === GUIDED_ORDER.length - 1
  const isFirstIssue = (key: string) => GUIDED_ORDER.indexOf(key as IssueKey) === 0

  const handleCardClick = (label: string) => {
    setExpandedCard(prev => {
      const next = prev === label ? null : label
      onYoyToggle?.(next === 'YoY analysis')
      return next
    })
  }

  const getIssueConfig = (key: string) => {
    return ALL_ISSUES.find(i => i.issueKey === key) ?? null
  }

  const activeIssue = issueDetailOpen ? getIssueConfig(issueDetailOpen) : null

  return (
    <div className={`${embedded ? styles.panelEmbedded : styles.panel} ${closing && !embedded ? styles.panelClosing : ''}`}>

      {/* ── Header — hidden when embedded ── */}
      {!embedded && (
        <div className={styles.header}>
          <div className={styles.headerLeft} />
          <div className={styles.headerTitle}>
            <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
            <span className={styles.titleText}>Review AI</span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconBtn} aria-label="Close" onClick={onClose}>
              <Close size="small" />
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable pane ── */}
      <div className={styles.pane}>
        <div className={styles.chat}>

          <p className={styles.agentMessage}>
            Here's what we found. Review the issues below to complete your return.
          </p>

          {/* Diagnostics review scorecard */}
          <div className={styles.scoreCard}>
            <span className={styles.scoreTitle}>Diagnostics to review</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct || 5}%`, background: '#00856d', transition: 'width 400ms ease' }} />
            </div>
            <div className={styles.scoreCountRow}>
              <span className={styles.scoreCountNumber}>{Math.max(0, TOTAL_REVIEW_ITEMS - reviewedCount)}</span>
              <span className={styles.scoreCountLabel}>diagnostics remaining</span>
            </div>
          </div>

          {/* Completion screen — shown when all items reviewed (replaces cards) */}
          {allReviewed && showCompletion && (
            <div className={styles.completionScreen}>
              <div className={styles.completionHeader}>
                <span className={styles.completionCheckIcon}><CircleCheck size="small" /></span>
                <span className={styles.completionTitle}>Review complete</span>
              </div>
              <p className={styles.completionBody}>
                All {TOTAL_REVIEW_ITEMS} issues reviewed and reconciled. This return is ready to move forward.
              </p>
              {[...reviewedFields.values()].slice(0, 1).map((v, idx) => (
                <p key={idx} className={styles.completionSignOff}>
                  Signed off by <strong>{v.by}</strong> · {v.at}
                </p>
              ))}
              <div className={styles.completionActions}>
                <Button priority="primary" size="medium" onClick={() => {}}>
                  Complete return review
                </Button>
                <button className={styles.completionSecondaryBtn} onClick={() => setShowCompletion(false)}>
                  Review again
                </button>
              </div>
            </div>
          )}

          {/* Expandable report card bundle — hidden when completion screen is shown */}
          <div className={styles.cardBundle} style={allReviewed && showCompletion ? { display: 'none' } : {}}>
            {REPORT_CARDS.map((card, i) => {
              const remaining = card.keys.filter(k => !reviewedFields.has(k)).length
              const cardDone = remaining === 0
              return (
              <div key={card.label}>
                <button
                  className={`${styles.card} ${styles[`card_${card.position}`]} ${expandedCard === card.label ? styles.cardActive : ''}`}
                  onClick={() => handleCardClick(card.label)}
                >
                  <div className={styles.cardIcon}>{CARD_ICONS[i]}</div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardLabel}>{card.label}</span>
                    {cardDone
                      ? <span className={`${styles.badge} ${styles.badgeGreen}`}>✓</span>
                      : <span className={`${styles.badge} ${card.badgeColor === 'red' ? styles.badgeRed : card.badgeColor === 'orange' ? styles.badgeOrange : styles.badgeBlue}`}>{remaining}</span>
                    }
                  </div>
                  <ChevronDown size="small" className={`${styles.chevron} ${expandedCard === card.label ? styles.chevronUp : ''}`} />
                </button>

                {/* ── Issue findings — rendered from ALL_ISSUES filtered to this card's keys ── */}
                {expandedCard === card.label && (
                  <div className={styles.findingCard} style={{ gap: 12 }}>
                    {card.keys.map((key) => {
                      const issue = getIssueConfig(key)
                      if (!issue) return null
                      const signOff = reviewedFields.get(key)
                      const isReviewed = !!signOff
                      const issueNum = GUIDED_ORDER.indexOf(key as IssueKey) + 1
                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          className={`${styles.findingInner} ${isReviewed ? styles.findingInnerReviewed : ''}`}
                          onClick={() => onHighlightField?.(ISSUE_FIELD[key as IssueKey] ?? null)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHighlightField?.(ISSUE_FIELD[key as IssueKey] ?? null) } }}
                        >
                          <div className={styles.findingTitleRow}>
                            {isReviewed ? <span className={styles.findingCheckIcon}><CircleCheck size="small" /></span> : <span className={styles.findingDot} style={{ background: issue.dotColor === 'blue' ? '#0077c5' : issue.dotColor === 'orange' ? '#d68000' : '#c22929' }} />}
                            <span className={styles.findingTitle}>{issue.title}</span>
                            <span className={styles.issueChip}>{issueNum} of {GUIDED_ORDER.length}</span>
                            {isReviewed && <span className={styles.findingReviewedBadge}>Reviewed</span>}
                          </div>
                          {signOff && <span className={styles.findingSignOff}>{signOff.by} · {signOff.at}</span>}
                          <p className={styles.findingBody}>{issue.summary}</p>
                          <div className={styles.findingActions} onClick={e => e.stopPropagation()}>
                            <Tooltip text={`Open the source document for: ${issue.title}`}>
                              <Button priority="secondary" size="small" onClick={() => onNavigateToTab?.(issue.viewSourceTab, issue.viewSourceSubTab, issue.viewSourceField)}>
                                <Panel size="small" /> View source
                              </Button>
                            </Tooltip>
                            <Tooltip text="See the root cause, tax impact, and suggested next steps for this finding">
                              <Button priority="primary" size="small" onClick={() => openDetail(key)}>See details <ChevronRight size="small" /></Button>
                            </Tooltip>
                            <Tooltip text={isReviewed ? 'Click to unmark' : 'Mark as reviewed'}>
                              <button
                                className={`${styles.findingMarkReviewedBtn} ${isReviewed ? styles.findingMarkReviewedBtnActive : ''}`}
                                aria-label={isReviewed ? `Unmark ${issue.title} as reviewed` : `Mark ${issue.title} as reviewed`}
                                onClick={() => onMarkReviewed?.(key)}
                              >
                                <CircleCheck size="small" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )})}
          </div>

        </div>
      </div>

      {/* ── Input area ── */}
      <div className={styles.inputArea}>
        <div className={styles.inputFade} />
        <div className={styles.inputBox}>
          <div className={styles.inputTextField}>
            <textarea
              className={styles.textarea}
              placeholder="Ask anything"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <div className={styles.inputActionsLeft}>
              <button className={styles.attachBtn} aria-label="Attach"><Plus size="medium" /></button>
            </div>
            <div className={styles.inputActionsRight}>
              <button className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`} aria-label="Send">
                <img src={brandBallsIcon} alt="" className={styles.sendIcon} />
              </button>
            </div>
          </div>
        </div>
        <span className={styles.legal}>Important information about how we use generative AI</span>
      </div>

      {/* ── Issue detail pane ── */}
      {(!!issueDetailOpen || issueDetailClosing) && activeIssue && (() => {
        return (
          <IssueDetailPane
            closing={issueDetailClosing}
            issueKey={activeIssue.issueKey}
            dotColor={activeIssue.dotColor}
            title={activeIssue.title}
            summary={activeIssue.summary}
            taxImpact={activeIssue.taxImpact}
            rootCause={activeIssue.rootCause}
            tableRows={activeIssue.tableRows}
            tableHeaders={activeIssue.tableHeaders}
            suggestedActions={activeIssue.suggestedActions}
            viewSourceLabel={activeIssue.viewSourceLabel}
            reviewedCount={reviewedCount}
            totalItems={TOTAL_REVIEW_ITEMS}
            reviewedFields={reviewedFields}
            onBack={handleCloseIssueDetail}
            onClose={() => { handleCloseIssueDetail(); onClose?.() }}
            onViewSource={() => {
              onNavigateToTab?.(activeIssue.viewSourceTab, activeIssue.viewSourceSubTab, activeIssue.viewSourceField)
            }}
            onMarkReviewed={onMarkReviewed}
            issueNumber={GUIDED_ORDER.indexOf(activeIssue.issueKey as IssueKey) + 1}
            category={activeIssue.category}
            totalIssues={GUIDED_ORDER.length}
            onPrev={isFirstIssue(activeIssue.issueKey) ? undefined : () => handlePrev(activeIssue.issueKey)}
            onNext={isLastIssue(activeIssue.issueKey) ? undefined : () => handleNext(activeIssue.issueKey)}
          />
        )
      })()}

    </div>
  )
}
