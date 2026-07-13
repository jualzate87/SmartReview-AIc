import type { TopTab } from '../pages/data-review/ReviewTab'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'

/** Single imported source document in Jessica Drake's TY 2025 return. */
export type SourceDocument = {
  id: string
  formType: string
  label: string
  payer: string
  tab: TopTab
  subTab?: W2Employer | DivPayer | IntPayer | 'meridian' | 'summit'
}

/** All source documents — single source of truth for document lists and tax control. */
export const SOURCE_DOCUMENTS: SourceDocument[] = [
  { id: 'w2-techCircle',       formType: 'W-2',      label: 'W-2 — Tech Circle Inc',              payer: 'Tech Circle Inc',              tab: 'w2s',       subTab: 'techCircle' },
  { id: '1099-div-token',      formType: '1099-DIV', label: '1099-DIV — Token Financial',         payer: 'Token Financial',              tab: '1099-divs', subTab: 'tokenFinancial' },
  { id: '1099-div-northmark',  formType: '1099-DIV', label: '1099-DIV — Northmark Index Funds',   payer: 'Northmark Index Funds',        tab: '1099-divs', subTab: 'northmarkIndex' },
  { id: '1099-div-beacon',     formType: '1099-DIV', label: '1099-DIV — Beacon Dividend Trust',   payer: 'Beacon Dividend Trust',        tab: '1099-divs', subTab: 'beaconDividend' },
  { id: '1099-int-unwavering', formType: '1099-INT', label: '1099-INT — Unwavering Financial',    payer: 'Unwavering Financial LLC',     tab: '1099-ints', subTab: 'unwaverIngFinancial' },
  { id: '1099-int-harborline', formType: '1099-INT', label: '1099-INT — Harborline Credit Union', payer: 'Harborline Credit Union',      tab: '1099-ints', subTab: 'harborlineCredit' },
  { id: '1099-int-cascade',    formType: '1099-INT', label: '1099-INT — Cascade Federal Savings', payer: 'Cascade Federal Savings',      tab: '1099-ints', subTab: 'cascadeFederal' },
  { id: '1099-r-meridian',     formType: '1099-R',   label: '1099-R — Meridian Retirement Trust', payer: 'Meridian Retirement Trust',    tab: '1099-rs',   subTab: 'meridian' },
  { id: '1099-nec-summit',     formType: '1099-NEC', label: '1099-NEC — Summit Advisory Partners', payer: 'Summit Advisory Partners LLC', tab: '1099-necs', subTab: 'summit' },
]

/** Per-document default values for tax control reconciliation (source doc box values). */
export type TaxControlDocEntry = {
  docId: string
  label: string
  /** Hint value shown as placeholder — actual source doc amount */
  hint?: number
}

export type TaxControlRowConfig = {
  id: string
  /** Box number shown in the Line column — matches detail input panel labels */
  box: string
  label: string
  desc: string
  /** Contributing source documents for multi-doc popover */
  docs: TaxControlDocEntry[]
  /** 1040 line reference (shown in description only for total rows) */
  form1040Line?: string
  isTotalRow?: boolean
  isBlank?: boolean
  sourceTab?: string
}

/** Resolve a source document id → tab + payer/sub-tab for navigation. */
export function navigationForSourceDoc(docId: string): {
  tab: TopTab
  subTab?: W2Employer
  divPayer?: DivPayer
  intPayer?: IntPayer
} | null {
  const doc = SOURCE_DOCUMENTS.find(d => d.id === docId)
  if (!doc) return null
  if (doc.tab === 'w2s') {
    return { tab: doc.tab, subTab: doc.subTab as W2Employer }
  }
  if (doc.tab === '1099-divs') {
    return { tab: doc.tab, divPayer: doc.subTab as DivPayer }
  }
  if (doc.tab === '1099-ints') {
    return { tab: doc.tab, intPayer: doc.subTab as IntPayer }
  }
  return { tab: doc.tab }
}

/** Parse comma-formatted currency string to number. */
export function parseCurrency(raw: string): number | null {
  if (!raw || raw.trim() === '') return null
  const parsed = parseFloat(raw.replace(/[,$]/g, ''))
  return isNaN(parsed) ? null : parsed
}

export const TAX_CONTROL_ROWS: TaxControlRowConfig[] = [
  {
    id: 'wages',
    box: '1',
    label: 'Wages',
    desc: 'Box 1 (wages, tips, other compensation) from all W-2s',
    docs: [{ docId: 'w2-techCircle', label: 'Tech Circle Inc', hint: 148940 }],
    sourceTab: 'wages',
  },
  {
    id: 'interest',
    box: '1',
    label: 'Interest',
    desc: 'Box 1 (interest income) from all 1099-INTs',
    docs: [
      { docId: '1099-int-unwavering', label: 'Unwavering Financial', hint: 1986 },
      { docId: '1099-int-harborline', label: 'Harborline Credit Union', hint: 3200 },
      { docId: '1099-int-cascade', label: 'Cascade Federal Savings', hint: 1150 },
    ],
    sourceTab: 'taxableInterest',
  },
  {
    id: 'dividends',
    box: '1a',
    label: 'Dividends',
    desc: 'Box 1a (total ordinary dividends) from all 1099-DIVs',
    docs: [
      { docId: '1099-div-token', label: 'Token Financial', hint: 331250 },
      { docId: '1099-div-northmark', label: 'Northmark Index Funds', hint: 12400 },
      { docId: '1099-div-beacon', label: 'Beacon Dividend Trust', hint: 6750 },
    ],
    sourceTab: 'ordinaryDivs',
  },
  {
    id: 'qualDivs',
    box: '1b',
    label: 'Qualified divs',
    desc: 'Box 1b (qualified dividends) from all 1099-DIVs',
    docs: [
      { docId: '1099-div-token', label: 'Token Financial', hint: 187500 },
      { docId: '1099-div-northmark', label: 'Northmark Index Funds', hint: 8000 },
      { docId: '1099-div-beacon', label: 'Beacon Dividend Trust', hint: 4200 },
    ],
    sourceTab: 'qualifiedDivs',
  },
  {
    id: 'ira',
    box: '2a',
    label: 'IRA / pension',
    desc: 'Box 2a (taxable amount) from all 1099-Rs',
    docs: [{ docId: '1099-r-meridian', label: 'Meridian Retirement Trust (1099-R)', hint: 100000 }],
    sourceTab: 'iraDistrib',
  },
  {
    id: 'totalIncome',
    box: '9',
    label: 'Total income',
    desc: 'Form 1040 line 9 — sum of all income lines',
    docs: [],
    form1040Line: '9',
    isTotalRow: true,
  },
  {
    id: 'stdDeduction',
    box: '12',
    label: 'Standard deduction',
    desc: 'Form 1040 line 12 — deduction for filing status Single: $15,750 for 2025',
    docs: [],
    form1040Line: '12',
  },
  {
    id: 'taxableIncome',
    box: '15',
    label: 'Taxable income',
    desc: 'Form 1040 line 15 — total income minus deductions',
    docs: [],
    form1040Line: '15',
    isTotalRow: true,
  },
  {
    id: 'totalTax',
    box: '24',
    label: 'Total tax',
    desc: 'Form 1040 line 24 — tax on taxable income per IRS tables',
    docs: [],
    form1040Line: '24',
    isTotalRow: true,
  },
  {
    id: 'withholdingW2',
    box: '2',
    label: 'W-2 withholding',
    desc: 'Box 2 (federal income tax withheld) from all W-2s',
    docs: [{ docId: 'w2-techCircle', label: 'Tech Circle Inc', hint: 15840 }],
    sourceTab: 'withholding',
  },
  {
    id: 'withholding99',
    box: '4',
    label: '1099 withholding',
    desc: 'Box 4 (federal income tax withheld) from all 1099s',
    docs: [
      { docId: '1099-div-token', label: 'Token Financial (1099-DIV)', hint: 26363 },
      { docId: '1099-r-meridian', label: 'Meridian Retirement Trust (1099-R)', hint: 30000 },
      { docId: '1099-nec-summit', label: 'Summit Advisory Partners (1099-NEC)', hint: 0 },
    ],
    sourceTab: 'withholding1099',
  },
  {
    id: 'totalPayments',
    box: '33',
    label: 'Total payments',
    desc: 'Form 1040 line 33 — sum of all federal tax withheld',
    docs: [],
    form1040Line: '33',
    isTotalRow: true,
  },
  {
    id: 'amountOwed',
    box: '37',
    label: 'Amount owed',
    desc: 'Form 1040 line 37 — total tax minus total payments',
    docs: [],
    form1040Line: '37',
    isTotalRow: true,
  },
]

/** Map control row id → system value from live return data. */
export function getControlSystemValues(params: {
  total1a: number
  taxableInterest: number
  ordinaryDivs: number
  qualifiedDivs: number
  totalIncome: number
  stdDeduction: number
  taxableIncome: number
  totalTax: number
  w2Withholding: number
  /** Combined 1099 withholding (DIV + 1099-R + …) for line 25b / tax control */
  divWithholding: number
  totalWithholding: number
  oweAmount: number
  taxablePension: number
  /** Line 8 other income (NEC) when confirmed onto the return */
  otherIncome?: number
}): Record<string, number | null> {
  return {
    wages: params.total1a,
    interest: params.taxableInterest,
    dividends: params.ordinaryDivs,
    qualDivs: params.qualifiedDivs,
    ira: params.taxablePension,
    otherIncome: params.otherIncome ?? 0,
    totalIncome: params.totalIncome,
    stdDeduction: params.stdDeduction,
    taxableIncome: params.taxableIncome,
    totalTax: params.totalTax,
    withholdingW2: params.w2Withholding,
    withholding99: params.divWithholding,
    totalPayments: params.totalWithholding,
    amountOwed: params.oweAmount,
  }
}
