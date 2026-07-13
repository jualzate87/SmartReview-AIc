/**
 * Loop 2 Build Spec — frozen return anchors (Part 1).
 * Shared substrate values identical across study arms.
 */
export const FROZEN_RETURN = {
  /** W-2 Box 1 on return (source 148,940) */
  wages: 118_940,
  /** 1040 line 2b — sum of all 1099-INT Box 1 */
  taxableInterest: 6_336,
  /** 1040 line 3b — sum of all 1099-DIV Box 1a */
  ordinaryDivs: 350_400,
  /** 1040 line 3a — sum of all 1099-DIV Box 1b on return */
  qualifiedDivs: 343_450,
  /** 1099-R Box 2a taxable amount on return (source 150,000) */
  taxablePension: 100_000,
  /** 1040 line 9 */
  totalIncome: 575_676,
  /** W-2 Box 2 — matches source (not in error map) */
  w2Withholding: 15_840,
  /** Token 1099-DIV Box 4 on return (source 26,363) */
  divWithholding: 24_925,
  /** 1040 line 33 — W-2 + 1099-DIV (1099-R withholding dropped) */
  totalWithholding: 40_765,
  capitalGain: 0,
  stdDeduction: 15_750,
  totalTax: 149_830,
} as const

/** Token-only qualified divs on return (silent error 6 — not flagged) */
export const TOKEN_QUALIFIED_DIVS_RETURN = 331_250
