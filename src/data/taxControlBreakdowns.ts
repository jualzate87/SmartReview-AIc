import { FROZEN_RETURN } from './frozenReturn'
import { TAX_CONTROL_ROWS, type TaxControlRowConfig } from './sourceDocuments'

export type BreakdownComponent = {
  label: string
  value: number
  /** Shown before the value in the formula list */
  operator?: '+' | '−' | '='
}

export type TaxControlBreakdown = {
  rowId: string
  title: string
  /** Short formula description shown under the title */
  formula: string
  components: BreakdownComponent[]
  total: number
  totalLabel: string
  /** Optional note (e.g. filing-status lookup, tax table) */
  footnote?: string
  kind: 'source' | 'calc'
}

export type ControlSystemValues = Record<string, number | null>

function fmt(n: number) {
  return n.toLocaleString()
}

function rowConfig(id: string): TaxControlRowConfig {
  return TAX_CONTROL_ROWS.find(r => r.id === id)!
}

/** Source-document breakdown — lists each contributing doc and the return total. */
function sourceBreakdown(
  rowId: string,
  systemVals: ControlSystemValues,
): TaxControlBreakdown | null {
  const cfg = rowConfig(rowId)
  const total = systemVals[rowId]
  if (total === null || cfg.docs.length === 0) return null

  const docCount = cfg.docs.length
  const formLabel = cfg.box ? `Box ${cfg.box}` : cfg.label

  return {
    rowId,
    title: cfg.label,
    formula:
      docCount === 1
        ? `${formLabel} from ${cfg.docs[0].label}`
        : `${formLabel} from ${docCount} source documents`,
    components: cfg.docs.map((doc, i) => ({
      label: doc.label,
      value: doc.hint ?? 0,
      operator: i === 0 ? '=' : '+',
    })),
    total,
    totalLabel: 'On return (system)',
    footnote:
      docCount > 1
        ? `Source document total may differ from the return when amounts were adjusted during import.`
        : undefined,
    kind: 'source',
  }
}

/** Build a read-only calculation / source breakdown for any tax control row. */
export function getTaxControlBreakdown(
  rowId: string,
  systemVals: ControlSystemValues,
): TaxControlBreakdown | null {
  const v = (id: string) => systemVals[id] ?? 0

  switch (rowId) {
    case 'wages':
    case 'interest':
    case 'dividends':
    case 'qualDivs':
    case 'ira':
    case 'withholdingW2':
    case 'withholding99':
      return sourceBreakdown(rowId, systemVals)

    case 'totalIncome': {
      const components: BreakdownComponent[] = [
        { label: 'Line 1z — Wages (1a–1h)', value: v('wages'), operator: '=' },
        { label: 'Line 2b — Taxable interest', value: v('interest'), operator: '+' },
        { label: 'Line 3b — Ordinary dividends', value: v('dividends'), operator: '+' },
        { label: 'Line 4b — IRA distributions', value: v('ira'), operator: '+' },
      ]
      const capGain = FROZEN_RETURN.capitalGain
      if (capGain !== 0) {
        components.push({ label: 'Line 7 — Capital gain (loss)', value: capGain, operator: '+' })
      }
      const otherIncome = v('otherIncome')
      if (otherIncome > 0) {
        components.push({ label: 'Line 8 — Other income (1099-NEC)', value: otherIncome, operator: '+' })
      }
      return {
        rowId,
        title: 'Total income',
        formula: 'Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8',
        components,
        total: v('totalIncome'),
        totalLabel: 'Line 9 total',
        kind: 'calc',
      }
    }

    case 'stdDeduction':
      return {
        rowId,
        title: 'Standard deduction',
        formula: 'Line 12 — Standard deduction for filing status',
        components: [
          { label: 'Single filer (2025)', value: v('stdDeduction'), operator: '=' },
        ],
        total: v('stdDeduction'),
        totalLabel: 'Line 12',
        footnote: 'Amount from IRS standard deduction table for Single filing status.',
        kind: 'calc',
      }

    case 'taxableIncome':
      return {
        rowId,
        title: 'Taxable income',
        formula: 'Line 15 — Adjusted gross income minus deductions (lines 12 + 13)',
        components: [
          { label: 'Line 11 — Adjusted gross income', value: v('totalIncome'), operator: '=' },
          { label: 'Line 14 — Deductions (lines 12 + 13)', value: v('stdDeduction'), operator: '−' },
        ],
        total: v('taxableIncome'),
        totalLabel: 'Line 15',
        kind: 'calc',
      }

    case 'totalTax':
      return {
        rowId,
        title: 'Total tax',
        formula: 'Line 24 — Tax on taxable income per IRS rate schedules',
        components: [
          { label: 'Line 15 — Taxable income', value: v('taxableIncome'), operator: '=' },
          { label: 'Tax computed from rate schedules', value: v('totalTax'), operator: '=' },
        ],
        total: v('totalTax'),
        totalLabel: 'Line 24',
        footnote: `Tax on $${fmt(v('taxableIncome'))} taxable income.`,
        kind: 'calc',
      }

    case 'totalPayments':
      return {
        rowId,
        title: 'Total payments',
        formula: 'Line 33 — Federal tax withheld (lines 25a + 25b + 25c)',
        components: [
          { label: 'Line 25a — W-2 withholding', value: v('withholdingW2'), operator: '=' },
          { label: 'Line 25b — 1099 withholding', value: v('withholding99'), operator: '+' },
        ],
        total: v('totalPayments'),
        totalLabel: 'Line 33',
        kind: 'calc',
      }

    case 'amountOwed':
      return {
        rowId,
        title: 'Amount owed',
        formula: 'Line 37 — Total tax minus total payments',
        components: [
          { label: 'Line 24 — Total tax', value: v('totalTax'), operator: '=' },
          { label: 'Line 33 — Total payments', value: v('totalPayments'), operator: '−' },
        ],
        total: v('amountOwed'),
        totalLabel: 'Line 37',
        kind: 'calc',
      }

    default:
      return null
  }
}
