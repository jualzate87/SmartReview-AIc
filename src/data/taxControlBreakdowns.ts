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
        { label: 'W-2 wages', value: v('wages'), operator: '=' },
        { label: 'Taxable interest', value: v('interest'), operator: '+' },
        { label: 'Ordinary dividends', value: v('dividends'), operator: '+' },
        { label: 'IRA distributions', value: v('ira'), operator: '+' },
      ]
      const capGain = FROZEN_RETURN.capitalGain
      if (capGain !== 0) {
        components.push({ label: 'Capital gain (loss)', value: capGain, operator: '+' })
      }
      const otherIncome = v('otherIncome')
      if (otherIncome > 0) {
        components.push({ label: 'Other income', value: otherIncome, operator: '+' })
      }
      return {
        rowId,
        title: 'Total income',
        formula: 'Includes these subtotals',
        components,
        total: v('totalIncome'),
        totalLabel: 'Total',
        kind: 'calc',
      }
    }

    case 'stdDeduction':
      return {
        rowId,
        title: 'Standard deduction',
        formula: 'Includes these subtotals',
        components: [
          { label: 'Single filer (2025)', value: v('stdDeduction'), operator: '=' },
        ],
        total: v('stdDeduction'),
        totalLabel: 'Total',
        footnote: 'Amount from IRS standard deduction table for Single filing status.',
        kind: 'calc',
      }

    case 'taxableIncome':
      return {
        rowId,
        title: 'Taxable income',
        formula: 'Amounts from the lines above',
        components: [
          { label: 'Adjusted gross income', value: v('totalIncome'), operator: '=' },
          { label: 'Standard deduction', value: v('stdDeduction'), operator: '−' },
        ],
        total: v('taxableIncome'),
        totalLabel: 'Total',
        kind: 'calc',
      }

    case 'totalTax':
      return {
        rowId,
        title: 'Total tax',
        formula: 'Includes these subtotals',
        components: [
          { label: 'Tax', value: v('totalTax'), operator: '=' },
        ],
        total: v('totalTax'),
        totalLabel: 'Total',
        footnote: `Tax on $${fmt(v('taxableIncome'))} taxable income.`,
        kind: 'calc',
      }

    case 'totalPayments':
      return {
        rowId,
        title: 'Total payments',
        formula: 'Includes these subtotals',
        components: [
          { label: 'Federal tax withheld (W-2)', value: v('withholdingW2'), operator: '=' },
          { label: 'Federal tax withheld (1099)', value: v('withholding99'), operator: '+' },
        ],
        total: v('totalPayments'),
        totalLabel: 'Total',
        kind: 'calc',
      }

    case 'amountOwed':
      return {
        rowId,
        title: 'Amount you owe',
        formula: 'Amounts from the lines above',
        components: [
          { label: 'Total tax', value: v('totalTax'), operator: '=' },
          { label: 'Total payments', value: v('totalPayments'), operator: '−' },
        ],
        total: v('amountOwed'),
        totalLabel: 'Total',
        kind: 'calc',
      }

    default:
      return null
  }
}
