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
  /** Aggregate Box 12 amounts placeholder (0 until entered) */
  box12: number
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
}

/** Source-true NEC Box 1 on the Summit PDF — not seeded onto the return/detail panel. */
export const NEC_SOURCE_AMOUNT = 24_000

export type LiveReturnTotals = {
  wages: number
  taxableInterest: number
  ordinaryDivs: number
  qualifiedDivs: number
  taxablePension: number
  /** Line 8 — other income (NEC) when confirmed onto the return */
  otherIncome: number
  capitalGain: number
  totalIncome: number
  stdDeduction: number
  taxableIncome: number
  /** Prototype keeps tax table lookup frozen; payments/owed still live-recalc */
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
  employeeSsn: string
  employerEin: string
}

export function computeLiveReturn(amounts: LiveAmounts): LiveReturnTotals {
  const taxableInterest =
    amounts.interestUnwavering + amounts.interestHarborline + amounts.interestCascade
  const ordinaryDivs =
    amounts.ordinaryDivsToken + amounts.ordinaryDivsNorthmark + amounts.ordinaryDivsBeacon
  const qualifiedDivs =
    amounts.qualifiedDivsToken + amounts.qualifiedDivsNorthmark + amounts.qualifiedDivsBeacon
  const otherIncome = amounts.necOnReturn ? amounts.necIncome : 0
  const capitalGain = FROZEN_RETURN.capitalGain
  const totalIncome =
    amounts.wages +
    taxableInterest +
    ordinaryDivs +
    amounts.taxablePension +
    capitalGain +
    otherIncome
  const stdDeduction = FROZEN_RETURN.stdDeduction
  const taxableIncome = totalIncome - stdDeduction
  const totalTax = FROZEN_RETURN.totalTax
  const withholding1099 = amounts.divWithholding + amounts.rWithholding
  const totalWithholding = amounts.w2Withholding + withholding1099

  return {
    wages: amounts.wages,
    taxableInterest,
    ordinaryDivs,
    qualifiedDivs,
    taxablePension: amounts.taxablePension,
    otherIncome,
    capitalGain,
    totalIncome,
    stdDeduction,
    taxableIncome,
    totalTax,
    w2Withholding: amounts.w2Withholding,
    divWithholding: amounts.divWithholding,
    rWithholding: amounts.rWithholding,
    withholding1099,
    totalWithholding,
    totalPayments: totalWithholding,
    oweAmount: Math.max(0, totalTax - totalWithholding),
    necOnReturn: amounts.necOnReturn,
    employeeSsn: amounts.employeeSsn,
    employerEin: amounts.employerEin,
  }
}

/** Parse a currency draft (commas / $) into a number; empty → 0. */
export function parseAmountDraft(raw: string): number {
  if (!raw || !raw.trim()) return 0
  const n = parseFloat(raw.replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : 0
}
