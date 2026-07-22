/**
 * Input (Details) → output destination copy for field-label tooltips.
 *
 * Principle: name the schedule/form first when the path isn’t a direct 1040 line
 * (e.g. NEC → Schedule C → Schedule 1 → Form 1040). Cover every amount / box
 * field so preparers aren’t guessing.
 */

const goes1040 = (line: string, name: string) =>
  `Goes to Form 1040 · Line ${line} — ${name}`

const goesVia = (path: string) => `Goes to ${path}`

const notOnReturn = (why: string) => `Not on this return · ${why}`

const efileOnly = (what: string) =>
  `E-file / identity only · ${what} — not a Form 1040 amount line`

/** Strip employer / payer suffixes so one rule covers all tabs. */
function baseKey(fieldKey: string): string {
  return fieldKey
    .replace(/-(techCircle|bingEquipment)$/, '')
    .replace(/-(unwaverIngFinancial|harborlineCredit|cascadeFederal)$/, '')
    .replace(/-(tokenFinancial|northmarkIndex|beaconDividend)$/, '')
    .replace(/-(meridian|summit)$/, '')
}

/**
 * Returns hover copy for a Details field key, or null only for unknown keys.
 */
export function getInputDestinationTip(fieldKey: string): string | null {
  const key = baseKey(fieldKey)

  // ── Shared identity (W-2 / 1099 payer & recipient) ───────────────────
  if (
    key === 'ssn' ||
    key === 'ein' ||
    key === 'employerName' ||
    key === 'street' ||
    key === 'cityStateZip' ||
    key === 'payerEin' ||
    key === 'payerName' ||
    key === 'payerStreet' ||
    key === 'payerCityStateZip' ||
    key === 'payerPhone' ||
    key === 'recipientSsn' ||
    key === 'recipientName' ||
    key === 'recipientStreet' ||
    key === 'recipientCityStateZip' ||
    key === 'nec-ein' ||
    key === 'nec-payerName' ||
    key === 'nec-street' ||
    key === 'nec-cityStateZip' ||
    key === 'nec-phone' ||
    key === 'nec-ssn' ||
    key === 'nec-recipientName' ||
    key === 'nec-recipientStreet' ||
    key === 'nec-recipientCityStateZip' ||
    key === 'r-ein' ||
    key === 'r-payerName' ||
    key === 'r-street' ||
    key === 'r-cityStateZip' ||
    key === 'r-ssn' ||
    key === 'r-recipientName' ||
    key === 'r-recipientStreet' ||
    key === 'r-recipientCityStateZip'
  ) {
    return efileOnly('Used to match the source document')
  }

  // ── W-2 ──────────────────────────────────────────────────────────────
  if (key === 'wages') {
    return goes1040('1a', 'W-2 wages')
  }
  if (key === 'withholding') {
    return goes1040('25a', 'Federal tax withheld (W-2)')
  }
  if (key === 'box12' || key.startsWith('box12')) {
    return notOnReturn(
      'Box 12 codes (e.g. 401(k)) are informational on Form W-2 — not a Form 1040 income line',
    )
  }
  if (key === 'box13') {
    return notOnReturn('Box 13 checkboxes don’t create a Form 1040 amount line')
  }
  if (
    key === 'sswages' ||
    key === 'sstax' ||
    key === 'medicarewages' ||
    key === 'medicaretax' ||
    key === 'sstips' ||
    key === 'allocatedtips'
  ) {
    return notOnReturn('Social Security / Medicare boxes — payroll tax reporting, not Form 1040 income')
  }
  if (key === 'dependentcare') {
    return notOnReturn(
      'Would flow to Form 2441 / Form 1040 credits when claimed — not on this return',
    )
  }
  if (key === 'nonqualified') {
    return notOnReturn('Nonqualified plans — not a Form 1040 income line on this return')
  }

  // ── 1099-INT ─────────────────────────────────────────────────────────
  if (key === 'taxableInterest') {
    return goesVia(
      'Form 1040 · Line 2b — Taxable interest (Schedule B when interest exceeds the filing threshold)',
    )
  }
  if (key === 'taxExempt') {
    return goes1040('2a', 'Tax-exempt interest')
  }
  if (key === 'usBonds') {
    return notOnReturn(
      'Box 3 (U.S. Savings Bonds / T-bills) isn’t carried — no Schedule B treatment on this return',
    )
  }
  if (key === 'earlyPenalty') {
    return notOnReturn(
      'Would go to Schedule 1 (early withdrawal penalty adjustment) — not claimed on this return',
    )
  }
  if (key === 'investExpenses') {
    return notOnReturn(
      'Investment expenses are generally not deductible after TCJA — not on Form 1040 here',
    )
  }
  if (key === 'foreignTax') {
    return notOnReturn(
      'Would go to Form 1116 / Schedule 3 (foreign tax credit) — not claimed on this return',
    )
  }
  if (key === 'foreignCountry') {
    return efileOnly('Supports foreign tax credit forms when used')
  }
  if (key === 'specPrivActivity') {
    return notOnReturn(
      'Private activity bond interest — AMT preference; not a Form 1040 line on this return',
    )
  }
  if (key === 'marketDiscount' || key === 'bondPremium') {
    return notOnReturn('Bond market-discount / premium adjustments — not applied on this return')
  }
  if (key === 'stateTaxId' || key === 'stateTax' || key === 'stateIncome') {
    return notOnReturn('State tax boxes — state return only, not Form 1040 federal lines')
  }

  // ── 1099-DIV ─────────────────────────────────────────────────────────
  if (key === 'ordinaryDivs') {
    return goesVia(
      'Form 1040 · Line 3b — Ordinary dividends (Schedule B when dividends exceed the filing threshold)',
    )
  }
  if (key === 'qualifiedDivs') {
    return goes1040('3a', 'Qualified dividends')
  }
  if (
    key === 'totalCapGain' ||
    key === 'unrecap1250' ||
    key === 'sec1202' ||
    key === 'divCollectibles'
  ) {
    return notOnReturn(
      'Would go to Schedule D → Form 1040 · Line 7 — no capital gain distributions on this return',
    )
  }
  if (key === 'divNonDiv') {
    return notOnReturn(
      'Nondividend distributions reduce basis — not reported as Form 1040 dividend income',
    )
  }
  if (key === 'fedTaxWithheld') {
    return goes1040('25b', 'Federal tax withheld (1099)')
  }
  if (key === 'sec199A') {
    return notOnReturn(
      'Would go to Form 8995 / QBI (Section 199A) — not claimed on this return',
    )
  }
  if (key === 'foreignTaxPaid') {
    return notOnReturn(
      'Would go to Form 1116 / Schedule 3 (foreign tax credit) — not claimed on this return',
    )
  }
  if (key === 'cashLiquidation' || key === 'nonCashLiquidation') {
    return notOnReturn(
      'Liquidation distributions — generally capital gain / basis, not ordinary Form 1040 income here',
    )
  }

  // ── 1099-R ───────────────────────────────────────────────────────────
  if (key === 'grossDistrib' || key === 'r-grossDistrib') {
    return notOnReturn(
      'Gross distribution stays on the 1099-R; taxable amount (Box 2a) goes to Form 1040 · Line 4b',
    )
  }
  if (key === 'r-taxableAmt' || key === 'iraDistrib') {
    return goes1040('4b', 'IRA distributions')
  }
  if (key === 'r-fedTaxWithheld' || key === 'withholding1099') {
    return goes1040('25b', 'Federal tax withheld (1099)')
  }
  if (key === 'r-capitalGain') {
    return notOnReturn(
      'Capital gain included in Box 2a — not a separate Form 1040 or Schedule D line here',
    )
  }
  if (key === 'r-employeeContrib') {
    return notOnReturn('Employee contributions / after-tax basis — not a Form 1040 income line')
  }
  if (key === 'r-distCode') {
    return efileOnly('Distribution codes explain tax treatment of the 1099-R')
  }

  // ── 1099-NEC — business path ─────────────────────────────────────────
  if (key === 'nec-box1' || key === 'necIncome') {
    return goesVia(
      'Schedule C · Line 1 (gross receipts) → Schedule 1 · Line 3 → Form 1040 · Line 8 — also drives Schedule SE (self-employment tax)',
    )
  }
  if (key === 'nec-fedTaxWithheld') {
    return goes1040('25b', 'Federal tax withheld (1099)')
  }
  if (key === 'nec-stateTaxId' || key === 'nec-stateTax' || key === 'nec-stateIncome') {
    return notOnReturn('State NEC boxes — state return only, not Form 1040 federal lines')
  }

  // ── Fallback: unknown / leftover keys ────────────────────────────────
  // Prefer a quiet tip over silence so every hoverable amount has guidance.
  if (
    key.startsWith('payer') ||
    key.startsWith('recipient') ||
    key.startsWith('nec-') ||
    key.startsWith('r-')
  ) {
    return efileOnly('Document detail')
  }

  return null
}
