import { useState, useEffect, useRef } from 'react'
import { Close, Plus, ChevronDown, ChevronRight, CircleCheck, Send } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import compareOthersIcon from '../../assets/icons/compare-others.svg'
import federalTaxesIcon from '../../assets/icons/federal-taxes.svg'
import scannerIcon from '../../assets/icons/scanner.svg'
import IssueDetailPane, { type IssueAction, type IssueSourceCard } from './IssueDetailPane'
import Tooltip from './Tooltip'
import { FROZEN_RETURN } from '../../data/frozenReturn'
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { computeLiveReturn, SEED_AMOUNTS } from '../../data/liveReturn'
import { RETURN_SUMMARY_INSIGHTS } from './phase1FlagMessages'
import {
  getPhase2Progress,
  getOutstandingImportMismatches,
  PHASE2_DIAGNOSTIC_ORDER,
  SAFE_HARBOR_2024,
  type Phase2IssueKey,
} from './phase2FlagSync'
import type { QuestionnaireResponseId } from './questionnaireData'
import type { TopTab } from './ReviewTab'
import styles from '../../styles/data-review/AgentReportPane.module.css'

export const TOTAL_REVIEW_ITEMS = PHASE2_DIAGNOSTIC_ORDER.length
export const GUIDED_ORDER = PHASE2_DIAGNOSTIC_ORDER
type IssueKey = Phase2IssueKey

type NavigateTab = TopTab | undefined

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
  onNavigateToTab?: (
    tab?: NavigateTab,
    subTab?: 'techCircle',
    field?: string,
    questionnaireResponseId?: QuestionnaireResponseId,
    /** preview = document source panel; details = focus/highlight Details input */
    focus?: 'preview' | 'details',
  ) => void
  onHighlightField?: (field: string | null) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  liveTotals?: LiveReturnTotals
  amounts?: LiveAmounts
  /** Open an output form / schedule in the left panel (Sch C, 8960, …) */
  onOpenForm?: (formLabel: string) => void
}

const REPORT_CARDS = [
  { label: 'Filing stoppers', keys: ['importMismatches'], badgeColor: 'red' as const, position: 'first' },
  { label: 'Compliance', keys: ['underpaymentRisk', 'necScheduleC', 'niitForm8960'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Planning opportunities', keys: ['optItemize'], badgeColor: 'blue' as const, position: 'last' },
]

const CARD_ICONS = [
  <img src={compareOthersIcon} alt="" width={20} height={20} />,
  <img src={scannerIcon} alt="" width={20} height={20} />,
  <img src={federalTaxesIcon} alt="" width={20} height={20} />,
]

const fmtUsd = (n: number) => `$${n.toLocaleString()}`

type IssueCard = {
  issueKey: IssueKey
  dotColor: 'red' | 'orange' | 'blue'
  title: string
  category: string
  summary: string
  taxImpact: string
  rootCause: string
  clientResponseNote?: string
  questionnaireResponseId?: QuestionnaireResponseId
  tableRows: { label: string; cols: string[]; total?: boolean; badge?: 'red' | 'orange' | 'grey' | 'green' | 'blue' }[]
  tableHeaders: string[]
  suggestedActions: string[]
  actions: IssueAction[]
  sources: IssueSourceCard[]
  /** Default destination for reviewSource / goToInput when action omits overrides */
  viewSourceTab?: NavigateTab
  viewSourceSubTab?: 'techCircle'
  viewSourceField?: string
  /** When true, goToInput highlights Summary only (no source-tab switch) */
  summaryOnlyGoToInput?: boolean
}

function buildImportMismatchesIssue(amounts: LiveAmounts): IssueCard {
  const gaps = getOutstandingImportMismatches(amounts)
  const first = gaps[0]
  return {
    issueKey: 'importMismatches',
    dotColor: 'red',
    title:
      gaps.length === 0
        ? 'Import accuracy: no remaining input↔source gaps'
        : `${gaps.length} input↔source mismatch${gaps.length === 1 ? '' : 'es'} still on the return`,
    category: 'Filing stoppers',
    summary:
      gaps.length === 0
        ? 'Source-document amounts and input fields match. No outstanding import accuracy gaps.'
        : 'These fields still disagree with the source documents — including items that may have been marked correct in Phase 1 without fixing the amount, plus silent import gaps.',
    taxImpact:
      'Filing with uncorrected import mismatches can understate income, withholding, or identity data and trigger notices or amended returns.',
    rootCause:
      'OCR / import mapped some values incorrectly, dropped withholding, or planted state data that is not on the PDF. Confirm each row against the source preview.',
    tableRows: gaps.slice(0, 6).map((g, i) => ({
      label: g.label,
      cols: [g.returnValue, g.sourceValue, 'Fix'],
      badge: (i === 0 ? 'red' : 'orange') as 'red' | 'orange',
      total: i === gaps.length - 1 || i === 5,
    })),
    tableHeaders: ['Field', 'On return', 'On source', ''],
    suggestedActions: [
      'Open each listed field and compare to the source document preview.',
      'Correct amounts that disagree with the source, or enter missing identity fields.',
      ...(gaps.some(g => g.id === 'taxablePension' || g.id === 'rWithholding')
        ? [
            'IRA / 1099-R tip: Box 1 is the gross distribution; Box 2a is the taxable amount that flows to Form 1040 line 4b — they often differ when basis or rollovers apply.',
            'IRA / 1099-R tip: Confirm Box 4 federal withholding is on the return; missing withholding is a common underpayment trigger.',
            'IRA / 1099-R tip: Check Box 7 distribution code (e.g. 7 = normal distribution). Early-withdrawal codes may need Form 5329.',
          ]
        : []),
    ],
    actions: first
      ? [
          {
            type: 'goToInput',
            label: 'Go to first mismatch',
            tab: first.tab as IssueAction['tab'],
            field: first.field,
          },
        ]
      : [{ type: 'goToInput', label: 'Go to wages', tab: 'w2s', field: 'wages' }],
    sources: [
      {
        id: 'irs-accuracy',
        sourceName: 'IRS.gov',
        title: 'Check your return carefully',
        description:
          'Compare every imported amount to the paper or PDF source before filing. Common gaps include wages, withholding, and state boxes that do not belong on the form.',
        meta: 'Import accuracy',
        href: 'https://www.irs.gov/individuals/check-your-tax-return',
      },
    ],
    viewSourceTab: (first?.tab as IssueCard['viewSourceTab']) ?? 'w2s',
    viewSourceField: first?.field ?? 'wages',
  }
}

const NIIT_FORM8960_ISSUE: IssueCard = {
  issueKey: 'niitForm8960',
  dotColor: 'orange',
  title: 'Review Form 8960 — Net Investment Income Tax',
  category: 'Compliance',
  summary: RETURN_SUMMARY_INSIGHTS.niit,
  taxImpact:
    'At AGI above $200,000 for single filers, net investment income may be subject to the 3.8% NIIT on Form 8960. Confirm the form amounts match interest and dividends on the return.',
  rootCause: `Investment income is substantial: ${fmtUsd(FROZEN_RETURN.taxableInterest)} taxable interest, ${fmtUsd(FROZEN_RETURN.ordinaryDivs)} ordinary dividends, and ${fmtUsd(FROZEN_RETURN.qualifiedDivs)} qualified dividends. Form 8960 is already on the return — verify the NIIT computation.`,
  tableRows: [
    { label: 'AGI (line 11)', cols: [fmtUsd(FROZEN_RETURN.totalIncome), 'Above $200k', ''], badge: 'orange', total: false },
    { label: 'Form 8960', cols: ['On return', 'Review NIIT lines', '✓'], badge: 'blue', total: true },
  ],
  tableHeaders: ['Item', 'Status', 'Note', ''],
  suggestedActions: [
    'Open Form 8960 and confirm NIIT lines match taxable interest and dividends.',
    'Cross-check qualified vs. ordinary dividend classifications on the 1099-DIVs.',
    'Mark this issue reviewed once the form looks correct.',
  ],
  actions: [
    {
      type: 'openForm',
      label: 'Open Form 8960',
    },
    {
      type: 'goToInput',
      label: 'Go to investment income',
      field: 'ordinaryDivs',
      menuItems: [
        { label: 'Taxable interest (1099-INT)', tab: '1099-ints', field: 'taxableInterest' },
        { label: 'Ordinary dividends (1099-DIV)', tab: '1099-divs', field: 'ordinaryDivs' },
        { label: 'Qualified dividends (1099-DIV)', tab: '1099-divs', field: 'qualifiedDivs' },
        { label: 'Summary — investment lines', field: 'ordinaryDivs', summaryOnly: true },
      ],
    },
  ],
  sources: [
    {
      id: 'irs-form-8960',
      sourceName: 'Form 8960',
      title: 'Net Investment Income Tax (NIIT)',
      description:
        'Individuals with modified AGI above the filing-status threshold may owe an additional 3.8% tax on net investment income. Form 8960 computes that tax when interest, dividends, and other NII apply.',
      meta: 'IRS.gov · About Form 8960',
      href: 'https://www.irs.gov/forms-pubs/about-form-8960',
    },
  ],
  // Summary CY investment lines only — never prior-1040
  viewSourceField: 'ordinaryDivs',
  summaryOnlyGoToInput: false,
}

function buildUnderpaymentRiskIssue(live: LiveReturnTotals): IssueCard {
  const shortfall = Math.max(0, SAFE_HARBOR_2024 - live.totalWithholding)
  return {
    issueKey: 'underpaymentRisk',
    dotColor: 'orange',
    title: 'Underpayment risk: low withholding and no estimated payments',
    category: 'Compliance',
    summary: `Combined federal withholding is ${fmtUsd(live.totalWithholding)} against ${fmtUsd(live.totalTax)} total tax. Line 26 shows $0 estimated payments. Jessica's Tax Organizer says she did not make quarterly 1040-ES payments.`,
    taxImpact: RETURN_SUMMARY_INSIGHTS.estTaxPenalty,
    rootCause: `Withholding covers ${Math.round((live.totalWithholding / live.totalTax) * 100)}% of tax and is below the ${fmtUsd(SAFE_HARBOR_2024)} safe harbor (110% of 2024 tax). Client confirmed no ES payments were made.`,
    clientResponseNote:
      'Jessica Drake (Mar 2, 2025): "No. I didn\'t make any estimated payments this year. I figured my W-2 and 1099 withholding would cover everything like usual."',
    questionnaireResponseId: 'estimatedPayments',
    tableRows: [
      { label: 'Federal withholding (25a + 25b)', cols: [fmtUsd(live.totalWithholding), 'On return', ''], badge: 'orange', total: false },
      { label: '2025 estimated payments (line 26)', cols: ['$0', 'Client: none', '!'], badge: 'orange', total: false },
      { label: 'Safe harbor shortfall', cols: [fmtUsd(shortfall), 'Form 2210', '!'], badge: 'red', total: true },
    ],
    tableHeaders: ['Item', 'Amount', 'Status', ''],
    suggestedActions: [
      'Restore or confirm DIV / 1099-R withholding on the return.',
      'IRA tip: Meridian 1099-R Box 4 should show $30,000 federal withholding — confirm it posted to the return.',
      'Review Form 2210 for underpayment penalty exposure.',
      'Confirm the Tax Organizer "no ES payments" answer matches her records.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to DIV withholding', tab: '1099-divs', field: 'fedTaxWithheld' },
      { type: 'goToInput', label: 'Go to 1099-R withholding', tab: '1099-rs', field: 'withholding1099' },
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'estimatedPayments' },
      {
        type: 'openForm',
        label: 'Open Form 2210',
      },
    ],
    sources: [
      {
        id: 'irs-form-2210',
        sourceName: 'Form 2210',
        title: 'Underpayment of Estimated Tax by Individuals',
        description:
          'Taxpayers generally must pay tax as they earn income through withholding or estimated payments. Form 2210 figures the underpayment penalty when payments fall short of safe-harbor rules.',
        meta: 'IRS.gov · About Form 2210',
        href: 'https://www.irs.gov/forms-pubs/about-form-2210',
      },
    ],
    viewSourceTab: '1099-divs',
    viewSourceField: 'fedTaxWithheld',
  }
}

function buildNecScheduleCIssue(): IssueCard {
  return {
    issueKey: 'necScheduleC',
    dotColor: 'orange',
    title: '1099-NEC income without Schedule C or expenses',
    category: 'Compliance',
    summary:
      'Summit Advisory Partners 1099-NEC nonemployee compensation is on the return, but no Schedule C or business expenses are applied. Jessica reported she had deductible expenses for that work.',
    taxImpact:
      'Reporting NEC income without Schedule C can misstate self-employment tax and miss ordinary-and-necessary expense deductions.',
    rootCause:
      'Packet includes a 1099-NEC, but the return has no business schedule. Client said she had software, supplies, and travel expenses and is unsure what to claim.',
    clientResponseNote:
      'Jessica Drake (Mar 5, 2025): "Yes. I had expenses for software, home office supplies, and some travel… Nothing for expenses is on the return yet."',
    questionnaireResponseId: 'necExpenses',
    tableRows: [
      { label: '1099-NEC (Summit)', cols: ['On return', 'Box 1', '!'], badge: 'orange', total: false },
      { label: 'Schedule C / expenses', cols: ['Missing', 'Client has costs', '!'], badge: 'red', total: true },
    ],
    tableHeaders: ['Item', 'Status', 'Note', ''],
    suggestedActions: [
      'Open the 1099-NEC and confirm Box 1 income.',
      'Ask for receipt detail, then add Schedule C expenses if deductible.',
      'Review the Tax Organizer NEC expenses response.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to NEC income', tab: '1099-necs', field: 'nec-box1' },
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'necExpenses' },
      {
        type: 'openForm',
        label: 'Open Schedule C',
      },
    ],
    sources: [
      {
        id: 'irs-schedule-c',
        sourceName: 'Schedule C',
        title: 'Profit or Loss From Business (Sole Proprietorship)',
        description:
          'Self-employment and nonemployee compensation generally belong on Schedule C. Ordinary and necessary business expenses (software, supplies, travel) reduce net profit and self-employment tax.',
        meta: 'IRS.gov · About Schedule C',
        href: 'https://www.irs.gov/forms-pubs/about-schedule-c-form-1040',
      },
    ],
    viewSourceTab: '1099-necs',
    viewSourceField: 'nec-box1',
  }
}

const OPT_ITEMIZE_ISSUE: IssueCard = {
  issueKey: 'optItemize',
  dotColor: 'blue',
  title: 'Standard deduction vs itemizing: mortgage interest',
  category: 'Planning opportunities',
  summary:
    'The return is on the standard deduction, but Jessica said she owns a home, pays mortgage interest, and may have an unuploaded Form 1098. Itemizing could reduce taxable income.',
  taxImpact:
    'If mortgage interest (plus other itemized amounts) exceeds the single standard deduction, Schedule A can lower tax. Confirm Form 1098 before deciding.',
  rootCause:
    'No Form 1098 is in the import packet. Tax Organizer confirms mortgage interest was paid in 2025; the exact amount still needs the 1098.',
  clientResponseNote:
    'Jessica Drake (Feb 28, 2025): "Yes. I own my home and paid mortgage interest in 2025… I think I got a Form 1098 from my lender but I haven\'t uploaded it yet."',
  questionnaireResponseId: 'mortgage',
  tableRows: [
    { label: 'Deduction method', cols: ['Standard', 'On return', ''], badge: 'blue', total: false },
    { label: 'Form 1098 / mortgage interest', cols: ['Not uploaded', 'Client confirmed', '?'], badge: 'orange', total: true },
  ],
  tableHeaders: ['Item', 'Status', 'Note', ''],
  suggestedActions: [
    'Request Form 1098 and compare interest + taxes to the standard deduction.',
    'Review the Tax Organizer mortgage response with Jessica.',
    'If itemizing wins, switch to Schedule A before filing.',
  ],
  actions: [
    { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'mortgage' },
    { type: 'goToInput', label: 'Go to deductions', field: 'stdDeduction' },
    {
      type: 'openForm',
      label: 'Open Schedule A',
    },
  ],
  sources: [
    {
      id: 'irs-topic-501',
      sourceName: 'Tax Topic 501',
      title: 'Should I itemize?',
      description:
        'Compare the standard deduction to itemized amounts such as mortgage interest, state and local taxes, and charitable gifts. If itemized deductions are higher, Schedule A usually produces a lower tax.',
      meta: 'IRS.gov · Topic 501',
      href: 'https://www.irs.gov/taxtopics/tc501',
    },
  ],
  viewSourceField: 'stdDeduction',
  summaryOnlyGoToInput: true,
}

export const ISSUE_FIELD: Partial<Record<IssueKey, string>> = {
  importMismatches: 'wages',
  niitForm8960: 'ordinaryDivs',
  underpaymentRisk: 'fedTaxWithheld',
  necScheduleC: 'nec-box1',
  optItemize: 'stdDeduction',
}

function buildAllIssues(live: LiveReturnTotals, amounts: LiveAmounts): IssueCard[] {
  return [
    buildImportMismatchesIssue(amounts),
    buildUnderpaymentRiskIssue(live),
    buildNecScheduleCIssue(),
    NIIT_FORM8960_ISSUE,
    OPT_ITEMIZE_ISSUE,
  ]
}

export default function AgentReportPane({
  onClose,
  onYoyToggle,
  onMarkReviewed,
  reviewedFields = new Map(),
  closing = false,
  embedded = false,
  onNavigateToTab,
  onHighlightField,
  liveTotals,
  amounts = SEED_AMOUNTS,
  onOpenForm,
}: AgentReportPaneProps) {
  const live = liveTotals ?? computeLiveReturn(amounts)
  const ALL_ISSUES = buildAllIssues(live, amounts)
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
  const [expandedCard, setExpandedCard] = useState<string | null>('Filing stoppers')
  const [issueDetailOpen, setIssueDetailOpen] = useState<string | null>(null)
  const [issueDetailClosing, setIssueDetailClosing] = useState(false)

  const handleSend = () => {
    if (!inputValue.trim()) return
    setInputValue('')
  }

  useEffect(() => {
    if (allReviewed && !prevAllReviewed.current) {
      const t = setTimeout(() => {
        setIssueDetailOpen(null)
        setShowCompletion(true)
      }, 600)
      return () => clearTimeout(t)
    }
    prevAllReviewed.current = allReviewed
  }, [allReviewed])

  useEffect(() => {
    if (issueDetailOpen && !activeOrder.includes(issueDetailOpen as IssueKey)) {
      setIssueDetailOpen(null)
      onHighlightField?.(null)
    }
  }, [activeOrder, issueDetailOpen, onHighlightField])

  const openDetail = (key: string) => {
    const field = ISSUE_FIELD[key as IssueKey] ?? null
    onHighlightField?.(field)
    setIssueDetailOpen(key)
  }

  const handleCloseIssueDetail = () => {
    setIssueDetailClosing(true)
    onHighlightField?.(null)
    setTimeout(() => { setIssueDetailOpen(null); setIssueDetailClosing(false) }, 200)
  }

  const handleNext = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const nextKey = idx >= 0 && idx < activeOrder.length - 1 ? activeOrder[idx + 1] : null
    if (nextKey) {
      handleCloseIssueDetail()
      setTimeout(() => openDetail(nextKey), 220)
    } else {
      handleCloseIssueDetail()
      setTimeout(() => setShowCompletion(true), 220)
    }
  }

  const handlePrev = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const prevKey = idx > 0 ? activeOrder[idx - 1] : null
    if (!prevKey) return
    handleCloseIssueDetail()
    setTimeout(() => openDetail(prevKey), 220)
  }

  const isLastIssue = (key: string) => activeOrder.indexOf(key as IssueKey) === activeOrder.length - 1
  const isFirstIssue = (key: string) => activeOrder.indexOf(key as IssueKey) === 0

  const handleCardClick = (label: string) => {
    setExpandedCard(prev => {
      const next = prev === label ? null : label
      onYoyToggle?.(false)
      return next
    })
  }

  const getIssueConfig = (key: string) => ALL_ISSUES.find(i => i.issueKey === key) ?? null
  const activeIssue = issueDetailOpen ? getIssueConfig(issueDetailOpen) : null

  const navigateFromAction = (action?: IssueAction, fallback?: {
    tab?: NavigateTab
    field?: string
    questionnaireResponseId?: QuestionnaireResponseId
    summaryOnly?: boolean
    focus?: 'preview' | 'details'
  }) => {
    const tab = (action?.tab as NavigateTab | undefined) ?? fallback?.tab
    const field = action?.field ?? fallback?.field
    const qId = (action?.questionnaireResponseId as QuestionnaireResponseId | undefined)
      ?? fallback?.questionnaireResponseId
    // Per-action summaryOnly (e.g. "Summary — investment lines") wins over issue default
    const summaryOnly = Boolean(action?.summaryOnly || (fallback?.summaryOnly && !tab))
    // reviewSource → document preview; goToInput → Details field focus
    const focus: 'preview' | 'details' =
      fallback?.focus
      ?? (action?.type === 'reviewSource' ? 'preview' : 'details')

    if (summaryOnly && field) {
      // Highlight Summary only — never switch source tabs (avoids sticky prior-1040)
      onHighlightField?.(field)
      onNavigateToTab?.(undefined, undefined, field, undefined, 'details')
      return
    }

    if (action?.type === 'viewClientResponse' || tab === 'questionnaire') {
      onNavigateToTab?.(
        'questionnaire',
        undefined,
        undefined,
        qId ?? activeIssue?.questionnaireResponseId,
      )
      return
    }

    // Preview CTAs open the source doc; Details CTAs require a field target
    const navField = focus === 'preview' ? undefined : field
    onNavigateToTab?.(tab, activeIssue?.viewSourceSubTab, navField, qId, focus)
  }

  return (
    <div className={`${embedded ? styles.panelEmbedded : styles.panel} ${closing && !embedded ? styles.panelClosing : ''}`}>

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

      <div className={styles.pane}>
        <div className={styles.chat}>

          <p className={styles.agentMessage}>
            Filing stoppers, compliance checks, and opportunities for this return.
          </p>

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

          {allReviewed && showCompletion && (
            <div className={styles.completionScreen}>
              <div className={styles.completionHeader}>
                <span className={styles.completionCheckIcon}><CircleCheck size="small" /></span>
                <span className={styles.completionTitle}>Review complete</span>
              </div>
              <p className={styles.completionBody}>
                All {totalActive} diagnostics reviewed. This return is ready to move forward.
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
                            <Tooltip text={isReviewed && signOff
                              ? `Reviewed · ${signOff.by} · ${signOff.at}`
                              : (isReviewed ? 'Click to unmark' : 'Mark as reviewed')}>
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

      <div className={styles.inputArea}>
        <div className={styles.inputFade} />
        <div className={styles.inputBox}>
          <div className={styles.inputTextField}>
            <textarea
              className={styles.textarea}
              placeholder="Ask anything"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <div className={styles.inputActionsLeft}>
              <button className={styles.attachBtn} aria-label="Attach"><Plus size="medium" /></button>
            </div>
            <div className={styles.inputActionsRight}>
              <button
                type="button"
                className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
                aria-label="Send"
                disabled={!inputValue.trim()}
                onClick={handleSend}
              >
                <Send size="medium" />
              </button>
            </div>
          </div>
        </div>
        <span className={styles.legal}>Important information about how we use generative AI</span>
      </div>

      {(!!issueDetailOpen || issueDetailClosing) && activeIssue && (
        <IssueDetailPane
          closing={issueDetailClosing}
          issueKey={activeIssue.issueKey}
          dotColor={activeIssue.dotColor}
          title={activeIssue.title}
          summary={activeIssue.summary}
          taxImpact={activeIssue.taxImpact}
          rootCause={activeIssue.rootCause}
          clientResponseNote={activeIssue.clientResponseNote}
          tableRows={activeIssue.tableRows}
          tableHeaders={activeIssue.tableHeaders}
          suggestedActions={activeIssue.suggestedActions}
          actions={activeIssue.actions}
          sources={activeIssue.sources}
          reviewedCount={reviewedCount}
          totalItems={totalActive}
          reviewedFields={reviewedFields}
          onBack={handleCloseIssueDetail}
          onClose={() => { handleCloseIssueDetail(); onClose?.() }}
          onGoToInput={(action) => {
            navigateFromAction(action, {
              tab: activeIssue.summaryOnlyGoToInput ? undefined : activeIssue.viewSourceTab,
              field: action?.field ?? activeIssue.viewSourceField,
              summaryOnly: activeIssue.summaryOnlyGoToInput,
              focus: 'details',
            })
          }}
          onViewSource={(action) => {
            navigateFromAction(action, {
              tab: activeIssue.viewSourceTab,
              // Preview-first: do not pin a Details field unless the action asks for one
              field: action?.field,
              focus: 'preview',
            })
          }}
          onViewClientResponse={(action) => {
            navigateFromAction(action, {
              tab: 'questionnaire',
              questionnaireResponseId: activeIssue.questionnaireResponseId,
            })
          }}
          onOpenForm={(action) => {
            onOpenForm?.(action?.label ?? 'Open Form 1040')
          }}
          onMarkReviewed={onMarkReviewed}
          issueNumber={activeOrder.indexOf(activeIssue.issueKey as IssueKey) + 1}
          category={activeIssue.category}
          totalIssues={activeOrder.length}
          onPrev={isFirstIssue(activeIssue.issueKey) ? undefined : () => handlePrev(activeIssue.issueKey)}
          onNext={isLastIssue(activeIssue.issueKey) ? undefined : () => handleNext(activeIssue.issueKey)}
        />
      )}

    </div>
  )
}
