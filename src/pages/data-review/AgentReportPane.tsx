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
export const TOTAL_REVIEW_ITEMS = 11

export const GUIDED_ORDER = [
  'balanceDueJump',
  'totalTaxRise',
  'withholdingDrop',
  'w2WithholdingZero',
  'qualDivDrop',
  'ordinaryDivSurge',
  'qualDivRatio',
  'confirmPriorAgi',
  'missingEstPayments',
  'optW4Adjustment',
  'optIra',
] as const
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
  onNavigateToTab?: (tab?: 'w2s' | '1099-divs' | '1099-ints' | 'prior-1040', subTab?: 'techCircle', field?: string) => void
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
  { label: 'Critical',        keys: ['balanceDueJump', 'totalTaxRise', 'withholdingDrop', 'w2WithholdingZero'], badgeColor: 'red'    as const, position: 'first' },
  { label: 'Review required', keys: ['qualDivDrop', 'ordinaryDivSurge', 'qualDivRatio', 'confirmPriorAgi', 'missingEstPayments'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Opportunities',   keys: ['optW4Adjustment', 'optIra'], badgeColor: 'blue'   as const, position: 'last' },
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

const BALANCE_DUE_JUMP_ISSUE = {
  issueKey: 'balanceDueJump',
  dotColor: 'red' as const,
  title: 'Balance due jumped to $124,905',
  category: 'IRS compliance',
  summary: 'Line 37 rose from $22,790 in 2024 to $124,905 this year, a 448% increase. Confirm Jessica can pay this amount by the filing deadline.',
  taxImpact: 'A balance due this large may trigger underpayment penalties if quarterly payments were not made. Form 2210 should be reviewed before filing.',
  rootCause: 'Total tax rose while federal withholding fell sharply. Capital gains dropped to $0 but dividend income surged, shifting the tax profile.',
  tableRows: [
    { label: 'Amount you owe (line 37)', cols: ['$124,905', '$22,790', '+448%'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Confirm Jessica can pay $124,905 by the filing deadline.',
    'Ask if any 2025 estimated payments were made but not entered on line 26.',
    'Review Form 2210 for underpayment penalty exposure.',
  ],
  viewSourceLabel: 'View Form 1040',
  viewSourceTab: undefined,
  viewSourceSubTab: undefined,
  viewSourceField: 'amountOwed',
}

const TOTAL_TAX_RISE_ISSUE = {
  issueKey: 'totalTaxRise',
  dotColor: 'red' as const,
  title: 'Total tax up 52% year over year',
  category: 'IRS compliance',
  summary: 'Total tax on line 24 rose from $98,890 in 2024 to $149,830 in 2025 even though AGI fell 7%. The income mix changed: capital gains fell to $0 while ordinary dividends rose 161%.',
  taxImpact: 'Higher total tax with lower AGI means more income is taxed at ordinary rates. Review Schedule D and Form 8949 for missing capital gain entries.',
  rootCause: 'Capital gains fell from $219,850 to $0 on line 7. Ordinary dividends rose from $126,750 to $331,250 on line 3b, replacing lower-rate gain income.',
  tableRows: [
    { label: 'Total tax (line 24)', cols: ['$149,830', '$98,890', '+52%'], badge: 'red' as const, total: true },
    { label: 'AGI (line 11)',       cols: ['$452,176', '$485,820', '-7%'], badge: 'orange' as const, total: false },
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

const WITHHOLDING_DROP_ISSUE = {
  issueKey: 'withholdingDrop',
  dotColor: 'red' as const,
  title: 'Federal withholding down 39%',
  category: 'IRS compliance',
  summary: 'Combined federal withholding on lines 25a and 25b fell from $41,100 in 2024 to $24,925 this year. That covers only 16.6% of the $149,830 total tax.',
  taxImpact: 'Withholding below the safe harbor of $108,779 (110% of 2024 tax) exposes Jessica to Form 2210 underpayment penalties.',
  rootCause: 'All $24,925 in federal withholding now comes from 1099-DIV Box 4 backup withholding. Last year withholding included $22,360 from W-2 Box 2.',
  tableRows: [
    { label: 'Federal withholding (25a + 25b)', cols: ['$24,925', '$41,100', '-39%'], badge: 'red' as const, total: false },
    { label: 'Safe harbor (110% of 2024 tax)',    cols: ['$108,779', 'Not met', '!'],    badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'Status'],
  suggestedActions: [
    'Cross-check 1099-DIV Box 4 ($26,363 source vs. $24,925 on return).',
    'Run Form 2210 to estimate underpayment penalty.',
    'Ask about unrecorded estimated payments that would reduce the balance due.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'fedTaxWithheld',
}

const W2_WITHHOLDING_ZERO_ISSUE = {
  issueKey: 'w2WithholdingZero',
  dotColor: 'red' as const,
  title: 'W-2 federal withholding is $0',
  category: 'IRS compliance',
  summary: 'Tech Circle W-2 Box 2 is blank this year. Last year Box 2 was $22,360 despite similar wages of $118,940 on line 1a.',
  taxImpact: 'Missing W-2 withholding is a major reason total withholding dropped 39%. If Jessica is not exempt, the employer should be withholding.',
  rootCause: 'W-2 Box 2 shows no federal income tax withheld for Tech Circle. Jessica may have claimed exempt status or the employer stopped withholding mid-year.',
  tableRows: [
    { label: 'W-2 Box 2 withholding', cols: ['$0', '$22,360', '-100%'], badge: 'red' as const, total: false },
    { label: 'W-2 Box 1 wages',       cols: ['$118,940', '$136,480', '-13%'], badge: 'orange' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024', 'YoY'],
  suggestedActions: [
    'Confirm with Jessica whether she claimed exempt status on Form W-4.',
    'If not exempt, request flat withholding via Form W-4 Step 4(c).',
    'Verify wages on the return match the source W-2 ($148,940 on document vs. $118,940 entered).',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'w2Withholding',
}

const QUAL_DIV_DROP_ISSUE = {
  issueKey: 'qualDivDrop',
  dotColor: 'orange' as const,
  title: 'Qualified dividends may be misclassified',
  category: 'IRS compliance',
  summary: 'Return line 3a shows $331,250 but Token Financial 1099-DIV Box 1b shows only $187,500 qualified. The full ordinary amount may have been misclassified as qualified.',
  taxImpact: 'Qualified dividends are taxed at 15% or 20%. If $143,750 was misclassified from ordinary to qualified, the tax difference could exceed $20,000.',
  rootCause: 'Source Box 1b is $187,500 qualified out of $331,250 ordinary (Box 1a). Return line 3a matches Box 1a instead of Box 1b, a common import miscode.',
  tableRows: [
    { label: 'Return line 3a (qualified)', cols: ['$331,250', '$219,850', '+51%'], badge: 'red' as const, total: false },
    { label: 'Source Box 1b (qualified)',  cols: ['$187,500', 'Should match', '!'], badge: 'red' as const, total: true },
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
  title: 'Ordinary dividends rose 161%',
  category: 'IRS compliance',
  summary: 'Ordinary dividends on line 3b jumped from $126,750 in 2024 to $331,250 this year. This is the largest single income line change on the return.',
  taxImpact: 'Ordinary dividends are taxed at regular rates up to 37%. The $204,500 increase adds roughly $71,000 in tax at the 35% marginal rate.',
  rootCause: 'Token Financial 1099-DIV Box 1a shows $331,250 total ordinary dividends. Capital gains on line 7 fell to $0, suggesting gains may have been distributed as dividends instead.',
  tableRows: [
    { label: 'Ordinary dividends (line 3b)', cols: ['$331,250', '$126,750', '+161%'], badge: 'red' as const, total: false },
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
  summary: 'The qualified share of dividends is inconsistent. Return line 3a shows $331,250 but only $187,500 qualifies per source Box 1b. The ratio should be 57%, not 100%.',
  taxImpact: 'At a 35% marginal rate, the non-qualified portion alone adds about $50,000 in tax compared to if the full amount were qualified at 20%.',
  rootCause: 'Box 1b ($187,500) is 57% of Box 1a ($331,250) on the Token Financial 1099-DIV. Return line 3a incorrectly reflects the full Box 1a amount.',
  tableRows: [
    { label: 'Qualified share (should be)', cols: ['57%', '63% last year', 'Check'], badge: 'orange' as const, total: false },
    { label: 'Return line 3a vs source 1b', cols: ['$331,250', '$187,500', 'Mismatch'], badge: 'red' as const, total: true },
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

const MISSING_STATE_RETURN_ISSUE = {
  issueKey: 'missingStateReturn',
  dotColor: 'orange' as const,
  title: 'CA state filing likely required',
  category: 'Missing information',
  summary: 'Jessica\'s address is Middlefield, CA. No California state return information was found in imported documents. Last year\'s CA liability was likely significant given $485,820 AGI.',
  taxImpact: 'California taxes capital gains and dividends at ordinary rates, about 10.3% to 11.3% in this income range. Estimated 2025 CA tax is roughly $38,000 to $42,000 on taxable income of $436,426. Last year may have been higher with $219,850 in capital gains.',
  rootCause: 'No CA documents (CA W-2 withholding, CA 540 prior return) were imported. Filing is inferred from the Middlefield, CA address on Form 1040. Federal amount owed rose 448% year over year. State underpayment risk may match federal.',
  tableRows: [
    { label: 'CA state return (CA 540)', cols: ['N/A', 'Not started', '!'], badge: 'orange' as const, total: false },
    { label: 'CA withholding on W-2',    cols: ['N/A', 'Verify', '?'],      badge: 'orange' as const, total: false },
    { label: 'Estimated CA liability',   cols: ['~$38,000 to $42,000', 'Estimate', ''], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Item', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm California filing with Jessica. Middlefield, CA residency triggers Form CA 540.',
    'Prepare Form CA 540. Ordinary dividends ($331,250) are taxed at full CA ordinary rates.',
    'Check W-2 Box 17 for CA withholding and whether CA estimated payments were made.',
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
  summary: 'Line 26 shows $0 in 2025 estimated payments. With $124,905 owed (up from $22,790 last year) and only $24,925 in withholding, confirm whether Jessica made quarterly 1040-ES payments.',
  taxImpact: 'If estimated payments were made but not entered, the $124,905 balance due on line 37 would go down. With $83,854 between withholding ($24,925) and the safe harbor ($108,779), missing payments are the most likely way to avoid a Form 2210 penalty.',
  rootCause: 'No 1040-ES payment records were imported. Last year total payments were $76,100 (line 33) against $98,890 tax. This year only $24,925 is recorded against $149,830 tax, a much wider gap.',
  tableRows: [
    { label: '2025 estimated payments (line 26)', cols: ['$0', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
    { label: 'Amount you owe (line 37)',          cols: ['$124,905', '$22,790', '+448%'], badge: 'orange' as const, total: false },
    { label: 'Safe harbor shortfall',             cols: ['$83,854', 'Gap', '!'], badge: 'red' as const, total: true },
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

// ── Optimization Suggestions ──────────────────────────────────────────────

const OPT_W4_ISSUE = {
  issueKey: 'optW4Adjustment',
  dotColor: 'blue' as const,
  title: 'Set up 2026 estimated payments. W-2 withholding is $0',
  category: 'Optimization',
  summary: 'Federal withholding fell from $41,100 to $24,925 while total tax rose to $149,830. W-2 Box 2 is blank ($0 vs. $22,360 last year). There is nothing to fix via W-4. Quarterly 1040-ES payments are the main lever for 2026.',
  taxImpact: 'The 2026 safe harbor will be 110% of this year\'s $149,830 total tax: $164,813. Without action, Jessica may face another large balance due and a Form 2210 penalty. She did not meet the $108,779 safe harbor this year.',
  rootCause: 'All federal withholding comes from 1099-DIV backup withholding ($24,925). W-2 federal withholding dropped from $22,360 to $0 despite $118,940 in wages. Jessica may have claimed exempt status or the employer stopped withholding. Investment income now drives most of the tax.',
  tableRows: [
    { label: '2025 total withholding (25a+25b)', cols: ['$24,925', '$41,100', '-39%'], badge: 'orange' as const, total: false },
    { label: '2026 safe-harbor target (110%)',   cols: ['$164,813', 'Plan now', ''],    badge: 'blue' as const,  total: false },
    { label: 'Quarterly 1040-ES needed',         cols: ['~$41,203/qtr', 'Suggestion', ''], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', '2025', '2024 / target', ''],
  suggestedActions: [
    'Set up quarterly 1040-ES payments for 2026. Target $164,813 total (safe harbor).',
    'Find out why W-2 Box 2 is blank. If Jessica is not exempt, request flat withholding via Form W-4 Step 4(c).',
    'When reconciling totals, cross-check 1099-INT Box 1 against line 2b. Gaps between sources and the 1040 weaken return integrity.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'w2Withholding',
}

const OPT_IRA_ISSUE = {
  issueKey: 'optIra',
  dotColor: 'blue' as const,
  title: 'IRA deduction: confirm workplace plan coverage',
  category: 'Optimization',
  summary: 'No IRA deduction was claimed. At AGI of $452,176 (down from $485,820), a traditional IRA is deductible only if Jessica is NOT covered by a workplace plan. For covered single filers, the 2025 phase-out ends around $89,000 MAGI.',
  taxImpact: 'If Jessica is not covered by a workplace plan (check W-2 Box 13), a full $7,000 traditional IRA deduction would cut taxable income from $436,426 to $429,426. That saves about $2,450 at her 35% marginal rate. AGI fell 7% but stays far above any phase-out for covered filers.',
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
  w2WithholdingZero:   'w2Withholding',
  qualDivDrop:         'qualifiedDivs',
  ordinaryDivSurge:    'ordinaryDivs',
  qualDivRatio:        'qualifiedDivs',
  confirmPriorAgi:     'agi',
  missingEstPayments:  'totalPayments',
  optW4Adjustment:     'w2Withholding',
  optIra:              'agi',
}

const ALL_ISSUES = [
  BALANCE_DUE_JUMP_ISSUE, TOTAL_TAX_RISE_ISSUE, WITHHOLDING_DROP_ISSUE, W2_WITHHOLDING_ZERO_ISSUE,
  QUAL_DIV_DROP_ISSUE, ORDINARY_DIV_SURGE_ISSUE, QUAL_DIV_RATIO_ISSUE, CONFIRM_PRIOR_AGI_ISSUE,
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
