import { useState, useEffect, useRef } from 'react'
import { Close, Plus, ChevronDown, ChevronRight, CircleCheck } from '@design-systems/icons'
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
import { FROZEN_RETURN } from '../../data/frozenReturn'
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { computeLiveReturn, SEED_AMOUNTS } from '../../data/liveReturn'
import { RETURN_SUMMARY_INSIGHTS } from './phase1FlagMessages'
import {
  getPhase2Progress,
  PHASE2_DIAGNOSTIC_ORDER,
  type Phase2IssueKey,
} from './phase2FlagSync'
import styles from '../../styles/data-review/AgentReportPane.module.css'

// ProtoC Phase 2 — AI diagnostics ONLY. Import/OCR flags (w2Box12, w2Ein,
// wagesConfidence, divCollectibles, divNonDiv) are owned by Phase 1 and removed here,
// so there is zero redundancy between the two phases.
/** Full catalog size before Phase 1 sync dismisses any cards. */
export const TOTAL_REVIEW_ITEMS = PHASE2_DIAGNOSTIC_ORDER.length

export const GUIDED_ORDER = PHASE2_DIAGNOSTIC_ORDER
type IssueKey = Phase2IssueKey

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
  onNavigateToTab?: (tab?: 'w2s' | '1099-divs' | '1099-ints' | 'prior-1040', subTab?: 'techCircle', field?: string) => void
  /** Highlight a 1040 field without leaving the agent panel */
  onHighlightField?: (field: string | null) => void
  /** Live field values for inline editing */
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  /** Live-recalculated 1040 totals — keeps Phase 2 figures in sync after Phase 1 edits */
  liveTotals?: LiveReturnTotals
  /** Editable amounts — used with liveTotals to auto-dismiss invalidated diagnostics */
  amounts?: LiveAmounts
}

// ProtoC Phase 2 — diagnostics only. Import/OCR keys removed (owned by Phase 1).
// Key order within each card matches GUIDED_ORDER so the "N of 7" badges are
// consecutive within the card (e.g. Critical always reads 1, 2 — never 2, 5).
const REPORT_CARDS = [
  { label: 'Critical',        keys: ['balanceDueJump', 'totalTaxRise', 'withholdingDrop', 'estTaxPenalty'], badgeColor: 'red'    as const, position: 'first' },
  { label: 'Review required', keys: ['qualDivDrop', 'ordinaryDivSurge', 'qualDivRatio', 'confirmPriorAgi', 'missingEstPayments', 'niitForm8960'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Opportunities',   keys: ['optW4Adjustment', 'optIra'], badgeColor: 'blue'   as const, position: 'last' },
]

const CARD_ICONS = [
  <img src={compareOthersIcon}   alt="" width={20} height={20} />,
  <img src={scannerIcon}         alt="" width={20} height={20} />,
  <img src={federalTaxesIcon}    alt="" width={20} height={20} />,
  <img src={taxesAndCreditsIcon} alt="" width={20} height={20} />,
]

// ── Jessica Drake Issues (Phase 2 diagnostics only) ────────────────────────
// Figures align with Loop 2 frozen return anchors (FROZEN_RETURN).

const fmtUsd = (n: number) => `$${n.toLocaleString()}`

/** Build Phase 2 issue cards from live totals so edits don't leave stale figures. */
function buildBalanceDueIssue(live: LiveReturnTotals) {
  const owe = live.oweAmount
  return {
  issueKey: 'balanceDueJump',
  dotColor: 'red' as const,
  title: `Balance due jumped to ${fmtUsd(owe)}`,
  category: 'IRS compliance',
  summary: `Line 37 rose from $22,790 in 2024 to ${fmtUsd(owe)} this year. Confirm Jessica can pay this amount by the filing deadline.`,
  taxImpact: RETURN_SUMMARY_INSIGHTS.estTaxPenalty,
  rootCause: 'Total tax rose while federal withholding fell sharply. Capital gains dropped to $0 but dividend income surged, shifting the tax profile.',
  tableRows: [
    { label: 'Amount you owe (line 37)', cols: [fmtUsd(owe), '$22,790', 'YoY'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'YoY'],
  suggestedActions: [
    `Confirm Jessica can pay ${fmtUsd(owe)} by the filing deadline.`,
    'Ask if any 2025 estimated payments were made but not entered on line 26.',
    'Review Form 2210 for underpayment penalty exposure.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'amountOwed',
}
}

const TOTAL_TAX_RISE_ISSUE = {
  issueKey: 'totalTaxRise',
  dotColor: 'red' as const,
  title: 'Total tax up 52% year over year',
  category: 'IRS compliance',
  summary: `Total tax on line 24 rose from $98,890 in 2024 to ${fmtUsd(FROZEN_RETURN.totalTax)} in 2025 even though AGI rose 19%. The income mix changed: capital gains fell to $0 while ordinary dividends rose 177%.`,
  taxImpact: 'Higher total tax with a shifted income mix means more income is taxed at ordinary rates. Review Schedule D and Form 8949 for missing capital gain entries.',
  rootCause: `Capital gains fell from $219,850 to $0 on line 7. Ordinary dividends rose from $126,750 to ${fmtUsd(FROZEN_RETURN.ordinaryDivs)} on line 3b, replacing lower-rate gain income.`,
  tableRows: [
    { label: 'Total tax (line 24)', cols: [fmtUsd(FROZEN_RETURN.totalTax), '$98,890', '+52%'], badge: 'red' as const, total: true },
    { label: 'AGI (line 11)',       cols: [fmtUsd(FROZEN_RETURN.totalIncome), '$485,820', '+19%'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Item', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Compare line 24 to last year\'s return on the Prior Year 1040 tab.',
    'Check whether capital gains were realized inside funds instead of on Schedule D.',
    'Review Form 6251 (AMT) given the income mix shift.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalTax',
}

function buildWithholdingDropIssue(live: LiveReturnTotals) {
  const rNote = live.rWithholding > 0
    ? `1099-R withholding of ${fmtUsd(live.rWithholding)} is included.`
    : '1099-R withholding was not imported.'
  return {
  issueKey: 'withholdingDrop',
  dotColor: 'red' as const,
  title: 'Federal withholding below safe harbor',
  category: 'IRS compliance',
  summary: `Combined federal withholding on lines 25a and 25b is ${fmtUsd(live.totalWithholding)} this year (${fmtUsd(live.w2Withholding)} W-2 + ${fmtUsd(live.withholding1099)} from 1099s). That covers ${Math.round((live.totalWithholding / live.totalTax) * 100)}% of the ${fmtUsd(live.totalTax)} total tax.`,
  taxImpact: RETURN_SUMMARY_INSIGHTS.estTaxPenalty,
  rootCause: `W-2 Box 2 shows ${fmtUsd(live.w2Withholding)} and 1099 withholding on line 25b shows ${fmtUsd(live.withholding1099)} on the return. ${rNote} Last year total withholding was $41,100.`,
  tableRows: [
    { label: 'Federal withholding (25a + 25b)', cols: [fmtUsd(live.totalWithholding), '$41,100', 'YoY'], badge: 'red' as const, total: false },
    { label: 'Safe harbor (110% of 2024 tax)',    cols: ['$108,779', 'Not met', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'Status'],
  suggestedActions: [
    'Cross-check 1099-DIV Box 4 ($26,363 source vs. return amount).',
    'Run Form 2210 to estimate underpayment penalty.',
    'Ask about unrecorded estimated payments that would reduce the balance due.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'fedTaxWithheld',
}
}

function buildEstTaxPenaltyIssue(live: LiveReturnTotals) {
  return {
  issueKey: 'estTaxPenalty',
  dotColor: 'red' as const,
  title: 'Estimated tax penalty may apply',
  category: 'IRS compliance',
  summary: RETURN_SUMMARY_INSIGHTS.estTaxPenalty,
  taxImpact: `Withholding of ${fmtUsd(live.totalWithholding)} is below the $108,779 safe harbor (110% of 2024 tax). Form 2210 should be completed before filing.`,
  rootCause: `Total payments on line 33 (${fmtUsd(live.totalWithholding)}) fall short of both total tax (${fmtUsd(live.totalTax)}) and the prior-year safe harbor.`,
  tableRows: [
    { label: 'Total payments (line 33)', cols: [fmtUsd(live.totalWithholding), '$76,100', 'YoY'], badge: 'red' as const, total: false },
    { label: 'Safe harbor shortfall',    cols: [fmtUsd(Math.max(0, 108779 - live.totalWithholding)), 'Gap', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024 / status', ''],
  suggestedActions: [
    'Review Form 2210 for underpayment penalty exposure.',
    'Ask Jessica if any 2025 Form 1040-ES quarterly payments were made but not entered.',
    'Confirm total withholding matches source documents before filing.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalPayments',
}
}

const QUAL_DIV_DROP_ISSUE = {
  issueKey: 'qualDivDrop',
  dotColor: 'orange' as const,
  title: 'Qualified dividends may be misclassified',
  category: 'IRS compliance',
  summary: `Return line 3a shows ${fmtUsd(FROZEN_RETURN.qualifiedDivs)} but Token Financial 1099-DIV Box 1b shows only $187,500 qualified. Token's return value may overstate qualified dividends.`,
  taxImpact: RETURN_SUMMARY_INSIGHTS.niit,
  rootCause: 'Source Box 1b is $187,500 qualified out of $331,250 ordinary (Box 1a) for Token. Return aggregates qualified dividends across all payers on line 3a.',
  tableRows: [
    { label: 'Return line 3a (qualified)', cols: [fmtUsd(FROZEN_RETURN.qualifiedDivs), '$219,850', '+56%'], badge: 'red' as const, total: false },
    { label: 'Token source Box 1b',        cols: ['$187,500', 'Should match', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Field', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Confirm shares backing the $187,500 qualified amount were held 61+ days.',
    'Cross-check Box 1b against Box 1a on the Token Financial 1099-DIV.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'qualifiedDivs',
}

const ORDINARY_DIV_SURGE_ISSUE = {
  issueKey: 'ordinaryDivSurge',
  dotColor: 'orange' as const,
  title: 'Ordinary dividends rose 177%',
  category: 'IRS compliance',
  summary: `Ordinary dividends on line 3b jumped from $126,750 in 2024 to ${fmtUsd(FROZEN_RETURN.ordinaryDivs)} this year. This is the largest single income line change on the return.`,
  taxImpact: 'Ordinary dividends are taxed at regular rates up to 37%. The increase adds significant tax at Jessica\'s marginal rate.',
  rootCause: '1099-DIV Box 1a totals $350,400 across all payers. Capital gains on line 7 fell to $0, suggesting gains may have been distributed as dividends instead.',
  tableRows: [
    { label: 'Ordinary dividends (line 3b)', cols: [fmtUsd(FROZEN_RETURN.ordinaryDivs), '$126,750', '+177%'], badge: 'red' as const, total: false },
    { label: 'Capital gain (line 7)',        cols: ['$0', '$219,850', '-100%'],     badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Field', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Ask the brokerage why ordinary dividends surged while capital gains dropped to zero.',
    'Review fund distribution statements for reclassified gain amounts.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'ordinaryDivs',
}

const QUAL_DIV_RATIO_ISSUE = {
  issueKey: 'qualDivRatio',
  dotColor: 'orange' as const,
  title: 'Qualified dividend ratio dropped to 57%',
  category: 'IRS compliance',
  summary: `The qualified share of dividends should be reviewed. Return line 3a shows ${fmtUsd(FROZEN_RETURN.qualifiedDivs)} across all payers.`,
  taxImpact: RETURN_SUMMARY_INSIGHTS.niit,
  rootCause: 'Token Financial Box 1b ($187,500) is 57% of Box 1a ($331,250). Aggregate qualified dividends on line 3a include all payers.',
  tableRows: [
    { label: 'Qualified share (Token)', cols: ['57%', '63% last year', 'Check'], badge: 'orange' as const, total: false },
    { label: 'Return line 3a total', cols: [fmtUsd(FROZEN_RETURN.qualifiedDivs), '$219,850', '+56%'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Metric', '2025', '2024', 'Change'],
  suggestedActions: [
    'Review brokerage statements for shares sold within 60 days of ex-dividend dates.',
    'Confirm whether any Box 1a amount was misclassified between qualified and ordinary.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'qualifiedDivs',
}

const CONFIRM_PRIOR_AGI_ISSUE = {
  issueKey: 'confirmPriorAgi',
  dotColor: 'orange' as const,
  title: 'Confirm prior-year AGI matches imported 1040',
  category: 'Missing information',
  summary: 'The imported 2024 Form 1040 shows AGI of $485,820 on line 11. Confirm this matches Jessica\'s signed return before e-filing. Prior-year AGI is required for PIN validation.',
  taxImpact: 'Wrong prior-year AGI is the top reason for e-file rejections. The IRS uses it to validate the taxpayer\'s identity PIN.',
  rootCause: 'The Prior Year 1040 tab is populated from jessica-1040-2024-variant.pdf. The preparer should verify line 11 against Jessica\'s signed copy or an IRS transcript.',
  tableRows: [
    { label: '2024 AGI (line 11)',     cols: ['$485,820', 'Imported', 'Verify'], badge: 'orange' as const, total: false },
    { label: '2024 total tax (line 24)', cols: ['$98,890', 'Imported', 'Verify'], badge: 'orange' as const, total: true },
  ],
  tableHeaders: ['Field', 'Value', 'Source', 'Action'],
  suggestedActions: [
    'Open the Prior Year 1040 tab and confirm line 11 shows $485,820.',
    'Compare against Jessica\'s signed 2024 return or IRS Get Transcript.',
    'Enter the confirmed AGI in the e-file section before submission.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'agi',
}

const NIIT_FORM8960_ISSUE = {
  issueKey: 'niitForm8960',
  dotColor: 'orange' as const,
  title: 'Net investment income tax may apply',
  category: 'IRS compliance',
  summary: RETURN_SUMMARY_INSIGHTS.niit,
  taxImpact: 'At AGI above $200,000 for single filers, net investment income may be subject to the 3.8% NIIT on Form 8960.',
  rootCause: `Investment income is substantial: ${fmtUsd(FROZEN_RETURN.taxableInterest)} taxable interest, ${fmtUsd(FROZEN_RETURN.ordinaryDivs)} ordinary dividends, and ${fmtUsd(FROZEN_RETURN.qualifiedDivs)} qualified dividends on the return.`,
  tableRows: [
    { label: 'AGI (line 11)', cols: [fmtUsd(FROZEN_RETURN.totalIncome), '$485,820', '+19%'], badge: 'orange' as const, total: false },
    { label: 'Investment income lines', cols: ['Review', 'Form 8960', '!'], badge: 'orange' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024 / action', ''],
  suggestedActions: [
    'Review Form 8960 for net investment income tax exposure.',
    'Confirm which dividend and interest amounts are subject to NIIT.',
    'Cross-check qualified vs. ordinary dividend classifications.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalIncome',
}

function buildMissingEstPaymentsIssue(live: LiveReturnTotals) {
  return {
  issueKey: 'missingEstPayments',
  dotColor: 'orange' as const,
  title: 'No estimated tax payments recorded',
  category: 'Missing information',
  summary: `Line 26 shows $0 in 2025 estimated payments. With ${fmtUsd(live.oweAmount)} owed (up from $22,790 last year) and ${fmtUsd(live.totalWithholding)} in withholding, confirm whether Jessica made quarterly 1040-ES payments.`,
  taxImpact: `If estimated payments were made but not entered, the ${fmtUsd(live.oweAmount)} balance due on line 37 would go down. Withholding is below the $108,779 safe harbor.`,
  rootCause: `No 1040-ES payment records were imported. Last year total payments were $76,100 (line 33) against $98,890 tax. This year ${fmtUsd(live.totalWithholding)} is recorded against ${fmtUsd(live.totalTax)} tax.`,
  tableRows: [
    { label: '2025 estimated payments (line 26)', cols: ['$0', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
    { label: 'Amount you owe (line 37)',          cols: [fmtUsd(live.oweAmount), '$22,790', 'YoY'], badge: 'orange' as const, total: false },
    { label: 'Safe harbor shortfall',             cols: [fmtUsd(Math.max(0, 108779 - live.totalWithholding)), 'Gap', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Field', '2025', '2024 / status', ''],
  suggestedActions: [
    'Ask Jessica if she made any 2025 Form 1040-ES quarterly payments. Last year\'s pattern suggests she may have.',
    'If yes, enter the total on line 26. That lowers amount owed and may remove underpayment penalty.',
    'IRS account transcript or payment history on IRS.gov can confirm payments if she is unsure.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalPayments',
}
}

// ── Optimization Suggestions ──────────────────────────────────────────────

function buildOptW4Issue(live: LiveReturnTotals) {
  return {
  issueKey: 'optW4Adjustment',
  dotColor: 'blue' as const,
  title: 'Plan 2026 estimated payments',
  category: 'Optimization',
  summary: `Federal withholding is ${fmtUsd(live.totalWithholding)} while total tax is ${fmtUsd(live.totalTax)}. W-2 Box 2 shows ${fmtUsd(live.w2Withholding)}. Quarterly 1040-ES payments are the main lever for 2026.`,
  taxImpact: `The 2026 safe harbor will be 110% of this year's ${fmtUsd(live.totalTax)} total tax: $164,813. Jessica did not meet the $108,779 safe harbor this year.`,
  rootCause: `Federal withholding includes ${fmtUsd(live.w2Withholding)} from W-2 and ${fmtUsd(live.withholding1099)} from 1099s. Investment income drives most of the tax at AGI of ${fmtUsd(live.totalIncome)}.`,
  tableRows: [
    { label: '2025 total withholding (25a+25b)', cols: [fmtUsd(live.totalWithholding), '$41,100', 'YoY'], badge: 'orange' as const, total: false },
    { label: '2026 safe-harbor target (110%)',   cols: ['$164,813', 'Plan now', ''], badge: 'blue' as const, total: false },
    { label: 'Quarterly 1040-ES needed',         cols: ['~$41,203/qtr', 'Suggestion', ''], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024 / target', ''],
  suggestedActions: [
    'Set up quarterly 1040-ES payments for 2026. Target $164,813 total (safe harbor).',
    'Review W-4 withholding at Tech Circle if additional wage withholding is desired.',
    'When reconciling totals, cross-check 1099-INT Box 1 against line 2b.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'w2Withholding',
}
}

const OPT_IRA_ISSUE = {
  issueKey: 'optIra',
  dotColor: 'blue' as const,
  title: 'IRA deduction: confirm workplace plan coverage',
  category: 'Optimization',
  summary: `No IRA deduction was claimed. At AGI of ${fmtUsd(FROZEN_RETURN.totalIncome)} (up from $485,820), a traditional IRA is deductible only if Jessica is NOT covered by a workplace plan.`,
  taxImpact: `If Jessica is not covered by a workplace plan (check W-2 Box 13), a full $7,000 traditional IRA deduction would reduce taxable income. AGI of ${fmtUsd(FROZEN_RETURN.totalIncome)} stays far above any phase-out for covered filers.`,
  rootCause: 'No IRA deduction appears on the return. The Tech Circle W-2 does not show whether Box 13 "Retirement plan" is checked. Wages dropped 13% ($136,480 to $118,940) but remain well above IRA limits.',
  tableRows: [
    { label: 'W-2 Box 13, Retirement plan', cols: ['Unconfirmed', 'Check first', '?'], badge: 'orange' as const, total: false },
    { label: 'Max deductible (2025, if not covered)', cols: ['$7,000', 'Eligible?', ''], badge: 'blue' as const,  total: false },
    { label: 'Tax savings (est., if deductible)',    cols: ['~$2,450', 'Opportunity', ''], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Check W-2 Box 13 to confirm whether Jessica is covered by a workplace retirement plan.',
    'If not covered, a full $7,000 traditional IRA deduction is available regardless of income.',
    'If covered, no deduction is available at this AGI. Consider a backdoor Roth conversion instead.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'agi',
}

// Maps each issue key to the 1040 field it should highlight on Form/Summary view.
export const ISSUE_FIELD: Partial<Record<IssueKey, string>> = {
  balanceDueJump:      'amountOwed',
  totalTaxRise:        'totalTax',
  withholdingDrop:     'withholding',
  estTaxPenalty:       'totalPayments',
  qualDivDrop:         'qualifiedDivs',
  ordinaryDivSurge:    'ordinaryDivs',
  qualDivRatio:        'qualifiedDivs',
  confirmPriorAgi:     'agi',
  missingEstPayments:  'totalPayments',
  niitForm8960:        'totalIncome',
  optW4Adjustment:     'w2Withholding',
  optIra:              'agi',
}

function buildAllIssues(live: LiveReturnTotals) {
  return [
    buildBalanceDueIssue(live),
    TOTAL_TAX_RISE_ISSUE,
    buildWithholdingDropIssue(live),
    buildEstTaxPenaltyIssue(live),
    QUAL_DIV_DROP_ISSUE,
    ORDINARY_DIV_SURGE_ISSUE,
    QUAL_DIV_RATIO_ISSUE,
    CONFIRM_PRIOR_AGI_ISSUE,
    NIIT_FORM8960_ISSUE,
    buildMissingEstPaymentsIssue(live),
    buildOptW4Issue(live),
    OPT_IRA_ISSUE,
  ]
}

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
  liveTotals,
  amounts = SEED_AMOUNTS,
}: AgentReportPaneProps) {
  const live = liveTotals ?? computeLiveReturn(amounts)
  const ALL_ISSUES = buildAllIssues(live)
  // Active = not auto-dismissed by Phase 1 flag resolution or amount edits.
  // Remaining / badges follow live synced state so source-review fixes clear Phase 2 ghosts.
  const phase2Progress = getPhase2Progress({ reviewedFields, live, amounts })
  const activeOrder = phase2Progress.activeKeys
  const reviewedCount = phase2Progress.reviewed
  const totalActive = phase2Progress.total
  const remainingCount = phase2Progress.remaining
  const progressPct = totalActive === 0 ? 100 : Math.round((reviewedCount / totalActive) * 100)
  const allReviewed = phase2Progress.complete
  const [showCompletion, setShowCompletion] = useState(false)
  const prevAllReviewed = useRef(false)
  const [inputValue, setInputValue] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [issueDetailOpen, setIssueDetailOpen] = useState<string | null>(null)
  const [issueDetailClosing, setIssueDetailClosing] = useState(false)

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

  // Close detail pane if the open issue was auto-dismissed by Phase 1 sync
  useEffect(() => {
    if (issueDetailOpen && !activeOrder.includes(issueDetailOpen as IssueKey)) {
      setIssueDetailOpen(null)
      onHighlightField?.(null)
    }
  }, [activeOrder, issueDetailOpen, onHighlightField])

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

  // Navigate to next issue in active (non-dismissed) guided order
  const handleNext = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const nextKey = idx >= 0 && idx < activeOrder.length - 1 ? activeOrder[idx + 1] : null
    if (nextKey) {
      handleCloseIssueDetail()
      setTimeout(() => openDetail(nextKey), 220)
    } else {
      // All done — close detail and show completion screen if all reviewed
      handleCloseIssueDetail()
      setTimeout(() => setShowCompletion(true), 220)
    }
  }

  // Navigate to previous issue in active guided order
  const handlePrev = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const prevKey = idx > 0 ? activeOrder[idx - 1] : null
    if (!prevKey) return
    handleCloseIssueDetail()
    setTimeout(() => openDetail(prevKey), 220)
  }

  const isLastIssue  = (key: string) => activeOrder.indexOf(key as IssueKey) === activeOrder.length - 1
  const isFirstIssue = (key: string) => activeOrder.indexOf(key as IssueKey) === 0

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
              <span className={styles.scoreCountNumber}>{Math.max(0, remainingCount)}</span>
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
                All {totalActive} issues reviewed and reconciled. This return is ready to move forward.
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
              const visibleKeys = card.keys.filter(k => activeOrder.includes(k as IssueKey))
              if (visibleKeys.length === 0) return null
              const remaining = visibleKeys.filter(k => !reviewedFields.has(k)).length
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
                    {visibleKeys.map((key) => {
                      const issue = getIssueConfig(key)
                      if (!issue) return null
                      const signOff = reviewedFields.get(key)
                      const isReviewed = !!signOff
                      const issueNum = activeOrder.indexOf(key as IssueKey) + 1
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
                            <span className={styles.issueChip}>{issueNum} of {activeOrder.length}</span>
                            {isReviewed && <span className={styles.findingReviewedBadge}>Reviewed</span>}
                          </div>
                          {signOff && <span className={styles.findingSignOff}>{signOff.by} · {signOff.at}</span>}
                          <p className={styles.findingBody}>{issue.summary}</p>
                          <div className={styles.findingActions} onClick={e => e.stopPropagation()}>
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
            totalItems={totalActive}
            reviewedFields={reviewedFields}
            onBack={handleCloseIssueDetail}
            onClose={() => { handleCloseIssueDetail(); onClose?.() }}
            onViewSource={() => {
              onNavigateToTab?.(activeIssue.viewSourceTab, activeIssue.viewSourceSubTab, activeIssue.viewSourceField)
            }}
            onMarkReviewed={onMarkReviewed}
            issueNumber={activeOrder.indexOf(activeIssue.issueKey as IssueKey) + 1}
            category={activeIssue.category}
            totalIssues={activeOrder.length}
            onPrev={isFirstIssue(activeIssue.issueKey) ? undefined : () => handlePrev(activeIssue.issueKey)}
            onNext={isLastIssue(activeIssue.issueKey) ? undefined : () => handleNext(activeIssue.issueKey)}
          />
        )
      })()}

    </div>
  )
}
