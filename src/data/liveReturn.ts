/**
 * Live return totals derived from editable synced amounts + frozen non-editable pieces.
 *
 * INITIAL seeds match Loop 2 Build Spec frozen anchors (including silent errors).
 * After the user edits/saves a field, totals follow the edited values.
 */
import { FROZEN_RETURN, TOKEN_QUALIFIED_DIVS_RETURN } from './frozenReturn'

/** Editable amounts persisted in useSyncedReviewState. */
export type LiveAmounts = {
  /** W-2 Box 1 — frozen seed 118,940 (source 148,940) */
  wages: number
  /** W-2 Box 2 — matches source (not in error map) */
  w2Withholding: number
  /** 1099-INT Box 1 per payer */
  interestUnwavering: number
  interestHarborline: number
  interestCascade: number
  /** 1099-DIV Box 1a per payer */
  ordinaryDivsToken: number
  ordinaryDivsNorthmark: number
  ordinaryDivsBeacon: number
  /** 1099-DIV Box 1b per payer — Token starts at silent-error seed */
  qualifiedDivsToken: number
  qualifiedDivsNorthmark: number
  qualifiedDivsBeacon: number
  /** Token 1099-DIV Box 4 — frozen seed 24,925 (source 26,363) */
  divWithholding: number
  /** Meridian 1099-R Box 4 — frozen seed 0 (silent drop; source 30,000) */
  rWithholding: number
  /** Meridian 1099-R Box 2a — frozen seed 100,000 (source 150,000) */
  taxablePension: number
  /**
   * Summit 1099-NEC Box 1 on the return.
   * Starts at 0 / not on return (silent omit). After the user saves NEC Box 1
   * in the detail panel, necOnReturn flips true and this amount flows to line 8.
   */
  necIncome: number
  necOnReturn: boolean
  /** W-2 Box a — blank at session start (planted error 1) */
  employeeSsn: string
  /** W-2 Box b — blank at session start (planted error 2) */
  employerEin: string
  /** Aggregate Box 12 amounts placeholder (0 until entered) — sum of box12Rows amounts */
  box12: number
  /** W-2 Box 12 a–d codes + amounts — persists across Save / refresh */
  box12Rows: {
    a: { code: string; amount: number }
    b: { code: string; amount: number }
    c: { code: string; amount: number }
    d: { code: string; amount: number }
  }
  /** W-2 Box 13 — Retirement plan checkbox (Tech Circle 401(k)) */
  box13RetirementPlan: boolean
  /** W-2 Box 13 — Statutory employee */
  box13StatutoryEmployee: boolean
  /** W-2 Box 13 — Third-party sick pay */
  box13ThirdPartySickPay: boolean
  /**
   * Schedule C ordinary expenses (software, supplies, travel).
   * Starts at 0; client confirmed she had costs — preparer enters after review.
   */
  schCExpenses: number
  /**
   * Schedule A mortgage interest from Form 1098.
   * Starts at 0 (1098 not in packet); client confirmed she paid mortgage interest.
   */
  mortgageInterest: number
  /** Schedule A state/local taxes (SALT) — seeded Austin TX property+income estimate */
  saltTaxes: number
  /** Schedule A charitable cash contributions */
  charitableContributions: number
}

/** Build Spec INITIAL seeds — verification anchors at session start. */
export const SEED_AMOUNTS: LiveAmounts = {
  wages: FROZEN_RETURN.wages,
  w2Withholding: FROZEN_RETURN.w2Withholding,
  interestUnwavering: 1_986,
  interestHarborline: 3_200,
  interestCascade: 1_150,
  ordinaryDivsToken: 331_250,
  ordinaryDivsNorthmark: 12_400,
  ordinaryDivsBeacon: 6_750,
  qualifiedDivsToken: TOKEN_QUALIFIED_DIVS_RETURN,
  qualifiedDivsNorthmark: 8_000,
  qualifiedDivsBeacon: 4_200,
  divWithholding: FROZEN_RETURN.divWithholding,
  rWithholding: 0,
  taxablePension: FROZEN_RETURN.taxablePension,
  necIncome: 0,
  necOnReturn: false,
  employeeSsn: '',
  employerEin: '',
  box12: 0,
  // Codes seeded from Tech Circle W-2 PDF; amounts blank (planted import gap) until Save
  box12Rows: {
    a: { code: 'C', amount: 0 },
    b: { code: 'AA', amount: 0 },
    c: { code: 'DD', amount: 0 },
    d: { code: '', amount: 0 },
  },
  // Box 13 matches Tech Circle W-2 / questionnaire (401(k) coverage)
  box13RetirementPlan: true,
  box13StatutoryEmployee: false,
  box13ThirdPartySickPay: false,
  schCExpenses: 0,
  mortgageInterest: 0,
  saltTaxes: 8_400,
  charitableContributions: 1_200,
}

/** Source-true NEC Box 1 on the Summit PDF — not seeded onto the return/detail panel. */
export const NEC_SOURCE_AMOUNT = 24_000

/** 110% of 2024 total tax — Form 2210 safe harbor. */
export const SAFE_HARBOR_2210 = 113_029
/** Single-filer NIIT AGI threshold. */
export const NIIT_AGI_THRESHOLD = 200_000
/** Single standard deduction (TY 2025 prototype). */
export const STD_DEDUCTION_SINGLE = FROZEN_RETURN.stdDeduction

export type LiveReturnTotals = {
  wages: number
  taxableInterest: number
  ordinaryDivs: number
  qualifiedDivs: number
  taxablePension: number
  /** Line 8 — other income (NEC / Sch C) when confirmed onto the return */
  otherIncome: number
  capitalGain: number
  totalIncome: number
  stdDeduction: number
  /** Schedule A total itemized (before comparing to standard) */
  itemizedDeduction: number
  /** Larger of standard vs itemized — drives 1040 line 12 in live mode */
  deductionTaken: number
  deductionMethod: 'standard' | 'itemized'
  taxableIncome: number
  /** Prototype keeps base tax table frozen; NIIT + SE add live */
  incomeTax: number
  seTax: number
  niitTax: number
  totalTax: number
  w2Withholding: number
  divWithholding: number
  rWithholding: number
  /** Line 25b — DIV + 1099-R (+ any NEC withholding) */
  withholding1099: number
  totalWithholding: number
  totalPayments: number
  oweAmount: number
  necOnReturn: boolean
  /** Schedule C — gross receipts (NEC Box 1 when on return) */
  schCGross: number
  schCExpenses: number
  schCNetProfit: number
  /** Schedule 1 line 3 / SE base */
  schedule1BusinessIncome: number
  /** Form 8960 — net investment income subject to 3.8% */
  netInvestmentIncome: number
  /** Form 2210 — required annual payment vs payments made */
  requiredAnnualPayment: number
  underpaymentAmount: number
  employeeSsn: string
  employerEin: string
  box13RetirementPlan: boolean
}

export function computeLiveReturn(amounts: LiveAmounts): LiveReturnTotals {
  // Merge with seeds so partial / stale session payloads never crash form views
  const a: LiveAmounts = {
    ...SEED_AMOUNTS,
    ...amounts,
    box12Rows: {
      ...SEED_AMOUNTS.box12Rows,
      ...(amounts.box12Rows ?? {}),
      a: { ...SEED_AMOUNTS.box12Rows.a, ...(amounts.box12Rows?.a ?? {}) },
      b: { ...SEED_AMOUNTS.box12Rows.b, ...(amounts.box12Rows?.b ?? {}) },
      c: { ...SEED_AMOUNTS.box12Rows.c, ...(amounts.box12Rows?.c ?? {}) },
      d: { ...SEED_AMOUNTS.box12Rows.d, ...(amounts.box12Rows?.d ?? {}) },
    },
  }
  const taxableInterest =
    a.interestUnwavering + a.interestHarborline + a.interestCascade
  const ordinaryDivs =
    a.ordinaryDivsToken + a.ordinaryDivsNorthmark + a.ordinaryDivsBeacon
  const qualifiedDivs =
    a.qualifiedDivsToken + a.qualifiedDivsNorthmark + a.qualifiedDivsBeacon
  const schCGross = a.necOnReturn ? a.necIncome : 0
  const schCExpenses = a.necOnReturn ? Math.min(a.schCExpenses, schCGross) : 0
  const schCNetProfit = Math.max(0, schCGross - schCExpenses)
  const otherIncome = schCNetProfit
  const capitalGain = FROZEN_RETURN.capitalGain
  const totalIncome =
    a.wages +
    taxableInterest +
    ordinaryDivs +
    a.taxablePension +
    capitalGain +
    otherIncome

  const itemizedDeduction =
    a.mortgageInterest + a.saltTaxes + a.charitableContributions
  const stdDeduction = STD_DEDUCTION_SINGLE
  const useItemized = itemizedDeduction > stdDeduction
  const deductionTaken = useItemized ? itemizedDeduction : stdDeduction
  const taxableIncome = Math.max(0, totalIncome - deductionTaken)

  // Base income tax stays frozen for study continuity; SE + NIIT recalculate live.
  const incomeTax = FROZEN_RETURN.totalTax
  const seTax =
    schCNetProfit > 400 ? Math.round(schCNetProfit * 0.9235 * 0.153) : 0
  const netInvestmentIncome = taxableInterest + ordinaryDivs + capitalGain
  const niitTax =
    totalIncome > NIIT_AGI_THRESHOLD && netInvestmentIncome > 0
      ? Math.round(netInvestmentIncome * 0.038)
      : 0
  const totalTax = incomeTax + seTax + niitTax

  const withholding1099 = a.divWithholding + a.rWithholding
  const totalWithholding = a.w2Withholding + withholding1099
  const requiredAnnualPayment = SAFE_HARBOR_2210
  const underpaymentAmount = Math.max(0, requiredAnnualPayment - totalWithholding)

  return {
    wages: a.wages,
    taxableInterest,
    ordinaryDivs,
    qualifiedDivs,
    taxablePension: a.taxablePension,
    otherIncome,
    capitalGain,
    totalIncome,
    stdDeduction,
    itemizedDeduction,
    deductionTaken,
    deductionMethod: useItemized ? 'itemized' : 'standard',
    taxableIncome,
    incomeTax,
    seTax,
    niitTax,
    totalTax,
    w2Withholding: a.w2Withholding,
    divWithholding: a.divWithholding,
    rWithholding: a.rWithholding,
    withholding1099,
    totalWithholding,
    totalPayments: totalWithholding,
    oweAmount: Math.max(0, totalTax - totalWithholding),
    necOnReturn: a.necOnReturn,
    schCGross,
    schCExpenses,
    schCNetProfit,
    schedule1BusinessIncome: schCNetProfit,
    netInvestmentIncome,
    requiredAnnualPayment,
    underpaymentAmount,
    employeeSsn: a.employeeSsn,
    employerEin: a.employerEin,
    box13RetirementPlan: a.box13RetirementPlan,
  }
}

/** Parse a currency draft (commas / $) into a number; empty → 0. */
export function parseAmountDraft(raw: string): number {
  if (!raw || !raw.trim()) return 0
  const n = parseFloat(raw.replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : 0
}
