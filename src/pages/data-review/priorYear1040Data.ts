/** Prior-year 1040 (2024) line amounts — sourced from sample_1040_2024_variant_amounts_no_ssn.pdf */
export const PRIOR_YEAR_1040_FIELDS: {
  key?: string
  line?: string
  label?: string
  amount?: string
  bold?: boolean
  section?: string
}[] = [
  { section: 'INCOME' },
  { key: '1a', line: '1a', label: 'Total wages, salaries, tips (W-2)', amount: '136,480' },
  { key: '1z', line: '1z', label: 'Add lines 1a–1h', amount: '136,480' },
  { key: '2b', line: '2b', label: 'Taxable interest', amount: '2,740' },
  { key: '3a', line: '3a', label: 'Qualified dividends', amount: '142,300' },
  { key: '3b', line: '3b', label: 'Ordinary dividends', amount: '219,850' },
  { key: '7', line: '7', label: 'Capital gain or (loss)', amount: '126,750' },
  { key: '9', line: '9', label: 'Total income', amount: '485,820', bold: true },
  { section: 'ADJUSTMENTS TO INCOME' },
  { key: '11', line: '11', label: 'Adjusted gross income', amount: '485,820', bold: true },
  { section: 'DEDUCTIONS' },
  { key: '12', line: '12', label: 'Standard deduction', amount: '31,850' },
  { key: '15', line: '15', label: 'Taxable income', amount: '453,970', bold: true },
  { section: 'TAX AND CREDITS' },
  { key: '16', line: '16', label: 'Tax (see instructions)', amount: '84,610' },
  { key: '24', line: '24', label: 'Total tax', amount: '98,890', bold: true },
  { section: 'PAYMENTS' },
  { key: '25a', line: '25a', label: 'Federal income tax withheld (W-2)', amount: '22,360' },
  { key: '25b', line: '25b', label: 'Federal income tax withheld (1099s)', amount: '18,740' },
  { key: '25d', line: '25d', label: 'Total withholding', amount: '41,100' },
  { key: '33', line: '33', label: 'Total payments', amount: '76,100', bold: true },
  { key: '37', line: '37', label: 'Amount you owe', amount: '22,790' },
]

/** Numeric prior-year values for YoY comparisons in LeftPanel1040. */
export const PRIOR_YEAR_1040_VALUES: Record<string, number> = {
  wages: 136480,
  wagesTotal: 136480,       // line 1z (same as 1a this return)
  taxableInterest: 2740,
  qualifiedDivs: 142300,
  ordinaryDivs: 219850,
  capitalGain: 126750,
  totalIncome: 485820,
  agi: 485820,
  stdDeduction: 31850,
  deductionSum: 31850,      // line 14 (12 + 13)
  taxableIncome: 453970,
  incomeTax: 84610,         // line 16
  w2Withholding: 22360,
  withholding: 18740,         // line 25b, 1099 federal withholding
  totalWithholding: 41100,    // line 25d
  estimatedPayments: 35000,   // line 26 (76100 total payments minus 41100 withholding)
  totalPayments: 76100,       // line 33
  totalTax: 98890,
  amountOwed: 22790,
}

/** YoY percent change; returns rounded integer percent. */
export function yoyPercent(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : Math.round((current - prior) / Math.abs(prior || 1) * 100)
  return Math.round((current - prior) / prior * 100)
}

/** Build YoY map from live current-year values against priorYear1040Data. */
export function buildYoyMap(current: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [key, curr] of Object.entries(current)) {
    const prior = PRIOR_YEAR_1040_VALUES[key]
    if (prior !== undefined) out[key] = yoyPercent(curr, prior)
  }
  return out
}
