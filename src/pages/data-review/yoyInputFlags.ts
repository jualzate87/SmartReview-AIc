/**
 * Flag input (detail) fields that feed Form 1040 lines with large YoY swings.
 * Threshold: |change| ≥ 50% vs prior year.
 */
import { SEED_AMOUNTS, type LiveAmounts, type LiveReturnTotals } from '../../data/liveReturn'
import { getFieldOrigin } from '../../data/fieldOrigins'
import { buildYoyMap } from './priorYear1040Data'

const YOY_INPUT_FLAG_THRESHOLD = 50

export function buildYoyInputFlags(
  totals: LiveReturnTotals,
  amounts: LiveAmounts = SEED_AMOUNTS,
  thresholdPct = YOY_INPUT_FLAG_THRESHOLD,
): Record<string, string> {
  const yoy = buildYoyMap({
    wages: totals.wages,
    wagesTotal: totals.wages,
    taxableInterest: totals.taxableInterest,
    qualifiedDivs: totals.qualifiedDivs,
    ordinaryDivs: totals.ordinaryDivs,
    iraDistrib: totals.taxablePension,
    capitalGain: totals.capitalGain,
    totalIncome: totals.totalIncome,
    agi: totals.totalIncome,
    stdDeduction: totals.stdDeduction,
    taxableIncome: totals.taxableIncome,
    incomeTax: totals.incomeTax,
    w2Withholding: totals.w2Withholding,
    withholding: totals.withholding1099,
    totalWithholding: totals.totalWithholding,
    totalPayments: totals.totalPayments,
    totalTax: totals.totalTax,
    amountOwed: totals.oweAmount,
  })

  const flags: Record<string, string> = {}

  for (const [fieldId, pct] of Object.entries(yoy)) {
    if (Math.abs(pct) < thresholdPct) continue
    const origin = getFieldOrigin(fieldId, totals, amounts)
    if (!origin?.sources?.length) continue

    const signed = pct > 0 ? `+${pct}` : `${pct}`
    const msg =
      `Significant year-over-year change (${signed}%) on this Form 1040 line. Double-check this amount against the source.`

    flags[fieldId] = msg
    for (const s of origin.sources) {
      flags[s.detailFieldId] = msg
    }
  }

  return flags
}

/** Merge YoY flags under Phase 1 OCR flags (Phase 1 messages win on conflict). */
export function mergeInputFlags(
  phase1: Record<string, string>,
  yoy: Record<string, string>,
): Record<string, string> {
  return { ...yoy, ...phase1 }
}
