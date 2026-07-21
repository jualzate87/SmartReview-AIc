/**
 * Input (Details) → output (Form 1040) destination copy for field-label tooltips.
 * Complements row highlighting when the mapping isn’t obvious.
 */

const goes = (line: string, name: string) =>
  `Goes to Form 1040 · Line ${line} — ${name}`

const notOnReturn = (why: string) => `Not on this return · ${why}`

/**
 * Returns hover copy for a Details field key, or null when no tip is useful
 * (e.g. payer address / identity rows).
 */
export function getInputDestinationTip(fieldKey: string): string | null {
  // ── W-2 ──────────────────────────────────────────────────────────────
  if (fieldKey === 'wages' || fieldKey.startsWith('wages-')) {
    return goes('1a', 'W-2 wages')
  }
  if (fieldKey === 'withholding') {
    return goes('25a', 'Federal tax withheld (W-2)')
  }
  if (fieldKey === 'box12' || fieldKey.startsWith('box12')) {
    return notOnReturn('Box 12 codes are informational on this return')
  }
  if (fieldKey === 'box13') {
    return notOnReturn('Box 13 checkboxes don’t create a Form 1040 amount line')
  }
  if (
    fieldKey === 'sswages' ||
    fieldKey === 'sstax' ||
    fieldKey === 'medicarewages' ||
    fieldKey === 'medicaretax' ||
    fieldKey === 'sstips' ||
    fieldKey === 'allocatedtips' ||
    fieldKey === 'dependentcare' ||
    fieldKey === 'nonqualified' ||
    fieldKey.startsWith('sswages-') ||
    fieldKey.startsWith('sstax-') ||
    fieldKey.startsWith('medicarewages-') ||
    fieldKey.startsWith('medicaretax-') ||
    fieldKey.startsWith('sstips-') ||
    fieldKey.startsWith('allocatedtips-') ||
    fieldKey.startsWith('dependentcare-') ||
    fieldKey.startsWith('nonqualified-')
  ) {
    return notOnReturn('Payroll tax boxes — not Form 1040 income lines')
  }

  // ── 1099-INT ─────────────────────────────────────────────────────────
  if (fieldKey === 'taxableInterest' || fieldKey.startsWith('taxableInterest-')) {
    return goes('2b', 'Taxable interest')
  }
  if (fieldKey.startsWith('taxExempt-')) {
    return goes('2a', 'Tax-exempt interest')
  }
  if (fieldKey.startsWith('usBonds-')) {
    return notOnReturn(
      'Box 3 (U.S. Savings Bonds / T-bills) isn’t carried — no Schedule B on this return',
    )
  }
  if (fieldKey.startsWith('earlyPenalty-')) {
    return notOnReturn('Early withdrawal penalty isn’t shown on Form 1040 here')
  }
  if (
    fieldKey.startsWith('investExpenses-') ||
    fieldKey.startsWith('foreignTax-') ||
    fieldKey.startsWith('foreignCountry-') ||
    fieldKey.startsWith('specPrivActivity-') ||
    fieldKey.startsWith('marketDiscount-') ||
    fieldKey.startsWith('bondPremium-') ||
    fieldKey.startsWith('stateTaxId-') ||
    fieldKey.startsWith('stateTax-') ||
    fieldKey.startsWith('stateIncome-')
  ) {
    return notOnReturn('This box doesn’t feed a Form 1040 line on this return')
  }

  // ── 1099-DIV ─────────────────────────────────────────────────────────
  if (fieldKey === 'ordinaryDivs' || fieldKey.startsWith('ordinaryDivs-')) {
    return goes('3b', 'Ordinary dividends')
  }
  if (fieldKey === 'qualifiedDivs' || fieldKey.startsWith('qualifiedDivs-')) {
    return goes('3a', 'Qualified dividends')
  }
  // DIV / INT Box 4 withholding → payments line 25b when present
  if (fieldKey === 'fedTaxWithheld' || fieldKey.startsWith('fedTaxWithheld-')) {
    return goes('25b', 'Federal tax withheld (1099)')
  }
  if (
    fieldKey === 'divCollectibles' ||
    fieldKey.startsWith('divCollectibles-') ||
    fieldKey === 'divNonDiv' ||
    fieldKey.startsWith('divNonDiv-') ||
    fieldKey.startsWith('totalCapGain-') ||
    fieldKey.startsWith('unrecap1250-') ||
    fieldKey.startsWith('sec1202-') ||
    fieldKey.startsWith('sec199A-') ||
    fieldKey.startsWith('cashLiquidation-') ||
    fieldKey.startsWith('nonCashLiquidation-') ||
    fieldKey.startsWith('foreignTaxPaid-')
  ) {
    return notOnReturn('This box doesn’t feed a Form 1040 line on this return')
  }

  // ── 1099-R ───────────────────────────────────────────────────────────
  if (fieldKey === 'grossDistrib' || fieldKey === 'r-grossDistrib') {
    return notOnReturn('Gross distribution is shown on the 1099-R; taxable amount drives Line 4b')
  }
  if (fieldKey === 'r-taxableAmt' || fieldKey === 'iraDistrib') {
    return goes('4b', 'IRA distributions')
  }
  if (fieldKey === 'r-fedTaxWithheld' || fieldKey === 'withholding1099') {
    return goes('25b', 'Federal tax withheld (1099)')
  }
  if (fieldKey === 'r-capitalGain') {
    return notOnReturn('Capital gain in Box 2a isn’t a separate Form 1040 line here')
  }

  // ── 1099-NEC ─────────────────────────────────────────────────────────
  if (fieldKey === 'nec-box1' || fieldKey === 'necIncome') {
    return goes('8', 'Other income (when confirmed on the return)')
  }

  return null
}
