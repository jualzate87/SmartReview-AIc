/**
 * Origin metadata for every Form 1040 line shown in LeftPanel1040.
 * Drives FieldPopover "Source documents" / "Calculated from" sections.
 */
import { SEED_AMOUNTS, type LiveAmounts, type LiveReturnTotals } from './liveReturn'

export type FieldOriginSource = {
  docId: string
  /** Payer / document display name */
  label: string
  /** Form box label, e.g. "Box 1" */
  box: string
  amount: number
  /** Detail panel field key used for highlight + selection */
  detailFieldId: string
}

export type FieldOriginCalcComponent = {
  /** Optional 1040 field id for cross-reference */
  lineFieldId?: string
  label: string
  amount: number
  operator?: '+' | '−' | '='
}

export type FieldOrigin = {
  fieldId: string
  label: string
  kind: 'source' | 'calc' | 'manual'
  /** Populated when the line comes from imported documents */
  sources?: FieldOriginSource[]
  /** Populated when the line is computed from other 1040 lines (or IRS tables) */
  calc?: {
    formula: string
    components: FieldOriginCalcComponent[]
    total: number
    totalLabel: string
    footnote?: string
  }
  /** Manual / carried / no-source explanation */
  note?: string
}

function source(
  docId: string,
  label: string,
  box: string,
  amount: number,
  detailFieldId: string,
): FieldOriginSource {
  return { docId, label, box, amount, detailFieldId }
}

/** Build live origin metadata for a 1040 field id. */
export function getFieldOrigin(
  fieldId: string,
  totals: LiveReturnTotals,
  amounts: LiveAmounts = SEED_AMOUNTS,
): FieldOrigin | null {
  switch (fieldId) {
    case 'wages':
      return {
        fieldId,
        label: 'Wages',
        kind: 'source',
        sources: [
          source('w2-techCircle', 'Tech Circle Inc (W-2)', 'Box 1', amounts.wages, 'wages'),
        ],
      }

    case 'wagesTotal':
      return {
        fieldId,
        label: 'Total wages (1a–1h)',
        kind: 'calc',
        calc: {
          formula: 'Line 1z — Add lines 1a through 1h',
          components: [
            { lineFieldId: 'wages', label: 'Line 1a — W-2 wages', amount: totals.wages, operator: '=' },
          ],
          total: totals.wages,
          totalLabel: 'Line 1z',
          footnote: 'Lines 1b–1h are blank on this return.',
        },
      }

    case 'taxExemptInterest':
      return {
        fieldId,
        label: 'Tax-exempt interest',
        kind: 'source',
        sources: [
          source(
            '1099-int-unwavering',
            'Unwavering Financial (1099-INT)',
            'Box 8',
            180,
            'taxExempt-unwaverIngFinancial',
          ),
        ],
      }

    case 'taxableInterest':
      return {
        fieldId,
        label: 'Taxable interest',
        kind: 'source',
        sources: [
          source(
            '1099-int-unwavering',
            'Unwavering Financial (1099-INT)',
            'Box 1',
            amounts.interestUnwavering,
            'taxableInterest',
          ),
          source(
            '1099-int-harborline',
            'Harborline Credit Union (1099-INT)',
            'Box 1',
            amounts.interestHarborline,
            'taxableInterest-harborlineCredit',
          ),
          source(
            '1099-int-cascade',
            'Cascade Federal Savings (1099-INT)',
            'Box 1',
            amounts.interestCascade,
            'taxableInterest-cascadeFederal',
          ),
        ],
      }

    case 'qualifiedDivs':
      return {
        fieldId,
        label: 'Qualified dividends',
        kind: 'source',
        sources: [
          source(
            '1099-div-token',
            'Token Financial (1099-DIV)',
            'Box 1b',
            amounts.qualifiedDivsToken,
            'qualifiedDivs',
          ),
          source(
            '1099-div-northmark',
            'Northmark Index Funds (1099-DIV)',
            'Box 1b',
            amounts.qualifiedDivsNorthmark,
            'qualifiedDivs-northmarkIndex',
          ),
          source(
            '1099-div-beacon',
            'Beacon Dividend Trust (1099-DIV)',
            'Box 1b',
            amounts.qualifiedDivsBeacon,
            'qualifiedDivs-beaconDividend',
          ),
        ],
      }

    case 'ordinaryDivs':
      return {
        fieldId,
        label: 'Ordinary dividends',
        kind: 'source',
        sources: [
          source(
            '1099-div-token',
            'Token Financial (1099-DIV)',
            'Box 1a',
            amounts.ordinaryDivsToken,
            'ordinaryDivs-tokenFinancial',
          ),
          source(
            '1099-div-northmark',
            'Northmark Index Funds (1099-DIV)',
            'Box 1a',
            amounts.ordinaryDivsNorthmark,
            'ordinaryDivs',
          ),
          source(
            '1099-div-beacon',
            'Beacon Dividend Trust (1099-DIV)',
            'Box 1a',
            amounts.ordinaryDivsBeacon,
            'ordinaryDivs-beaconDividend',
          ),
        ],
      }

    case 'iraDistrib':
      return {
        fieldId,
        label: 'IRA distributions',
        kind: 'source',
        sources: [
          source(
            '1099-r-meridian',
            'Meridian Retirement Trust (1099-R)',
            'Box 2a',
            amounts.taxablePension,
            'r-taxableAmt',
          ),
        ],
      }

    case 'capitalGain':
      return {
        fieldId,
        label: 'Capital gain / (loss)',
        kind: 'manual',
        note:
          totals.capitalGain === 0
            ? 'No capital gain or loss is reported on this return. Nothing maps from Schedule D or Form 8949.'
            : 'Amount from Schedule D / Form 8949.',
        calc:
          totals.capitalGain !== 0
            ? {
                formula: 'Line 7 — Capital gain or (loss)',
                components: [
                  { label: 'Schedule D / Form 8949', amount: totals.capitalGain, operator: '=' },
                ],
                total: totals.capitalGain,
                totalLabel: 'Line 7',
              }
            : undefined,
      }

    case 'otherIncome':
      return {
        fieldId,
        label: 'Other income',
        kind: 'source',
        sources: totals.necOnReturn
          ? [
              source(
                '1099-nec-summit',
                'Summit Advisory Partners (1099-NEC)',
                'Box 1',
                totals.otherIncome,
                'nec-box1',
              ),
            ]
          : [],
        note: !totals.necOnReturn
          ? '1099-NEC income is not yet on this return. Confirm Box 1 on Summit Advisory Partners to flow it to line 8.'
          : undefined,
      }

    case 'totalIncome':
      return {
        fieldId,
        label: 'Total income',
        kind: 'calc',
        calc: {
          formula: 'Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8',
          components: [
            { lineFieldId: 'wagesTotal', label: 'Line 1z — Wages', amount: totals.wages, operator: '=' },
            { lineFieldId: 'taxableInterest', label: 'Line 2b — Taxable interest', amount: totals.taxableInterest, operator: '+' },
            { lineFieldId: 'ordinaryDivs', label: 'Line 3b — Ordinary dividends', amount: totals.ordinaryDivs, operator: '+' },
            { lineFieldId: 'iraDistrib', label: 'Line 4b — IRA distributions', amount: totals.taxablePension, operator: '+' },
            ...(totals.capitalGain !== 0
              ? [{ lineFieldId: 'capitalGain', label: 'Line 7 — Capital gain (loss)', amount: totals.capitalGain, operator: '+' as const }]
              : []),
            ...(totals.otherIncome > 0
              ? [{ lineFieldId: 'otherIncome', label: 'Line 8 — Other income', amount: totals.otherIncome, operator: '+' as const }]
              : []),
          ],
          total: totals.totalIncome,
          totalLabel: 'Line 9',
        },
      }

    case 'agi':
      return {
        fieldId,
        label: 'Adjusted gross income',
        kind: 'calc',
        calc: {
          formula: 'Line 11 — Total income minus adjustments (none on this return)',
          components: [
            { lineFieldId: 'totalIncome', label: 'Line 9 — Total income', amount: totals.totalIncome, operator: '=' },
          ],
          total: totals.totalIncome,
          totalLabel: 'Line 11',
          footnote: 'No adjustments to income (Schedule 1) on this return.',
        },
      }

    case 'stdDeduction':
      return {
        fieldId,
        label: 'Standard deduction',
        kind: 'calc',
        calc: {
          formula: 'Line 12 — Standard deduction for filing status',
          components: [
            { label: 'Single filer (2025)', amount: totals.stdDeduction, operator: '=' },
          ],
          total: totals.stdDeduction,
          totalLabel: 'Line 12',
          footnote:
            'Jessica qualifies for the standard deduction because itemizable expenses don’t exceed the standard deduction for Single.',
        },
        note:
          'Jessica qualifies for the standard deduction because her itemizable expenses (mortgage interest, state and local taxes, charitable gifts) don’t exceed the standard deduction amount for her filing status.',
      }

    case 'deductionSum':
      return {
        fieldId,
        label: 'Deductions total',
        kind: 'calc',
        calc: {
          formula: 'Line 14 — Add lines 12 and 13',
          components: [
            { lineFieldId: 'stdDeduction', label: 'Line 12 — Standard deduction', amount: totals.stdDeduction, operator: '=' },
          ],
          total: totals.stdDeduction,
          totalLabel: 'Line 14',
          footnote: 'Line 13 (charitable deduction for non-itemizers) is blank.',
        },
      }

    case 'taxableIncome':
      return {
        fieldId,
        label: 'Taxable income',
        kind: 'calc',
        calc: {
          formula: 'Line 15 — AGI minus deductions',
          components: [
            { lineFieldId: 'agi', label: 'Line 11 — Adjusted gross income', amount: totals.totalIncome, operator: '=' },
            { lineFieldId: 'deductionSum', label: 'Line 14 — Deductions', amount: totals.stdDeduction, operator: '−' },
          ],
          total: totals.taxableIncome,
          totalLabel: 'Line 15',
        },
      }

    case 'incomeTax':
      return {
        fieldId,
        label: 'Tax (line 16)',
        kind: 'calc',
        calc: {
          formula: 'Line 16 — Tax on taxable income per IRS rate schedules',
          components: [
            { lineFieldId: 'taxableIncome', label: 'Line 15 — Taxable income', amount: totals.taxableIncome, operator: '=' },
            { label: 'Tax from rate schedules', amount: totals.totalTax, operator: '=' },
          ],
          total: totals.totalTax,
          totalLabel: 'Line 16',
          footnote: `Tax on $${totals.taxableIncome.toLocaleString()} taxable income.`,
        },
      }

    case 'totalTax':
      return {
        fieldId,
        label: 'Total tax',
        kind: 'calc',
        calc: {
          formula: 'Line 24 — Total tax (equals line 16; no additional taxes)',
          components: [
            { lineFieldId: 'incomeTax', label: 'Line 16 — Tax', amount: totals.totalTax, operator: '=' },
          ],
          total: totals.totalTax,
          totalLabel: 'Line 24',
        },
      }

    case 'w2Withholding':
      return {
        fieldId,
        label: 'W-2 federal withholding',
        kind: 'source',
        sources: [
          source(
            'w2-techCircle',
            'Tech Circle Inc (W-2)',
            'Box 2',
            amounts.w2Withholding,
            'withholding',
          ),
        ],
      }

    case 'withholding':
      return {
        fieldId,
        label: 'Federal tax withheld (1099)',
        kind: 'source',
        sources: [
          source(
            '1099-div-token',
            'Token Financial (1099-DIV)',
            'Box 4',
            amounts.divWithholding,
            'fedTaxWithheld',
          ),
          source(
            '1099-r-meridian',
            'Meridian Retirement Trust (1099-R)',
            'Box 4',
            amounts.rWithholding,
            'withholding1099',
          ),
        ],
      }

    case 'totalWithholding':
      return {
        fieldId,
        label: 'Total withholding (25a–25c)',
        kind: 'calc',
        calc: {
          formula: 'Line 25d — Add lines 25a through 25c',
          components: [
            { lineFieldId: 'w2Withholding', label: 'Line 25a — W-2 withholding', amount: totals.w2Withholding, operator: '=' },
            { lineFieldId: 'withholding', label: 'Line 25b — 1099 withholding', amount: totals.withholding1099, operator: '+' },
          ],
          total: totals.totalWithholding,
          totalLabel: 'Line 25d',
        },
      }

    case 'totalPayments':
      return {
        fieldId,
        label: 'Total payments',
        kind: 'calc',
        calc: {
          formula: 'Line 33 — Federal tax withheld and other payments',
          components: [
            { lineFieldId: 'totalWithholding', label: 'Line 25d — Total withholding', amount: totals.totalWithholding, operator: '=' },
          ],
          total: totals.totalPayments,
          totalLabel: 'Line 33',
          footnote: 'No estimated tax payments on this return.',
        },
      }

    case 'amountOwed':
      return {
        fieldId,
        label: 'Amount you owe',
        kind: 'calc',
        calc: {
          formula: 'Line 37 — Total tax minus total payments',
          components: [
            { lineFieldId: 'totalTax', label: 'Line 24 — Total tax', amount: totals.totalTax, operator: '=' },
            { lineFieldId: 'totalPayments', label: 'Line 33 — Total payments', amount: totals.totalPayments, operator: '−' },
          ],
          total: totals.oweAmount,
          totalLabel: 'Line 37',
        },
      }

    default:
      return null
  }
}

/** Live current-year amount shown in the popover YoY card. */
export function getFieldLiveCurrent(
  fieldId: string,
  totals: LiveReturnTotals,
): number | undefined {
  const map: Record<string, number> = {
    wages: totals.wages,
    wagesTotal: totals.wages,
    taxExemptInterest: 180,
    taxableInterest: totals.taxableInterest,
    qualifiedDivs: totals.qualifiedDivs,
    ordinaryDivs: totals.ordinaryDivs,
    iraDistrib: totals.taxablePension,
    capitalGain: totals.capitalGain,
    otherIncome: totals.otherIncome,
    totalIncome: totals.totalIncome,
    agi: totals.totalIncome,
    stdDeduction: totals.stdDeduction,
    deductionSum: totals.stdDeduction,
    taxableIncome: totals.taxableIncome,
    incomeTax: totals.totalTax,
    totalTax: totals.totalTax,
    w2Withholding: totals.w2Withholding,
    withholding: totals.withholding1099,
    totalWithholding: totals.totalWithholding,
    totalPayments: totals.totalPayments,
    amountOwed: totals.oweAmount,
  }
  return map[fieldId]
}
