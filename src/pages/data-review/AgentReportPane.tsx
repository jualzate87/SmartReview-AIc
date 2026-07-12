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
export const TOTAL_REVIEW_ITEMS = 7

// Ordered list of issue keys for guided "Next" navigation (Phase 2 diagnostics only).
// Exported so DataReviewPage can compute the Phase 2 banner's progress from the same
// source of truth instead of duplicating the list. Ordered to match REPORT_CARDS
// grouping (Critical, then Review required, then Opportunities) so each card's
// "N of 7" badges read as a consecutive local sequence instead of jumping around.
export const GUIDED_ORDER = ['balanceDue', 'verifyQualifiedDivs', 'missingPriorAgi', 'missingStateReturn', 'missingEstPayments', 'optW4Adjustment', 'optIra'] as const
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
  onNavigateToTab?: (tab: 'w2s' | '1099-divs' | '1099-ints' | 'prior-1040', subTab?: 'techCircle', field?: string) => void
  /** Highlight a 1040 field without leaving the agent panel */
  onHighlightField?: (field: string | null) => void
  /** Live field values for inline editing */
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
}

// ProtoC Phase 2 — diagnostics only. Import/OCR keys removed (owned by Phase 1).
// Key order within each card matches GUIDED_ORDER so the "N of 7" badges are
// consecutive within the card (e.g. Critical always reads 1, 2 — never 2, 5).
const REPORT_CARDS = [
  { label: 'Critical',        keys: ['balanceDue', 'verifyQualifiedDivs'],               badgeColor: 'red'    as const, position: 'first' },
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
// (wages $118,940, taxable interest $1,986, qualified divs $187,500, ordinary
// divs $331,250, capital gain $0, total income/AGI $452,176, taxable income
// $436,426, total tax $149,830 flat, withholding $24,925 [$0 W-2 + $24,925 1099-DIV,
// editable], amount owed $124,905) or the real prior-year figures from
// priorYear1040Data.ts (AGI $485,820, total tax $98,890, amount owed $22,790).
// Prior-year AGI exceeds $150,000, so the 2025 safe harbor is 110% of 2024's
// total tax ($108,779) — this year's $24,925 in payments falls far short.

const BALANCE_DUE_ISSUE = {
  issueKey: 'balanceDue',
  dotColor: 'red' as const,
  title: 'Balance due: $124,905 — up 448% from prior year',
  category: 'IRS compliance',
  summary: 'Line 37 jumped from $22,790 (2024) to $124,905 while total tax rose 52% ($98,890 → $149,830) and federal withholding fell 39% ($41,100 → $24,925). W-2 withholding dropped to $0 (was $22,360) even though wages are still $118,940 on line 1a.',
  taxImpact: 'Withholding of $24,925 covers only 16.6% of the $149,830 total tax and falls well short of the $108,779 safe harbor (110% of 2024\'s $98,890 tax). Form 2210 underpayment penalty should be evaluated before filing — prior year owed only $22,790 with $76,100 in total payments.',
  rootCause: 'Income mix shifted dramatically YoY: capital gains fell from $219,850 to $0 (line 7) while ordinary dividends surged 161% ($126,750 → $331,250), pushing total tax up despite AGI falling 7%. All federal withholding now comes from 1099-DIV Box 4 ($24,925) — the Tech Circle W-2 has no Box 2 withholding.',
  tableRows: [
    { label: 'Total tax (line 24)',              cols: ['$149,830', '$98,890', '+52%'], badge: 'red' as const,    total: false },
    { label: 'Federal withholding (25a + 25b)', cols: ['$24,925', '$41,100', '−39%'], badge: 'red' as const,    total: false },
    { label: 'Safe harbor (110% of 2024 tax)',   cols: ['$108,779', 'Not met', '!'],    badge: 'red' as const,    total: false },
    { label: 'Amount you owe (line 37)',         cols: ['$124,905', '$22,790', '+448%'], badge: 'red' as const,    total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Confirm Jessica has cash to cover $124,905 by the filing deadline — prior year balance was only $22,790.',
    'Run Form 2210 to quantify underpayment penalty exposure; $24,925 paid vs. $108,779 safe harbor.',
    'Ask whether any 2025 estimated payments were made (line 26 is $0) — unrecorded payments would reduce amount owed.',
    'Review Form 6251 (AMT) — prior year had $219,850 in capital gains; income profile shift may still trigger AMT.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'withholding',
}

const VERIFY_QUALIFIED_DIVS_ISSUE = {
  issueKey: 'verifyQualifiedDivs',
  dotColor: 'red' as const,
  title: 'Verify qualified dividend classification',
  category: 'IRS compliance',
  summary: 'Qualified dividends fell 15% ($219,850 → $187,500 on line 3a) while ordinary dividends surged 161% ($126,750 → $331,250 on line 3b). The qualified-to-ordinary ratio dropped from 63% to 57% — confirm holding-period rules were met for the full $187,500.',
  taxImpact: 'Qualified dividends are taxed at preferential rates (15%/20%) instead of ordinary rates. If any portion of the $187,500 doesn\'t meet the 61-day holding-period requirement, reclassification to ordinary income at Jessica\'s 35% marginal rate could add roughly $37,500 in tax on a $150,000 reclass alone.',
  rootCause: 'Unwavering Financial\'s 1099-DIV reports $187,500 as qualified (Box 1b) out of $331,250 total ordinary dividends (Box 1a). Prior year had the inverse profile — $219,850 qualified vs. $126,750 ordinary — suggesting a major portfolio turnover or reclassification event.',
  tableRows: [
    { label: 'Qualified dividends (line 3a)', cols: ['$187,500', '$219,850', '−15%'], badge: 'orange' as const, total: false },
    { label: 'Ordinary dividends (line 3b)',  cols: ['$331,250', '$126,750', '+161%'], badge: 'red' as const,    total: false },
    { label: 'Capital gain (line 7)',         cols: ['$0', '$219,850', '−100%'],     badge: 'red' as const,    total: true },
  ],
  tableHeaders: ['Field', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Confirm with Jessica or the brokerage that shares backing the $187,500 qualified amount were held 61+ days.',
    'Cross-check Box 1b ($187,500) against Box 1a ($331,250) — the $143,750 non-qualified portion should be ordinary-rate income.',
    'Investigate why capital gains dropped to $0 while ordinary dividends jumped — may indicate gain recognition inside the fund rather than Schedule D reporting.',
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
  summary: 'Prior-year (2024) AGI is required for e-file PIN validation. Not found in any imported document — the $485,820 figure on the Prior Year 1040 tab is unconfirmed.',
  taxImpact: 'Without the correct prior-year AGI, the IRS cannot validate the e-file PIN. The return cannot be submitted electronically until this is confirmed. Wrong AGI is the #1 cause of e-file rejections.',
  rootCause: 'The 2024 return was not imported as a document and no prior-year AGI was recorded during client onboarding — the $485,820 AGI shown on the Prior Year 1040 tab (line 11) has not been verified against an IRS transcript or Jessica\'s signed 2024 return.',
  tableRows: [
    { label: '2024 AGI (line 11, e-file PIN)', cols: ['$485,820', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
    { label: '2024 total tax (line 24)',        cols: ['$98,890', 'Unconfirmed', '?'],  badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm the $485,820 prior-year AGI with Jessica or her signed 2024 Form 1040.',
    'Enter it in the e-file section of the return before submission.',
    'Alternatively, use IRS Get Transcript (wage & income) to verify both AGI and total tax.',
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
  summary: 'Jessica\'s address is Middlefield, CA. No California state return information was found in any imported document. Prior year CA liability was likely significant given $485,820 AGI.',
  taxImpact: 'California taxes capital gains and dividends at ordinary rates, reaching 10.3%–11.3% in this income range. Estimated 2025 CA liability is roughly $38,000–$42,000 on taxable income of $436,426 — prior year may have been higher with $219,850 in capital gains.',
  rootCause: 'No CA state documents (CA W-2 withholding, CA 540 prior return) were imported. State filing requirement is inferred from the Middlefield, CA address on Form 1040. Federal amount owed jumped 448% YoY — state underpayment risk may mirror federal.',
  tableRows: [
    { label: 'CA state return (CA 540)', cols: ['—', 'Not started', '!'], badge: 'orange' as const, total: false },
    { label: 'CA withholding on W-2',    cols: ['—', 'Verify', '?'],      badge: 'orange' as const, total: false },
    { label: 'Estimated CA liability',   cols: ['~$38,000–$42,000', 'Estimate', '—'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Item', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm California state filing requirement with Jessica — residency at Middlefield, CA triggers CA 540.',
    'Prepare Form CA 540; ordinary dividends ($331,250) are taxed at full CA ordinary rates.',
    'Check W-2 Box 17 for CA state withholding and whether CA estimated payments were made.',
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
  summary: 'Line 26 shows $0 in 2025 estimated payments. With $124,905 owed (up from $22,790 prior year) and withholding at only $24,925, confirm whether Jessica made quarterly 1040-ES payments.',
  taxImpact: 'If estimated payments were made but not recorded, the $124,905 balance due (line 37) would decrease accordingly. Given the $83,854 gap between withholding ($24,925) and safe harbor ($108,779), unrecorded payments are the most likely way to avoid a Form 2210 penalty.',
  rootCause: 'No 1040-ES payment records were imported. Prior year had $76,100 in total payments (line 33) against $98,890 tax — this year only $24,925 is recorded against $149,830 tax, a much wider gap.',
  tableRows: [
    { label: '2025 estimated payments (line 26)', cols: ['$0', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
    { label: 'Amount you owe (line 37)',          cols: ['$124,905', '$22,790', '+448%'], badge: 'orange' as const, total: false },
    { label: 'Safe harbor shortfall',             cols: ['$83,854', 'Gap', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Field', '2025', '2024 / status', ''],
  suggestedActions: [
    'Ask Jessica if she made any 2025 Form 1040-ES quarterly payments — prior year pattern suggests she may have.',
    'If yes, enter the total on line 26; this reduces amount owed and may eliminate underpayment penalty.',
    'IRS account transcript or payment history on IRS.gov can confirm payments if Jessica is unsure.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'withholding',
}

// ── Optimization Suggestions ──────────────────────────────────────────────

const OPT_W4_ISSUE = {
  issueKey: 'optW4Adjustment',
  dotColor: 'blue' as const,
  title: 'Set up 2026 estimated payments — W-2 withholding is $0',
  category: 'Optimization',
  summary: 'Federal withholding fell from $41,100 to $24,925 YoY while total tax rose to $149,830. W-2 Box 2 is blank ($0 vs. $22,360 prior year), so there is nothing to adjust via W-4 — quarterly 1040-ES payments are the primary lever for 2026.',
  taxImpact: 'The 2026 safe harbor will be 110% of this year\'s $149,830 total tax — $164,813. Without action, Jessica faces another six-figure balance due and likely Form 2210 penalty, as she did not meet the $108,779 safe harbor this year.',
  rootCause: 'All federal withholding comes from 1099-DIV backup withholding ($24,925). W-2 federal withholding dropped from $22,360 to $0 despite wages of $118,940 — either Jessica claimed exempt status or the employer stopped withholding. Investment income now drives virtually all tax liability.',
  tableRows: [
    { label: '2025 total withholding (25a+25b)', cols: ['$24,925', '$41,100', '−39%'], badge: 'orange' as const, total: false },
    { label: '2026 safe-harbor target (110%)',   cols: ['$164,813', 'Plan now', '→'],    badge: 'blue' as const,  total: false },
    { label: 'Quarterly 1040-ES needed',         cols: ['~$41,203/qtr', 'Suggestion', '→'], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024 / target', ''],
  suggestedActions: [
    'Set up quarterly 1040-ES estimated payments for 2026 — target $164,813 total (safe harbor).',
    'Investigate why W-2 Box 2 is blank — if Jessica is not exempt, request flat-dollar withholding via Form W-4 Step 4(c).',
    'When reconciling source totals, cross-check 1099-INT Box 1 against line 2b — undocumented source-to-1040 gaps undermine return integrity even when not auto-flagged.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'withholding',
}

const OPT_IRA_ISSUE = {
  issueKey: 'optIra',
  dotColor: 'blue' as const,
  title: 'IRA deduction — confirm workplace plan coverage',
  category: 'Optimization',
  summary: 'No IRA deduction was claimed. At AGI of $452,176 (down from $485,820), a traditional IRA contribution is only deductible if Jessica is NOT covered by a workplace retirement plan — the 2025 phase-out for covered single filers tops out around $89,000 MAGI.',
  taxImpact: 'If Jessica is not covered by a workplace plan (check W-2 Box 13), a full $7,000 traditional IRA deduction would reduce taxable income from $436,426 to $429,426 — saving approximately $2,450 at her 35% marginal rate. AGI fell 7% YoY but remains far above any phase-out threshold for covered filers.',
  rootCause: 'No IRA contribution deduction appears on the return, and the Tech Circle W-2 doesn\'t indicate whether Box 13 "Retirement plan" is checked. Wages dropped 13% ($136,480 → $118,940) but remain well above IRA phase-out limits.',
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
  BALANCE_DUE_ISSUE, VERIFY_QUALIFIED_DIVS_ISSUE, MISSING_PRIOR_AGI_ISSUE,
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
  total1a = 118940,
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
