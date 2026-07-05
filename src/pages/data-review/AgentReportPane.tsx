import { useState, useEffect, useRef } from 'react'
import { Close, Plus, ChevronDown, ChevronRight, ChevronLeft, CircleCheck, Document, Panel } from '@design-systems/icons'
import importedDocsIcon from '../../assets/icons/imported-docs.svg'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Badge } from '@cgds/badge'
import '@cgds/badge/dist/index.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import brandBallsIcon from '../../assets/icons/brand-balls.svg'
import compareOthersIcon from '../../assets/icons/compare-others.svg'
import federalTaxesIcon from '../../assets/icons/federal-taxes.svg'
import scannerIcon from '../../assets/icons/scanner.svg'
import taxesAndCreditsIcon from '../../assets/icons/taxes-and-credits.svg'
import YoYDetailPane from './YoYDetailPane'
import IssueDetailPane from './IssueDetailPane'
import QuestionnairePane from './QuestionnairePane'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/AgentReportPane.module.css'

// 12 total items across all categories
const TOTAL_REVIEW_ITEMS = 15

// Ordered list of issue keys for guided "Next" navigation
const GUIDED_ORDER = ['w2Box12', 'w2Ein', 'divCollectibles', 'divNonDiv', 'wagesConfidence', 'capitalGainNew', 'irsEstPenalty', 'irsAmt', 'irsCapGainWithholding', 'missingPriorAgi', 'missingStateReturn', 'missingEstPayments', 'optW4Adjustment', 'optQbi', 'optIra'] as const
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
  onNavigateToTab?: (tab: 'w2s' | '1099-divs' | '1099-ints' | 'k1' | 'prior-1040', subTab?: 'techCircle', field?: string) => void
  /** Highlight a 1040 field without leaving the agent panel */
  onHighlightField?: (field: string | null) => void
  /** Live field values for inline editing */
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
}

const REPORT_CARDS = [
  { label: 'Critical',        keys: ['w2Ein', 'irsEstPenalty', 'irsAmt', 'missingPriorAgi'],                                                          badgeColor: 'red'    as const, position: 'first' },
  { label: 'Review required', keys: ['w2Box12', 'wagesConfidence', 'divCollectibles', 'divNonDiv', 'irsCapGainWithholding', 'missingStateReturn', 'missingEstPayments', 'capitalGainNew'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Opportunities',   keys: ['optW4Adjustment', 'optQbi', 'optIra'],                                                                          badgeColor: 'blue'   as const, position: 'last' },
]

const CARD_ICONS = [
  <img src={compareOthersIcon}   alt="" width={20} height={20} />,
  <img src={scannerIcon}         alt="" width={20} height={20} />,
  <img src={federalTaxesIcon}    alt="" width={20} height={20} />,
  <img src={taxesAndCreditsIcon} alt="" width={20} height={20} />,
]

// ── Jessica Drake Issues ──────────────────────────────────────────────────

const W2_BOX12_ISSUE = {
  issueKey: 'w2Box12',
  dotColor: 'red' as const,
  title: 'W-2 Box 12 not imported',
  category: 'Scan quality & inputs',
  summary: 'Box 12 was not captured during import. Code and amount must be entered manually.',
  taxImpact: 'Box 12 codes can affect pre-tax deductions (e.g., 401k, HSA). If Box 12 contains a deferral amount, taxable income may be overstated until the field is populated.',
  rootCause: 'The Box 12 section on the Tech Circle W-2 was not recognized during OCR. The field was left blank in the imported data.',
  tableRows: [
    { label: 'Box 12 (Code)', cols: ['—', 'Required', '—'], badge: 'red' as const, total: false },
  ],
  tableHeaders: ['Field', 'Imported', 'Status', ''],
  suggestedActions: [
    'Open the Tech Circle W-2 in the source document panel.',
    'Locate Box 12 and enter the Code and Amount manually.',
    'Save the value — it flows automatically to the return.',
  ],
  viewSourceLabel: 'View Tech Circle W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'box12',
}

const W2_EIN_ISSUE = {
  issueKey: 'w2Ein',
  dotColor: 'red' as const, // Critical
  title: 'W-2 EIN not found',
  category: 'Scan quality & inputs',
  summary: 'Employer EIN not found in the document. Required for e-filing — enter manually.',
  taxImpact: 'A missing EIN will prevent e-filing. The return cannot be submitted electronically until this field is populated.',
  rootCause: 'The EIN field on the Tech Circle W-2 was not captured during import. This may be due to scan quality or document formatting.',
  tableRows: [
    { label: 'Employer EIN (Box b)', cols: ['—', 'Required', '—'], badge: 'red' as const, total: false },
  ],
  tableHeaders: ['Field', 'Imported', 'Status', ''],
  suggestedActions: [
    'Open the Tech Circle W-2 and locate Box b (Employer identification number).',
    'Enter the EIN manually in the Employer Information section.',
    'Verify it matches the printed value on the source document.',
  ],
  viewSourceLabel: 'View Tech Circle W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'wages',
}

const DIV_COLLECTIBLES_ISSUE = {
  issueKey: 'divCollectibles',
  dotColor: 'red' as const,
  title: '1099-DIV Box 2d empty',
  category: 'Scan quality & inputs',
  summary: 'Collectibles (28%) gain not imported — verify source document.',
  taxImpact: 'If collectibles gain exists and was not captured, income may be understated. Collectibles gains are taxed at a maximum 28% rate.',
  rootCause: 'Box 2d on the Unwavering Financial 1099-DIV was blank or not recognized during import.',
  tableRows: [
    { label: 'Box 2d (Collectibles 28% gain)', cols: ['—', 'Verify', '?'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Imported', 'Status', ''],
  suggestedActions: [
    'Open the Unwavering Financial 1099-DIV and check Box 2d.',
    'If a value exists, enter it manually.',
    'If blank on the source document, no action needed.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'qualifiedDivs',
}

const DIV_NONDIV_ISSUE = {
  issueKey: 'divNonDiv',
  dotColor: 'red' as const,
  title: '1099-DIV Box 3 empty',
  category: 'Scan quality & inputs',
  summary: 'Nondividend distributions not imported — verify source document.',
  taxImpact: 'Nondividend distributions (Box 3) are a return of capital — generally not taxable but reduce cost basis. If present and not captured, basis calculations may be affected.',
  rootCause: 'Box 3 on the Unwavering Financial 1099-DIV was not captured during import.',
  tableRows: [
    { label: 'Box 3 (Nondividend distributions)', cols: ['—', 'Verify', '?'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Imported', 'Status', ''],
  suggestedActions: [
    'Open the Unwavering Financial 1099-DIV and check Box 3.',
    'If a value exists, enter it and note the basis impact.',
    'If blank on the source document, no action needed.',
  ],
  viewSourceLabel: 'View 1099-DIV',
  viewSourceTab: '1099-divs' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'ordinaryDivs',
}

const WAGES_CONFIDENCE_ISSUE = {
  issueKey: 'wagesConfidence',
  dotColor: 'red' as const,
  title: 'Wages low confidence',
  category: 'Scan quality',
  summary: 'W-2 wages read at 72% confidence. Verify Box 1 matches source document ($118,940).',
  taxImpact: 'If wages are misread, taxable income will be incorrect. At Jessica\'s marginal rate, each $1,000 error changes tax liability by approximately $240.',
  rootCause: 'The scan of the Tech Circle W-2 returned a lower-than-normal confidence score for Box 1. The printed digits may be partially obscured or low contrast.',
  tableRows: [
    { label: 'Box 1 (Wages)', cols: ['$118,940', '72%', 'Verify'], badge: 'red' as const, total: false },
  ],
  tableHeaders: ['Field', 'Scanned value', 'Confidence', 'Action'],
  suggestedActions: [
    'Open the Tech Circle W-2 and confirm Box 1 shows $118,940.',
    'If the printed value differs, correct it in the Wages field.',
    'Mark as reviewed once confirmed.',
  ],
  viewSourceLabel: 'View Tech Circle W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'wages',
}

const CAPITAL_GAIN_NEW_ISSUE = {
  issueKey: 'capitalGainNew',
  dotColor: 'orange' as const,
  title: 'New capital gain this year',
  category: 'YoY analysis',
  summary: 'Capital gain of $194,600 is new this year (prior year: $0). Confirm Schedule D is attached.',
  taxImpact: 'Long-term capital gains at Jessica\'s income level are taxed at 20%. A $194,600 gain adds approximately $38,920 in capital gains tax. Confirm whether gains are short-term (ordinary rates) or long-term.',
  rootCause: 'No capital gain appeared on the prior year return. This year\'s $194,600 is entirely new and likely reflects asset sales in 2025.',
  tableRows: [
    { label: 'Capital gain (2025)', cols: ['$194,600', 'New', '—'],    badge: 'orange' as const, total: false },
    { label: 'Capital gain (2024)', cols: ['$0',        'Prior year', '—'], badge: undefined,         total: false },
  ],
  tableHeaders: ['Field', 'Amount', 'Status', ''],
  suggestedActions: [
    'Confirm Schedule D is attached and reflects all 2025 asset sales.',
    'Ask Jessica whether gains are short-term or long-term.',
    'Verify the $194,600 figure against brokerage 1099-B statements.',
  ],
  viewSourceLabel: 'View 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'capitalGain',
}

// ── IRS Compliance Issues ─────────────────────────────────────────────────

const IRS_EST_PENALTY_ISSUE = {
  issueKey: 'irsEstPenalty',
  dotColor: 'red' as const,
  title: 'Estimated tax penalty: $3,814',
  category: 'IRS compliance',
  summary: 'An estimated tax penalty of $3,814 appears on line 38. IRS requires quarterly payments when withholding falls short.',
  taxImpact: 'The $3,814 penalty (line 38) is added to the amount owed and is not deductible. Total amount due is $101,169 ($97,355 + $3,814).',
  rootCause: 'Jessica\'s total withholding ($40,765) covered only 29.5% of her $138,120 tax liability. The IRS safe-harbor threshold requires either 100% of prior-year tax or 110% for high-income filers.',
  tableRows: [
    { label: 'Total tax (line 24)',        cols: ['$138,120', '—', '—'],   badge: undefined,        total: false },
    { label: 'Total withholding (line 33)', cols: ['$40,765',  '—', '—'],  badge: undefined,        total: false },
    { label: 'Estimated tax penalty (line 38)', cols: ['$3,814', 'Due', '!'], badge: 'red' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Advise Jessica to set up 2025 quarterly estimated payments to avoid a repeat penalty.',
    'Review whether safe-harbor payments were made in 2024 — if so, penalty may be waivable.',
    'Consider adjusting W-4 withholding at Tech Circle to cover next year\'s liability.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalTax',
}

const IRS_AMT_ISSUE = {
  issueKey: 'irsAmt',
  dotColor: 'red' as const,
  title: 'AMT exposure at this income level',
  category: 'IRS compliance',
  summary: 'AGI of $646,776 places Jessica above the AMT exemption phase-out threshold. Form 6251 should be attached.',
  taxImpact: 'The 2024 AMT exemption phases out at $609,350 for single filers. At Jessica\'s income, the effective exemption is reduced, increasing potential AMT liability. Form 6251 must be filed to calculate and document AMT.',
  rootCause: 'High dividend and capital gain income combined with AGI above phase-out thresholds triggers an AMT review requirement for this return.',
  tableRows: [
    { label: 'AGI (line 11)',           cols: ['$646,776', '—', '—'],         badge: undefined,           total: false },
    { label: 'AMT phase-out threshold', cols: ['$609,350', 'Exceeded', '!'],   badge: 'red' as const,      total: false },
    { label: 'Form 6251',               cols: ['—',        'Required', '—'],   badge: 'orange' as const,   total: false },
  ],
  tableHeaders: ['Item', 'Value', 'Status', ''],
  suggestedActions: [
    'Complete Form 6251 (Alternative Minimum Tax) and attach to the return.',
    'Review whether ISO stock options or other AMT preference items apply.',
    'Confirm software has calculated AMT and included it in total tax if triggered.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'agi',
}

const IRS_CAP_GAIN_WITHHOLDING_ISSUE = {
  issueKey: 'irsCapGainWithholding',
  dotColor: 'orange' as const,
  title: 'Capital gains with no withholding',
  category: 'IRS compliance',
  summary: '$194,600 in capital gains were reported with no associated withholding. 2025 estimated payments may be required.',
  taxImpact: 'At Jessica\'s income level, long-term capital gains are taxed at 20% plus 3.8% Net Investment Income Tax — up to $46,300 in additional tax on the gain alone, with no withholding applied.',
  rootCause: 'Capital gains from asset sales typically have no automatic withholding. Without quarterly estimated payments, the IRS will assess an underpayment penalty for 2025.',
  tableRows: [
    { label: 'Capital gain (line 7)',    cols: ['$194,600', '—', '—'],       badge: undefined,          total: false },
    { label: 'Withholding on gain',      cols: ['$0',       'None', '!'],     badge: 'orange' as const,  total: false },
    { label: 'Estimated NIIT exposure',  cols: ['~$7,395',  'Review', '—'],   badge: 'orange' as const,  total: false },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Advise Jessica to make 2025 Q1 estimated payment covering capital gain tax.',
    'Confirm whether the gain is short-term (ordinary rates) or long-term (preferential rates).',
    'Review Net Investment Income Tax (Form 8960) — likely applies at this income level.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'capitalGain',
}

// ── Missing Information Issues ────────────────────────────────────────────

const MISSING_PRIOR_AGI_ISSUE = {
  issueKey: 'missingPriorAgi',
  dotColor: 'orange' as const,
  title: 'Prior-year AGI not on file',
  category: 'Missing information',
  summary: 'Prior-year AGI is required for e-file PIN validation. Not found in any imported document.',
  taxImpact: 'Without the correct prior-year AGI, the IRS cannot validate the e-file PIN. The return cannot be submitted electronically until this is confirmed.',
  rootCause: 'The 2023 return was not imported and no prior-year AGI was recorded during client onboarding.',
  tableRows: [
    { label: '2023 AGI (e-file PIN)', cols: ['—', 'Missing', '!'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Value', 'Status', ''],
  suggestedActions: [
    'Ask Jessica to provide her 2023 prior-year AGI.',
    'Enter it in the e-file section of the return.',
    'Alternatively, use the IRS Get Transcript tool to retrieve it.',
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
  taxImpact: 'California taxes all income including capital gains at ordinary rates (up to 13.3%). At Jessica\'s income level, CA state tax liability could exceed $80,000.',
  rootCause: 'No CA state documents (CA W-2 withholding, CA 540 prior return) were imported. State filing requirement is inferred from the address on Form 1040.',
  tableRows: [
    { label: 'CA state return (CA 540)', cols: ['—', 'Not started', '!'], badge: 'orange' as const, total: false },
    { label: 'CA withholding on W-2',    cols: ['—', 'Verify', '?'],      badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Item', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm California state filing requirement with Jessica.',
    'Prepare Form CA 540 — capital gains are taxed at ordinary CA rates.',
    'Check W-2 Box 17 for CA state withholding amount.',
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
  summary: 'Line 26 shows $0 in 2024 estimated payments. Confirm with Jessica whether quarterly payments were made.',
  taxImpact: 'If estimated payments were made but not recorded, the amount owed ($97,355) would decrease and the penalty ($3,814) may be reduced or eliminated.',
  rootCause: 'No 1040-ES payment records were imported. Either no payments were made, or they were made but not captured during document import.',
  tableRows: [
    { label: '2024 estimated payments (line 26)', cols: ['$0', 'Unconfirmed', '?'], badge: 'orange' as const, total: false },
  ],
  tableHeaders: ['Field', 'Recorded', 'Status', ''],
  suggestedActions: [
    'Ask Jessica if she made any 2024 Form 1040-ES quarterly payments.',
    'If yes, enter the total on line 26 — this reduces the amount owed.',
    'IRS account transcript can confirm payments if Jessica is unsure.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'totalPayments',
}

// ── Optimization Suggestions ──────────────────────────────────────────────

const OPT_W4_ISSUE = {
  issueKey: 'optW4Adjustment',
  dotColor: 'blue' as const,
  title: 'Consider adjusting W-4 withholding',
  category: 'Optimization',
  summary: 'Jessica owed $97,355 this year. Increasing W-4 withholding at Tech Circle could eliminate next year\'s penalty.',
  taxImpact: 'To meet the 110% safe-harbor rule for high-income filers, Jessica would need to withhold at least $151,932 in 2025 (110% × $138,120). Current withholding pace is $15,840/year from wages alone.',
  rootCause: 'The large balance due ($97,355) is driven almost entirely by dividend and capital gain income, which has no automatic withholding.',
  tableRows: [
    { label: 'Current annual withholding', cols: ['$15,840',  '—', '—'],      badge: undefined,        total: false },
    { label: '110% safe-harbor target',    cols: ['$151,932', 'Gap', '—'],    badge: 'blue' as const,  total: false },
    { label: 'Additional needed/year',     cols: ['$136,092', 'Suggestion', '→'], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Advise Jessica to submit a new W-4 to Tech Circle requesting higher withholding.',
    'Alternatively, set up quarterly 1040-ES payments to cover investment income.',
    'Target at least 110% of 2024 total tax ($151,932) to avoid 2025 penalty.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'withholding',
}

const OPT_QBI_ISSUE = {
  issueKey: 'optQbi',
  dotColor: 'blue' as const,
  title: 'QBI deduction — verify eligibility',
  category: 'Optimization',
  summary: 'No QBI deduction (line 13) was claimed. If Tech Circle income includes qualified business income, Jessica may be eligible for up to 20% deduction.',
  taxImpact: 'A QBI deduction of 20% on qualifying income could meaningfully reduce taxable income. At Jessica\'s marginal rate, each $10,000 of QBI deduction saves approximately $3,700 in federal tax.',
  rootCause: 'The return shows $0 on line 13. This may be correct if Tech Circle pays W-2 wages only — but should be confirmed if Jessica has any pass-through business income.',
  tableRows: [
    { label: 'QBI deduction (line 13)', cols: ['$0', 'Not claimed', '→'], badge: 'blue' as const, total: false },
  ],
  tableHeaders: ['Field', 'Value', 'Status', ''],
  suggestedActions: [
    'Confirm whether Jessica has any pass-through business income (S-corp, partnership, sole prop).',
    'If eligible, complete Form 8995 and claim the deduction on line 13.',
    'Note: W-2 wages alone do not qualify — business income required.',
  ],
  viewSourceLabel: 'View Prior Year 1040',
  viewSourceTab: 'prior-1040' as const,
  viewSourceSubTab: undefined,
  viewSourceField: 'taxableIncome',
}

const OPT_IRA_ISSUE = {
  issueKey: 'optIra',
  dotColor: 'blue' as const,
  title: 'No IRA contribution found',
  category: 'Optimization',
  summary: 'No IRA deduction was claimed. Jessica may be eligible to contribute up to $7,000 for 2024 and reduce taxable income.',
  taxImpact: 'A $7,000 traditional IRA contribution (if deductible) would reduce taxable income by $7,000 — saving approximately $2,590 in federal tax at Jessica\'s marginal rate. Deadline is April 15, 2025.',
  rootCause: 'No IRA contribution deduction appears on the return. Deductibility depends on whether Jessica is covered by a workplace retirement plan — which should be confirmed via W-2 Box 12 (once resolved).',
  tableRows: [
    { label: '2024 IRA contribution', cols: ['$0',    'Not claimed', '→'], badge: 'blue' as const, total: false },
    { label: 'Max deductible (2024)', cols: ['$7,000', 'Eligible?', '—'], badge: 'blue' as const,  total: false },
    { label: 'Tax savings (est.)',    cols: ['~$2,590', 'Opportunity', '→'], badge: 'blue' as const, total: true },
  ],
  tableHeaders: ['Item', 'Amount', 'Status', ''],
  suggestedActions: [
    'Confirm whether Jessica is covered by a workplace retirement plan (W-2 Box 13).',
    'If not covered, a full $7,000 traditional IRA deduction is likely available.',
    'Contributions for 2024 can be made until April 15, 2025.',
  ],
  viewSourceLabel: 'View W-2',
  viewSourceTab: 'w2s' as const,
  viewSourceSubTab: 'techCircle' as const,
  viewSourceField: 'wages',
}

// Maps each issue key to the 1040 field it should highlight
const ISSUE_FIELD: Partial<Record<IssueKey, string>> = {
  w2Box12:               'wages',
  w2Ein:                 'wages',
  divCollectibles:       'qualifiedDivs',
  divNonDiv:             'ordinaryDivs',
  wagesConfidence:       'wages',
  capitalGainNew:        'capitalGain',
  irsEstPenalty:         'totalTax',
  irsAmt:                'agi',
  irsCapGainWithholding: 'capitalGain',
  missingPriorAgi:       undefined,
  missingStateReturn:    'wages',
  missingEstPayments:    'totalPayments',
  optW4Adjustment:       'withholding',
  optQbi:                'taxableIncome',
  optIra:                'wages',
}

// All issues as a flat list for getIssueConfig lookup
const ALL_ISSUES = [
  W2_BOX12_ISSUE, W2_EIN_ISSUE, DIV_COLLECTIBLES_ISSUE, DIV_NONDIV_ISSUE, WAGES_CONFIDENCE_ISSUE, CAPITAL_GAIN_NEW_ISSUE,
  IRS_EST_PENALTY_ISSUE, IRS_AMT_ISSUE, IRS_CAP_GAIN_WITHHOLDING_ISSUE,
  MISSING_PRIOR_AGI_ISSUE, MISSING_STATE_RETURN_ISSUE, MISSING_EST_PAYMENTS_ISSUE,
  OPT_W4_ISSUE, OPT_QBI_ISSUE, OPT_IRA_ISSUE,
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
  const reviewedCount = reviewedFields.size
  const progressPct = Math.round((reviewedCount / TOTAL_REVIEW_ITEMS) * 100)
  const allReviewed = reviewedCount >= TOTAL_REVIEW_ITEMS
  const [showCompletion, setShowCompletion] = useState(false)
  const prevAllReviewed = useRef(false)

  // Auto-trigger completion screen the moment all items become reviewed
  useEffect(() => {
    if (allReviewed && !prevAllReviewed.current) {
      // Brief delay so the "Reviewed" button state renders first
      const t = setTimeout(() => {
        setYoyDetailOpen(false)
        setIssueDetailOpen(null)
        setShowCompletion(true)
      }, 600)
      return () => clearTimeout(t)
    }
    prevAllReviewed.current = allReviewed
  }, [allReviewed])
  const [inputValue, setInputValue] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [importedDocsExpanded, setImportedDocsExpanded] = useState(false)
  const [yoyDetailOpen, setYoyDetailOpen] = useState(initialSubView === 'yoyDetail')
  const [yoyDetailClosing, setYoyDetailClosing] = useState(false)
  const [issueDetailOpen, setIssueDetailOpen] = useState<string | null>(null)
  const [issueDetailClosing, setIssueDetailClosing] = useState(false)
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false)
  const [questionnaireClosing, setQuestionnaireClosing] = useState(false)

  const handleOpenQuestionnaire = () => setQuestionnaireOpen(true)
  const handleCloseQuestionnaire = () => {
    setQuestionnaireClosing(true)
    setTimeout(() => { setQuestionnaireOpen(false); setQuestionnaireClosing(false) }, 220)
  }

  // ── Detail pane navigation ─────────────────────────────────
  const openDetail = (key: string) => {
    // Highlight the corresponding 1040 field when opening any issue detail
    const field = ISSUE_FIELD[key as IssueKey] ?? null
    onHighlightField?.(field)
    setIssueDetailOpen(key)
  }

  const handleCloseYoyDetail = () => {
    setYoyDetailClosing(true)
    onSubViewChange?.('overview')
    onHighlightField?.(null)  // clear 1040 highlight when closing
    setTimeout(() => { setYoyDetailOpen(false); setYoyDetailClosing(false) }, 200)
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
      if (currentKey === 'wages') {
        handleCloseYoyDetail()
        setTimeout(() => openDetail(nextKey), 220)
      } else {
        handleCloseIssueDetail()
        setTimeout(() => openDetail(nextKey), 220)
      }
    } else {
      // All done — close detail and show completion screen if all reviewed
      if (currentKey === 'wages') handleCloseYoyDetail()
      else handleCloseIssueDetail()
      setTimeout(() => setShowCompletion(true), 220)
    }
  }

  // Navigate to previous issue in guided order
  const handlePrev = (currentKey: string) => {
    const idx = GUIDED_ORDER.indexOf(currentKey as IssueKey)
    const prevKey = idx > 0 ? GUIDED_ORDER[idx - 1] : null
    if (!prevKey) return
    if (currentKey === 'wages') {
      handleCloseYoyDetail()
      setTimeout(() => openDetail(prevKey), 220)
    } else {
      handleCloseIssueDetail()
      setTimeout(() => openDetail(prevKey), 220)
    }
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

          {/* Imported Documents card */}
          <div className={styles.importedDocsCard}>
            <button
              className={styles.importedDocsHeader}
              onClick={() => setImportedDocsExpanded(v => !v)}
              aria-expanded={importedDocsExpanded}
            >
              <img src={importedDocsIcon} alt="" width={20} height={20} />
              <div className={styles.importedDocsContent}>
                <span className={styles.importedDocsLabel}>Imported documents</span>
                <Badge status="info" shape="rect">5</Badge>
              </div>
              <ChevronDown size="small" className={importedDocsExpanded ? styles.chevronUp : styles.chevron} />
            </button>

            {importedDocsExpanded && (
              <div className={styles.docList}>
                <div className={styles.docTableHeader}>
                  <span className={styles.docColDocument}>Document</span>
                  <span className={styles.docColConfidence}>
                    Confidence
                    <span className={styles.docConfidenceInfo} title="Scan confidence score">ⓘ</span>
                  </span>
                </div>
                <button className={styles.docRow} onClick={() => onNavigateToTab?.('prior-1040')}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}><Document size="medium" /></div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>1040-PriorYear-2024.pdf</span>
                      <span className={styles.docSub}>Form 1040 · 2 pages</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">100%</span>
                </button>
                <button className={styles.docRow} onClick={() => onNavigateToTab?.('w2s', 'techCircle')}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}><Document size="medium" /></div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>W2-TechCircle.pdf</span>
                      <span className={styles.docSub}>W-2 · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="low">72%</span>
                </button>
                <button className={styles.docRow} onClick={() => onNavigateToTab?.('1099-ints')}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}><Document size="medium" /></div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>1099-INT-UnwaveringFinancial.pdf</span>
                      <span className={styles.docSub}>1099-INT · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">91%</span>
                </button>
                <button className={styles.docRow} onClick={() => onNavigateToTab?.('1099-divs')}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}><Document size="medium" /></div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>1099-DIV-UnwaveringFinancial.pdf</span>
                      <span className={styles.docSub}>1099-DIV · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">94%</span>
                </button>
                <button className={styles.docRow} onClick={handleOpenQuestionnaire}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon} style={{ color: '#205ea3' }}><Document size="medium" /></div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>Client-Questionnaire.pdf</span>
                      <span className={styles.docSub}>Organizer · 10 responses</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">100%</span>
                </button>
              </div>
            )}
          </div>

          {/* Items to review scorecard */}
          <div className={styles.scoreCard}>
            <span className={styles.scoreTitle}>Items to review</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct || 5}%`, background: '#00856d', transition: 'width 400ms ease' }} />
            </div>
            <div className={styles.scoreCountRow}>
              <span className={styles.scoreCountNumber}>{TOTAL_REVIEW_ITEMS - reviewedCount}</span>
              <span className={styles.scoreCountLabel}>items remaining</span>
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
                        <button key={key} className={`${styles.findingInner} ${isReviewed ? styles.findingInnerReviewed : ''}`} onClick={() => onHighlightField?.(ISSUE_FIELD[key as IssueKey] ?? null)}>
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
                          </div>
                        </button>
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

      {/* ── YoY detail pane ── */}
      {(yoyDetailOpen || yoyDetailClosing) && (
        <YoYDetailPane
          closing={yoyDetailClosing}
          onClose={() => { handleCloseYoyDetail(); onClose?.() }}
          onBack={handleCloseYoyDetail}
          onViewW2={() => onViewW2?.('yoyDetail')}
          onReviewSource={onReviewSource ? () => { onReviewSource() } : undefined}
          onMarkReviewed={onMarkReviewed}
          reviewedCount={reviewedCount}
          totalItems={TOTAL_REVIEW_ITEMS}
          reviewedFields={reviewedFields}
          total1a={total1a}
          wages={wages}
          issueNumber={GUIDED_ORDER.indexOf('wages') + 1}
          category="YoY analysis"
          totalIssues={GUIDED_ORDER.length}
          onPrev={isFirstIssue('wages') ? undefined : () => handlePrev('wages')}
          onNext={isLastIssue('wages') ? undefined : () => handleNext('wages')}
          onOpenQuestionnaire={handleOpenQuestionnaire}
        />
      )}

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
              const field = (activeIssue as typeof TAXABLE_INTEREST_ISSUE).viewSourceField
              onNavigateToTab?.(
                activeIssue.viewSourceTab as 'w2s' | '1099-divs' | '1099-ints' | 'k1',
                (activeIssue as typeof SCAN_QUALITY_ISSUE).viewSourceSubTab,
                field ?? undefined
              )
              if (!field) onViewW2?.('overview')
            }}
            onMarkReviewed={onMarkReviewed}
            issueNumber={GUIDED_ORDER.indexOf(activeIssue.issueKey as IssueKey) + 1}
            category={activeIssue.category}
            totalIssues={GUIDED_ORDER.length}
            onPrev={isFirstIssue(activeIssue.issueKey) ? undefined : () => handlePrev(activeIssue.issueKey)}
            onNext={isLastIssue(activeIssue.issueKey) ? undefined : () => handleNext(activeIssue.issueKey)}
            onOpenQuestionnaire={handleOpenQuestionnaire}
          />
        )
      })()}

      {/* ── Questionnaire pane ── */}
      {(questionnaireOpen || questionnaireClosing) && (
        <QuestionnairePane
          closing={questionnaireClosing}
          onBack={handleCloseQuestionnaire}
        />
      )}

    </div>
  )
}
